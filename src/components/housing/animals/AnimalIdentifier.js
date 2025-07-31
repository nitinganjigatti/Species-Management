import { Avatar, Button, Card, IconButton, Menu, MenuItem, TextField, Tooltip, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import StickyTable from 'src/views/table/sticky-table'
import Icon from 'src/@core/components/icon'
import { Box } from '@mui/system'
import AddIdentifierDrawer from 'src/views/pages/housing/animals/AddIdentifierDrawer'
import AddIdentifier from './AddIdentifierForm'
import DialogConfirmationDialog from 'src/views/utility/DeleteConfirmationDialog'

const AnimalIdentifier = () => {
  const theme = useTheme()

  const [searchValue, setSearchValue] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 })
  const [openAddIdentifierDrawer, setOpenAddIdentifierDrawer] = useState(false)

  // Inside your component
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  const [addIdentifierDrawer, setAddIdentifierDrawer] = useState(false)
  const [animalId, setAnimalId] = useState('')

  const [deleteDialog, setDeleteDialog] = useState(false)

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
            letterSpacing: 0,
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
      width: 220,
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
          <Tooltip title={params.row.identifier_type}>
            <Typography
              sx={{
                fontSize: '16px',
                fontWeight: 500,
                letterSpacing: 0,
                color: theme.palette.customColors.OnSurfaceVariant,
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden'
              }}
            >
              {params.row.identifier_type}
            </Typography>
          </Tooltip>
        </Box>
      )
    },
    {
      field: 'identifier',
      headerName: 'LOCAL IDENTIFIER',
      width: 160,
      flex: 0.3,
      sortable: false,
      renderCell: params => (
        <Tooltip title={params.row.identifier}>
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: 16,
              letterSpacing: 0,
              color: theme.palette.customColors.OnSurfaceVariant,
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden'
            }}
          >
            {params.row.identifier}
          </Typography>
        </Tooltip>
      )
    },
    {
      field: 'primary',
      headerName: 'PRIMARY',
      width: 100,
      flex: 0.2,
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <Tooltip title={params.row.primary}>
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: 16,
              color: params.row.primary === 'Yes' ? theme.palette.primary.dark : '',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden'
            }}
          >
            {params.row.primary}
          </Typography>
        </Tooltip>
      )
    },
    {
      field: 'added_by',
      headerName: 'ADDED BY',
      width: 220,
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
                letterSpacing: '0.1px',
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              {params.row.user}
            </Typography>
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: 400,
                letterSpacing: 0,
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
      width: 50,
      flex: 0.5,
      sortable: false,
      renderCell: params => (
        <Box>
          <IconButton size='small' onClick={handleMenuOpen}>
            <Icon color={theme.palette.customColors.OnSurfaceVariant} icon='mdi:dots-vertical' />
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
            <MenuItem onClick={() => {
              setAnimalId('123')
              handleMenuClose()
              setAddIdentifierDrawer(true)
            }}>Edit Identifier</MenuItem>
            <MenuItem onClick={() => {
              setDeleteDialog(true)
              handleMenuClose()
            }}>Delete Identifier</MenuItem>
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: '24px', flexWrap: 'wrap' }}>
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
        <Box sx={{ display: 'flex', columnGap: '8px', rowGap: '12px', flexWrap: 'wrap' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
              borderRadius: '8px',
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
          <Button onClick={() => setAddIdentifierDrawer(true)} sx={{ height: '38px', padding: '8px' }} variant='contained'>
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
          headerHeight={50}
          pagination={true}
          downloadExcel
          searchMode='server'
          disableColumnSorting={true}
        />
      </Box>
      <AddIdentifier
        animalId={animalId}
        addIdentifierDrawer={addIdentifierDrawer}
        setAddIdentifierDrawer={setAddIdentifierDrawer} />
      <DialogConfirmationDialog
        open={deleteDialog}
        message={'Are you sure you want to delete this local identifier?'}
        handleClose={() => setDeleteDialog(false)}
        action={() => setDeleteDialog(false)} />
    </Box>
  )
}

export default AnimalIdentifier
