# Rep Tracking API — live map, rep day, WebSocket

Frontend integration reference for **rep tracking**, built from the frontend's
"Rep Tracking — Backend Contract + Seed Request". Two clients:

- **Rep app (مندوب)** writes: start / end the day, GPS points, visits without a
  sale, and coordinates on invoices, payments and returns (§3).
- **Company dashboard** reads: one rep's day (§4.1), all reps now (§4.2), and
  live updates over a WebSocket (§5).

§7 lists every place the implementation differs from the original request.
Read it before wiring the hooks.

---

## 1. Conventions

| Environment | REST base URL | WebSocket URL |
|---|---|---|
| Production | `https://api.tredro.online` | `wss://api.tredro.online/ws/companies/tracking/` |
| Local | `http://localhost:8000` | `ws://localhost:8000/ws/companies/tracking/` |

```http
Authorization: Bearer <access-token>
Content-Type: application/json
```

- `reps/...` endpoints need a **rep** token.
- `companies/...` endpoints need a **company user** token with `reps` → `can_view`
  (owners always pass). Otherwise: `403`.
- **Always send the trailing slash.**

Envelope, as everywhere else:

```json
{ "success": true, "message": "", "data": { } }
{ "success": false, "message": "فشل التحقق من البيانات", "errors": { "field": ["detail"] } }
```

### Times

- Request times are ISO 8601 **with an offset** (`2026-10-31T08:22:00+03:00`).
  The device's own clock is trusted, so an offline rep syncs the real times later.
- Tracking responses (§3.1–3.2, §4, §5) give times in ISO 8601 **Syria time
  (`+03:00`)**. The visit object in §3.4 is a plain API resource and uses the
  API's usual UTC (`Z`) format. Both may carry
  microseconds (`2026-10-31T14:27:42.364813+03:00`), so parse them; don't
  compare them as strings.
- A tracking **day** is a calendar day in Syria time (Asia/Damascus).

### Coordinates and money

- Coordinates are decimal degrees, as **numbers**. Stored to 6 decimals; send
  as many as you have.
- Money is a fixed-precision **string** (`"1155000.00"`).

---

## 2. Data model in one paragraph

Nothing about a day is stored as such. The server rebuilds the day on every read
from the **day session** (start/end), the **GPS points**, and the **documents
themselves**: sales invoices, cash payments, issued returns, no-sale visits and
new customers. It is always cut off at the current time. So an invoice's amount
on the map is always the invoice's real amount, and editing a document is
reflected on the next read.

---

## 3. Rep app → backend

### 3.1 Start the day

`POST /api/reps/day/start/`

```json
{ "latitude": 36.2021, "longitude": 37.1343, "at": "2026-10-31T08:22:00+03:00" }
```

All fields are optional. `at` defaults to the server's time. If the coordinates
are missing, the dashboard has no depot pin for the day.

| Status | Meaning |
|---|---|
| `201` | Day opened |
| `200` | A day for that date was already open; it is returned unchanged (idempotent) |

```json
{
  "success": true,
  "message": "تم بدء يوم العمل",
  "data": {
    "day": { "id": 52, "date": "2026-10-31", "started_at": "2026-10-31T08:22:00+03:00", "ended_at": null }
  }
}
```

One day per rep per date: the date is taken from `at`.

### 3.2 End the day

`POST /api/reps/day/end/` takes the same body and returns the same `day` object
with `ended_at` set.

- This ends today's day, or yesterday's if it ran past midnight.
- Ending a day that is already ended changes nothing and returns `200`.
- If no day was started, the response is `400` with `errors.day`.

If the rep never presses "end", the dashboard shows the day as ended **30
minutes after the rep was last seen**, meaning the last GPS point or last
activity (capped at midnight). See §6.2.

### 3.3 GPS points

`POST /api/reps/locations/`

```json
{
  "points": [
    { "latitude": 36.20514, "longitude": 37.13921, "recorded_at": "2026-10-31T09:14:05+03:00", "accuracy": 8.5, "speed": 6.2, "heading": 92 }
  ]
}
```

| Field | Required | Notes |
|---|---|---|
| `latitude`, `longitude` | yes | |
| `recorded_at` | yes | Device time of the fix |
| `accuracy` | no | Metres, ≥ 0. Points with **accuracy > 100 are dropped** |
| `speed` | no | m/s, ≥ 0 |
| `heading` | no | Degrees, 0–360 |

```json
{ "success": true, "message": "", "data": { "received": 2, "accepted": 2 } }
```

The server keeps a point only if **all** of these hold:

- its accuracy is ≤ 100 m (or not sent);
- it falls **inside a started day**, between `started_at` and `ended_at`.
  **Sync "start my day" before the points that follow it.** An offline queue
  that sends points first loses them;
- it is not a repeat. A point with the same `recorded_at` as one already stored
  is ignored, so re-sending a batch is safe.

`accepted` counts the points that passed the first two checks. Order within a
batch doesn't matter.

**Batching:** online, send each point as it is taken (a batch of one); that is
what moves the car on the dashboard. Offline, send the queue on reconnect, in
chunks of at most **3000 points**. Only points recorded in the last minute are
pushed live; older ones just fill in the history.

**Heartbeat while standing still: please implement.** Send a point about once a
minute even when the rep isn't moving. Without one, a stop of more than 30
minutes with no sale (a long visit, lunch) looks like the end of the day, and
the dashboard shows the rep as `finished` until they move again.

### 3.4 Visit without a sale

`POST /api/reps/visits/`. Send an `Idempotency-Key` header, as for invoices,
so a retry can't record the visit twice.

```json
{ "customer": 42, "outcome": "no_sale", "reason": "shop_closed", "note": "", "latitude": 36.2, "longitude": 37.13, "at": "2026-10-31T10:05:00+03:00" }
```

| Field | Required | Notes |
|---|---|---|
| `customer` | yes | Must be one of **this rep's** customers, otherwise `400` |
| `reason` | yes | `shop_closed` · `owner_absent` · `enough_stock` · `come_back_later` · `other` |
| `note` | when `reason=other` | Required and non-blank for `other`, otherwise `400` (`errors.note`) |
| `outcome` | no | Only `no_sale` exists; this is the default |
| `latitude`, `longitude`, `at` | no | `at` defaults to now |

`201`:

```json
{
  "success": true,
  "message": "تم تسجيل الزيارة",
  "data": {
    "visit": {
      "id": 18, "customer": 42, "outcome": "no_sale", "reason": "shop_closed", "note": "",
      "latitude": "36.200000", "longitude": "37.130000",
      "visited_at": "2026-10-31T07:05:00Z", "created_at": "2026-10-31T07:05:02.114000Z"
    }
  }
}
```

### 3.5 Coordinates on invoices, payments and returns

Three existing rep-app endpoints now accept optional `latitude` and `longitude`:

- `POST /api/reps/sales-invoices/` (any `payment_amount` paid on the spot gets
  the same location)
- `POST /api/reps/payments/`
- `POST /api/reps/return-invoices/`

Send **both or neither**; half a pair is ignored. Without them, the activity is
drawn at the customer's pin.

A return shows on the map when it is **issued**, not when the draft is created.

---

## 4. Dashboard ← backend (REST)

### 4.1 One rep's day

`GET /api/companies/reps/{rep_id}/tracking/?date=2026-10-31`

`date` is a Syria-time date in `YYYY-MM-DD` form and defaults to today. Today
returns everything up to now. A future date returns an empty, `not_started` day.

| Status | Meaning |
|---|---|
| `400` | `date` isn't `YYYY-MM-DD` |
| `404` | Rep isn't in your company |

```json
{
  "success": true,
  "message": "",
  "data": {
    "rep_id": 6,
    "date": "2026-10-31",
    "status": "at_customer",
    "current_customer": { "id": 42, "name": "سوبر ماركت أبو أحمد" },
    "day_start": "2026-10-31T08:22:00+03:00",
    "day_end": null,
    "depot": { "latitude": 36.2021, "longitude": 37.1343 },
    "position": { "latitude": 36.2101, "longitude": 37.1502, "recorded_at": "2026-10-31T12:40:10+03:00", "heading": 92, "speed": 6.4 },
    "path": [
      { "latitude": 36.2021, "longitude": 37.1343, "recorded_at": "2026-10-31T08:22:00+03:00" }
    ],
    "activities": [
      {
        "id": "inv-311",
        "type": "invoice",
        "at": "2026-10-31T09:36:00+03:00",
        "latitude": 36.2051, "longitude": 37.1392,
        "customer": { "id": 42, "name": "سوبر ماركت أبو أحمد" },
        "amount": "1155000.00",
        "note": "",
        "reason": null,
        "visit_index": 2,
        "ref": { "kind": "sales_invoice", "id": 311 }
      }
    ],
    "planned": [
      { "id": 42, "name": "سوبر ماركت أبو أحمد", "latitude": 36.2051, "longitude": 37.1392, "visited": true }
    ],
    "stats": {
      "visits": 5, "planned": 7,
      "sales_total": "4190000.00", "collections_total": "330000.00", "returns_total": "0.00",
      "invoices_count": 4, "distance_km": 7.4,
      "first_activity": "2026-10-31T08:22:00+03:00", "last_activity": "2026-10-31T12:36:00+03:00"
    }
  }
}
```

Field notes:

| Field | Notes |
|---|---|
| `depot` | Where the rep pressed "start my day". `null` if there's no day or it was started without a GPS fix |
| `position` | The last GPS point, `null` if none. Has `speed` as well as `heading`; both may be `null` |
| `path` | Every stored point of the day in time order. Inaccurate points were never stored |
| `day_end` | When the rep pressed "end", **or the inferred end** (§3.2). `null` while the day is running |
| `planned` | Customers due on this weekday, plus anyone visited off-plan. **Visited first, in visit order**, then the rest by name. `latitude`/`longitude` may be `null` for a customer with no pin |

### 4.2 All reps now

`GET /api/companies/reps/tracking/live/`

```json
{
  "success": true,
  "message": "",
  "data": {
    "reps": [
      {
        "rep_id": 6,
        "name": "سامي الحلبي",
        "date": "2026-10-31",
        "status": "moving",
        "current_customer": null,
        "day_start": "2026-10-31T08:22:00+03:00",
        "day_end": null,
        "depot": { "latitude": 36.2021, "longitude": 37.1343 },
        "position": { "latitude": 36.2101, "longitude": 37.1502, "recorded_at": "...", "heading": 92, "speed": 6.4 },
        "activities": [ ],
        "last_activity": { },
        "stats": { },
        "path_preview": [ { "latitude": 36.2021, "longitude": 37.1343, "recorded_at": "..." } ]
      }
    ]
  }
}
```

- This is the §4.1 object for **today**, **without `path` and `planned`**,
  plus `name`, `last_activity` (the last item of `activities`, or `null`) and
  `path_preview` (the path thinned to **≤ 200 points**, always ending at the
  latest point).
- **Every** rep of the company is listed, inactive ones included (as
  `offline`): active reps first, then by name.

Call it once when the page opens, and again after every WebSocket reconnect. If
the socket can't connect, poll it every 30 s.

---

## 5. Live updates — WebSocket

### 5.1 Connect

```
wss://api.tredro.online/ws/companies/tracking/?token=<company access token>
```

The socket opens, then closes straight away if it is refused:

| Close code | Meaning | What to do |
|---|---|---|
| `4401` | Token invalid or expired | Refresh the token, reconnect |
| `4403` | Not a company user, or no `reps` → `can_view` | Don't retry |

A company only ever receives events about its own reps.

### 5.2 Subscribe

Client → server:

```json
{ "action": "subscribe", "scope": "all" }
{ "action": "subscribe", "scope": "rep", "rep_id": 6 }
{ "action": "unsubscribe", "scope": "rep", "rep_id": 6 }
```

Server replies:

```json
{ "type": "subscribed", "scope": "rep", "rep_id": 6 }
{ "type": "unsubscribed", "scope": "rep", "rep_id": 6 }
{ "type": "error", "message": "Unknown scope or rep." }
```

- **`rep_id` must be a JSON number.** `"6"` is rejected, and so is a rep from
  another company.
- For `scope: "all"`, the reply's `rep_id` is `null`.
- Subscribing sends **no current state**; read §4.1 / §4.2 for that.
- You can hold both scopes on one socket (home card plus a rep tab). Events
  about a rep you follow individually arrive **once**, from the `rep` scope.

### 5.3 Keep-alive

The server sends `{ "type": "ping" }` every 25 s. Answer
`{ "action": "pong" }`. A socket that hasn't answered for 60 s is closed (in
practice within 60–85 s). Treat that as a normal disconnect: reconnect, re-read
REST, resubscribe.

### 5.4 Events

Every event has `type`, `rep_id` and `at` (Syria time). Payloads have the same
shapes as §4.1, so you can append them directly.

| `type` | When | Payload |
|---|---|---|
| `location` | A new GPS point arrives live | `point`: `{ latitude, longitude, recorded_at, heading, speed }` |
| `activity` | Invoice, cash payment, issued return, no-sale visit, new customer, day start or day end, **happening today** | `activity`: the §4.1 activity object, with its final `visit_index` |
| `stats` | Right after each batch of `activity` events | `stats`: the §4.1 stats object |
| `status` | The rep's status or current customer changed | `status`, `current_customer` (`{id, name}` or `null`) |

```json
{ "type": "location", "rep_id": 6, "at": "2026-10-31T12:40:10+03:00",
  "point": { "latitude": 36.2101, "longitude": 37.1502, "recorded_at": "2026-10-31T12:40:10+03:00", "heading": 92, "speed": 6.4 } }

{ "type": "status", "rep_id": 6, "at": "2026-10-31T12:42:00+03:00",
  "status": "at_customer", "current_customer": { "id": 42, "name": "سوبر ماركت أبو أحمد" } }
```

Rules:

- **`location` on the `all` scope is throttled** to one per rep every 5 s. The
  `rep` scope gets every point.
- **No replay on reconnect.** Re-read REST, then keep listening.
- Status changes that need no write, such as arriving at a shop while standing
  still or a day ending by inactivity, are detected by a server check **every
  30 s**. Expect those `status` events up to ~30 s late.
- Documents dated in the past (backdated, or synced late from offline) are
  **not** pushed. They show up on the next REST read.
- Events can, rarely, arrive twice. Dedupe activities by `id`.

---

## 6. Rules the server applies

### 6.1 Activities

| `type` | Source | `at` | `amount` | `ref.kind` | `id` |
|---|---|---|---|---|---|
| `day_start` | Day session | `started_at` | `null` | `ref` is `null` | `start-{session}` |
| `invoice` | Sales invoice by this rep | invoice **`date`** | `total_amount` | `sales_invoice` | `inv-{id}` |
| `collection` | **Cash** payment collected by this rep | `collected_at` | `amount` | `payment` | `pay-{id}` |
| `return` | **Issued** return of this rep | `issued_at` | `amount` | `return_invoice` | `ret-{id}` |
| `new_customer` | Customer created by this rep in the app, or signed up with the rep's referral code | `created_at` | `null` | `customer` | `cust-{id}` |
| `no_sale` | §3.4 visit | `visited_at` | `null` | `visit` | `visit-{id}` |
| `day_end` | Pressed or inferred end | end time | `null` | `ref` is `null` | `end-{session}` |

- Sorted by `at`.
- **Location:** the device coordinates sent with the record. If there are none,
  the customer's pin. For `day_end` without coordinates, the last GPS point.
- **`note`:** the document's notes (or the visit's note). **`reason`:** the
  no-sale reason, `null` on other types.
- **`visit_index`:** the 1-based shop stop. Back-to-back activities at the same
  customer share one index. `null` on `day_start` / `day_end`.
- Applying a stored customer credit is **not** a collection: no cash changed
  hands at a visit.

### 6.2 Status

Checked in this order:

| Value | Rule |
|---|---|
| `offline` | Rep account inactive |
| `not_started` | No day session for the date (yet) |
| `finished` | Day ended: pressed, or 30 min after the rep was last seen (last point or activity), capped at midnight |
| `at_customer` | The rep's points have stayed within **60 m** of one of their customers for **≥ 2 min**, counted up to now. If two shops are both in range, the one the rep has been beside longest wins |
| `moving` | Otherwise |

`current_customer` is set only for `at_customer`.

### 6.3 Stats

| Field | Rule |
|---|---|
| `visits` | Number of shop stops (the highest `visit_index`) |
| `planned` | Length of `planned` |
| `sales_total` / `collections_total` / `returns_total` | Sums of the matching activities' `amount`. **Not currency-converted**: documents are summed as written |
| `invoices_count` | Number of `invoice` activities |
| `distance_km` | Length of the stored path (straight lines between points), 1 decimal |
| `first_activity` / `last_activity` | `at` of the first / last activity, `null` on an empty day |

---

## 7. Differences from the original request

| Request said | Built | Why |
|---|---|---|
| Customers list lacks `latitude`, `longitude`, `address` | Already returned by `GET /api/companies/customers/`; no change made | If you don't see them, production is behind; check after this deploy |
| `depot` | The day-start location | Warehouses have no coordinates |
| Invoice time = `created_at` | Invoice **`date`** | An invoice synced late from offline keeps its real time |
| Return time = `issued_at` | Same; **drafts don't show** | A draft hasn't happened yet |
| Live endpoint: "the same object as 4.1 without `path` and `planned`" | Exactly that, so `activities` **stays**; `last_activity` and `path_preview` added | |
| — | Extra fields: `reason` on activities, `speed` on `position` | Displaying the no-sale reason; parity with the `location` event |
| Points only between start and end (client rule) | **Also enforced by the server** (§3.3) | Reps aren't tracked off the clock |
| — | Batch limit of **3000 points** | Chunk larger offline backlogs |
| — | **Heartbeat point once a minute while stationary** (rep app) | Otherwise long stops read as `finished` (§3.3) |
| — | `Idempotency-Key` on `reps/visits/` | Same retry safety as invoices |
| — | `subscribe` replies `error` for an unknown scope or rep | |

---

## 8. Demo data

The demo company **الشام للمواد الغذائية** (login `900000101`) is seeded with:

```bash
python manage.py seed_rep_tracking            # after seed_demo_data
```

- Every active rep gets 16 shops pinned to real streets in their own Aleppo
  neighbourhood, 9–10 of them planned on **every** weekday.
- Each rep gets the last 14 days plus **all of today**, driven along real roads.
  Every stop is a real invoice / payment / return / no-sale at that shop at that
  time, so `ref` links open real documents.
- **Today replays live.** Data after now is hidden from REST and pushed over
  the socket as its time arrives, so the map moves during a demo. This lasts
  until midnight, so **re-run the command on demo day**.
- Re-running replaces the previous run and doesn't touch other companies.
