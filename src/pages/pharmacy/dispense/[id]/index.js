import { Avatar, Card, CardContent, CardHeader, Grid, Typography } from '@mui/material'
import Router, { useRouter } from 'next/router'
import Icon from 'src/@core/components/icon'
import React, { useEffect, useState } from 'react'
import { Box } from '@mui/system'
import { getDispenseById } from 'src/lib/api/pharmacy/dispenseProduct'
import moment from 'moment'
import { DataGrid } from '@mui/x-data-grid'
import Error404 from 'src/pages/404'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Utility from 'src/utility'

const IndividualDispense = () => {
  const [dispenseData, setDispenseData] = useState({})
  const router = useRouter()
  const { id } = router.query
  const { selectedPharmacy } = usePharmacyContext()

  useEffect(() => {
    if (id) {
      try {
        getDispenseById(id)?.then(res => {
          setDispenseData(res?.data)
        })
      } catch (error) {
        console.log('error', error)
      }
    }
  }, [])

  const dispenseColumns = [
    {
      flex: 0.25,
      minWidth: 200,
      field: 'name',
      headerName: 'PRODUCT NAME',
      renderCell: params => {
        return (
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params?.row?.name}
          </Typography>
        )
      }
    },
    {
      flex: 0.25,
      minWidth: 230,
      field: 'batch_no',
      headerName: 'BATCH NO.',
      renderCell: params => <Typography>{params.row.batch_no}</Typography>
    },
    {
      flex: 0.15,
      minWidth: 120,
      field: 'qty',
      headerName: 'QUANTITY',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.qty}
        </Typography>
      )
    }
  ]

  const animalsColumns = [
    {
      flex: 0.1,
      field: ' ',
      headerName: '',
      renderCell: params => (
        <Box sx={{ p: 1.4 }}>
          <Avatar
            sx={{
              '& > img': {
                objectFit: 'contain'
              },
              width: '100%',
              height: '100%'
            }}
            variant='circular'
            alt={params?.row?.default_icon}
            src={params?.row?.default_icon}
          />
        </Box>
      )
    },
    {
      flex: 0.25,
      field: 'animal_id',
      headerName: 'Animal Id',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params?.row?.animal_id}
        </Typography>
      )
    },
    {
      flex: 0.25,
      field: 'common_name',
      headerName: 'Animal Name',
      renderCell: params => {
        return (
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.common_name}
          </Typography>
        )
      }
    },
    {
      flex: 0.25,
      field: 'enclosure_id',
      headerName: 'Enclosure Id',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.enclosure_id}
        </Typography>
      )
    },
    {
      flex: 0.25,
      field: 'section_name',
      headerName: 'section Name',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.section_name}
        </Typography>
      )
    },
    {
      flex: 0.25,
      field: 'sex',
      headerName: 'Gender',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.sex}
        </Typography>
      )
    }
  ]

  return (
    <>
      {selectedPharmacy.permission.pharmacy_module === 'allow_full_access' ||
      selectedPharmacy.permission.dispense_medicine ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Grid container gap={3} justifyContent={'space-between'} alignItems={'stretch'}>
            <Grid item xs={12} md={6.4}>
              <Card>
                <CardHeader
                  title='Dispense Detail'
                  avatar={
                    <Icon
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        Router?.push('/pharmacy/dispense')
                      }}
                      icon='ep:back'
                    />
                  }
                />
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-evenly' }}>
                    <Box>
                      <Avatar
                        sx={{
                          '& > img': {
                            objectFit: 'contain'
                          },
                          width: 100,
                          height: 100,
                          my: 2
                        }}
                        variant='rounded'
                        alt={dispenseData?.created_profile_pic}
                        src={dispenseData?.created_profile_pic}
                      />
                    </Box>

                    <Box sx={{ my: 2 }}>
                      <Typography sx={{ fontSize: 24, fontWeight: 600 }}>
                        {dispenseData?.created_user_first_name} {dispenseData?.created_user_last_name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Icon style={{ cursor: 'pointer' }} icon='mdi:call' />
                        <Typography sx={{}}>
                          {dispenseData?.created_user_country_code} {dispenseData?.created_user_mobile_number}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex' }}>
                        <Typography sx={{ fontWeight: 600 }}>Dispense Id : </Typography>
                        <Typography>&nbsp;{dispenseData?.dispense_id}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', my: 0 }}>
                        <Typography sx={{ fontWeight: 600 }}>Created At : </Typography>
                        <Typography>
                          &nbsp;
                          {Utility.formatDisplayDate(Utility.convertUTCToLocal(dispenseData?.created_at))} -{' '}
                          {Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(dispenseData?.created_at))}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex' }}>
                        <Typography sx={{ fontWeight: 600 }}>From Store : </Typography>
                        <Typography>&nbsp;{dispenseData?.from_store}</Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={5.4}>
              <Card>
                <CardHeader title='Dispense To' avatar={<Icon style={{ cursor: 'pointer' }} icon='ep:user' />} />
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-evenly' }}>
                    <Box>
                      <Avatar
                        sx={{
                          '& > img': {
                            objectFit: 'contain'
                          },
                          width: 100,
                          height: 100,
                          my: 6.4
                        }}
                        variant='rounded'
                        alt={dispenseData?.profile_pic}
                        src={dispenseData?.profile_pic}
                      />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 24, fontWeight: 600 }}>
                        {dispenseData?.user_first_name} {dispenseData?.user_last_name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Icon style={{ cursor: 'pointer' }} icon='mdi:call' />
                        <Typography sx={{ fontSize: 18, fontWeight: 600 }}>
                          {dispenseData?.user_country_code} {dispenseData?.user_mobile_number}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {dispenseData?.dispense_item_details?.length > 0 ? (
            <Card>
              <CardHeader title='Dispense List' />
              <DataGrid
                autoHeight
                columns={dispenseColumns}
                getRowId={row => row?.id}
                rows={dispenseData?.dispense_item_details}
              />
            </Card>
          ) : null}
          {dispenseData?.animal_details?.length > 0 ? (
            <Card>
              <CardHeader title='Animal List' />
              <DataGrid
                autoHeight
                columns={animalsColumns}
                getRowId={row => row.animal_id}
                rows={dispenseData?.animal_details}
              />
            </Card>
          ) : null}
        </Box>
      ) : (
        <>
          <Error404></Error404>
        </>
      )}
    </>
  )
}

export default IndividualDispense
