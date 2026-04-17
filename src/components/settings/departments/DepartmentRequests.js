import { useCallback, useEffect, useRef, useState } from 'react'
import { Box, Button } from '@mui/material'
import toast from 'react-hot-toast'
import Icon from 'src/@core/components/icon'
import { getDepartmentRequests } from 'src/lib/api/request-department'
import DepartmentRequestsView from 'src/views/pages/settings/departments/DepartmentRequestsView'

const DepartmentRequests = ({ departmentId }) => {
  const [requests, setRequests] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 })
  const [searchValue, setSearchValue] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const searchDebounceRef = useRef(null)

  const fetchRequests = useCallback(async () => {
    if (!departmentId) return
    setLoading(true)
    try {
      const params = {
        department_ids: departmentId,
        page_no: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        status: filterStatus !== 'all' ? filterStatus : 'all',
        ...(searchValue && { q: searchValue }),
        ...(dateFrom && { start_date: dateFrom }),
        ...(dateTo && { end_date: dateTo })
      }
      const response = await getDepartmentRequests(params)
      if (response?.success || response?.status) {
        const list = Array.isArray(response?.data) ? response.data : (response?.data?.requests || response?.data?.list || [])
        const totalCount = parseInt(response?.total_count || response?.data?.total_count || response?.data?.total) || list.length
        const indexed = Array.isArray(list) ? list.map((item, idx) => ({
          ...item,
          id: item.id || item.request_id || idx
        })) : []
        setRequests(indexed)
        setTotal(totalCount)
      }
    } catch (error) {
      console.error('Error fetching department requests:', error)
    } finally {
      setLoading(false)
    }
  }, [departmentId, paginationModel, searchValue, filterStatus, dateFrom, dateTo])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleSearchChange = value => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      setSearchValue(value)
      setPaginationModel(prev => ({ ...prev, page: 0 }))
    }, 300)
  }

  const handleFilterChange = value => {
    setFilterStatus(value)
    setPaginationModel(prev => ({ ...prev, page: 0 }))
  }

  const handleDateFromChange = value => {
    setDateFrom(value)
    setPaginationModel(prev => ({ ...prev, page: 0 }))
  }

  const handleDateToChange = value => {
    setDateTo(value)
    setPaginationModel(prev => ({ ...prev, page: 0 }))
  }

  const handleRowClick = row => {
    // TODO: Navigate to request detail page or open request detail drawer
    console.log('Request row clicked:', row)
  }

  const handleDownloadReport = () => {
    // TODO: Implement report download — call report export API with current filters
    toast.success('Report download coming soon')
  }

  return (
    <>
      {/* Header Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
        <Button
          variant='outlined'
          startIcon={<Icon icon='mdi:download-outline' />}
          onClick={handleDownloadReport}
        >
          Download Report
        </Button>
      </Box>

      <DepartmentRequestsView
        requests={requests}
        total={total}
        loading={loading}
        paginationModel={paginationModel}
        setPaginationModel={setPaginationModel}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        filterStatus={filterStatus}
        onFilterChange={handleFilterChange}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={handleDateFromChange}
        onDateToChange={handleDateToChange}
        onRowClick={handleRowClick}
      />
    </>
  )
}

export default DepartmentRequests
