import { Icon } from '@iconify/react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardHeader,
  Divider,
  IconButton,
  Stack,
  Typography
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import React, { useEffect, useState } from 'react'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useTheme } from '@mui/material/styles'

const Tests = ({ labTest }) => {
  console.log('labTest', labTest)
  const theme = useTheme()

  const columns = [
    // {
    //   flex: 0.05,
    //   Width: 40,
    //   field: 'id',
    //    headerName:'SL.NO',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {parseInt(params.row.sl_no)}
    //     </Typography>
    //   )
    // },
    {
      flex: 2.3,
      Width: 20,
      field: 'tests',
      headerName: 'TESTS',
      hide: false,

      renderCell: params => (
        <>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params?.row?.test_name}
          </Typography>
        </>
      )
    }

    // {
    //   flex: 0.2,
    //   minWidth: 20,

    //   // field: 'Action',
    //   // headerName: 'Action',
    //   renderCell: params => (
    //     <>
    //       <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right' }}>
    //         <IconButton size='small' sx={{ mr: 0.5 }}>
    //           <Icon icon='ant-design:more-outlined' fontSize={30} />
    //         </IconButton>
    //       </Box>
    //     </>
    //   )
    // }
  ]

  /***** Server side pagination */

  const [total, setTotal] = useState(0)

  // const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')

  // const [sortColumn, setSortColumn] = useState('label')
  // const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)

  // const [status, setStatus] = useState('pending')

  const getSlNo = index => index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))
  const getRowId = row => row.test_id

  // const handleSortModel = newModel => {
  //   if (newModel.length) {
  //     setSort(newModel[0].sort)
  //     setSortColumn(newModel[0].field)
  //     fetchTableData(newModel[0].sort, searchValue, newModel[0].field, status)
  //   } else {
  //   }
  // }

  // const handleSearch = value => {
  //   setSearchValue(value)
  //   searchTableData(sort, value, 'request_number', status)
  // }

  function extractTestsData(labTest) {
    const parent = labTest.flatMap(lab =>
      lab.tests.flatMap(test =>
        test.child_tests.map(childTest => ({
          test_id: childTest.test_id,
          test_name: childTest.test_name,
          input_type: childTest.input_type
        }))
      )
    )

    const child = labTest.flatMap(lab => lab.tests.map(test => ({ test_id: test.test_id, test_name: test.test_name })))

    let newArray = [...parent, ...child]

    // Sort newArray alphabetically by test_name
    newArray.sort((a, b) => a.test_name.localeCompare(b.test_name))

    return newArray
  }
  useEffect(() => {
    if (labTest) {
      const extractedTestsData = extractTestsData(labTest)
      setRows(extractedTestsData)
    }
  }, [labTest])

  return (
    <Card>
      <CardHeader
        title='TESTS'

        //    action={headerAction}
      />
      <Box sx={{ px: 5, mb: 5 }}>
        {labTest?.map((list, index) => (
          <Box key={index} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography sx={{ fontSize: 16, fontWeight: 'bold', m: 2, textTransform: 'capitalize' }}>
              {list?.sample_name}
            </Typography>
            {list?.tests?.map((parent, index) =>
              parent?.child_tests?.length > 0 ? (
                <>
                  <Box
                    sx={{
                      bgcolor: theme.palette.customColors.displaybgPrimary,
                      borderRadius: '4px',
                      p: 1,
                      mb: 1
                    }}
                  >
                    <Typography
                      ml={4}
                      sx={{
                        display: 'flex',
                        py: 2,
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '15px',
                        fontWeight: 'bold',
                        textTransform: 'capitalize'
                      }}
                    >
                      {parent?.test_name}
                    </Typography>
                    <Divider />
                    {parent?.child_tests?.map((child, id) => {
                      return (
                        <Typography
                          key={child?.test_id}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            ml: 4,
                            py: 2,
                            textTransform: 'capitalize'
                          }}
                        >
                          {child?.test_name}
                        </Typography>
                      )
                    })}
                  </Box>
                  {/* <Accordion
                    key={parent?.test_id}
                    defaultExpanded
                    disableGutters
                    sx={{
                      bgcolor: theme.palette.customColors.displaybgPrimary,
                      boxShadow: 'none',
                      border: 'none',
                      m: 0.5,

                      '&:not(:last-of-type)': {
                        borderBottom: 'none',
                        borderTop: 'none'
                      },

                      '&:first-of-type': {
                        borderTopLeftRadius: '4px',
                        borderTopRightRadius: '4px'
                      },
                      '&:last-of-type': {
                        borderBottomLeftRadius: '4px',
                        borderBottomRightRadius: '4px'
                      }
                    }}
                    slotProps={{ heading: { component: 'h4' } }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography
                        component="span"
                        sx={{ overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 'bold', fontSize: '15px' }}
                      >
                        {parent?.test_name}
                      </Typography>
                    </AccordionSummary>
                    <Divider sx={{ bgcolor: '#bdbdbd', opacity: 0.2 }} />
                    <AccordionDetails>
                      {parent?.child_tests?.map((child, id) => {
                        return (
                          <Typography
                            key={child?.test_id}
                            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          >
                            {child?.test_name}
                          </Typography>
                        )
                      })}
                    </AccordionDetails>
                  </Accordion> */}
                </>
              ) : (
                <>
                  <Box
                    sx={{
                      bgcolor: theme.palette.customColors.displaybgPrimary,
                      borderRadius: '4px',
                      p: 1,
                      mb: 1
                    }}
                  >
                    <Typography
                      ml={4}
                      sx={{
                        display: 'flex',
                        py: 2,
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '15px',
                        fontWeight: 'bold',
                        textTransform: 'capitalize'
                      }}
                    >
                      {parent?.test_name}
                    </Typography>
                  </Box>
                </>
              )
            )}
          </Box>
        ))}
      </Box>
      {/* <DataGrid
        autoHeight
        hideFooterPagination
        getRowId={getRowId}
        rows={indexedRows === undefined ? [] : indexedRows}
        rowCount={total}
        columns={columns}
        loading={loading}
        disableColumnMenu={true}
        slotProps={{
          baseButton: {
            variant: 'outlined'
          }

          // toolbar: {
          //   value: searchValue,
          //   clearSearch: () => handleSearch(''),

          //   onChange: event => {
          //     setSearchValue(event.target.value)

          //     return handleSearch(event.target.value)
          //   }
          // }
        }}
      /> */}
    </Card>
  )
}

export default Tests
