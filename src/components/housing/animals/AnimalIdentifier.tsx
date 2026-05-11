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
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import useSafeRouter from 'src/hooks/useSafeRouter'
import { deleteAnimalIdentifier, getAnimalIdentifier } from 'src/lib/api/housing'
import Utility from 'src/utility'
import Search from 'src/views/utility/Search'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import { getAnimalGetconfigs } from 'src/lib/api/egg/egg/createAnimal'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import Toaster from 'src/components/Toaster'
import { AnimalIdentifier as AnimalIdentifierType, IdentifierType, IndexedIdentifierRow } from 'src/types/housing'
import { GridRenderCellParams, GridRowParams } from '@mui/x-data-grid'
import { useTranslation } from 'react-i18next'

interface PaginationModel {
  page: number
  pageSize: number
}

interface IdentifierApiResponse {
  success?: boolean
  data?: AnimalIdentifierType[]
  message?: string
}

interface IdentifierDataForDrawer {
  id?: string
  type?: string
  local_identifier_value?: string
  is_primary?: string
  images?: (string | File)[]
}

interface LocalIdentifierTypeOption {
  label: string
  value: string
}

interface AnimalIdentifierProps {
  animalId?: number | string
}

const AnimalIdentifier: React.FC<AnimalIdentifierProps> = ({ animalId: propAnimalId }) => {
  const theme = useTheme() as any
  const router = useSafeRouter()
  const { id } = router.query
  const { t } = useTranslation()

  const [searchValue, setSearchValue] = useState<string>('')
  const [paginationModel, setPaginationModel] = useState<PaginationModel>({ page: 0, pageSize: 25 })
  const [addIdentifierDrawer, setAddIdentifierDrawer] = useState<boolean>(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false)
  const [identifierData, setIdentifierData] = useState<IdentifierDataForDrawer | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false)
  const [restoreLoading, setRestoreLoading] = useState<boolean>(false)
  const [localIdentifierTypeData, setLocalIdentifierTypeData] = useState<LocalIdentifierTypeOption[]>([])
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null)
  const [selectedRow, setSelectedRow] = useState<IndexedIdentifierRow | null>(null)
  const [selectedItemToDelete, setSelectedItemToDelete] = useState<IndexedIdentifierRow | null>(null)

  useEffect(() => {
    const getLocalIdentifierTypeData = async (): Promise<void> => {
      try {
        await getAnimalGetconfigs().then((res: any) => {
          if (res?.success) {
            setLocalIdentifierTypeData(
              res?.data?.animal_indetifier.map((item: any) => ({
                label: t(item?.string_id || '', { defaultValue: item?.label }),
                value: String(item?.id || '')
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

  const animalId = propAnimalId != null ? String(propAnimalId) : (Array.isArray(id) ? id[0] : id)

  const { data, isLoading, refetch }: UseQueryResult<IdentifierApiResponse, Error> = useQuery({
    queryKey: ['animal-identifier', animalId],
    queryFn: () =>
      getAnimalIdentifier({
        animal_id: animalId as string
      }),
    enabled: !!animalId
  })

  const getSlNo = (index: number): number => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows: IndexedIdentifierRow[] | undefined = data?.data?.map(
    (row: AnimalIdentifierType, index: number) => ({
      ...row,
      sl: getSlNo(index)
    })
  )

  const columns = [
    {
      field: 'sl',
      headerName: t('s_no'),
      minWidth: 50,
      width: 100,
      align: 'center' as const,
      headerAlign: 'center' as const,
      sortable: false,
      renderCell: (params: GridRenderCellParams<IndexedIdentifierRow>) => (
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
      headerName: t('animals_module.local_identifier_type'),
      width: 250,
      sortable: false,
      renderCell: (params: GridRenderCellParams<IndexedIdentifierRow>) => (
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
      headerName: t('animals_module.local_identifier'),
      width: 200,
      sortable: false,
      renderCell: (params: GridRenderCellParams<IndexedIdentifierRow>) => (
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
      headerName: t('animals_module.primary'),
      width: 200,
      align: 'left' as const,
      headerAlign: 'left' as const,
      sortable: false,
      renderCell: (params: GridRenderCellParams<IndexedIdentifierRow>) => {
        const isPrimary = params.row.is_primary === 1 || params.row.is_primary === '1'

        return (
          <Tooltip title={isPrimary ? t('animals_module.primary') : t('animals_module.not_primary')}>
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
              {isPrimary ? t('animals_module.true') : t('animals_module.false')}
            </Typography>
          </Tooltip>
        )
      }
    },
    {
      minWidth: 20,
      width: 160,
      field: 'created_at',
      headerName: t('animals_module.created_date'),
      sortable: false,
      renderCell: (params: GridRenderCellParams<IndexedIdentifierRow>) => (
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
      headerName: t('animals_module.updated_date'),
      sortable: false,
      renderCell: (params: GridRenderCellParams<IndexedIdentifierRow>) => (
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
      headerName: t('actions'),
      headerAlign: 'right' as const,
      flex: 1,
      minWidth: 140,
      sortable: false,
      align: 'right' as const,
      renderCell: (params: GridRenderCellParams<IndexedIdentifierRow>) => (
        <>
          <IconButton
            size='small'
            aria-controls={menuAnchorEl ? 'identifier-menu' : undefined}
            aria-haspopup='true'
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
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

  const handleAddIdentifierDrawer = (): void => {
    setAddIdentifierDrawer(true)
    setIdentifierData(null)
  }

  const onDeleteDialogClose = (): void => {
    setOpenDeleteDialog(false)
    setSelectedItemToDelete(null)
  }

  const handleDelete = async (): Promise<void> => {
    if (!selectedItemToDelete?.id) return

    const params = {
      identifier_id: selectedItemToDelete.id,
      type: 'delete' as const
    }
    try {
      setDeleteLoading(true)
      await deleteAnimalIdentifier(params).then((res: any) => {
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

  const handleRestore = async (selectedRow: IndexedIdentifierRow): Promise<void> => {
    if (!selectedRow?.id) return

    const params = {
      identifier_id: selectedRow.id,
      type: 'restore' as const
    }
    try {
      setRestoreLoading(true)
      await deleteAnimalIdentifier(params).then((res: any) => {
        if (res?.success === true) {
          Toaster({ type: 'success', message: res?.message })
          setRestoreLoading(false)
          setMenuAnchorEl(null)
          refetch()
        } else {
          Toaster({ type: 'error', message: res?.message })
        }
      })
    } catch (error) {
      console.error(error, 'Cannot resore the Identifier')
      setRestoreLoading(false)
      setMenuAnchorEl(null)
    }
  }

  const getRowClassName = (params: GridRowParams<IndexedIdentifierRow>): string => {
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
          {t('animals_module.local_identifiers')} {data?.data?.length ? `(${data?.data?.length})` : ''}
        </Typography>
        <Box sx={{ display: 'flex', columnGap: '8px', rowGap: '12px', flexWrap: 'wrap' }}>
          <Box sx={{ display: 'none' }}>
            <Search
              value={searchValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchValue(e.target.value)}
            />
          </Box>
          <Button onClick={handleAddIdentifierDrawer} sx={{ height: '38px', padding: '8px' }} variant='contained'>
            <Icon icon='mdi:plus' /> {t('animals_module.add_identifier')}
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
              backgroundColor: theme.palette.customColors?.ErrorContainer,
              '&:hover': {
                backgroundColor: `${theme.palette.customColors?.AntzTertiary} !important`
              }
            },
            '& .primary-row': {
              backgroundColor: theme.palette.customColors?.SecondaryContainer,
              '&:hover': {
                backgroundColor: `${theme.palette.customColors?.antzSecondaryBg} !important`
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
          animalId={animalId || ''}
          localIdentifierTypeData={localIdentifierTypeData}
          setIdentifierData={setIdentifierData}
          refetch={refetch}
        />
      )}
      {openDeleteDialog && (
        <ConfirmationDialog
          dialogBoxStatus={openDeleteDialog}
          onClose={onDeleteDialogClose}
          title={t('animals_module.are_you_sure_you_want_to_delete_this_local_identifier')}
          cancelText={t('no')}
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
            border: `1px solid ${theme.palette.primary.main}`,
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
        {selectedRow?.is_deleted === '1' && (
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
              t('animals_module.restore_identifier')
            )}
          </MenuItem>
        )}
        {selectedRow?.is_deleted !== '1' && (
          <MenuItem
            onClick={() => {
              setAddIdentifierDrawer(true)
              if (selectedRow) {
                setIdentifierData({
                  id: String(selectedRow.id),
                  type: selectedRow?.type ? String(selectedRow?.type) : undefined,
                  local_identifier_value: selectedRow.local_identifier_value,
                  is_primary: selectedRow.is_primary ? String(selectedRow.is_primary) : undefined
                })
              }
              setMenuAnchorEl(null)
            }}
            sx={{
              fontWeight: 500,
              p: 3,
              fontSize: '16px',
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            {t('animals_module.edit_identifier')}
          </MenuItem>
        )}
        {selectedRow?.is_deleted !== '1' && (
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
            {t('animals_module.delete_identifier')}
          </MenuItem>
        )}
      </Menu>
    </Box>
  )
}

export default AnimalIdentifier
