import { useMemo, useState } from 'react'

/**
 * Client-side sort + pagination for the species-detail data tables.
 *
 * Our standard table (DetailTable → CommonTable → MUI DataGrid) runs in server sort mode,
 * so the grid never reorders rows itself — it just reports header clicks via onSortModelChange.
 * This hook owns that model, sorts the FULL row set, then slices the active page and indexes
 * each row with `id` + `sl_no` exactly like the Housing/Pairing tables. Feed the result straight
 * into <DetailTable rows total paginationModel setPaginationModel sortModel handleSortModel />.
 *
 * Rows must expose the sort value on the same key as the column's GridColDef `field`
 * (numbers sort numerically, everything else by locale string; null/'' always sorts last).
 */

export type SortDir = 'asc' | 'desc'
export interface SortSpec {
  field: string
  sort: SortDir
}

const compareBy = (field: string, dir: SortDir) => (a: any, b: any) => {
  const va = a[field]
  const vb = b[field]
  const aEmpty = va == null || va === ''
  const bEmpty = vb == null || vb === ''
  if (aEmpty && bEmpty) return 0
  if (aEmpty) return 1 // missing values always last, regardless of direction
  if (bEmpty) return -1
  const mul = dir === 'asc' ? 1 : -1
  if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * mul

  return String(va).localeCompare(String(vb), undefined, { sensitivity: 'base', numeric: true }) * mul
}

export function useSortableTable<T extends Record<string, any>>(rows: T[], initial: SortSpec, pageSize = 10) {
  const [sortModel, setSortModel] = useState<SortSpec[]>([initial])
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize })

  const active = sortModel[0]

  const sorted = useMemo(() => {
    if (!active?.field || !active?.sort) return rows

    return [...rows].sort(compareBy(active.field, active.sort))
  }, [rows, active?.field, active?.sort])

  const total = sorted.length
  const start = paginationModel.page * paginationModel.pageSize
  const pageRows = sorted.slice(start, start + paginationModel.pageSize).map((r, i) => ({
    ...r,
    id: r.id ?? `${start + i}`,
    sl_no: start + i + 1
  }))

  // DataGrid's 3-state cycle ends on an empty model — fall back to the default so the table stays sorted.
  const handleSortModel = (model: SortSpec[]) => {
    setSortModel(model && model.length ? model : [initial])
    setPaginationModel(p => ({ ...p, page: 0 }))
  }

  return { rows: pageRows, total, sortModel, handleSortModel, paginationModel, setPaginationModel }
}
