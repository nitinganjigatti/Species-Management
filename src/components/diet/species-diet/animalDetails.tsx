import React, { useContext, useEffect, useRef, useState } from 'react'

import { Avatar, CircularProgress, Drawer, IconButton, Switch, Tab, Tooltip, Typography } from '@mui/material'
import { LoadingButton, TabContext, TabList, TabPanel } from '@mui/lab'
import { Box } from '@mui/system'
import { useTheme } from '@mui/material/styles'
import moment from 'moment'

import Icon from 'src/@core/components/icon'
import Toaster from 'src/components/Toaster'
import Utility from 'src/utility'
import UploadDiet from './uploadDiet'

import { animalDietAttachmentStatus, getAnimalDetailUploadedDiet } from 'src/lib/api/diet/speciesDiet'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import AnimalCard from 'src/views/utility/AnimalCard'
import { AuthContext } from 'src/context/AuthContext'
import { useTranslation } from 'react-i18next'

interface AnimalDetailsProps {
  animalDetailsDrawer: boolean
  setAnimalDetailsDrawer: (open: boolean) => void
  animalId: any
  setAnimalId: (id: any) => void
  fetchTableData: () => Promise<void>
}

function AnimalDetails({ animalDetailsDrawer, setAnimalDetailsDrawer, animalId, setAnimalId, fetchTableData }: AnimalDetailsProps) {
  const theme = useTheme()
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const authData = useContext(AuthContext) as any
  const dietModuleAccess = authData?.userData?.roles?.settings?.diet_module_access

  const [detailsLoader, setDetailsLoader] = useState<boolean>(true)
  const [animalDetails, setAnimalDetails] = useState<any>({})
  const [status, setStatus] = useState<string>('1')
  const [uploadDietDrawer, setUploadDietDrawer] = useState<boolean>(false)
  const [animalData, setAnimalData] = useState<any>({})

  const getAnimalDetail = async () => {
    setDetailsLoader(true)
    try {
      const res = await getAnimalDetailUploadedDiet(animalId, { uploaded_diet_section: true })
      setAnimalDetails(res?.data || {})
    } catch (error: any) {
      Toaster({ type: 'error', message: error.message || 'Failed to fetch data' })
    } finally {
      setDetailsLoader(false)
    }
  }

  useEffect(() => {
    if (animalDetailsDrawer) {
      getAnimalDetail()
    }
  }, [animalDetailsDrawer])

  const updateAttachmentStatus = async (nextStatus: string, attachmentId: any) => {
    if (!animalId || !attachmentId) return

    setDetailsLoader(true)
    try {
      await animalDietAttachmentStatus({
        status: String(nextStatus),
        animal_id: `${animalId}`,
        attachment_id: `${attachmentId}`
      })

      Toaster({
        type: 'success',
        message: nextStatus === '1' ? 'Diet Activated Successfully' : 'Diet Deactivated Successfully'
      })
      await fetchTableData()
      await getAnimalDetail()
    } catch (error: any) {
      Toaster({ type: 'error', message: error.message || 'Failed to update diet status' })
    } finally {
      setDetailsLoader(false)
    }
  }

  const DietCard = ({ item, type }: { item: any; type: string }) => {
    return (
      <Box>
        <Box
          sx={{
            boxShadow: `0px 2px 2px 0px ${theme.palette.customColors.shadowColor}`,
            backgroundColor:
              type === 'attach' ? theme.palette.primary.contrastText : theme.palette.customColors.customTableBorderBg,
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 1,
            cursor: 'pointer',
            padding: '20px 16px'
          }}
          onClick={() => {
            window.open(item.file, '_blank')
          }}
        >
          <Box
            sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '8px' }}
          >
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'start', gap: '8px' }}>
              <Avatar
                variant='rounded'
                alt='Medicine Image'
                sx={{
                  pt: '6px',
                  width: 48,
                  height: 48,
                  background:
                    type === 'attach'
                      ? theme.palette.customColors.avatarBackground
                      : theme.palette.customColors.mdAntzNeutral,
                  overflow: 'hidden'
                }}
              >
                <img style={{ width: '100%', height: '100%' }} src={'/icons/pdf_icon2.svg'} alt='pdf' />
              </Avatar>

              <Box sx={{ flexGrow: 1, display: 'inline-grid' }}>
                <Box
                  sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px'
                  }}
                >
                  <Tooltip title={item?.file_original_name ? item?.file_original_name : '-'}>
                    <Typography
                      sx={{
                        color: theme.palette.customColors.OnSurfaceVariant,
                        fontSize: '16px',
                        fontWeight: '500',
                        lineHeight: '19.36px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        width: 'calc(100% - 120px)'
                      }}
                    >
                      {item?.file_original_name}
                    </Typography>
                  </Tooltip>
                  <Switch
                    sx={{ marginLeft: -85 }}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation()
                      if (type === 'attach') {
                        updateAttachmentStatus('0', item?.attachment_id)
                      } else {
                        updateAttachmentStatus('1', item?.attachment_id)
                      }
                    }}
                    disabled={dietModuleAccess === 'VIEW' || dietModuleAccess === 'ADD'}
                    defaultChecked={type === 'attach'}
                  />
                </Box>
                <Box
                  sx={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    mb: '6px',
                    maxWidth: item?.dietitian_name?.length && item?.dietitian_name?.length > 20 ? '260px' : 'fit-content'
                  }}
                >
                  <UserAvatarDetails
                    profile_image={item?.dietitian_by_profile}
                    user_name={item?.dietitian_name}
                    size='small'
                  />
                  {item?.dietitian_role_name && (
                    <Typography component='div'
                      sx={{
                        color: theme.palette.customColors.Outline,
                        fontSize: '14px',
                        fontWeight: '500',
                        lineHeight: '100%',
                        letterSpacing: '0.1px',
                        display: 'flex'
                      }}
                    >
                      <span style={{ margin: '0px 8px 0px 0px' }}>&#8226;</span>{' '}
                      <span>{item?.dietitian_role_name}</span>
                    </Typography>
                  )}
                </Box>
                {item?.notes && (
                  <Typography
                    sx={{
                      width: { xs: 'calc(100% - 10px)', sm: '100%' },
                      color: theme.palette.customColors.OnSurfaceVariant,
                      fontSize: '14px',
                      fontWeight: '400',
                      lineHeight: '20px',
                      letterSpacing: '0%',
                      textAlign: 'justify',
                      mb: '6px'
                    }}
                  >
                    {item?.notes}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                  <Typography
                    sx={{
                      color: theme.palette.customColors.Outline,
                      fontSize: '10px',
                      fontWeight: '500',
                      lineHeight: '100%',
                      letterSpacing: '0%'
                    }}
                  >
                    Uploaded by&nbsp; •
                  </Typography>
                  <Tooltip title={item?.attached_by ? item?.attached_by : '-'}>
                    <Typography
                      sx={{
                        color: theme.palette.primary.light,
                        fontSize: '12px',
                        fontWeight: '400',
                        lineHeight: '100%',
                        letterSpacing: '0%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 100
                      }}
                    >
                      {item?.attached_by}
                    </Typography>
                  </Tooltip>
                  <Typography
                    sx={{
                      color: theme.palette.customColors.neutralSecondary,
                      fontSize: '12px',
                      fontWeight: '400',
                      lineHeight: '14.52px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    •&nbsp; {moment(Utility.convertUTCToLocalDate(item.modified_at)).format('DD MMM YYYY')}
                  </Typography>
                  <Typography
                    sx={{
                      color: theme.palette.customColors.neutralSecondary,
                      fontSize: '12px',
                      fontWeight: '400',
                      lineHeight: '14.52px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    •&nbsp; {Utility.convertUTCToLocaltime(item.modified_at)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    )
  }

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setStatus(newValue)
  }

  const TabBadge = ({ label }: { label: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
      {label}
    </div>
  )

  return (
    <Drawer
      anchor='right'
      open={animalDetailsDrawer}
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', 562] },
        height: '100vh',
        '& .css-e1dg5m-MuiCardContent-root': {
          pt: 0
        }
      }}
    >
      <Box
        className='sidebar-header'
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'background.default',
          p: theme => theme.spacing(3, 3.255, 3, 5.255)
        }}
      >
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
          <Avatar
            variant='rounded'
            alt='Medicine Image'
            sx={{
              width: 32,
              height: 32,
              background: theme.palette.customColors.displaybgPrimary,
              overflow: 'hidden'
            }}
          >
            <img style={{ width: '100%', height: '100%' }} src={'/icons/activity_icon.png'} alt='Profile' />
          </Avatar>
          <Typography sx={{ fontSize: '24px', fontWeight: 500 }}>Animal Details</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <IconButton
            size='small'
            sx={{ color: 'text.primary' }}
            onClick={() => {
              setAnimalId(null)
              setAnimalDetailsDrawer(false)
            }}
          >
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>
      </Box>
      <Box
        sx={{
          backgroundColor: 'background.default',
          height: '100%',
          px: 4,
          pt: 4,
          pb: '132px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          maxWidth: '562px'
        }}
      >
        {!!detailsLoader ? (
          <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box
              sx={{
                backgroundColor: theme.palette.primary.contrastText,
                borderRadius: '8px',
                border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                padding: '20px 16px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <AnimalCard data={animalDetails} />
            </Box>
            {/* @ts-ignore */}
            <TabContext sx={{ width: '100%' }} value={status}>
              <TabList
                sx={{ width: '100%', borderBottom: `1px solid ${theme.palette.customColors.Outline}` }}
                onChange={handleChange}
              >
                <Tab
                  sx={{ flex: 1 }}
                  value='1'
                  style={{ fontSize: 12 }}
                  label={
                    <TabBadge
                      label={`${t('diet_module.active_diets')} - ${animalDetails?.active_attachments?.length || 0}`}
                    />
                  }
                />
                <Tab
                  sx={{ flex: 1 }}
                  value='0'
                  style={{ fontSize: 12 }}
                  label={
                    <TabBadge
                      label={`${t('diet_module.in_active_diets')} - ${animalDetails?.deactive_attachments?.length || 0
                        }`}
                    />
                  }
                />
              </TabList>
              <TabPanel value='1'>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3
                  }}
                >
                  {animalDetails?.active_attachments?.map((item: any, index: number) => (
                    <DietCard key={index} item={item} type={'attach'} />
                  ))}
                </Box>
              </TabPanel>
              <TabPanel value='0'>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3
                  }}
                >
                  {animalDetails?.deactive_attachments?.map((item: any, index: number) => (
                    <DietCard key={index} item={item} type={'deAttach'} />
                  ))}
                </Box>
              </TabPanel>
            </TabContext>
          </>
        )}
      </Box>
      {!detailsLoader && (
        <Box
          sx={{
            height: '122px',
            width: '100%',
            maxWidth: '562px',
            position: 'fixed',
            bottom: 0,
            bgcolor: 'white',
            alignItems: 'center',
            justifyContent: 'center',
            display: 'flex',
            boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.2)',
            zIndex: 123
          }}
        >
          <LoadingButton
            fullWidth
            variant='contained'
            size='large'
            sx={{ height: '58px', width: '514px', mx: 4 }}
            onClick={() => {
              const scientific_name = animalDetails.scientific_name
              const common_name = animalDetails.common_name || animalDetails.default_common_name
              const default_icon = animalDetails.default_icon
              setAnimalData({ default_icon, scientific_name, common_name })
              setAnimalId(animalDetails.animal_id)
              setUploadDietDrawer(true)
            }}
            disabled={dietModuleAccess === 'VIEW'}
          >
            {t('upload_new')}
          </LoadingButton>

          <UploadDiet
            fetchTableData={fetchTableData}
            entityType='animal'
            entityId={animalId}
            entityData={animalData}
            setEntityId={setAnimalId}
            getEntityDetail={getAnimalDetail}
            uploadDietDrawer={uploadDietDrawer}
            setUploadDietDrawer={setUploadDietDrawer}
            entityDetailsDrawer={animalDetailsDrawer}
          />
        </Box>
      )}
    </Drawer>
  )
}

export default AnimalDetails
