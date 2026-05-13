import React, { useEffect, useState } from 'react'
import { Box, Typography, Button, IconButton, Switch, TextField, Avatar, Tooltip, Skeleton } from '@mui/material'
import { Icon } from '@iconify/react'
import { useTheme } from '@mui/material/styles'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import { styled } from '@mui/material/styles'
import UploadAnimalDiet from './UploadAnimalDiet'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import { getAnimalDietList } from 'src/lib/api/housing'
import { useParams } from 'next/navigation'
import NoDataFound from 'src/views/utility/NoDataFound'
import Utility from 'src/utility'
import moment from 'moment'
import { AnimalOverview } from 'src/types/housing'
import { useTranslation } from 'react-i18next'

interface DietAttachment {
  ref_id: number
  file: string
  file_original_name: string
  // Dietitian info (shown in card header)
  dietitian_name?: string
  dietitian_by_profile?: string
  dietitian_role_name?: string
  // Attached/Detached info (shown in footer)
  attached_by?: string
  detached_by?: string
  created_at?: string
  // Legacy fields (fallback)
  attached_by_profile?: string
  incident_date?: string
  notes?: string
  isActive?: boolean
}

interface AnimalDietProps {
  animalDetails: AnimalOverview & { taxonomyId?: string | number; taxonomy_id?: string | number }
  animalId?: number | string
}

const GreenSwitch = styled(Switch)(({ theme }) => ({
  width: 45.5,
  height: 28,
  padding: 0,
  borderRadius: '20px',
  display: 'flex',
  '&:active .MuiSwitch-thumb': {
    width: 21
  },
  '& .MuiSwitch-switchBase': {
    padding: 3,
    '&.Mui-checked': {
      transform: 'translateX(18px)',
      color: theme.palette.primary.contrastText,
      '& + .MuiSwitch-track': {
        backgroundColor: theme.palette.primary.main,
        opacity: 1
      }
    }
  },
  '& .MuiSwitch-thumb': {
    boxShadow: '0 2px 4px 0 rgb(0 0 0 / 20%)',
    width: 22,
    height: 22,
    borderRadius: '50%',
    backgroundColor: theme.palette.primary.contrastText
  },
  '& .MuiSwitch-track': {
    borderRadius: 26 / 2,
    backgroundColor: '#ccc',
    opacity: 1,
    transition: theme.transitions.create(['background-color'], {
      duration: 500
    })
  }
}))

const AnimalDiet: React.FC<AnimalDietProps> = ({ animalDetails, animalId: propAnimalId }) => {
  const theme = useTheme() as any
  const { t } = useTranslation()
  const { id: animalid } = useParams<{ id: string }>() ?? {}

  const [selectedTab, setSelectedTab] = useState<'active' | 'inactive'>('active')
  const [animalId, setAnimalId] = useState<string | string[] | undefined | null>(propAnimalId != null ? String(propAnimalId) : animalid)

  const [dietListLoader, setDietListLoader] = useState<boolean>(false)
  const [activeDietData, setActiveDietData] = useState<DietAttachment[]>([])
  const [inActiveDietData, setInActiveDietData] = useState<DietAttachment[]>([])
  const [activeDietCount, setActiveDietCount] = useState<number>(0)
  const [inActiveDietCount, setInActiveDietCount] = useState<number>(0)

  const [dietStates, setDietStates] = useState<boolean[]>(
    (selectedTab === 'active' ? activeDietData : inActiveDietData).map(d => d.isActive ?? false)
  )

  const [uploadAnimalDietDrawer, setUploadAnimalDietDrawer] = useState<boolean>(false) // or 'inactive'
  const [searchValue, setSearchValue] = useState<string>('')
  const [deleteDietDialog, setDeleteDietDialog] = useState<boolean>(false)
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false)
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState<boolean>(false)
  const [deactivateLoading, setDeactivateLoading] = useState<boolean>(false)
  const [pendingDeactivateIndex, setPendingDeactivateIndex] = useState<number | null>(null)

  const animalDietList = async (): Promise<void> => {
    // API requires species_id (taxonomy_id) as path param and animal_id as query param
    const speciesId = animalDetails?.taxonomyId || animalDetails?.taxonomy_id
    if (!speciesId) return
    try {
      setDietListLoader(true)
      const res = await getAnimalDietList(speciesId, Array.isArray(animalId) ? animalId[0] : animalId || undefined)
      if (res.success) {
        setActiveDietData((res?.data?.active_attachments || []) as unknown as DietAttachment[])
        setInActiveDietData((res?.data?.deactive_attachments || []) as unknown as DietAttachment[])
        setActiveDietCount(res?.data?.active_attachments_count || 0)
        setInActiveDietCount(res?.data?.deactive_attachments_count || 0)
      }
    } catch (error) {
    } finally {
      setDietListLoader(false)
    }
  }

  useEffect(() => {
    animalDietList()
  }, [animalId, animalDetails?.taxonomyId, animalDetails?.taxonomy_id])

  // Download helper that works for cross-origin + auth cookies
  const handleDownload = async (url: string | undefined, originalName: string | undefined): Promise<void> => {
    if (!url) return
    const fallbackOpen = (): Window | null => window.open(url, '_blank', 'noopener,noreferrer')

    try {
      const response = await fetch(url, { credentials: 'include' })
      if (!response.ok) return fallbackOpen() as any
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl

      // keep original name if provided; otherwise try to infer from url
      const fileName = originalName || url.split('/')?.pop() || 'document.pdf'
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    } catch (e) {
      fallbackOpen()
    }
  }

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header */}
          <Typography
            sx={{
              mt: 4,
              fontWeight: 500,
              fontSize: 20,
              letterSpacing: 0,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            {t('animals_module.diet_attached')} {`(${selectedTab === 'active' ? activeDietCount : inActiveDietCount})`}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', rowGap: 4, flexWrap: 'wrap' }}>
            {/* Tabs */}
            <Box sx={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Button
                onClick={() => setSelectedTab('active')}
                variant={selectedTab === 'active' ? 'contained' : 'text'}
                sx={{
                  fontSize: 14,
                  fontWeight: 500,
                  letterSpacing: '0.1px',
                  color:
                    selectedTab === 'active'
                      ? theme.palette.primary.contrastText
                      : theme.palette.customColors.OnSurfaceVariant,
                  backgroundColor:
                    selectedTab === 'active'
                      ? theme.palette.customColors.OnPrimaryContainer
                      : theme.palette.customColors.displaybgSecondary,
                  '&:hover': {
                    backgroundColor:
                      selectedTab === 'active'
                        ? theme.palette.customColors.OnPrimaryContainer
                        : theme.palette.customColors.displaybgSecondary
                  }
                }}
              >
                {t('animals_module.active_diets')} - {activeDietCount}
              </Button>

              <Button
                onClick={() => setSelectedTab('inactive')}
                variant={selectedTab === 'inactive' ? 'contained' : 'text'}
                sx={{
                  fontSize: 14,
                  fontWeight: 500,
                  letterSpacing: '0.1px',
                  color:
                    selectedTab === 'inactive'
                      ? theme.palette.primary.contrastText
                      : theme.palette.customColors.OnSurfaceVariant,
                  backgroundColor:
                    selectedTab === 'inactive'
                      ? theme.palette.customColors.OnPrimaryContainer
                      : theme.palette.customColors.displaybgSecondary,
                  '&:hover': {
                    backgroundColor:
                      selectedTab === 'inactive'
                        ? theme.palette.customColors.OnPrimaryContainer
                        : theme.palette.customColors.displaybgSecondary
                  }
                }}
              >
                {t('animals_module.inactive_diets')} - {inActiveDietCount}
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: '8px' }}>
              {/* <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                  borderRadius: '8px',
                  padding: '0 8px',
                  height: '40px'
                }}
              >
                <Icon fontSize={24} icon='mi:search' color={theme.palette.customColors.neutralSecondary} />
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
              </Box> */}
              {/* <Button onClick={() => setUploadAnimalDietDrawer(true)} sx={{ height: '38px' }} variant='contained'>
                <Icon icon='mdi:plus' /> Upload
              </Button> */}
            </Box>
          </Box>
        </Box>

        {/* Diet Card */}
        {dietListLoader ? (
          <Skeleton
            variant='rounded'
            sx={{ borderRadius: '8px', minHeight: '160px', maxHeight: '240px' }}
            height={118}
          />
        ) : activeDietData?.length || inActiveDietData?.length ? (
          (selectedTab === 'active' ? activeDietData : inActiveDietData).map((diet, index) => (
            <Box
              key={diet.ref_id}
              sx={{
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: selectedTab === 'active' ? 'transparent' : theme.palette.customColors.mdAntzNeutral,
                border: `1px solid ${
                  selectedTab === 'active' ? theme.palette.customColors.OutlineVariant : 'transparent' // or use a light transparent color
                }`,
                borderRadius: '8px',
                gap: '24px',
                p: '16px'

                // mb: 3
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 4,
                  flexWrap: 'wrap'
                }}
              >
                <Box sx={{ maxWidth: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Box
                    sx={{
                      backgroundColor: theme.palette.customColors?.ErrorContainer,
                      p: 1,
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Tooltip title={t('animals_module.click_to_download')}>
                      <Avatar
                        variant='rounded'
                        alt='Diet PDF'
                        onClick={() => handleDownload(diet?.file, diet?.file_original_name)}
                        sx={{
                          pt: '6px',
                          width: 48,
                          height: 48,
                          background: theme.palette.customColors.avatarBackground,
                          overflow: 'hidden',
                          cursor: diet?.file ? 'pointer' : 'default'
                        }}
                      >
                        <img style={{ width: '100%', height: '100%' }} src={'/icons/pdf_icon2.svg'} alt='pdf' />
                      </Avatar>
                    </Tooltip>
                  </Box>

                  <Box
                    sx={{ minWidth: '100px', maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '6px' }}
                  >
                    <Tooltip title={diet.file_original_name}>
                      <Typography
                        sx={{
                          fontSize: 16,
                          fontWeight: 500,
                          letterSpacing: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          wordBreak: 'break-word',
                          color: theme.palette.customColors.OnSurfaceVariant,
                          cursor: diet?.file ? 'pointer' : 'default',
                          textDecoration: 'none'
                        }}
                      >
                        {diet.file_original_name}
                      </Typography>
                    </Tooltip>
                    {/* Dietitian info - matching mobile */}
                    {diet.dietitian_name && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {diet.dietitian_by_profile ? (
                          <Avatar src={diet.dietitian_by_profile} sx={{ width: 20, height: 20 }} />
                        ) : (
                          <Icon
                            icon='mdi:account-circle'
                            width={20}
                            height={20}
                            color={theme.palette.customColors?.neutralSecondary}
                          />
                        )}
                        <Tooltip
                          title={`${diet.dietitian_name} • ${
                            diet.dietitian_role_name || t('animals_module.dietitian')
                          }`}
                        >
                          <Typography
                            sx={{
                              fontSize: 14,
                              fontWeight: 400,
                              letterSpacing: 0,
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              color: theme.palette.customColors.OnSurfaceVariant
                            }}
                          >
                            {diet.dietitian_name} • {diet.dietitian_role_name || t('animals_module.dietitian')}
                          </Typography>
                        </Tooltip>
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Right: User Info (Added by / Detached by) */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 400,
                      color: theme.palette.customColors?.neutralSecondary || theme.palette.text.secondary
                    }}
                  >
                    {diet.attached_by
                      ? t('animals_module.added_by')
                      : diet.detached_by
                      ? t('animals_module.detached_by')
                      : ''}
                  </Typography>
                  <UserAvatarDetails
                    profile_image={diet.dietitian_by_profile || diet.attached_by_profile}
                    user_name={diet.attached_by || diet.detached_by || ''}
                    date={diet.created_at || diet.incident_date}
                    show_time={true}
                    size='medium'
                    text_color={theme.palette.customColors?.OnSurfaceVariant}
                  />
                  {/* <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <GreenSwitch
                      checked={selectedTab === 'active'}
                      // checked={diet.isActive}
                      onChange={() => {
                        if (diet.isActive) {
                          // About to turn OFF, so ask for confirmation
                          setPendingDeactivateIndex(index)
                          setDeactivateDialogOpen(true)
                        } else {
                          // Turning ON directly
                          if (selectedTab === 'active') {
                            const updated = [...activeDietData]
                            updated[index].isActive = true
                            setActiveDietData(updated)
                          } else {
                            const updated = [...inActiveDietData]
                            updated[index].isActive = true
                            setInActiveDietData(updated)
                          }
                        }
                      }}
                    />
                    <IconButton sx={{ padding: 0 }} onClick={() => setDeleteDietDialog(true)}>
                      <Icon icon='mdi:trash-can-outline' color={theme.palette.customColors.OnSurfaceVariant} />
                    </IconButton>
                  </Box> */}
                </Box>
              </Box>
              {diet?.notes && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    backgroundColor:
                      selectedTab === 'active'
                        ? theme.palette.customColors.antzNotesLight
                        : theme.palette.customColors.mdAntzNeutral,
                    borderRadius: 1,
                    p: '12px'
                  }}
                >
                  <Typography sx={{ fontSize: 12, fontWeight: 400, color: theme.palette.customColors.neutralPrimary }}>
                    {t('notes')}:
                  </Typography>
                  <Typography
                    sx={{ fontSize: 14, color: theme.palette.customColors.OnTertiaryContainer, fontWeight: 400 }}
                  >
                    {diet.notes}
                  </Typography>
                </Box>
              )}
            </Box>
          ))
        ) : (
          <NoDataFound />
        )}
        <UploadAnimalDiet
          animalId={animalId}
          setAnimalId={setAnimalId}
          uploadAnimalDietDrawer={uploadAnimalDietDrawer}
          setUploadAnimalDietDrawer={setUploadAnimalDietDrawer}
        />
      </Box>
      {deleteDietDialog && (
        <ConfirmationDialog
          dialogBoxStatus={deleteDietDialog}
          onClose={() => setDeleteDietDialog(false)}
          title={t('animals_module.delete_diet_pdf')}
          cancelText={t('cancel')}
          confirmBtnStyle={{ background: theme.palette.customColors.Error, py: 2 }}
          image={'/images/warning-icon.svg'}
          imgStyle={{ background: theme.palette.customColors.TertiaryLight, p: 4 }}
          confirmAction={() => {}}
          loading={deleteLoading}
          ConfirmationText={t('delete')}
          description={t('animals_module.are_you_sure_you_want_to_permanently_delete_this_file')}
        />
      )}
      {/* {deactivateDialogOpen && (
        <ConfirmationDialog
          dialogBoxStatus={deactivateDialogOpen}
          onClose={() => setDeactivateDialogOpen(false)}
          title={'This action will make the diet PDF inactive'}
          description={'Are you sure you want to permanently delete this file?'}
          cancelText={'CANCEL'}
          cancelBtnStyle={{ borderColor: theme.palette.primary.main }}
          ConfirmationText={'YES, CONTINUE'}
          confirmAction={() => {}}
          confirmBtnStyle={{ background: theme.palette.primary.main, py: 2 }}
          image={'/images/warning-icon.svg'}
          imgStyle={{ background: theme.palette.customColors.TertiaryLight, p: 4 }}
          loading={deactivateLoading}
        />
      )} */}
      <ConfirmationDialog
        dialogBoxStatus={deactivateDialogOpen}
        onClose={() => {
          setDeactivateDialogOpen(false)
          setPendingDeactivateIndex(null)
        }}
        title={t('animals_module.this_action_will_make_the_diet_pdf_inactive')}
        description={t('animals_module.are_you_sure_you_want_to_make_this_diet_inactive')}
        cancelText={t('cancel')}
        ConfirmationText={t('animals_module.yes_continue')}
        confirmAction={() => {
          if (pendingDeactivateIndex !== null) {
            if (selectedTab === 'active') {
              const updated = [...activeDietData]
              updated[pendingDeactivateIndex].isActive = false
              setActiveDietData(updated)
            } else {
              const updated = [...inActiveDietData]
              updated[pendingDeactivateIndex].isActive = false
              setInActiveDietData(updated)
            }
          }
          setDeactivateDialogOpen(false)
          setPendingDeactivateIndex(null)
        }}
        cancelBtnStyle={{ borderColor: theme.palette.primary.main, color: theme.palette.primary.main }}
        confirmBtnStyle={{ background: theme.palette.primary.main, py: 2 }}
        image={'/images/warning-icon.svg'}
        imgStyle={{ background: theme.palette.customColors.TertiaryLight, p: 4 }}
        loading={deactivateLoading}
      />
    </>
  )
}

export default AnimalDiet
