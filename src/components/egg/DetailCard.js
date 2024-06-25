import { Avatar, Button, Card, CardHeader, IconButton, Typography, debounce } from '@mui/material'
import { Box, Stack } from '@mui/system'
import { DataGrid } from '@mui/x-data-grid'
import moment from 'moment'
import React, { useCallback, useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import NurserySlider from 'src/views/pages/egg/nursery/NurserySlideSheet'
import { GetRoomByNursery } from 'src/lib/api/egg/nursery'

const DetailCard = ({ title, DetailsListData, detailsData, ButtonName, setOpenDrawer }) => {
  const [drawer, setDrawer] = useState(false)
  const [sort, setSort] = useState('asc')
  const [sortColumn, setSortColumn] = useState('nursery_name')
  const [searchValue, setSearchValue] = useState('')
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })

  return (
    <>
      <Box sx={{ px: 5, py: 3 }}>
        <Stack
          direction='row'
          sx={{
            px: 3,
            py: 3,
            display: 'flex',

            gap: { md: 15, sx: 3, sm: 6 },
            justifyContent: 'space-between',
            alignItems: 'center',

            flexWrap: 'wrap',
            bgcolor: '#f2fff8',
            m: 4
          }}
        >
          {DetailsListData?.list &&
            Object?.entries(DetailsListData?.list).map(([key, value]) => (
              <Box key={key} m={2}>
                <Typography variant='body1'>{key}</Typography>
                <Typography sx={{ fontSize: '14px', fontWeight: 'bold' }}>{value}</Typography>
              </Box>
            ))}

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
              {DetailsListData?.Avatar?.profile_Pic ? (
                <img
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  src={DetailsListData?.Avatar?.profile_Pic}
                  alt='Profile'
                />
              ) : (
                <Icon icon='mdi:user' />
              )}
            </Avatar>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: 14 }}>
                {DetailsListData?.Avatar?.user_Name}
              </Typography>
              <Typography noWrap variant='body2' sx={{ color: '#44544a9c', fontSize: 12 }}>
                {DetailsListData?.Avatar?.create_at
                  ? 'Created on ' + moment(DetailsListData?.Avatar?.create_at).format('DD/MM/YYYY')
                  : '-'}
              </Typography>
            </Box>
          </Box>
        </Stack>
      </Box>
    </>
  )
}

export default DetailCard
