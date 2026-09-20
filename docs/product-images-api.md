# Product Images — Create / Edit Request Contract

This document describes how the dashboard frontend sends product images to the backend when **creating** or **editing** a product. Please implement / verify the backend against it.

---

## 1. Endpoints

| Mode   | Method  | URL                          |
| ------ | ------- | ---------------------------- |
| Create | `POST`  | `companies/products/`        |
| Edit   | `PATCH` | `companies/products/{id}/`   |

Both requests use **`Content-Type: multipart/form-data`**.
Images are **not** sent through a separate endpoint — they travel inside the same product request.

---

## 2. Request structure

The multipart body has:

1. **One `data` part** — a JSON string (`JSON.stringify(...)`) containing the whole product (name, sku, prices, custom_fields, **images**, ...). Nested arrays/objects are real JSON (no bracket notation like `images[0][alt_text]`).
2. **Zero or more file parts** — one part per **new** image, named `image_0`, `image_1`, `image_2`, ...

Each item in `data.images[]` is linked to its file part through `_file_ref`.

```
POST companies/products/
Content-Type: multipart/form-data; boundary=----X

------X
Content-Disposition: form-data; name="image_0"; filename="front.jpg"
Content-Type: image/jpeg

<binary>
------X
Content-Disposition: form-data; name="image_1"; filename="side.png"
Content-Type: image/png

<binary>
------X
Content-Disposition: form-data; name="data"

{ ...product JSON, see below... }
------X--
```

---

## 3. `images[]` item shape (inside `data`)

| Field         | Type      | Sent when                | Meaning                                                                 |
| ------------- | --------- | ------------------------ | ----------------------------------------------------------------------- |
| `id`          | number    | existing image (edit)    | Server id of an image that already exists. **Absent for new images.**   |
| `_file_ref`   | string    | **new image only**       | Name of the multipart file part that holds the file, e.g. `"image_0"`.  |
| `alt_text`    | string    | optional                 | Alt text. Omitted when empty.                                           |
| `is_primary`  | boolean   | always                   | Exactly one image should be `true` (the main/cover image).              |
| `sort_order`  | number    | always                   | Zero-based position, equal to the item's index in the array.            |

The frontend never sends the binary inside the JSON — only `_file_ref`.

### Three kinds of items

| Kind                        | Has `id` | Has `_file_ref` | Backend action                                              |
| --------------------------- | :------: | :-------------: | ----------------------------------------------------------- |
| **New image**               |    ✗     |        ✓        | Read file `data.images[i]._file_ref` from multipart, create image. |
| **Existing image, kept**    |    ✓     |        ✗        | Do not touch the file. Update `alt_text`, `is_primary`, `sort_order` only. |
| **Existing image, replaced**| —        | —               | Not supported as an in-place replace: the UI removes the old image (omitted from the list) and adds a new one. |

> The frontend filters out rows that have no file and no `id` before sending, so the backend will never receive an empty image row.

---

## 4. Create mode (`POST`)

- All images are **new** → each has `_file_ref`, none has `id`.
- `sort_order` = index, `is_primary` set on one item.

### Example `data` part

```json
{
  "name": "Blue T-Shirt",
  "sku": "TS-001",
  "unit": 1,
  "category": 4,
  "is_taxable": false,
  "is_sellable": true,
  "is_purchasable": true,
  "is_active": true,
  "status": "draft",
  "prices": [
    { "currency": 1, "price_type": "retail", "price": "25.00", "is_default": true }
  ],
  "images": [
    { "_file_ref": "image_0", "alt_text": "Front view", "is_primary": true,  "sort_order": 0 },
    { "_file_ref": "image_1",                            "is_primary": false, "sort_order": 1 }
  ]
}
```

plus file parts `image_0` and `image_1`.

---

## 5. Edit mode (`PATCH`)

The frontend sends the **complete desired list of images** for the product, in final order.

- Images already on the server → `{ "id": <server id>, ... }` (no file part).
- Newly added images → `{ "_file_ref": "image_N", ... }` + file part `image_N`.
  Note that `N` is the item's **index in the final array**, so in a mixed list the indexes of new images may not be contiguous (e.g. `image_1`, `image_3`).
- Order and primary flag are re-sent every time (`sort_order`, `is_primary`).

### Example `data` part

Product had images with ids `10` and `11`. The user removed `11`, added one new image, and made the new one primary:

```json
{
  "name": "Blue T-Shirt",
  "images": [
    { "id": 10, "alt_text": "Front view", "is_primary": false, "sort_order": 0 },
    { "_file_ref": "image_1",             "is_primary": true,  "sort_order": 1 }
  ]
}
```

plus file part `image_1`.

### Expected backend behavior on `PATCH`

1. For each item with `id` → update `alt_text`, `is_primary`, `sort_order` of that image (must belong to this product, otherwise 400/404).
2. For each item with `_file_ref` → read `request.FILES[_file_ref]`, create a new image with the given fields.
3. **Any existing image of the product whose `id` is NOT in `images[]` → delete it.** (This is how removal works — there is no separate delete call.)
4. Enforce a single `is_primary` (if none/multiple are sent, keep the first / fall back to the first by `sort_order`).

---

## 6. Important edge cases (please confirm)

1. **`images` key omitted.**
   If the product ends up with **zero** images, the frontend currently sends `images: undefined`, i.e. the key is **missing** from `data` (same for `prices`).
   - On **create**: fine, product has no images.
   - On **edit**: ambiguity — a missing key could mean "don't touch images" *or* "remove all images". Today the frontend can't remove the *last* remaining image with this behavior.
   - **Proposal:** the backend treats a missing `images` key as "leave unchanged", and the frontend will send `"images": []` when the user deletes all images (frontend change needed — tell us if you agree).

2. **`_file_ref` points to a missing file part** → return `400` with a field error like `images.<i>._file_ref`.

3. **Validation errors** should keep the field-path format so the form can highlight them, e.g.
   ```json
   { "success": false, "message": "Validation error", "errors": { "images.0.image": ["Invalid image."] } }
   ```

4. **Suggested file rules** (backend is the source of truth; tell us the limits so we can mirror them in the UI): allowed types `jpeg / png / webp`, max size per file (e.g. 5 MB), max images per product (e.g. 10).

5. **Do not use** a top-level `images` file field or bracket notation (`images[0][file]`). Only the `data` JSON part + `image_N` file parts are sent.

---

## 7. Response

Same envelope as today. `images` in the returned product:

```json
{
  "success": true,
  "message": "...",
  "data": {
    "product": {
      "id": 7,
      "images": [
        {
          "id": 10,
          "image": "https://cdn.example.com/products/10.jpg",
          "alt_text": "Front view",
          "is_primary": false,
          "sort_order": 0,
          "created_at": "...",
          "updated_at": "..."
        }
      ]
    }
  }
}
```

`image` must be an absolute URL (or one the frontend can resolve). The edit form loads these into the form and sends back `id` for images the user keeps.

---

## 8. Frontend reference

- Building the multipart body: `module/products/api/index.ts` → `buildProductFormData`
- Building the images list from the form: `module/products/components/product-form-client.tsx` → `buildImagesPayload`
