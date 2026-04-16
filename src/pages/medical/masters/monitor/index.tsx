// import { Grid, Tooltip, Typography, useTheme } from '@mui/material'
// import React, { useCallback, useEffect, useState } from 'react'
// import { getAssessmentCategoriesList } from 'src/lib/api/report'
// import MUISearch from 'src/views/forms/form-fields/MUISearch'
// import CommonTable from 'src/views/table/data-grid/CommonTable'
// import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
// import { debounce } from 'lodash'
// import { useRouter } from 'next/router'

// function AddMonitorCategory() {
//   const [rows, setRows] = useState([])
//   const [loading, setLoading] = useState(false)
//   const [searchValue, setSearchValue] = useState('')
//   const [total, setTotal] = useState([])
//   const theme = useTheme()
//   const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
//   const [allRows, setAllRows] = useState([])

//   const router = useRouter()

//   const handleRowClick = params => {
//     const { assessment_category_id, label } = params.row

//     router.push({
//       pathname: `/masters/monitor/${assessment_category_id}`,
//       query: { label: label }
//     })
//   }

//   const fetchTableData = useCallback(async () => {
//     try {
//       setLoading(true)

//       const params = {
//         cat_id: router.query.id,
//         ref_type: 'animal'
//       }
//       const res = await getAssessmentCategoriesList(params)

//       if (res?.success) {
//         setTotal(res?.data?.length || 0)

//         setAllRows(res?.data || [])
//         setRows(res?.data || [])
//       }
//     } catch {
//     } finally {
//       setLoading(false)
//     }
//   }, [])

//   useEffect(() => {
//     fetchTableData()
//   }, [fetchTableData])

//   const searchTableData = useCallback(
//     debounce(value => {
//       setSearchValue(value)

//       if (!value || '' || null) {
//         setRows(allRows)
//       }

//       const filteredData = allRows.filter(row => row.label?.toLowerCase().includes(value.toLowerCase()))

//       setRows(filteredData)
//       setTotal(filteredData.length)
//     }),
//     [allRows]
//   )

//   const handleSearch = value => {
//     searchTableData(value)
//   }

//   const indexedRows = rows.map((row, index) => ({
//     ...row,
//     id: row.assessment_category_id,
//     sl_no: paginationModel.page * paginationModel.pageSize + index + 1
//   }))

//   const columns = [
//     {
//       width: 120,
//       field: 'sl_no',
//       headerName: 'SL.NO',

//       renderCell: params => (
//         <Typography variant='body2' sx={{ color: theme.palette.customColors.customHeadingTextColor, pl: '10px' }}>
//           {params.row.sl_no}.
//         </Typography>
//       )
//     },
//     {
//       width: 350,
//       field: 'label',
//       headerName: 'NAME',
//       renderCell: params => (
//         <Tooltip title={params.row.label}>
//           <Typography
//             variant='body2'
//             sx={{
//               fontSize: '14px',
//               fontWeight: 500,
//               overflow: 'hidden',
//               textOverflow: 'ellipsis',
//               whiteSpace: 'nowrap',
//               color: theme.palette.customColors.customHeadingTextColor,
//               pl: '6px'
//             }}
//           >
//             {params.row.label}
//           </Typography>
//         </Tooltip>
//       )
//     },
//     {
//       width: 280,
//       field: 'assessment_type_count',
//       headerName: 'Active Assessment Type Count',

//       renderCell: params => (
//         <Typography
//           sx={{
//             fontSize: '14px',
//             fontWeight: 500,
//             overflow: 'hidden',
//             textOverflow: 'ellipsis',
//             whiteSpace: 'nowrap',
//             color: theme.palette.customColors.customHeadingTextColor,
//             display: 'flex',
//             justifyContent: 'center',
//             flex: 1
//           }}
//           variant='body2'
//         >
//           {params.row.assessment_type_count}
//         </Typography>
//       )
//     },

//     {
//       width: 140,
//       field: 'active',
//       headerName: 'STATUS',

//       renderCell: params => (
//         <Typography
//           sx={{
//             fontSize: '14px',
//             fontWeight: 500,
//             overflow: 'hidden',
//             textOverflow: 'ellipsis',
//             whiteSpace: 'nowrap',
//             color: theme.palette.customColors.customHeadingTextColor,
//             pl: '6px'
//           }}
//           variant='body2'
//         >
//           {params.row.active === '1' ? 'Active' : 'Inactive'}
//         </Typography>
//       )
//     }
//   ]

//   return (
//     <PageCardLayout title='Monitoring'>
//       <Grid container>
//         <Grid container sx={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
//           <Grid item size={{ xs: 'grow', sm: 3.5, md: 3.5, lg: 3, xl: 2.5 }}>
//             <MUISearch
//               sx={{
//                 width: {
//                   xs: '100%',
//                   sm: '250px'
//                 }
//               }}
//               placeholder='Search...'
//               onChange={e => handleSearch(e.target.value)}
//               onClear={() => handleSearch('')}
//               value={searchValue}
//             />
//           </Grid>
//         </Grid>

//         <Grid item size={{ xs: 12 }}>
//           <CommonTable
//             indexedRows={indexedRows}
//             total={total}
//             columns={columns}
//             loading={loading}
//             searchValue={searchValue}
//             paginationModel={paginationModel}
//             onRowClick={handleRowClick}
//             setPaginationModel={setPaginationModel}
//           />
//         </Grid>
//       </Grid>
//     </PageCardLayout>
//   )
// }

// export default AddMonitorCategory

import { Grid, Tooltip, Typography, useTheme } from '@mui/material'
import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { getAssessmentCategoriesList } from 'src/lib/api/report'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import { debounce, DebouncedFunc } from 'lodash'
import { useRouter } from 'next/router'
import { GridSortModel, GridPaginationModel, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { Theme } from '@mui/material/styles'
import { NextPage } from 'next'
import { ChangeEvent, ReactNode } from 'react'

// Types and Interfaces
interface MonitorCategoryRow {
  assessment_category_id?: number | string
  label?: string
  assessment_type_count?: number
  active?: string
  sl_no?: number
  [key: string]: any
}

interface IndexedMonitorCategoryRow extends MonitorCategoryRow {
  sl_no: number
  id: number | string
}

interface ApiResponse {
  success?: boolean
  data?: MonitorCategoryRow[]
  message?: string
}

interface Filters {
  page: number
  limit: number
  q: string
}

const MonitorCategory: NextPage = () => {
  const theme: Theme = useTheme()
  const router = useRouter()

  // State
  const [rows, setRows] = useState<MonitorCategoryRow[]>([])
  const [allRows, setAllRows] = useState<MonitorCategoryRow[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [searchValue, setSearchValue] = useState<string>('')
  const [total, setTotal] = useState<number>(0)

  // Filters state
  const [filters, setFilters] = useState<Filters>({
    page: 1,
    limit: 50,
    q: ''
  })

  // Sync filters with URL query params on mount
  useEffect(() => {
    const {
      page = '1',
      limit = '50',
      q = ''
    } = router.query as {
      page?: string
      limit?: string
      q?: string
    }

    setFilters({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      q: q as string
    })
    setSearchValue(q as string)
  }, [router.query])

  const fetchTableData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)

      const params = {
        cat_id: router.query.id,
        ref_type: 'animal'
      }
      const res: ApiResponse = await getAssessmentCategoriesList(params)

      if (res?.success) {
        setAllRows(res?.data || [])

        // Apply client-side filtering based on search
        const filteredData = filterData(res?.data || [], filters.q)
        setRows(filteredData)
        setTotal(filteredData.length)
      }
    } catch (error) {
      console.error('Error fetching monitor categories:', error)
    } finally {
      setLoading(false)
    }
  }, [router.query.id, filters.q])

  useEffect(() => {
    fetchTableData()
  }, [fetchTableData])

  // Filter function
  const filterData = (data: MonitorCategoryRow[], searchText: string): MonitorCategoryRow[] => {
    if (!searchText.trim()) {
      return data
    }
    return data.filter(row => row.label?.toLowerCase().includes(searchText.toLowerCase()))
  }

  // Update URL params
  const updateUrlParams = (updatedFilters: Filters): void => {
    const params = new URLSearchParams()
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value.toString())
      }
    })
    router.push({ query: params.toString() }, undefined, { shallow: true })
  }

  // Debounced search
  const debouncedSearch: DebouncedFunc<(value: string) => void> = useMemo(
    () =>
      debounce((value: string) => {
        const updated: Filters = {
          ...filters,
          q: value,
          page: 1
        }
        setFilters(updated)
        updateUrlParams(updated)

        // Apply client-side filtering
        const filteredData = filterData(allRows, value)
        setRows(filteredData)
        setTotal(filteredData.length)
      }, 1000),
    [filters, allRows]
  )

  const handleSearch = (value: string): void => {
    setSearchValue(value)
    debouncedSearch(value)
  }

  const handleSearchClear = (): void => {
    setSearchValue('')
    debouncedSearch('')
  }

  const handlePaginationModelChange = (model: GridPaginationModel): void => {
    const updated: Filters = {
      ...filters,
      page: model.page + 1,
      limit: model.pageSize
    }
    setFilters(updated)
    updateUrlParams(updated)
  }

  const handleSortModel = (newModel: GridSortModel): void => {
    // Client-side sorting can be implemented here if needed
    console.log('Sort model:', newModel)
  }

  const handleRowClick = (params: any): void => {
    const { assessment_category_id, label } = params.row

    router.push({
      pathname: `/masters/monitor/${assessment_category_id}`,
      query: { label: label }
    })
  }

  const getSlNo = (index: number): number => (filters.page - 1) * filters.limit + index + 1

  // Apply pagination to rows
  const paginatedRows = useMemo(() => {
    const start = (filters.page - 1) * filters.limit
    const end = start + filters.limit
    return rows.slice(start, end)
  }, [rows, filters.page, filters.limit])

  const indexedRows: IndexedMonitorCategoryRow[] = paginatedRows.map((row, index) => ({
    ...row,
    id: row.assessment_category_id || index,
    sl_no: getSlNo(index)
  }))

  const columns: GridColDef<IndexedMonitorCategoryRow>[] = [
    {
      minWidth: 100,
      flex: 0.1,
      field: 'sl_no',
      headerName: 'SL.NO',
      sortable: false,
      renderCell: (params: GridRenderCellParams<IndexedMonitorCategoryRow>): ReactNode => (
        <Typography variant='body2' sx={{ color: theme.palette.customColors?.customHeadingTextColor, pl: '10px' }}>
          {params.row.sl_no}.
        </Typography>
      )
    },
    {
      minWidth: 350,
      flex: 0.4,
      field: 'label',
      headerName: 'NAME',
      sortable: true,
      renderCell: (params: GridRenderCellParams<IndexedMonitorCategoryRow>): ReactNode => (
        <Tooltip title={params.row.label || ''}>
          <Typography
            variant='body2'
            sx={{
              fontSize: '14px',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: theme.palette.customColors?.customHeadingTextColor,
              pl: '6px'
            }}
          >
            {params.row.label}
          </Typography>
        </Tooltip>
      )
    },
    {
      minWidth: 280,
      flex: 0.3,
      field: 'assessment_type_count',
      headerName: 'ACTIVE ASSESSMENT TYPE COUNT',
      sortable: true,
      renderCell: (params: GridRenderCellParams<IndexedMonitorCategoryRow>): ReactNode => (
        <Typography
          variant='body2'
          sx={{
            fontSize: '14px',
            fontWeight: 500,
            color: theme.palette.customColors?.customHeadingTextColor,
            pl: '6px'
          }}
        >
          {params.row.assessment_type_count}
        </Typography>
      )
    },
    {
      minWidth: 120,
      flex: 0.2,
      field: 'active',
      headerName: 'STATUS',
      sortable: true,
      renderCell: (params: GridRenderCellParams<IndexedMonitorCategoryRow>): ReactNode => (
        <Typography
          variant='body2'
          sx={{
            fontSize: '14px',
            fontWeight: 500,
            color: theme.palette.customColors?.customHeadingTextColor,
            pl: '6px'
          }}
        >
          {params.row.active === '1' ? 'Active' : 'Inactive'}
        </Typography>
      )
    }
  ]

  return (
    <PageCardLayout title='Monitoring'>
      <Grid container>
        <Grid container sx={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
          <Grid size={{ xs: 'grow', sm: 3.5, md: 3.5, lg: 3, xl: 2.5 }}>
            <MUISearch
              sx={{
                width: {
                  xs: '100%',
                  sm: '250px'
                }
              }}
              placeholder='Search...'
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
              onClear={handleSearchClear}
              value={searchValue}
            />
          </Grid>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <CommonTable
            indexedRows={indexedRows}
            total={total}
            columns={columns}
            loading={loading}
            searchValue={filters.q}
            paginationModel={{ page: filters.page - 1, pageSize: filters.limit }}
            handleSortModel={handleSortModel}
            setPaginationModel={handlePaginationModelChange}
            onRowClick={handleRowClick}
          />
        </Grid>
      </Grid>
    </PageCardLayout>
  )
}

export default MonitorCategory
