import type { FilterParams } from 'src/types/report/models'

/**
 * Species Management listing data layer.
 *
 * FRONTEND-ONLY: data comes from a static JSON file extracted from the user's SQL dump
 * (`public/species-data/list.json`, 2352 species). No DB / no backend. Shape matches
 * /v1/species/reportv1 (`{ data: { datalist, total_count } }`).
 */
let listCache: any[] | null = null

async function loadList(): Promise<any[]> {
  if (!listCache) {
    const res = await fetch('/species-data/list.json', { cache: 'no-store' })
    listCache = res.ok ? await res.json() : []
  }

  return listCache || []
}

export async function getSpeciesReportList(params: FilterParams): Promise<any> {
  const datalist = await loadList()

  if (params?.response_type === 'csv') {
    const cols = ['Species', 'Scientific Name', 'Class', 'Order', 'Family', 'Genus', 'IUCN', 'CITES', 'Category', 'Population', 'Male', 'Female', 'Undetermined', 'Identified']
    const lines = [cols.join(',')]
    for (const r of datalist) {
      lines.push(
        [r.common_name, r.scientific_name, r.class_name, r.order_name, r.family_name, r.genus_name, r.iucn_status, r.cites_appendix, r.breeding_category, r.animal_count, r.total_male, r.total_female, r.total_undetermined, r.total_indeterminate]
          .map(v => `"${String(v ?? '').replace(/"/g, '""')}"`)
          .join(',')
      )
    }

    return { data: `data:text/csv;charset=utf-8,${encodeURIComponent(lines.join('\n'))}` }
  }

  return { data: { datalist, total_count: datalist.length } }
}
