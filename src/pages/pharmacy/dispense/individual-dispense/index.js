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

function IndividualDispense() {
  const [dispenseData, setDispenseData] = useState({})
  const router = useRouter()
  const { id } = router.query
  const { selectedPharmacy } = usePharmacyContext()

  useEffect(() => {
    if (id) {
      getDispenseById(id)?.then(res => {
        setDispenseData(res?.data)
      })
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
        <Avatar
          sx={{
            '& > img': {
              objectFit: 'contain'
            },
            width: '100%',
            height: '100%'
          }}
          variant='rounded'
          alt={params?.row?.default_icon}
          src={params?.row?.default_icon}
        />
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
      {selectedPharmacy.type === 'local' &&
      (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') ? (
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
                      <Typography sx={{ textAlign: 'center', fontSize: 24, fontWeight: 600 }}>
                        {dispenseData?.created_user_first_name} {dispenseData?.created_user_last_name} :{' '}
                        {dispenseData?.created_user_mobile_number}
                      </Typography>
                      <Box sx={{ display: 'flex' }}>
                        <Typography sx={{ fontWeight: 600 }}>Dispense Id : </Typography>
                        <Typography>&nbsp;{dispenseData?.dispense_id}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', my: 0 }}>
                        <Typography sx={{ fontWeight: 600 }}>Created At : </Typography>
                        <Typography>&nbsp;{moment(dispenseData?.created_at).format('D MMM YYYY - h:mmA')}</Typography>
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
                  <Grid container sx={{ alignItems: 'center', justifyContent: 'center' }}>
                    <Grid item xs={12} md={2.8}>
                      <Avatar
                        sx={{
                          '& > img': {
                            objectFit: 'contain'
                          },
                          width: 100,
                          height: 100,
                          my: 3
                        }}
                        variant='rounded'
                        alt={dispenseData?.profile_pic}
                        src={dispenseData?.profile_pic}
                      />
                    </Grid>
                    <Grid item xs={12} md={8.8}>
                      <Typography sx={{ textAlign: 'center', fontSize: 24, fontWeight: 600 }}>
                        {dispenseData?.user_first_name} {dispenseData?.user_last_name} :{' '}
                        {dispenseData?.user_mobile_number}
                      </Typography>
                    </Grid>
                  </Grid>
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
{
  /* <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
          <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', justifyContent: 'center' }}>
            <Box>
              <Avatar
                sx={{
                  '& > img': {
                    objectFit: 'contain'
                  },
                  width: 200,
                  height: 200,
                  my: 2
                }}
                variant='rounded'
                alt={dispenseData?.created_profile_pic}
                src={dispenseData?.created_profile_pic}
              />
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ textAlign: 'center', fontSize: 24, fontWeight: 600 }}>
                  {dispenseData?.created_user_first_name} {dispenseData?.created_user_last_name}
                </Typography>
                <Typography sx={{ textAlign: 'center', fontSize: 24, fontWeight: 600, mt: 3 }}>
                  &nbsp; &nbsp;
                  <a
                    style={{ textDecoration: 'none', color: 'inherit' }}
                    href={`tel:+91${dispenseData?.created_user_mobile_number}`}
                  >
                    <Icon icon='mdi:call' />
                  </a>
                </Typography>
              </Box>
            </Box>
            <Box sx={{ width: '30%', my: 2 }}>
              <Divider style={{ borderBottom: '2px solid #e8e8e8' }} />
            </Box>
            <Box sx={{ my: 2 }}>
              <Box sx={{ display: 'flex' }}>
                <Typography sx={{ fontWeight: 600 }}>Dispense Id : </Typography>
                <Typography>{' ' + dispenseData?.dispense_id}</Typography>
              </Box>
              <Box sx={{ display: 'flex' }}>
                <Typography sx={{ fontWeight: 600 }}>Created At : </Typography>
                <Typography>{' ' + moment(dispenseData?.created_at).format('D MMM YYYY - h:mmA')}</Typography>
              </Box>
              <Box sx={{ display: 'flex' }}>
                <Typography sx={{ fontWeight: 600 }}>From Store : </Typography>
                <Typography>{' ' + dispenseData?.from_store}</Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
      <Card>
        <CardHeader
          title='Dispense To'
          avatar={
            <Icon
              style={{ cursor: 'pointer' }}
              onClick={() => {
                Router?.push('/pharmacy/dispense')
              }}
              icon='ep:user'
            />
          }
        />
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', justifyContent: 'center' }}>
            <Avatar
              sx={{
                '& > img': {
                  objectFit: 'contain'
                },
                width: 200,
                height: 200,
                my: 2
              }}
              variant='rounded'
              alt={dispenseData?.profile_pic}
              src={dispenseData?.profile_pic}
            />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ textAlign: 'center', fontSize: 24, fontWeight: 600 }}>
                {dispenseData?.user_first_name} {dispenseData?.user_last_name}
              </Typography>
              <Typography sx={{ textAlign: 'center', fontSize: 24, fontWeight: 600, mt: 3 }}>
                &nbsp; &nbsp;
                <a
                  style={{ textDecoration: 'none', color: 'inherit' }}
                  href={`tel:+91${dispenseData?.user_mobile_number}`}
                >
                  <Icon icon='mdi:call' />
                </a>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
      <Card>
        <CardHeader title='Dispense List' />
        <CardContent>
          <Grid container gap={4} justifyContent={'space-between'}>
            {dispenseData?.dispense_item_details?.length > 0
              ? dispenseData?.dispense_item_details.map((item, index) => (
                  <Grid item xs={12} sm={12} md={5.7} lg={5.8}>
                    <Card>
                      <CardContent>
                        <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 1 }}>{item?.name}</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography sx={{ fontWeight: 600 }}>Batch No : </Typography>
                          <Typography>{item?.batch_no}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography sx={{ fontWeight: 600 }}>Quantity :</Typography>
                          <Typography>{item?.qty}</Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              : null}
          </Grid>
        </CardContent>
      </Card>
      <Card>
        <CardHeader title='Animal List' />
        <CardContent>
          <Grid container gap={4} justifyContent={'space-between'}>
            {dispenseData?.animal_details?.length > 0
              ? dispenseData?.animal_details.map((item, index) => (
                  <Grid item xs={12} sm={12} md={5.7} lg={5.8}>
                    <Card>
                      <CardContent>
                        <Grid container sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                          <Grid item xs={2} sx={{ backgroundColor: '' }}>
                            <Avatar
                              sx={{
                                '& > img': {
                                  objectFit: 'contain'
                                },
                                width: '100%',
                                height: '100%'
                              }}
                              variant='rounded'
                              alt={item?.default_icon}
                              src={item?.default_icon}
                            />
                          </Grid>
                          <Grid item xs={9}>
                            <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 1 }}>{item?.common_name}</Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography sx={{ fontWeight: 600 }}>Animal Id : </Typography>
                              <Typography>{item?.animal_id}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography sx={{ fontWeight: 600 }}>Enclosure Id :</Typography>
                              <Typography>{item?.enclosure_id}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography sx={{ fontWeight: 600 }}>Section Name : </Typography>
                              <Typography>{item?.section_name}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography sx={{ fontWeight: 600 }}>Gender : </Typography>
                              <Typography>{item?.sex}</Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              : null}
          </Grid>
        </CardContent>
      </Card>
    </Box> */
}
