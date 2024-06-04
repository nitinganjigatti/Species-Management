import { Avatar, Button, Card, CardHeader, IconButton, Typography, debounce } from '@mui/material'
import { Box, Stack } from '@mui/system'
import { DataGrid } from '@mui/x-data-grid'
import moment from 'moment'
import React, { useCallback, useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import NurserySlider from 'src/views/pages/egg/nursery/NurserySlideSheet'
import { GetRoomByNursery } from 'src/lib/api/egg/nursery'

const DetailCard = ({ title, nurseryData, detailsData, ButtonName, setOpenDrawer }) => {
  const [drawer, setDrawer] = useState(false)
  const [sort, setSort] = useState('asc')
  const [sortColumn, setSortColumn] = useState('nursery_name')
  const [searchValue, setSearchValue] = useState('')
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })

  const headerAction = (
    <>
      <Box sx={{ display: 'flex', height: '32px', justifyContent: 'space-between' }}>
        <IconButton size='small' sx={{ mr: 0.5 }} aria-label='Edit' onClick={() => setOpenDrawer(true)}>
          <Icon icon='mdi:pencil-outline' />
        </IconButton>
        <Button sx={{ px: 7, py: 5 }} size='small' variant='contained'>
          <Icon icon='mdi:add' fontSize={20} />
          &nbsp; {ButtonName}
        </Button>
      </Box>
    </>
  )

  return (
    <>
      <Card sx={{ px: 5, py: 3 }}>
        <CardHeader title={title ? title : 'Rooms Details'} action={headerAction} />

        <Stack
          direction='row'
          sx={{
            px: 3,
            py: 3,
            display: 'flex',
            gap: { md: 20, sx: 3, sm: 6 },
            alignItems: 'center',
            flexWrap: 'wrap',
            bgcolor: '#f2fff8',
            m: 4
          }}
        >
          <Box m={2}>
            <Typography variant='body1'>{title ? 'Nursery Name' : 'Room'}</Typography>
            <Typography sx={{ fontSize: '14px', fontWeight: 'bold' }}>
              {title ? nurseryData?.nursery_name : detailsData?.room_name}
            </Typography>
          </Box>
          <Box m={2}>
            <Typography variant='body1'>{title ? 'Site' : 'Nursery Name'}</Typography>
            <Typography sx={{ fontSize: '14px', fontWeight: 'bold' }}>
              {title ? nurseryData?.site_name : detailsData?.nursery_name}
            </Typography>
          </Box>
          <Box m={2}>
            <Typography variant='body1'>{title ? 'Rooms' : 'Site'}</Typography>
            <Typography sx={{ fontSize: '14px', fontWeight: 'bold' }}>
              {title ? nurseryData?.no_of_rooms : detailsData?.site_name}
            </Typography>
          </Box>
          <Box m={2}>
            <Typography>Incubators</Typography>
            <Typography sx={{ fontSize: '14px', fontWeight: 'bold' }}>
              {title ? nurseryData?.no_of_incubators : detailsData?.no_of_incubators}
            </Typography>
          </Box>

          <Box m={2}>
            <Typography variant='body1'>Eggs</Typography>
            <Typography sx={{ fontSize: '14px', fontWeight: 'bold' }}>
              {title ? nurseryData?.no_of_eggs : detailsData?.no_of_eggs}
            </Typography>
          </Box>
          <Box m={2} sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
            <Avatar
              variant='square'
              alt='Medicine Image'
              sx={{
                width: 30,
                height: 30,
                mr: 4,
                borderRadius: '50%',
                background: '#E8F4F2',
                overflow: 'hidden'
              }}
            >
              {nurseryData?.user_profile_pic ? (
                <img
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  src={nurseryData?.user_profile_pic}
                  alt='Profile'
                />
              ) : detailsData?.user_profile_pic ? (
                <img
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  src={detailsData?.user_profile_pic}
                  alt='Profile'
                />
              ) : (
                <Icon icon='mdi:user' />
              )}
            </Avatar>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: 14 }}>
                {title ? nurseryData?.user_full_name : detailsData?.user_full_name ? detailsData?.user_full_name : '-'}
              </Typography>
              <Typography noWrap variant='body2' sx={{ color: '#44544a9c', fontSize: 12 }}>
                {nurseryData?.created_at
                  ? 'Created on ' + moment(nurseryData?.created_at).format('DD/MM/YYYY')
                  : detailsData?.created_at
                  ? 'Created on ' + moment(detailsData?.created_at).format('DD/MM/YYYY')
                  : '-'}
              </Typography>
            </Box>
          </Box>
        </Stack>
      </Card>
      {/* {drawer && (
        <NurserySlider
          closeSideSheet={closeSideSheet}
          editName={editName}
          fetchTableData={fetchTableData}
          editSite={editSite}
          editNurseryId={editNurseryId}
        /> */}
      {/* )} */}
    </>
  )
}

export default DetailCard
