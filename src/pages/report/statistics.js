import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Box, CardHeader, Grid, Typography } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import data from './dummyData'
import { useTheme } from '@mui/material/styles'
import { getReportFilterList, getReportList } from 'src/lib/api/report'
import toast from 'react-hot-toast'

const StatisticsReport = ({ apiFilterParams, popoverData, setDataList, dataList }) => {
  // console.log('Api Params >>', apiFilterParams)

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [total, setTotal] = useState(0)
  const [reportList, setReportList] = useState([])

  const theme = useTheme()

  function loadServerRows(currentPage, data) {
    return data
  }

  const [headerList, setHeaderList] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  // const [dataList, setDataList] = useState([]) // Holds data from API

  const initialLoad = useRef(true)

  const fetchData = useCallback(async () => {
    const params = {
      page: paginationModel.page + 1,
      limit: paginationModel.pageSize,
      include_housing: 1,
      include_enclosure: 1,
      include_section: 1,
      include_cluster: 1,
      include_class: 1,
      include_organization: 1,
      include_order: 1,
      include_family: 1,
      include_genus: 1,
      include_site: 1
    }

    console.log('Fetching data with params:', params)
    setIsLoading(true)

    try {
      const responseData = await getReportFilterList(params)

      if (responseData) {
        setIsLoading(false)
        const { header, datalist, total_count } = responseData.data
        console.log('Received data:', datalist)
        setHeaderList(header)
        setTotal(total_count)
        setDataList(loadServerRows(paginationModel.page, datalist))
      } else {
        toast.error('Something went wrong')
      }
    } catch (error) {
      toast.error('Error fetching data')
      setIsLoading(false)
    }

    initialLoad.current = false
  }, [paginationModel])

  useEffect(() => {
    fetchData()
  }, [fetchData, paginationModel]) // Add paginationModel as a dependency

  useEffect(() => {
    if (!initialLoad.current) {
      const fetchFilterData = async () => {
        setIsLoading(true)
        const response = await getReportFilterList(apiFilterParams)
        if (response) {
          setIsLoading(false)
          const { header, datalist } = response.data
          setHeaderList(header)
          setDataList(datalist)
          setDataList(loadServerRows(paginationModel.page, datalist))
        }
      }
      fetchFilterData()
    }
  }, [popoverData])

  // console.log('Header List >', headerList, dataList)

  const columns = headerList.map(header => {
    if (header.key.includes('default_icon')) {
      return {
        field: 'speciesAndCommonName',
        headerName: header.label,
        isAvatar: true,
        sortable: false,
        disableColumnMenu: true,
        width: 400,
        renderCell: params => (
          <CardHeader
            avatar={
              <img
                src={params.row.default_icon}
                alt={params.row.common_name}
                style={{ width: 40, height: 40, borderRadius: '50%' }}
              />
            }
            title={
              <Typography sx={{ fontSize: '16px', fontWeight: 500, fontFamily: 'Inter', color: '#006D35' }}>
                {params.row.common_name}
              </Typography>
            }
            subheader={
              <Typography
                sx={{ fontSize: '14px', fontWeight: 400, fontFamily: 'Inter', fontStyle: 'italic', color: '#006D35' }}
                variant='body2'
              >
                {params.row.scientific_name}
              </Typography>
            }
          />
        )
      }
    }
    return {
      field: header.key,
      headerName: header.label,
      width: 200,
      sortable: false,
      disableColumnMenu: true,
      textAlign: 'center',
      renderCell: params => (
        <Box
          sx={{
            width: ['Male', 'Female', 'Indeterminate', 'Undetermined'].includes(header.label) ? '50px' : '90px',
            height: '25px',
            backgroundColor: getCellBackgroundColor(header.label),
            color: getCellTextColor(header.label),
            fontWeight: 400,
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: ['Male', 'Female', 'Indeterminate', 'Undetermined'].includes(header.label)
              ? 'center'
              : header.label === 'total'
              ? 'flex-end'
              : 'flex-start',
            textAlign: ['Male', 'Female', 'Indeterminate', 'Undetermined'].includes(header.label)
              ? 'center'
              : header.label === 'total'
              ? 'right'
              : 'left'
          }}
        >
          {params.value}
        </Box>
      )
    }
  })

  const getCellBackgroundColor = label => {
    switch (label) {
      case 'Male':
        return '#AFEFEB'
      case 'Female':
        return '#FFD3D3'
      case 'Undetermined':
        return '#DDEBE9'
      case 'Indeterminate':
        return '#DDEBE9'
      default:
        return 'transparent'
    }
  }

  const getCellTextColor = label => {
    switch (label) {
      case 'Male':
      case 'Female':
        return '#1F415B'
      case 'Undetermined':
        return '#E93353'
      case 'Indeterminate':
        return '#44544A'
      default:
        return '#44544A'
    }
  }

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const reportRows = dataList?.map((item, index) => ({
    id: index + 1,
    ...item,
    sl_no: getSlNo(index)
  }))

  return (
    <Box sx={{ width: '98%', margin: 4 }}>
      <Box sx={{ borderRadius: '8px' }}>
        <DataGrid
          sx={{
            mt: 3,
            borderRadius: '8px',
            '.MuiDataGrid-cell:focus': {
              outline: 'none'
            },
            '& .MuiDataGrid-columnHeader': {
              backgroundColor: '#DDEBE9',
              color: '#1F415B',
              fontWeight: 600,
              fontSize: '12px',
              fontFamily: 'Inter',
              textTransform: 'capitalize',
              borderBottom: '2px solid #C3CEC7' // Divider line between header and body
            },
            '.MuiDataGrid-main': {
              borderLeft: '1px solid #C3CEC7',
              borderRight: '1px solid #C3CEC7',
              borderTop: '1px solid #C3CEC7',
              borderBottom: '1px solid #C3CEC7',
              borderRadius: '8px',
              overflow: 'hidden' // Hide overflow
              // '& .MuiDataGrid-virtualScroller': {
              //   // overflow: 'hidden' // Hide scrollbar
              // }
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: 'none' // Remove the border-top from footer container
            },

            '& .MuiDataGrid-cell': {
              fontFamily: 'Inter',
              fontSize: '14px',
              fontWeight: 400,
              lineHeight: '16.94px',
              textAlign: 'left',
              color: '#44544A'
            }
          }}
          rows={reportRows}
          disableColumnSorting={true}
          rowCount={total}
          columns={columns}
          sortingMode='server'
          paginationMode='server'
          pageSizeOptions={[7, 10, 25, 50]}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          loading={isLoading}
          autoHeight
          disableColumnFilter={false}
          hideFooterSelectedRowCount
          rowHeight={70}
          scrollbarSize={10}
        />
      </Box>
    </Box>
  )
}

export default StatisticsReport
