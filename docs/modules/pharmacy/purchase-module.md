# Pharmacy Purchase Module

## Overview

Multi-component system for managing inventory purchases with manual entry, batch operations, and invoice uploads. Handles GST taxation, discounts, freight charges, and roundup values.

## File Structure

| File | Purpose |
|------|---------|
| `src/pages/pharmacy/purchase/add-purchase/index.js` | Entry point — permission gate |
| `src/components/pharmacy/purchase/AddPurchaseForm.js` | Main form — header fields, submission, calculations |
| `src/views/pages/pharmacy/purchase/purchaseItemForm/index.js` | Item dialog — product selection, per-item calculations |
| `src/components/pharmacy/purchase/PurchaseDetailsTable.js` | Table — displays added items |
| `src/components/pharmacy/purchase/PurchaseInvoiceUpload.js` | Invoice upload flow |

---

## Data Flow

```
User navigates to /pharmacy/purchase/add-purchase
  │
  ├── Permission check (central pharmacy + ADD/full_access)
  │
  └── AddPurchaseForm
        ├── Fetches suppliers, stores, variants on mount
        ├── If edit mode: fetches existing purchase via getPurchaseListById(id)
        ├── Manages editParams.purchase_details[] (array of line items)
        │
        ├── "Add Inventory Item" button → opens PurchaseItemForm dialog
        │     ├── Product autocomplete search (debounced 1000ms)
        │     ├── Batch + Expiry (auto-fetched via getBatchExpiry, debounced 500ms)
        │     ├── Rate, Qty, Discount %, GST fields
        │     ├── calculateStuff() on any value change
        │     └── Submit → addItemsToTable() or updateTableItems()
        │
        ├── PurchaseDetailsTable (renders purchase_details[])
        │     ├── Edit → editTableData() → pre-fills PurchaseItemForm
        │     └── Delete → removeItemsFroTable()
        │
        ├── Amount Summary (aggregated from purchase_details[])
        │     ├── Total Amount, Freight, Additional Charges
        │     ├── CGST, SGST, IGST totals
        │     ├── Discount, Roundup
        │     └── Grand Total
        │
        └── Submit → addPurchase() or updatePurchasePrice()
              └── Redirect to /pharmacy/purchase/
```

---

## Form Fields & Defaults

### AddPurchaseForm (useForm defaultValues)

```javascript
{
  po_date: Utility.formattedPresentDate(),
  po_no: '',
  supplier_id: '',
  description: '',
  purchase_order_no: '',
  requested_by: '',
  freight_charges: '',
  freight_gst: '',
  additional_charges: '',
  round_off: ''
}
```

### AddPurchaseForm Validation Schema

| Field | Rule |
|-------|------|
| `supplier_id` | Required |
| `po_no` | Required |
| `po_date` | Required |
| `description` | Optional string |

### PurchaseItemForm (useForm defaultValues)

```javascript
{
  product: { label: '', value: '', stock_type: '' },
  purchase_batch_no: '',
  purchase_expiry_date: null,
  purchase_unit_price: '',
  purchase_qty: '',
  purchase_free_quantity: 0,
  purchase_discount: 0,
  purchase_cgst: 0,
  purchase_sgst: 0,
  purchase_igst: 0,
  purchase_gst: 0,
  purchase_cgst_amount: 0,
  purchase_sgst_amount: 0,
  purchase_igst_amount: 0,
  purchase_gross_amount: 0,
  purchase_discount_amount: 0,
  purchase_taxable_amount: 0,
  purchase_net_amount: 0,
  package_details: '',
  manufacture: '',
  purchase_variant_id: '',
  purchase_unit_qty: 0,
  purchase_variant_ratio: '',
  isVariantIdPresent: false,
  purchase_created_by: '',
  medicine_name_by_ml: ''
}
```

### PurchaseItemForm Validation Rules

| Field | Rule |
|-------|------|
| `product.value` | Required |
| `purchase_batch_no` | Required, unique per product+batch combo |
| `purchase_expiry_date` | Required (skipped for non_medical stock_type) |
| `purchase_unit_price` | Required, positive number |
| `purchase_qty` | Required, min 1 |
| `purchase_discount` | Required, min 0 |
| `purchase_cgst` | If > 0, SGST must also > 0 and IGST must = 0 |
| `purchase_sgst` | If > 0, CGST must also > 0 and IGST must = 0 |
| `purchase_igst` | If > 0, CGST and SGST must both = 0 |
| `purchase_variant_id` | Required |

---

## Calculations

### Per-Item Calculation Engine (calculateStuff in PurchaseItemForm)

**Location:** `src/views/pages/pharmacy/purchase/purchaseItemForm/index.js`

**Triggered by onChange of:** `purchase_unit_price`, `purchase_qty`, `purchase_discount`, `purchase_cgst`, `purchase_sgst`, `purchase_igst`

#### Step-by-step calculation flow:

```javascript
// STEP 1: Extract and validate inputs
unit_price             = checkNumber(purchase_unit_price)
purchase_qty           = checkNumber(purchase_qty)
purchase_discount      = checkNumber(purchase_discount)       // percentage
purchase_free_quantity = checkNumber(purchase_free_quantity)
purchase_cgst          = checkNumber(purchase_cgst)           // percentage
purchase_sgst          = checkNumber(purchase_sgst)           // percentage
purchase_igst          = checkNumber(purchase_igst)           // percentage

// STEP 2: Gross Amount (before any deductions)
totalPurchasedQty = purchase_qty - purchase_free_quantity
grossAmount       = totalPurchasedQty * unit_price
// → sets form field: purchase_gross_amount

// STEP 3: Discount
discountAmount         = grossAmount * (purchase_discount / 100)
totalAmountAfterDiscount = grossAmount - discountAmount
// → sets form field: purchase_discount_amount

// STEP 4: Taxable Amount (after discount, before tax)
taxableAmount = grossAmount - discountAmount
// → sets form field: purchase_taxable_amount

// STEP 5: Tax Amounts (calculated on taxable amount)
purchase_cgst_amount = taxableAmount * (purchase_cgst / 100)
purchase_sgst_amount = taxableAmount * (purchase_sgst / 100)
purchase_igst_amount = taxableAmount * (purchase_igst / 100)
purchase_gst         = purchase_sgst + purchase_cgst          // combined %
purchase_gst_amount  = taxableAmount * (purchase_gst / 100)   // combined amount
// → sets form fields: purchase_cgst_amount, purchase_sgst_amount, purchase_igst_amount, purchase_gst

// STEP 6: Net Amount (final amount including tax)
if (purchase_igst_amount === 0) {
  netAmount = taxableAmount + purchase_gst_amount    // CGST+SGST path
} else {
  netAmount = taxableAmount + purchase_igst_amount   // IGST path
}
// → sets form field: purchase_net_amount

// STEP 7: Unit Quantity (for variant tracking)
totalUnitQty = purchase_variant_ratio * purchase_qty
// → sets form field: purchase_unit_qty
```

#### Helper Functions

```javascript
// Validate and parse number (returns 0 if invalid)
checkNumber(value) = parseFloat(value?.toString().length > 0 && !isNaN(value) ? value : 0)

// Format decimal precision based on magnitude
checkFloatValue(value):
  if value >= 0.01  → parseFloat(value).toFixed(2)   // e.g., 12.50
  if value > 0 && < 0.01 → parseFloat(value).toFixed(5)  // e.g., 0.00345
  else → 0

// Discount helpers
calculateDiscountAmount(price, percent) = (price * percent) / 100
calculateAmountAfterDiscount(price, percent) = price - (price * percent / 100)
```

#### GST Mutual Exclusivity (useWatch + useEffect)

```javascript
// Watched values
purchaseCgst = useWatch({ name: 'purchase_cgst' })
purchaseSgst = useWatch({ name: 'purchase_sgst' })
purchaseIgst = useWatch({ name: 'purchase_igst' })

// Effect 1: CGST or SGST entered → zero out IGST
if (purchaseCgst > 0 || purchaseSgst > 0) {
  setValue('purchase_igst', 0)
}

// Effect 2: IGST entered → zero out CGST and SGST
if (purchaseIgst > 0) {
  setValue('purchase_cgst', 0)
  setValue('purchase_sgst', 0)
}
```

#### Numerical Example

```
Input:  qty=10, free_qty=0, unit_price=100, discount=10%, CGST=9%, SGST=9%

Gross Amount      = (10 - 0) * 100             = 1000.00
Discount Amount   = 1000 * (10 / 100)          = 100.00
Taxable Amount    = 1000 - 100                  = 900.00
CGST Amount       = 900 * (9 / 100)            = 81.00
SGST Amount       = 900 * (9 / 100)            = 81.00
IGST Amount       = 900 * (0 / 100)            = 0.00
GST Amount        = 900 * (18 / 100)           = 162.00
Net Amount        = 900 + 162                   = 1062.00
```

---

### Aggregated Totals (AddPurchaseForm)

**Location:** `src/components/pharmacy/purchase/AddPurchaseForm.js`

These are computed directly from `editParams.purchase_details[]` using `.reduce()`:

| Variable | Formula | Used In |
|----------|---------|---------|
| `totalLineItemsAmount` | `SUM(purchase_gross_amount)` | CalcRow "Total Amount", `postData.total_amount` |
| `totalLineItemsTaxableAmount` | `SUM(purchase_taxable_amount)` | `postData.taxable_amount` |
| `totalLineItemsPurchase` | `SUM(purchase_net_amount)` | Input to `grandTotalAmount` |
| `totalLineItemsDiscount` | `SUM(purchase_discount_amount)` | CalcRow "Discount", `postData.discount_amount` |
| `calculate_cgst_tax_amount` | `SUM(purchase_cgst_amount)` | CalcRow "CGST", `postData.cgst` |
| `calculate_sgst_tax_amount` | `SUM(purchase_sgst_amount)` | CalcRow "SGST", `postData.sgst` |
| `calculate_igst_tax_amount` | `SUM(purchase_igst_amount)` | CalcRow "IGST", `postData.igst` |

---

### Freight Charges Calculation

**Function:** `calculateFreightChargesWithGst(freightCharges, gstPercent)`

```
Total Freight = freightCharges + (freightCharges * gstPercent / 100)
```

**Triggered by:** onChange on `freight_charges` or `freight_gst` fields
**Stored in:** `totalFreightCharges` state

---

### Grand Total (useMemo)

```javascript
// Dependencies: [totalLineItemsPurchase, totalFreightCharges, additionalCharges, roundUpValue, roundup_select]

roundUp = roundup_select === '-' ? -parseFloat(roundUpValue) : parseFloat(roundUpValue)
totalFreight = parseFloat(totalFreightCharges) || 0
additional = parseFloat(additionalCharges) || 0
totalItems = parseFloat(totalLineItemsPurchase) || 0

grandTotalAmount = totalItems + totalFreight + additional + roundUp
```

**Used in:** `postData.net_amount`, Amount Summary display

#### Grand Total Numerical Example

```
Line Items Net Total  = 1062.00  (from per-item example above)
Freight Charges       = 500.00
Freight GST (18%)     = 90.00
Total Freight         = 590.00
Additional Charges    = 50.00
Roundup (+)           = 0.50

Grand Total = 1062.00 + 590.00 + 50.00 + 0.50 = 1702.50
```

---

### Invoice Total Validation

**Function:** `validateAndShowAmount()` (called onBlur of invoice total input)

```javascript
// Only show grand total if user-entered invoice total is > 50% of calculated grand total
if (inputValue > grandTotalAmount * 0.5) {
  showAmount = true   // Display grand total
} else {
  showAmount = false  // Hide grand total (likely invalid entry)
}
```

---

### Complete Calculation Flow Diagram

```
PurchaseItemForm (per item)
  │
  ├── purchase_qty, purchase_unit_price, purchase_free_quantity
  │     └── grossAmount = (qty - free_qty) * unit_price
  │
  ├── purchase_discount (%)
  │     ├── discountAmount = grossAmount * discount% / 100
  │     └── taxableAmount = grossAmount - discountAmount
  │
  ├── purchase_cgst, purchase_sgst (%) ─── OR ─── purchase_igst (%)
  │     ├── cgst_amount = taxableAmount * cgst% / 100
  │     ├── sgst_amount = taxableAmount * sgst% / 100
  │     ├── igst_amount = taxableAmount * igst% / 100
  │     └── gst_amount = taxableAmount * (cgst + sgst)% / 100
  │
  └── netAmount = taxableAmount + gst_amount (or igst_amount)
        │
        └── Stored in purchase_details[] array
              │
              ▼
AddPurchaseForm (aggregated)
  │
  ├── totalLineItemsAmount    = SUM(grossAmount)
  ├── totalLineItemsPurchase  = SUM(netAmount)        ─┐
  ├── totalLineItemsDiscount  = SUM(discountAmount)    │
  ├── calculate_cgst_tax      = SUM(cgst_amount)       │
  ├── calculate_sgst_tax      = SUM(sgst_amount)       │
  ├── calculate_igst_tax      = SUM(igst_amount)       │
  │                                                     │
  ├── freight_charges + freight_gst% → totalFreight   ─┤
  ├── additionalCharges                               ─┤
  ├── roundUpValue (+ or -)                           ─┤
  │                                                     │
  └── grandTotalAmount = totalNet + freight + additional + roundUp
```

---

## API Calls

### AddPurchaseForm

| Function | Endpoint/Method | When |
|----------|----------------|------|
| `getSuppliersLists()` | `getSuppliers({})` | On mount |
| `getStoresLists()` | `getStoreList({})` | On mount |
| `fetchAllVariantsList()` | `getVariants({ params })` | On mount |
| `getListOfItemsById(id)` | `getPurchaseListById(id)` | Edit mode, on mount |
| `addPurchase(payload)` | `addPurchase(payload)` | Submit (add mode) |
| `updatePurchasePrice(id, payload)` | `updatePurchasePrice(id, payload)` | Submit (edit mode) |
| `deleteInvoiceById(id, deleteId)` | `postDeleteInvoiceById(id, { transcript_id })` | Delete attachment |
| `printPurchaseInvoice(id)` | `printPurchaseInvoice(id)` | Download invoice PDF |
| `productMappingForMlTraining(data)` | `productMappingForMlTraining(data)` | After submit if invoice_upload |

### PurchaseItemForm

| Function | Endpoint/Method | When |
|----------|----------------|------|
| `fetchMedicineData(searchText)` | `getMedicineList({ params })` | Product search (debounced 1000ms) |
| `getMedicineExpiryDate(id, batch)` | `getBatchExpiry({ batch, stock_id })` | Batch number change (debounced 500ms) |
| `getProductVariantByproductId(id)` | `getVariantFOrProduct(id)` | Product selection |
| `getRecentPurchasePriceOfProduct(data)` | `validatePurchaseProducts(data)` | Rate change (debounced 500ms) |

---

## Item Management (purchase_details[])

### Add Item
```
User fills PurchaseItemForm → onSubmit()
  → payload built with all calculated fields
  → addItemsToTable(payload)
    → assigns uid via uuidv4()
    → appends to editParams.purchase_details[]
    → resets form, closes dialog
```

### Edit Item
```
User clicks edit icon in PurchaseDetailsTable
  → editTableData(uid, index, batch_no, medicine_name)
    → finds item in purchase_details[] by uid
    → sets nestedRowMedicine with all item fields
    → opens dialog (PurchaseItemForm populates from nestedRowMedicine)
  → User modifies fields → onSubmit()
    → updateTableItems(payload)
      → finds item index by uid + batch_no
      → updates in-place in purchase_details[]
      → closes dialog
```

### Delete Item
```
User clicks delete icon in PurchaseDetailsTable
  → onDelete(uid)
    → removeItemsFroTable(uid)
      → filters out item by uid from purchase_details[]
```

**Edit mode restriction:** Items fetched from DB (have `id` field) cannot be deleted — only newly-added items can be removed.

---

## Add Mode vs Edit Mode

| Aspect | Add Mode | Edit Mode |
|--------|----------|-----------|
| URL query | `action` not set | `action=edit&id=123` |
| `po_no` field | Editable | Disabled |
| Data loading | Empty defaults | `getListOfItemsById(id)` populates form |
| Delete items | All items deletable | Only new items (no `id`) deletable |
| Submit API | `addPurchase()` | `updatePurchasePrice()` |
| Invoice print | Not available | Available via download button |
| Freight section | Hidden by default | Shown if `freight_charges` exists |
| Invoice files | Upload new | Shows existing + can upload more |

---

## Submit Payload Structure

```javascript
{
  supplier_id: '',
  po_no: '',
  po_date: '',
  description: '',
  purchase_order_no: '',
  requested_by: '',
  store_id: selectedPharmacy.id,
  type_of_store: selectedPharmacy.type,
  cgst: calculate_cgst_tax_amount,           // Aggregated CGST
  sgst: calculate_sgst_tax_amount,           // Aggregated SGST
  igst: calculate_igst_tax_amount,           // Aggregated IGST
  total_amount: totalLineItemsAmount,        // Sum of gross amounts
  discount_amount: totalLineItemsDiscount,   // Sum of discounts
  taxable_amount: totalLineItemsTaxableAmount,
  net_amount: grandTotalAmount,              // Grand total
  freight_charges: '',
  freight_gst: '',
  freight_total_charges: String(totalFreightCharges),
  additional_charges: additionalCharges,
  round_off: roundup_select == '-' ? '-' + roundUpValue : roundUpValue,
  invoice_transcript: fileArr,               // File objects
  purchase_details: JSON.stringify([...])    // Stringified array of items
}
```

---

## GST Rules

- **CGST + SGST** and **IGST** are mutually exclusive
- If CGST > 0, SGST must also be > 0 and IGST must be 0
- If IGST > 0, both CGST and SGST must be 0
- Tax is calculated on the **taxable amount** (after discount)
- Effects enforce this: setting CGST/SGST auto-zeroes IGST, and vice versa

---

## File Upload

- Accepts: `.png`, `.jpg`, `.jpeg`, `.pdf`
- Multiple files allowed
- Two upload methods: dropzone drag-and-drop, or file input click
- Files stored in `fileArr` (File objects) and `fileSrc` (preview URLs)
- In edit mode: existing files shown from API, can add more or delete
- Delete in edit mode calls `postDeleteInvoiceById` API
- Delete in add mode removes from local state only

---

## Price Validation

When a supplier rate is entered, `validatePurchaseProducts()` is called (debounced 500ms). If the new price deviates more than 5% from the most recent purchase price:
1. `priceValidationError` is set to `true`
2. On submit, a confirmation dialog (`validatePurchaseDialog`) appears
3. User can confirm to proceed or cancel to adjust the price

---

## Helper Components

### CalcWrapper (styled)
Flex row with space-between alignment, margin between siblings.

### CalcRow
Reusable summary row with label + value. Props:
- `label` — left text
- `value` — right text
- `showRupee` (default: true) — shows rupee icon before value
- `prefix` — text prefix like "+" or "-"
- `valueSx` — custom styling for value text

### PurchaseDetailsTable
Props: `purchaseDetails`, `onEdit(item, index)`, `onDelete(uid)`, `isEditMode`

### freightVisibilitySx
Shared sx object for freight section Grid items — controls show/hide animation.
