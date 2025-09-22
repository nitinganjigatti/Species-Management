import { Badge, Box, Breadcrumbs, Button, Card, CardContent, CardHeader, Typography, useTheme } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import SpeciesShipmentFilterDrawer from 'src/components/compliance/drawer/SpeciesShipmentFilterDrawer'
import { getSpeciesData } from 'src/lib/api/compliance/species'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import Search from 'src/views/utility/Search'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import { ExportButton } from 'src/views/utility/render-snippets'
import Utility from 'src/utility'
import Toaster from 'src/components/Toaster'

const Species = () => {
  const theme = useTheme()
  const router = useRouter()

  const [searchValue, setSearchValue] = useState('')
  const [exportLoading, setExportLoading] = useState(false)

  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    q: '',
    sort: 'asc',
    column: ''
  })

  const [selectedOptions, setSelectedOptions] = useState({
    'Exporting country': [],
    Exporter: [],
    Importer: [],
    Documents: []
  })
  const [filterCount, setFilterCount] = useState(0)
  const [openFilter, setOpenFilter] = useState(false)

  const applyFilters = selectedOptions => {
    setSelectedOptions(selectedOptions)
    setOpenFilter(false)
  }

  useEffect(() => {
    const { page = '1', limit = '50', q = '', column = '', sort = 'asc' } = router.query

    setFilters({
      page: parseInt(page),
      limit: parseInt(limit),
      q,
      sort,
      column
    })

    setSearchValue(q)
  }, [router.query])

  const prepareFilterParams = key => {
    return selectedOptions[key]?.length > 0 ? selectedOptions[key].join(',') : undefined
  }

  const { data, isFetching } = useQuery({
    queryKey: ['trade-species', filters, selectedOptions],
    queryFn: () =>
      getSpeciesData({
        page: filters?.page,
        limit: filters?.limit,
        q: filters?.q,
        sort: filters?.sort,
        column: filters?.column,
        exporting_country: prepareFilterParams('Exporting country'),
        exporter: prepareFilterParams('Exporter'),
        importer: prepareFilterParams('Importer'),
        missing_docs: prepareFilterParams('Documents')
      })
  })

  const total = data?.data?.total || 0
  const rows = data?.data?.records || []

  const updateUrlParams = updatedFilters => {
    const params = new URLSearchParams()
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value.toString())
      }
    })
    router.push({ query: params.toString() }, undefined, { shallow: true })
  }

  const handlePaginationModelChange = model => {
    console.log(model, 'models')

    const updated = {
      ...filters,
      page: model.page + 1,
      limit: model.pageSize
    }
    setFilters(updated)
    updateUrlParams(updated)
  }

  const debouncedSearch = useMemo(
    () =>
      debounce(value => {
        const updated = {
          ...filters,
          q: value,
          page: 1
        }
        setFilters(updated)
        updateUrlParams(updated)
      }, 500),
    [filters]
  )

  const handleSearch = useCallback(
    value => {
      setSearchValue(value)
      debouncedSearch(value)
    },
    [debouncedSearch]
  )

  const handleSortModelChange = sortModel => {
    let updated
    if (sortModel.length > 0) {
      const { field, sort } = sortModel[0]
      updated = {
        ...filters,
        column: field,
        sort: sort,
        page: 1
      }
    } else {
      updated = {
        ...filters,
        column: '',
        sort: 'asc'
      }
    }
    setFilters(updated)
    updateUrlParams(updated)
  }

  const getSlNo = index => (filters.page - 1) * filters.limit + index + 1

  const indexedRows = rows.map((row, index) => ({
    ...row,
    id: +row?.species_id,
    sl_no: getSlNo(index)
  }))

  const columns = [
    {
      width: 100,
      field: 'sl_no',
      headerName: 'SL.NO',
      align: 'left',
      headerAlign: 'left',
      sortable: false,
      renderCell: params => (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'left',
            pl: 2
          }}
        >
          <Typography
            sx={{
              color: theme.palette.customColors.neutralSecondary,
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            {parseInt(params.row?.sl_no) + '.'}
          </Typography>
        </Box>
      )
    },
    {
      field: 'common_name',
      headerName: 'SPECIES',
      width: 350,
      align: 'left',
      headerAlign: 'left',
      sortable: true,
      renderCell: params => (
        <>
          <Box sx={{ px: 2, py: 2 }}>
            <SpeciesCard
              species={{
                common_name: params.row?.common_name,
                scientific_name: params.row?.scientific_name,
                default_icon: params.row?.default_icon || '/images/branding/antz/Antz_logomark_h_color.svg'
              }}
            />
          </Box>
        </>
      )
    },
    {
      field: 'total_shipments',
      headerName: 'SHIPMENTS',
      width: 200,
      align: 'left',
      headerAlign: 'left',
      sortable: true,
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: 400,
            px: 2
          }}
        >
          {params.row?.total_shipments ? params.row?.total_shipments : '-'}
        </Typography>
      )
    },
    {
      field: 'total_exports',
      headerName: 'EXPORTS',
      width: 200,
      align: 'left',
      headerAlign: 'left',
      sortable: true,
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: 400,
            px: 2
          }}
        >
          {params.row?.total_exports ? params.row?.total_exports : '-'}
        </Typography>
      )
    },
    {
      field: 'total_animals_permitted',
      headerName: 'PERMITTED ANIMALS',
      width: 200,
      align: 'left',
      headerAlign: 'left',
      sortable: true,
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: 400,
            px: 2
          }}
        >
          {params.row?.total_animals_permitted ? params.row?.total_animals_permitted : '-'}
        </Typography>
      )
    },
    {
      field: 'total_animals_received',
      headerName: 'RECEIVED ANIMALS',
      width: 200,
      align: 'left',
      headerAlign: 'left',
      sortable: true,
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: 400,
            px: 2
          }}
        >
          {params.row?.total_animals_received ? params.row?.total_animals_received : '-'}
        </Typography>
      )
    }
  ]

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const params = {
        page: filters?.page,
        limit: filters?.limit,
        q: filters?.q,
        sort: filters?.sort,
        column: filters?.column,
        exporting_country: prepareFilterParams('Exporting country'),
        exporter: prepareFilterParams('Exporter'),
        importer: prepareFilterParams('Importer'),
        missing_docs: prepareFilterParams('Documents'),
        response_type: 'csv'
      }

      await getSpeciesData(params).then(res => {
        if (res?.success === true) {
          Utility.downloadFileFromURL(res.data, `Species Report`)
          Toaster({ type: 'success', message: res?.message })
          setExportLoading(false)
        } else {
          Toaster({ type: 'error', message: res?.message })
        }
      })
    } catch (error) {
      console.error('Error exporting report:', error)
      setExportLoading(false)
    }
  }

  const headerTitle = (
    <Typography sx={{ fontSize: '24px', fontWeight: 500, color: theme.palette.customColors.customTextColorGray2 }}>
      Species
    </Typography>
  )

  const handleRowClick = params => {
    router.push({
      pathname: `/compliance/species/${params.row?.species_id}`
    })
  }

  return (
    <>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography sx={{ cursor: 'pointer', color: 'inherit' }}>Compliance</Typography>
        <Typography sx={{ cursor: 'pointer', color: 'inherit' }}>Species</Typography>
      </Breadcrumbs>
      <Card>
        <CardHeader title={headerTitle} />
        <CardContent>
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Search value={searchValue} onChange={e => handleSearch(e.target.value)} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                <ExportButton loading={exportLoading} tooltip='Download Report' onClick={handleExport} />
                <Button
                  variant='outlined'
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    borderColor: theme.palette.customColors.OutlineVariant,
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  startIcon={
                    <TuneRoundedIcon
                      sx={{ height: '24px', width: '24px' }}
                      color={theme.palette.customColors.OnSurfaceVariant}
                    />
                  }
                  endIcon={
                    <Badge
                      badgeContent={filterCount}
                      color='primary'
                      invisible={filterCount === 0}
                      sx={{ ml: 2, mr: 2 }}
                    />
                  }
                  onClick={() => setOpenFilter(true)}
                >
                  Filter
                </Button>
              </Box>
            </Box>
            <CommonTable
              columns={columns}
              indexedRows={indexedRows}
              total={total}
              pageSizeOptions={[10]}
              loading={isFetching}
              paginationModel={{ page: filters.page - 1, pageSize: filters.limit }}
              setPaginationModel={handlePaginationModelChange}
              handleSortModel={handleSortModelChange}
              searchValue=''
              onRowClick={handleRowClick}
            />
          </Box>
        </CardContent>
      </Card>
      {openFilter && (
        <SpeciesShipmentFilterDrawer
          open={openFilter}
          onClose={() => setOpenFilter(false)}
          onApplyFilters={applyFilters}
          setFilterCount={setFilterCount}
          initialSelectedOptions={selectedOptions}
        />
      )}
    </>
  )
}

export default Species
