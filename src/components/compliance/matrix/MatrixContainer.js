import { useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { useQuery } from '@tanstack/react-query'
import { AuthContext } from 'src/context/AuthContext'
import { getClassList } from 'src/lib/api/diet/speciesDiet'
import { getSpeciesMatrix } from 'src/lib/api/compliance/matrix'
import MatrixView from 'src/views/pages/compliance/matrix/MatrixView'
import ReallocateDrawer from './ReallocateDrawer'

const DEFAULT_PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

const useDebouncedSync = (value, delay, onDebounced) => {
  useEffect(() => {
    const t = setTimeout(() => onDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay, onDebounced])
}

const MatrixContainer = () => {
  const router = useRouter()
  const ready = router.isReady

  // URL-bound filter state (source of truth = router.query)
  const urlQ = (router.query.q || '').toString()
  const urlSiteId = router.query.site_id ? Number(router.query.site_id) : null
  const urlOnlyFlagged = router.query.only_flagged === '1'
  const urlClass = (router.query.tax_class || '').toString()
  const urlPage = router.query.page ? Math.max(1, Number(router.query.page)) - 1 : 0

  // Local search input mirrors the URL but updates instantly while typing
  const [searchInput, setSearchInput] = useState(urlQ)

  useEffect(() => {
    setSearchInput(urlQ)
    // intentionally only sync on URL changes from elsewhere (back/forward)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQ])

  const [editing, setEditing] = useState(null)

  const pushQuery = next => {
    const merged = { ...router.query, ...next }
    Object.keys(merged).forEach(k => {
      if (merged[k] === '' || merged[k] === null || merged[k] === undefined) delete merged[k]
    })
    router.replace({ pathname: router.pathname, query: merged }, undefined, { shallow: true })
  }

  useDebouncedSync(searchInput, SEARCH_DEBOUNCE_MS, debounced => {
    if (debounced !== urlQ) {
      pushQuery({ q: debounced || undefined, page: undefined })
    }
  })

  // Matrix data
  const matrixQuery = useQuery({
    queryKey: [
      'compliance-matrix',
      { page: urlPage + 1, q: urlQ, site_id: urlSiteId, only_flagged: urlOnlyFlagged, tax_class: urlClass }
    ],
    queryFn: () =>
      getSpeciesMatrix({
        page: urlPage + 1,
        limit: DEFAULT_PAGE_SIZE,
        q: urlQ || undefined,
        site_id: urlSiteId || undefined,
        only_flagged: urlOnlyFlagged ? 1 : undefined,
        tax_class: urlClass || undefined
      }),
    enabled: ready,
    placeholderData: previousData => previousData
  })

  const matrix = matrixQuery.data?.data ?? matrixQuery.data ?? {}
  const orgs = matrix.orgs ?? []
  const rawItems = matrix.items ?? []
  const total = matrix.total ?? 0

  // Site dropdown — sourced from the auth context (current user's zoo), same
  // pattern used by egg/diet modules. No extra API call needed.
  const authData = useContext(AuthContext)
  const sites = useMemo(
    () => authData?.userData?.user?.zoos?.[0]?.sites ?? [],
    [authData]
  )
  const siteValue = useMemo(
    () => sites.find(s => s.site_id === urlSiteId) || null,
    [sites, urlSiteId]
  )

  // Class chip options — from taxonomy hierarchy API
  const classQuery = useQuery({
    queryKey: ['taxonomy-classes'],
    queryFn: () => getClassList({ type: 'class', page_no: 1, limit: 100, q: '' }),
    staleTime: 5 * 60_000
  })

  const classOptions = useMemo(() => {
    const raw = classQuery.data?.data?.result ?? classQuery.data?.result ?? []
    const items = raw.map(c => ({ id: c.tsn_id, label: c.complete_name }))
    const pinned = ['Mammalia', 'Aves', 'Reptilia']
    return items.sort((a, b) => {
      const ia = pinned.indexOf(a.label)
      const ib = pinned.indexOf(b.label)
      if (ia >= 0 && ib >= 0) return ia - ib
      if (ia >= 0) return -1
      if (ib >= 0) return 1
      return a.label.localeCompare(b.label)
    })
  }, [classQuery.data])

  const editingEnabled = Boolean(urlSiteId)

  const handleEdit = row => {
    setEditing({
      row,
      orgs,
      taxonomyId: row.taxonomy_id || row.compliance_taxonomy_id,
      siteId: urlSiteId,
      site_name: siteValue?.site_name || ''
    })
  }

  const clearFilters = () => {
    setSearchInput('')
    router.replace({ pathname: router.pathname, query: {} }, undefined, { shallow: true })
  }

  return (
    <>
      <MatrixView
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        sites={sites}
        siteValue={siteValue}
        onSiteChange={site => pushQuery({ site_id: site?.site_id || undefined, only_flagged: undefined, page: undefined })}
        onlyFlagged={urlOnlyFlagged}
        onOnlyFlaggedChange={next => pushQuery({ only_flagged: next ? '1' : undefined, page: undefined })}
        onlyFlaggedDisabled={!urlSiteId}
        classOptions={classOptions}
        taxonomicClass={urlClass}
        onClassChange={next => pushQuery({ tax_class: next || undefined, page: undefined })}
        orgs={orgs}
        rows={rawItems}
        total={total}
        page={urlPage}
        pageSize={DEFAULT_PAGE_SIZE}
        onPageChange={next => pushQuery({ page: next > 0 ? next + 1 : undefined })}
        isLoading={matrixQuery.isFetching}
        isError={matrixQuery.isError}
        errorMessage={matrixQuery.error?.response?.data?.message || ''}
        onRetry={() => matrixQuery.refetch()}
        onClearFilters={clearFilters}
        editingEnabled={editingEnabled}
        onEdit={handleEdit}
      />

      <ReallocateDrawer
        editing={editing}
        onClose={() => setEditing(null)}
        onSaved={() => matrixQuery.refetch()}
      />
    </>
  )
}

export default MatrixContainer
