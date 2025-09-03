import {
  Avatar,
  Button,
  Card,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import StickyTable from 'src/views/table/sticky-table'
import Icon from 'src/@core/components/icon'
import { Box, minWidth, width } from '@mui/system'
import AddIdentifierDrawer from 'src/views/pages/housing/animals/AddIdentifierDrawer'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import { deleteAnimalIdentifier, getAnimalIdentifier } from 'src/lib/api/housing'
import Utility from 'src/utility'
import Search from 'src/views/utility/Search'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import { getAnimalGetconfigs } from 'src/lib/api/egg/egg/createAnimal'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import Toaster from 'src/components/Toaster'

const AnimalIdentifier = () => {
  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query

  const [searchValue, setSearchValue] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 })
  const [addIdentifierDrawer, setAddIdentifierDrawer] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [identifierData, setIdentifierData] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [restoreLoading, setRestoreLoading] = useState(false)
  const [localIdentifierTypeData, setLocalIdentifierTypeData] = useState([])
  const [menuAnchorEl, setMenuAnchorEl] = useState(null)
  const [selectedRow, setSelectedRow] = useState(null)
  const [selectedItemToDelete, setSelectedItemToDelete] = useState(null)

  useEffect(() => {
    const getLocalIdentifierTypeData = async () => {
      try {
        await getAnimalGetconfigs().then(res => {
          if (res?.success) {
            setLocalIdentifierTypeData(
              res?.data?.animal_indetifier.map(item => ({
                label: item?.label,
                value: item?.id
              }))
            )
          }
        })
      } catch (error) {
        console.log(error)
      }
    }

    getLocalIdentifierTypeData()
  }, [])

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['animal-identifier', id],
    queryFn: () =>
      getAnimalIdentifier({
        animal_id: id
      }),
    enabled: !!id
  })

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = data?.data?.map((row, index) => ({
    ...row,
    sl: getSlNo(index)
  }))

  const columns = [
    {
      field: 'sl',
      headerName: 'SL NO',
      minWidth: 50,
      width: 100,
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
          {params.row.sl}
        </Typography>
      )
    },
    {
      field: 'identifier_type',
      headerName: 'LOCAL IDENTIFIER TYPE',
      width: 250,
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* <Avatar
            variant='rounded'
            sx={{
              width: 40,
              height: 40,
              borderRadius: '8px',
              backgroundColor: theme.palette.customColors.displaybgPrimary
            }}
          >
            <Icon icon='mdi:tag-outline' />
          </Avatar> */}
          <Tooltip title={params.row.local_identifier_name}>
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
              {params.row.local_identifier_name}
            </Typography>
          </Tooltip>
        </Box>
      )
    },
    {
      field: 'identifier',
      headerName: 'LOCAL IDENTIFIER',
      width: 200,
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
            {params.row.local_identifier_value ? params.row.local_identifier_value : 'NA'}
          </Typography>
        </Tooltip>
      )
    },
    {
      field: 'is_primary',
      headerName: 'PRIMARY',
      width: 200,
      align: 'left',
      headerAlign: 'left',
      sortable: false,
      renderCell: params => {
        const isPrimary = params.row.is_primary === 1 || params.row.is_primary === '1'

        return (
          <Tooltip title={isPrimary ? 'Primary' : 'Not Primary'}>
            <Typography
              sx={{
                fontWeight: 500,
                fontSize: 16,
                color: isPrimary ? theme.palette.primary.dark : theme.palette.customColors.OnSurfaceVariant,
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden'
              }}
            >
              {isPrimary ? 'True' : 'False'}
            </Typography>
          </Tooltip>
        )
      }
    },
    {
      minWidth: 20,
      width: 160,
      field: 'created_at',
      headerName: 'Created Date',
      sortable: false,
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {Utility.formatDisplayDate(params.row.created_at)}
        </Typography>
      )
    },
    {
      minWidth: 20,
      width: 160,
      field: 'modified_at',
      headerName: 'Updated Date',
      sortable: false,
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {Utility.formatDisplayDate(params.row.modified_at)}
        </Typography>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      headerAlign: 'right',
      minWidth: 20,
      width: 140,
      sortable: false,
      align: 'right',
      renderCell: params => (
        <>
          <IconButton
            size='small'
            aria-controls={menuAnchorEl ? 'identifier-menu' : undefined}
            aria-haspopup='true'
            onClick={event => {
              setMenuAnchorEl(event.currentTarget)
              setSelectedRow(params.row)
            }}
          >
            <Icon icon='mdi:dots-vertical' />
          </IconButton>
        </>
      )
    }
  ]

  const handleAddIdentifierDrawer = () => {
    setAddIdentifierDrawer(true)
    setIdentifierData(null)
  }

  const onDeleteDialogClose = () => {
    setOpenDeleteDialog(false)
    setSelectedItemToDelete(null)
  }

  const handleDelete = async id => {
    const params = {
      identifier_id: selectedItemToDelete?.id,
      type: 'delete'
    }
    try {
      setDeleteLoading(true)
      await deleteAnimalIdentifier(params).then(res => {
        if (res?.success === true) {
          setDeleteLoading(false)
          setOpenDeleteDialog(false)
          Toaster({ type: 'success', message: res?.message })
          refetch()
        } else {
          Toaster({ type: 'error', message: res?.message })
          setOpenDeleteDialog(false)
          setDeleteLoading(false)
        }
      })
    } catch (error) {
      console.error(error, 'Cannot delete the Identifier')
      setDeleteLoading(false)
    }
  }

  const handleRestore = async selectedRow => {
    const params = {
      identifier_id: selectedRow?.id,
      type: 'restore'
    }
    try {
      setRestoreLoading(true)
      await deleteAnimalIdentifier(params).then(res => {
        if (res?.success === true) {
          Toaster({ type: 'success', message: res?.message })
          setRestoreLoading(false)
          setMenuAnchorEl(false)
          refetch()
        } else {
          Toaster({ type: 'error', message: res?.message })
        }
      })
    } catch (error) {
      console.error(error, 'Cannot resore the Identifier')
      setRestoreLoading(false)
      setMenuAnchorEl(false)
    }
  }

  const getRowClassName = params => {
    if (params.row.is_deleted === '1') {
      return 'deleted-row'
    }

    return ''
  }

  return (
    <Box sx={{ py: '24px' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          mb: '24px',
          flexWrap: 'wrap'
        }}
      >
        <Typography
          sx={{
            fontWeight: 500,
            fontSize: 20,
            letterSpacing: 0,
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          Local Identifiers {data?.data?.length ? `(${data?.data?.length})` : ''}
        </Typography>
        <Box sx={{ display: 'flex', columnGap: '8px', rowGap: '12px', flexWrap: 'wrap' }}>
          <Box sx={{ display: 'none' }}>
            <Search value={searchValue} onChange={e => setSearchValue(e.target.value)} />
          </Box>
          <Button onClick={handleAddIdentifierDrawer} sx={{ height: '38px', padding: '8px' }} variant='contained'>
            <Icon icon='mdi:plus' /> Add Identifier
          </Button>
        </Box>
      </Box>
      <Box>
        {/* <StickyTable
          rows={indexedRows}
          pageSizeOptions={[5, 10, 25, 50]}
          rowsInView={10}
          loading={isLoading}
          rowsInViewOptions={[5, 10, 25]}
          columns={columns}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          headerHeight={50}
          pagination={false}
          downloadExcel
          searchMode='server'
          disableColumnSorting={true}
        /> */}
        <CommonTable
          indexedRows={indexedRows}
          columns={columns}
          loading={isLoading}
          getRowClassName={getRowClassName}
          total={indexedRows?.length}
          externalTableStyle={{
            '& .deleted-row': {
              backgroundColor: '#ffebee',
              '&:hover': {
                backgroundColor: '#ffcdd2 !important'
              }
            },
            '& .primary-row': {
              backgroundColor: '#e3f2fd',
              '&:hover': {
                backgroundColor: '#bbdefb !important'
              }
            }
          }}
        />
      </Box>
      {addIdentifierDrawer && (
        <AddIdentifierDrawer
          open={addIdentifierDrawer}
          setOpen={setAddIdentifierDrawer}
          identifierData={identifierData}
          animalId={id}
          localIdentifierTypeData={localIdentifierTypeData}
          setIdentifierData={setIdentifierData}
          refetch={refetch}
        />
      )}
      {openDeleteDialog && (
        <ConfirmationDialog
          dialogBoxStatus={openDeleteDialog}
          onClose={onDeleteDialogClose}
          title={'Are your sure you want to delete this local identifier?'}
          cancelText={'NO'}
          confirmBtnStyle={{ background: theme.palette.customColors.Error, py: 2 }}
          image={'/images/warning-icon.svg'}
          imgStyle={{ background: theme.palette.customColors.TertiaryLight, p: 4 }}
          confirmAction={handleDelete}
          loading={deleteLoading}
        />
      )}
      <Menu
        id='identifier-menu'
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
        PaperProps={{
          sx: {
            border: '1px solid #37BD69',
            borderRadius: 2,
            minWidth: 120,
            boxShadow: 2,
            px: 1
          }
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
      >
        <MenuItem
          sx={{
            display: 'none'
          }}
        >
          View Details
        </MenuItem>
        {selectedRow?.is_deleted === '1' ? (
          <MenuItem
            onClick={() => handleRestore(selectedRow)}
            sx={{
              fontWeight: 500,
              p: 3,
              fontSize: '16px',
              color: theme.palette.customColors.OnSurfaceVariant
            }}
            disabled={restoreLoading}
          >
            {restoreLoading ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  minHeight: '24px'
                }}
              >
                <CircularProgress size={24} sx={{ color: theme.palette.primary.main }} />
              </Box>
            ) : (
              'Restore Identifier'
            )}
          </MenuItem>
        ) : (
          // Show edit and delete options for active identifiers
          <>
            <MenuItem
              onClick={() => {
                setAddIdentifierDrawer(true)
                setIdentifierData(selectedRow)
                setMenuAnchorEl(null)
              }}
              sx={{
                fontWeight: 500,
                p: 3,
                fontSize: '16px',
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              Edit Identifier
            </MenuItem>
            <MenuItem
              onClick={() => {
                setOpenDeleteDialog(true)
                setSelectedItemToDelete(selectedRow)
                setMenuAnchorEl(null)
              }}
              sx={{
                fontWeight: 500,
                p: 3,
                fontSize: '16px',
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              Delete Identifier
            </MenuItem>
          </>
        )}
      </Menu>
    </Box>
  )
}

export default AnimalIdentifier
