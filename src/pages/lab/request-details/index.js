/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable lines-around-comment */
import React, { useState, useEffect, useCallback } from 'react'

import { getLabList } from 'src/lib/api/addLab'
import { IMAGE_BASE_URL } from 'src/constants/ApiConstant'

// import { getMedicineConfig } from 'src/lib/api/getMedicineConfig'
import Button from '@mui/material/Button'
import FallbackSpinner from 'src/@core/components/spinner/index'

// ** MUI Imports

import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import { debounce } from 'lodash'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box, Avatar, Badge, Stack } from '@mui/material'
import IconButton from '@mui/material/IconButton'
import Router from 'next/router'
import CommonDialogBox from 'src/components/CommonDialogBox'
import MedicineConfigure from 'src/components/pharmacy/medicine/MedicineConfigure'
import Utility from 'src/utility'

const RequestDetails = () => {
  const [loader, setLoader] = useState(false)

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          <Card sx={{ p: 5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant='h6'>
                  Request - <span style={{ color: '#37BD69', fontSize: '20px', fontWeight: 'bold' }}>1234567890</span>
                </Typography>
                <Typography>14 Nov 2023 14:30</Typography>
              </Box>
              <Box gap={2} sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    bgcolor: '#EDEDFF',
                    display: 'flex',
                    width: 40,
                    height: 40,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: '10px'
                  }}
                >
                  <Icon icon='ion:location-outline' fontSize={25} color={'#37BD69'} />
                </Box>
                <Typography variant='h6'>
                  Site - <span style={{ color: '#37BD69', fontSize: '20px', fontWeight: 'bold' }}>GAGWA</span>
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 6 }}>
              <Stack direction='row' gap={3}>
                <Typography>
                  No. of Tests : <span style={{ fontSize: '15px', fontWeight: 'bold' }}>10</span>
                </Typography>
                <Typography>
                  No. of Samples : <span style={{ fontSize: '15px', fontWeight: 'bold' }}>10</span>
                </Typography>
              </Stack>

              <Typography>
                Request by - <span style={{ fontSize: '15px', fontWeight: 'bold' }}>12345678</span>
              </Typography>
            </Box>
          </Card>

          {/* <Card>
            <CardHeader
              title='Test Reports'
              //  action={headerAction}
            />

            <DataGrid
              autoHeight
              pagination
              rows={indexedRows === undefined ? [] : indexedRows}
              rowCount={total}
              columns={columns}
              sortingMode='server'
              paginationMode='server'
              pageSizeOptions={[7, 10, 25, 50]}
              paginationModel={paginationModel}
              onSortModelChange={handleSortModel}
              slots={{ toolbar: ServerSideToolbar }}
              onPaginationModelChange={setPaginationModel}
              loading={loading}
              slotProps={{
                baseButton: {
                  variant: 'outlined'
                },
                toolbar: {
                  value: searchValue,
                  clearSearch: () => handleSearch(''),

                  onChange: event => {
                    setSearchValue(event.target.value)

                    return handleSearch(event.target.value)
                  }
                }
              }}
            />
          </Card> */}
        </>
      )}
    </>
  )
}

export default RequestDetails
