# Rep Tracking — Backend Contract + Seed Request

The dashboard now has a full **rep tracking** feature (live map of all reps, each rep's day on a map, visited shops, replay of the day with a moving car). Today it runs on **generated dummy data** in the frontend. This document describes what the backend needs to provide so we can delete the dummy data, and asks for a **seed** so the demo company shows realistic tracking.

Where it appears in the dashboard:

- `/reps/tracking`: all reps right now (list + map).
- `/reps/detail?id={rep}&tab=tracking`: one rep's day: visits list, map, route, replay, previous days.
- Home page: a one-line live summary card.

---

## 1. What already exists (no work needed)

| Data                                  | Source today                                 | Used for                          |
| ------------------------------------- | -------------------------------------------- | --------------------------------- |
| Customer `latitude`, `longitude`, `address` | customer model (rep app already sets them)  | shop pins on the map              |
| Rep ↔ customer `work_days`            | `assigned_reps_details[].work_days`          | the day's **planned** shops       |
| Sales invoices (`rep`, `customer`, `total_amount`, `created_at`) | invoices        | "invoice" activities              |
| Payments (`collected_by`, `amount`, `collected_at`) | payments                      | "collection" activities           |
| Return invoices (`rep`, `amount`, `issued_at`) | returns                            | "return" activities               |
| Customers created by a rep (referral)  | customers                                    | "new customer" activities         |

**One small change here:** the dashboard customers list (`GET companies/customers/`) does not return `latitude`, `longitude`, `address`. Please add them (same fields as the rep app's customer).

---

## 2. What is missing

1. **GPS points** from the rep app while the rep is working.
2. **Work day start / end** (the rep presses "start my day" / "end my day").
3. **Visit without a sale**: the rep visited a shop but nothing was sold (shop closed, owner absent, …). Today this leaves no record.
4. **Where** an invoice / payment / return was made: optional device coordinates on create.
5. Two **read endpoints** for the dashboard (section 4).

---

## 3. Rep app → backend (write)

All under the rep auth (`reps/...`). Times are ISO 8601 with timezone. Coordinates are decimal degrees (6 decimals is enough).

### 3.1 Start / end the work day

| Method | URL                    | Body                                      |
| ------ | ---------------------- | ----------------------------------------- |
| `POST` | `reps/day/start/`      | `{ "latitude": 36.2, "longitude": 37.13, "at": "2026-10-31T08:22:00+03:00" }` |
| `POST` | `reps/day/end/`        | same shape                                |

- One day session per rep per local date. Starting twice returns the existing session (idempotent).
- `at` is optional (server time if missing), so an offline rep can sync it later with the real time.
- If a rep never presses "end", treat the day as ended at the **last GPS point + 30 min** (or midnight).

### 3.2 GPS points (batched)

`POST reps/locations/`

```json
{
  "points": [
    { "latitude": 36.20514, "longitude": 37.13921, "recorded_at": "2026-10-31T09:14:05+03:00", "accuracy": 8.5, "speed": 6.2, "heading": 92 },
    { "latitude": 36.20561, "longitude": 37.14010, "recorded_at": "2026-10-31T09:14:20+03:00", "accuracy": 7.0, "speed": 6.8, "heading": 88 }
  ]
}
```

- Sent only **between day start and day end** (we don't track reps outside work).
- The app records a point every ~10–15 s while moving (or every 25 m). **Online, it sends each point right away** (a batch of one), so the dashboard sees the rep live (section 4.3). Offline, points queue up and are sent as one batch on reconnect. Late batches happen, so **sort by `recorded_at`, not by arrival**, and ignore exact duplicates.
- Every accepted point is also **pushed to the dashboard over the WebSocket** (4.3). Late offline batches only update history; they are not pushed as "live".
- `accuracy` (m), `speed` (m/s) and `heading` (degrees) are optional.
- Please drop points with `accuracy > 100` m. They make the route jump.

### 3.3 Visit without a sale

`POST reps/visits/`

```json
{ "customer": 42, "outcome": "no_sale", "reason": "shop_closed", "note": "", "latitude": 36.2, "longitude": 37.13, "at": "2026-10-31T10:05:00+03:00" }
```

`reason`: `shop_closed` | `owner_absent` | `enough_stock` | `come_back_later` | `other` (with `note`).

### 3.4 Location on existing actions (optional fields)

Add optional `latitude`, `longitude` to the create payloads of **sales invoice**, **payment** and **return invoice** from the rep app. If they are missing, use the customer's location.

---

## 4. Dashboard ← backend (read)

Company auth (`companies/...`). The frontend types these responses mirror are in `module/tracking/types/index.ts`.

### 4.1 One rep's day

`GET companies/reps/{rep_id}/tracking/?date=2026-10-31`

`date` is the company's local date and defaults to today. For **today**, return everything recorded **up to now**. The frontend handles replay by itself from the full path.

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
    "position": { "latitude": 36.2101, "longitude": 37.1502, "recorded_at": "2026-10-31T12:40:10+03:00", "heading": 92 },
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

**`activities[].type`**: `day_start` | `invoice` | `collection` | `return` | `new_customer` | `no_sale` | `day_end`. Sorted by `at`.

**`visit_index`** is the 1-based order of the shop visit within the day. Consecutive activities at the same customer share one index (e.g. an invoice + a payment in the same stop). `day_start` / `day_end` have none.

**`planned`** is the customers whose `work_days` for this rep include the date's weekday, plus any customer actually visited that day.

**`ref`** points to the real record, so the dashboard can link to the invoice / payment / return.

**`status`**:

| Value         | Rule                                                                      |
| ------------- | ------------------------------------------------------------------------- |
| `offline`     | rep account inactive                                                       |
| `not_started` | no day session yet for the date                                           |
| `at_customer` | last point within ~60 m of a customer for ≥ 2 min                         |
| `moving`      | day started, not ended, not at a customer                                 |
| `finished`    | day ended                                                                 |

`distance_km` is the sum of the path (after dropping inaccurate points), one decimal. Money uses fixed-precision strings, as everywhere else.

### 4.2 All reps right now

`GET companies/reps/tracking/live/`

The same object as 4.1 for **today**, one per rep, but **without `path` and `planned`** (the map only needs the position and the last activity here). To keep it light, add `path_preview`: the path simplified to ≤ 200 points, so we can draw each rep's dotted trail.

```json
{
  "success": true,
  "data": {
    "reps": [
      { "rep_id": 6, "name": "سامي الحلبي", "status": "moving", "position": { "...": "..." }, "last_activity": { "...": "..." }, "stats": { "...": "..." }, "path_preview": [] }
    ]
  }
}
```

The dashboard calls this **once on page open** (and after a WebSocket reconnect). Live changes then arrive over the WebSocket (4.3). If the socket can't connect, the dashboard falls back to polling this endpoint every 30 s.

### 4.3 Live updates — WebSocket

The REST endpoints give the **initial state**. Everything that happens after that is **pushed**, so the car moves smoothly and a new invoice shows up the second it's made. We expect Django Channels (or similar) on the existing API host.

**Connect**

```
wss://api.tredro.online/ws/companies/tracking/?token=<company access token>
```

- Same auth as the REST API. Close with code `4401` if the token is invalid or expired, so the frontend refreshes it and reconnects.
- A company only ever receives events about **its own** reps.

**Subscribe** (client → server). The client picks what it wants after connecting:

```json
{ "action": "subscribe", "scope": "all" }
{ "action": "subscribe", "scope": "rep", "rep_id": 6 }
{ "action": "unsubscribe", "scope": "rep", "rep_id": 6 }
```

- `all` is used by the all-reps page and the home card, `rep` by a rep's tracking tab.
- Server replies `{ "type": "subscribed", "scope": "...", "rep_id": 6 }`.

**Events** (server → client). Every event has `type`, `rep_id` and `at`. Payload shapes are the same as in 4.1, so the frontend appends them directly:

| `type`       | When                                              | Payload                                                                 |
| ------------ | ------------------------------------------------- | ----------------------------------------------------------------------- |
| `location`   | a new GPS point is accepted (online only)        | `{ "point": { "latitude", "longitude", "recorded_at", "heading", "speed" } }` |
| `activity`   | invoice / payment / return / no-sale / new customer / day start / day end created | `{ "activity": { …same object as 4.1 activities[]… } }` |
| `status`     | the rep's status changes (e.g. `moving` → `at_customer`) | `{ "status": "at_customer", "current_customer": { "id", "name" } }`    |
| `stats`      | after any `activity`                              | `{ "stats": { …same object as 4.1 stats… } }`                          |

```json
{ "type": "location", "rep_id": 6, "at": "2026-10-31T12:40:10+03:00",
  "point": { "latitude": 36.2101, "longitude": 37.1502, "recorded_at": "2026-10-31T12:40:10+03:00", "heading": 92, "speed": 6.4 } }
```

**Rules**

- Send `{ "type": "ping" }` every 25 s. The client answers `{ "action": "pong" }`. Drop sockets that don't answer within 60 s.
- No replay on reconnect. After reconnecting, the client calls 4.1 / 4.2 again for the current state, then keeps listening.
- Throttle `location` to at most **1 event per rep per 5 s** on the `all` scope. The `rep` scope gets every point.

---

## 5. Seed request (demo company)

We demo with company **الشام للمواد الغذائية** (login `900000101`). Please add a seed command (e.g. `seed_rep_tracking`) that fills it with realistic tracking data:

1. **Customers**: give every customer of the company real coordinates in **Aleppo** (the company's governorate). Put them on real streets / shop fronts, not in parks or the river. Spread each rep's customers over one area of the city (each rep has their own neighbourhood).
2. **Work days**: make sure each rep has **7–11 planned customers on every day of the week**, so any day we open has a plan.
3. **Days**: generate tracking for the **last 14 days + today**, for every active rep:
   - day start at the depot between 08:00 and 08:45, visits in nearest-first order, a lunch break around midday, return to the depot, day end;
   - **GPS path along real roads**: route each leg with OSRM (`router.project-osrm.org/route/v1/driving/...`) and store points ~every 15 s along the geometry, at city speed (~20–25 km/h);
   - 15–40 min at each shop, with a matching **real** invoice / payment / return / no-sale visit **at that shop at that time**. About 55 % invoice, 15 % invoice + payment, 10 % payment only, 8 % return, 12 % no sale;
   - 0–2 planned customers left unvisited on some days.
4. **Today must look live during a demo.** Seed the **whole** of today, including later hours, and let the read endpoints return only what is `≤ now`. Because the dashboard listens to the WebSocket, the server must also **push each seeded point / activity / status change over the socket when its time arrives** (a small loop or scheduled task for the demo company: every few seconds, emit whatever crossed `now` since the last run). Without this, the map stands still until the page is reloaded. (This is demo-data only; real data never has future points.)
5. Re-running the command replaces the seeded tracking data for that company (idempotent). It must never touch other companies.

---

## 6. When this is ready (frontend side)

We delete `module/tracking/lib/dummy-day.ts` and `module/tracking/lib/roads.ts`, swap the hooks in `module/tracking/hooks/index.ts` to call 4.1 / 4.2, and add a socket client (4.3) that appends live points and activities to the loaded day. The UI components stay as they are. The live car will glide between points the same way the replay already does. The rep app gets "start / end my day", background location sending (3.2) and a "visit without sale" action (3.3).

Questions or a different shape that suits you better? Tell us before building and we'll adapt the frontend.
