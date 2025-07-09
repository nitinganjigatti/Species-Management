import { Avatar, Button, Card, IconButton, Menu, MenuItem, TextField, Typography } from '@mui/material'
import React, { useState } from 'react'
import { useTheme } from '@mui/material/styles'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import StickyTable from 'src/views/table/sticky-table'
import Icon from 'src/@core/components/icon'
import { Box } from '@mui/system'

const AnimalIdentifier = () => {
  const theme = useTheme()

  const [searchValue, setSearchValue] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 })
  // Inside your component
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  const handleMenuOpen = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const columns = [
    {
      field: 'sl_no',
      headerName: 'NO',
      minWidth: 50,
      width: 50,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: params => (
        <Typography
          sx={{
            fontSize: '12px',
            fontWeight: 400,
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          {params.row.sl_no}
        </Typography>
      )
    },
    {
      field: 'identifier_type',
      headerName: 'LOCAL IDENTIFIER TYPE',
      minWidth: 150,
      flex: 0.4,
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar
            variant='rounded'
            sx={{
              width: 40,
              height: 40,
              borderRadius: '8px',
              backgroundColor: theme.palette.customColors.displaybgPrimary
            }}
          >
            {/* Replace with actual icon based on type */}
            {params.row.identifier_type === 'Name' ? (
              <img src={params.row.image} alt='avatar' style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Icon icon='mdi:tag-outline' />
            )}
          </Avatar>
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 500,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            {params.row.identifier_type}
          </Typography>
        </Box>
      )
    },
    {
      field: 'identifier',
      headerName: 'LOCAL IDENTIFIER',
      minWidth: 120,
      flex: 0.3,
      sortable: false,
      renderCell: params => (
        <Typography
          sx={{
            fontWeight: 500,
            fontSize: 16,
            letterSpacing: 0,
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          {params.row.identifier}
        </Typography>
      )
    },
    {
      field: 'primary',
      headerName: 'PRIMARY',
      minWidth: 80,
      flex: 0.2,
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <Typography
          sx={{
            fontWeight: 400,
            fontSize: 16,
            color: params.row.primary === 'Yes' ? theme.palette.primary.dark : ''
          }}
        >
          {params.row.primary}
        </Typography>
      )
    },
    {
      field: 'added_by',
      headerName: 'ADDED BY',
      minWidth: 200,
      flex: 0.5,
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar
            sx={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              backgroundColor: theme.palette.customColors.displaybgPrimary
            }}
          >
            <img
              src={params.row.profile}
              alt='user-profile'
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Avatar>
          <Box>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              {params.row.user}
            </Typography>
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: 400,
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              {params.row.date}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      field: 'action',
      headerName: '',
      // minWidth: 200,
      flex: 0.5,
      sortable: false,
      renderCell: params => (
        <Box>
          <IconButton size='small' onClick={handleMenuOpen}>
            <Icon icon='mdi:dots-vertical' />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={open}
            sx={{ backgroundColor: 'transparent' }}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={handleMenuClose}>View Details</MenuItem>
            <MenuItem onClick={handleMenuClose}>Edit Identifier</MenuItem>
            <MenuItem onClick={handleMenuClose}>Delete Identifier</MenuItem>
          </Menu>
        </Box>
      )
    }
  ]
  const rows = [
    {
      sl_no: 1,
      identifier_type: 'Name',
      identifier: 'Vishvash',
      primary: 'Yes',
      user: 'Jordan Stevenson',
      date: '14 Apr 2024 | 12:35 PM',
      profile: '/path/to/jordan-profile.png',
      image: '/path/to/parrot-image.jpg'
    },
    {
      sl_no: 2,
      identifier_type: 'Micro Chip',
      identifier: '54363',
      primary: 'No',
      user: 'Jordan Stevenson',
      date: '14 Feb 2024 | 01:35 PM',
      profile: '/path/to/jordan-profile.png'
    },
    {
      sl_no: 3,
      identifier_type: 'Ring Number',
      identifier: '253425',
      primary: 'No',
      user: 'Jordan Stevenson',
      date: '14 Jan 2024 | 10:35 PM',
      profile: '/path/to/jordan-profile.png'
    }
  ]

  return (
    <Box sx={{ py: '24px' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '24px' }}>
        <Box>
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: 20,
              letterSpacing: 0,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            Local Identifiers (3)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: '8px' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
              borderRadius: '4px',
              padding: '0 8px',
              height: '40px'
            }}
          >
            <Icon icon='mi:search' color={theme.palette.customColors.neutralSecondary} />
            <TextField
              variant='outlined'
              placeholder='Search...'
              onChange={e => {
                setSearchValue(e.target.value)
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  border: 'none',
                  borderRadius: '90px',
                  padding: '0',
                  '& fieldset': {
                    border: 'none'
                  }
                }
              }}
            />
          </Box>
          <Button sx={{ height: '38px' }} variant='contained'>
            <Icon icon='mdi:plus' /> Add Identifier
          </Button>
        </Box>
      </Box>
      <Box>
        <StickyTable
          rows={rows}
          pageSizeOptions={[5, 10, 25, 50]}
          rowsInView={10}
          rowsInViewOptions={[5, 10, 25]}
          columns={columns}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          // rowHeight={127.5}
          headerHeight={50}
          pagination={true}
          downloadExcel
          searchMode='server'
          disableColumnSorting={true}
        />
      </Box>
    </Box>
  )
}

export default AnimalIdentifier
