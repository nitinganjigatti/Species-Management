import { Autocomplete, Avatar, FormControl, Grid, TextField, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React, { useContext, useEffect, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import Icon from 'src/@core/components/icon'

// ** Custom Components Imports
import OptionsMenu from 'src/@core/components/option-menu'
import ReactApexcharts from 'src/@core/components/react-apexcharts'
import { AuthContext } from 'src/context/AuthContext'
import { DataGrid } from '@mui/x-data-grid'
import { getAllStats } from 'src/lib/api/egg/dashboard'
import moment from 'moment'
import Toaster from 'src/components/Toaster'

const Species = () => {
  const authData = useContext(AuthContext)
  const theme = useTheme()
  const [defaultSite, setDefaultSite] = useState(null)
  return (
    <Box
      sx={{
        backgroundColor: '#fff',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        boxShadow: '0px 2px 10px 0px #4C4E6438',
        borderRadius: '10px'
      }}
    >
      <Typography
        sx={{
          fontWeight: 500,
          fontSize: '24px',
          lineHeight: '29.05px',
          color: theme.palette.customColors.OnSurfaceVariant
        }}
      >
        Species
      </Typography>
      <Grid container columns={15} spacing={6}>
        <Grid item xs={3}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid #C3CEC7',
              borderRadius: '4px',
              padding: '0 8px',
              height: '40px'
            }}
          >
            <Icon icon='mi:search' color={theme.palette.customColors.OnSurfaceVariant} />
            <TextField
              variant='outlined'
              placeholder='Search'
              InputProps={{
                disableUnderline: true
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  border: 'none',
                  padding: '0',
                  '& fieldset': {
                    border: 'none'
                  }
                }
              }}
            />
          </Box>
        </Grid>
        <Grid item xs={5}>
          <Box sx={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                sx={{
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  width: '100%',
                  // '& .MuiIconButton-edgeEnd': { display: 'block' },
                  '& .css-sn37jt-MuiInputBase-root-MuiOutlinedInput-root': {
                    height: '40px',
                    borderRadius: '4px'
                  },
                  '& .css-1lqkpd-MuiFormLabel-root-MuiInputLabel-root': { top: '-7px' },
                  '& .css-1d3z3hw-MuiOutlinedInput-notchedOutline': { border: '1px solid #C3CEC7' }
                }}
                // value={value}
                // onChange={onChange}
                label={'From Date'}
                maxDate={dayjs()}
              />
            </LocalizationProvider>
            <Typography
              sx={{
                color: '#839D8D',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '16.94px'
              }}
            >
              To
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                sx={{
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  width: '100%',
                  '& .css-sn37jt-MuiInputBase-root-MuiOutlinedInput-root': { height: '40px', borderRadius: '4px' },
                  // '& .MuiIconButton-edgeEnd': { display: 'block' },
                  '& .css-1lqkpd-MuiFormLabel-root-MuiInputLabel-root': { top: '-7px' },
                  '& .css-1d3z3hw-MuiOutlinedInput-notchedOutline': { border: '1px solid #C3CEC7' }
                }}
                // value={value}
                // onChange={onChange}
                label={'Till Date'}
                maxDate={dayjs()}
              />
            </LocalizationProvider>
          </Box>
        </Grid>
        <Grid item xs={3}>
          {authData?.userData?.user?.zoos[0]?.sites.length > 0 && (
            <FormControl fullWidth>
              <Autocomplete
                name='site_id'
                value={defaultSite}
                disablePortal
                id='site_id'
                sx={{
                  '& .css-jthw9v-MuiAutocomplete-root .MuiOutlinedInput-root': {
                    height: '40px',
                    borderRadius: '4px'
                  },
                  '& .css-1d3z3hw-MuiOutlinedInput-notchedOutline': { border: '1px solid #C3CEC7' }
                }}
                options={authData?.userData?.user?.zoos[0].sites}
                getOptionLabel={option => option.site_name}
                isOptionEqualToValue={(option, value) => option?.site_id === value?.site_id}
                onChange={(e, val) => {
                  if (val === null) {
                    setDefaultSite(null)

                    // return onChange('')
                  } else {
                    setDefaultSite(val)

                    // console.log('val', val)

                    // return onChange(val.site_id)
                  }
                }}
                renderInput={params => (
                  <TextField
                    // onChange={e => {
                    //   searchRoom(defaultNursery.nursery_id, e.target.value)
                    // }}
                    sx={{
                      backgroundColor: '#fff',
                      borderRadius: '8px',
                      width: '100%',
                      '& .css-vh4m6j-MuiInputBase-root-MuiOutlinedInput-root': {
                        height: '40px',
                        borderRadius: '4px'
                      },
                      '& .css-1lqkpd-MuiFormLabel-root-MuiInputLabel-root': { top: '-7px' },
                      '& input': {
                        position: 'relative',
                        top: -7
                      }
                      // '& ::placeholder': {
                      //   position: 'relative',
                      //   top: -0
                      // }
                    }}
                    {...params}
                    label='From Site'
                    placeholder='Search'
                  />
                )}
              />
            </FormControl>
          )}
        </Grid>
        <Grid item xs={3}>
          {authData?.userData?.user?.zoos[0]?.sites.length > 0 && (
            <FormControl fullWidth>
              <Autocomplete
                name='site_id'
                value={defaultSite}
                disablePortal
                id='site_id'
                options={authData?.userData?.user?.zoos[0].sites}
                getOptionLabel={option => option.site_name}
                isOptionEqualToValue={(option, value) => option?.site_id === value?.site_id}
                onChange={(e, val) => {
                  if (val === null) {
                    setDefaultSite(null)

                    // return onChange('')
                  } else {
                    setDefaultSite(val)

                    // console.log('val', val)

                    // return onChange(val.site_id)
                  }
                }}
                renderInput={params => (
                  <TextField
                    // onChange={e => {
                    //   searchRoom(defaultNursery.nursery_id, e.target.value)
                    // }}
                    sx={{
                      backgroundColor: '#fff',
                      borderRadius: '8px',
                      width: '100%',
                      '& .css-vh4m6j-MuiInputBase-root-MuiOutlinedInput-root': {
                        height: '40px',
                        borderRadius: '4px'
                      },
                      '& .css-1lqkpd-MuiFormLabel-root-MuiInputLabel-root': { top: '-7px' },
                      '& input': {
                        position: 'relative',
                        top: -7
                      }
                    }}
                    {...params}
                    label='Receiving Site'
                    placeholder='Search & Select'
                  />
                )}
              />
            </FormControl>
          )}
        </Grid>
      </Grid>
      {/* <DataGrid
      sx={{
        '.MuiDataGrid-cell:focus': {
          outline: 'none'
        },
        '& .MuiDataGrid-row:hover': {
          cursor: 'pointer'
        },
        '& .MuiDataGrid-row:hover .customButton': {
          display: 'block'
        },
        '& .MuiDataGrid-row:hover .hideField': {
          display: 'none'
        },
        '& .MuiDataGrid-row .customButton': {
          display: 'none'
        },
        '& .MuiDataGrid-row .hideField': {
          display: 'block'
        }
      }}
      columnVisibilityModel={{
        sl_no: false
      }}
      hideFooterSelectedRowCount
      disableColumnSelector={true}
      autoHeight
      pagination
      rows={indexedRows === undefined ? [] : indexedRows}
      rowCount={total}
      columns={incubationColumns}
      sortingMode='server'
      paginationMode='server'
      pageSizeOptions={[7, 10, 25, 50]}
      paginationModel={paginationModel}
      onSortModelChange={handleSortModel}
      slots={{ toolbar: ServerSideToolbarWithFilter }}
      onPaginationModelChange={setPaginationModel}
      loading={loading}
      slotProps={{
        baseButton: {
          variant: 'outlined'
        },
        toolbar: {
          value: searchValue,
          clearSearch: () => handleSearch(''),
          onChange: event => handleSearch(event.target.value)
        }
      }}
      onCellClick={onCellClick}

      // onCellClick={handleCellClick}
      // checkboxSelection
    /> */}
    </Box>
  )
}

export default Species
