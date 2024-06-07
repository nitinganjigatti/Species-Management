import React, { useContext, useState } from 'react'

// ** MUI Imports
import Card from '@mui/material/Card'
import TabList from '@mui/lab/TabList'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import { Avatar, Button, Tooltip, Typography } from '@mui/material'
import { Box } from '@mui/system'
import IconButton from '@mui/material/IconButton'
import Icon from 'src/@core/components/icon'
import { AuthContext } from 'src/context/AuthContext'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import ConfirmationCheckBox from 'src/views/forms/form-elements/confirmationCheckBox'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import FallbackSpinner from 'src/@core/components/spinner/index'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import moment from 'moment'
import { useTheme } from '@mui/material/styles'

const SpeciesList = () => {
  const theme = useTheme()
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState('overview')
  const [loader, setLoader] = useState(false)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([
    {
      uid: '01',
      id: '1',
      common_name: 'Cheetah',
      scientific_name: 'Speckled pigeon',
      rkt: '123',
      kmt: '1',
      rktwt: '12',
      age: 'Juvenile',
      category: 'Birth',
      created_at: '2024-06-03 16:07:17',
      date: '2024-06-06 16:07:17',
      created_by_user: {
        user_name: 'sr',
        email: 'sr@mailinator.com',
        profile_pic: 'https://api.dev.antzsystems.com/uploads/11/diet/ingredients/665d9cdd975011717411037.jpg'
      }
    }
  ])
  const [searchValue, setSearchValue] = useState('')

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)

  const [statusCheckval, setstatusCheckval] = useState(false)
  const [dialog, setDialog] = useState(false)
  const [check, setCheck] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState()

  const authData = useContext(AuthContext)

  const onClose = () => {
    setDialog(false)
  }

  const handleChange = (event, newValue) => {
    setTotal(0)
    setStatus(newValue)
  }

  const TabBadge = ({ label, totalCount }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
      {label}
      {totalCount ? (
        <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' label={totalCount} color='secondary' />
      ) : null}
    </div>
  )

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const columns = [
    {
      flex: 0.2,
      Width: 40,
      field: 'uid',
      headerName: 'S.NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.uid}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 30,
      field: 'image_type',
      headerName: 'IMAGE',
      renderCell: params => (
        <>
          <Avatar variant='square' src={params.row.created_by_user?.profile_pic} alt={params.row.id} />
          <Tooltip title={params.row.image_type} placement='right'>
            <Typography
              variant='body2'
              sx={{ ml: 2, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {' '}
              {params.row.image_type}
            </Typography>
          </Tooltip>
        </>
      )
    },
    {
      flex: 0.3,
      minWidth: 30,
      field: 'common_name',
      headerName: 'COMMON NAME',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: '14px', fontWeight: '500' }}>
              {params.row.common_name ? params.row.common_name : '-'}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      flex: 0.4,
      minWidth: 10,
      field: 'scientific_name',
      headerName: 'SCIENTIFIC NAME',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.scientific_name ? params.row.scientific_name : '-'}
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 10,
      field: 'rkt',
      headerName: 'RKT',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: '#37BD69' }}>
          {params.row.rkt ? params.row.rkt : '-'}
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 10,
      field: 'kmt',
      headerName: 'KMT',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.kmt ? params.row.kmt : '-'}
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 10,
      field: 'rktwt',
      headerName: 'RKTWT',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.rktwt ? params.row.rktwt : '-'}
        </Typography>
      )
    }
  ]

  const onCellClick = params => {
    // Router.push('/parivesh/home/new-entries/add-newentry')
    // console.log(params, 'params')
    // const clickedColumn = params.field !== 'switch'
    // if (clickedColumn) {
    //   const data = params.row
    //   Router.push({
    //     pathname: `/diet/ingredient/${data?.id}`
    //   })
    // } else {
    //   return
    // }
  }

  const headerAction = (
    <>
      <div>
        <Button size='medium' variant='contained' onClick={() => Router.push('/')}>
          <Icon icon='mdi:add' fontSize={20} />
          &nbsp; ADD new species
        </Button>
      </div>
    </>
  )

  const tableData = () => {
    return (
      <>
        {loader ? (
          <FallbackSpinner />
        ) : (
          <Card sx={{ mt: 4 }}>
            <CardHeader title={'Species List'} action={headerAction} />
            <ConfirmationDialog
              // icon={'mdi:delete'}
              image={'https://app.antzsystems.com/uploads/6515471031963.jpg'}
              iconColor={'#ff3838'}
              title={'Are you sure you want to delete this ingredient?'}
              // description={`Since ingredient IND000123 isn't included in any recipe or diet, you can delete it.`}
              formComponent={
                <ConfirmationCheckBox
                  title={'This ingredient is part of 15 recipes and 10 diets.'}
                  label={'Deactivate this ingredient in all records'}
                  description={
                    'Deactivating this ingredient prevents its addition to new recipes or diets, but you can swap it with another ingredient.'
                  }
                  color={theme.palette.formContent?.tertiary}
                  value={check}
                  setValue={setCheck}
                />
              }
              dialogBoxStatus={dialog}
              onClose={onClose}
              ConfirmationText={'Delete'}
              confirmAction={onClose}
            />
            <DataGrid
              sx={{
                '.MuiDataGrid-cell:focus': {
                  outline: 'none'
                },

                '& .MuiDataGrid-row:hover': {
                  cursor: 'pointer'
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
              columns={columns}
              sortingMode='server'
              paginationMode='server'
              pageSizeOptions={[7, 10, 25, 50]}
              paginationModel={paginationModel}
              //   onSortModelChange={handleSortModel}
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
            />
          </Card>
        )}
      </>
    )
  }

  return (
    <>
      <Grid>
        <TabContext value={status}>
          <TabList onChange={handleChange} aria-label='simple tabs example'>
            <Tab
              value='overview'
              label={<TabBadge label='overview' totalCount={status === 'overview' ? total : null} />}
            />
          </TabList>

          <TabPanel value='overview'>
            <Grid>{tableData()}</Grid>
          </TabPanel>
        </TabContext>
      </Grid>
    </>
  )
}

export default SpeciesList
