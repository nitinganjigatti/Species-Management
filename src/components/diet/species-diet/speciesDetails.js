import { LoadingButton, TabContext, TabList, TabPanel } from '@mui/lab'
import { Avatar, CircularProgress, Drawer, IconButton, Switch, Tab, Tooltip, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React, { useEffect, useRef, useState } from 'react'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import { getSpecieDetailById, speciesAttachmentActive } from 'src/lib/api/diet/speciesDiet'
import Toaster from 'src/components/Toaster'
import Utility from 'src/utility'
import moment from 'moment'
import UploadDiet from './uploadDiet'

function SpeciesDetails({ speciesDetailsDrawer, setSpeciesDetailsDrawer, speciesId, setspeciesId, fetchTableData }) {
  const theme = useTheme()
  const fileInputRef = useRef(null)

  const [detailsLoader, setDetailsLoader] = useState(true)
  const [specieDetails, setSpecieDetails] = useState({})

  const [status, setStatus] = useState('1')

  const [uploadDietDrawer, setUploadDietDrawer] = useState(false) // has to be modified
  const [speciesData, setSpeciesData] = useState({})

  const getSpecieDetail = async () => {
    setDetailsLoader(true)
    try {
      const res = await getSpecieDetailById(speciesId)
      setSpecieDetails(res.data.data)
    } catch (error) {
      Toaster({ type: 'error', message: error.message || 'Failed to fetch data' })
    } finally {
      setDetailsLoader(false)
    }
  }

  useEffect(() => {
    if (speciesDetailsDrawer) {
      getSpecieDetail()
    }
  }, [speciesDetailsDrawer])

  const removeAttachment = async (speciesId, attachment_id) => {
    if (attachment_id) {
      setDetailsLoader(true)
      try {
        const res = await speciesAttachmentActive({
          status: '0',
          species_id: `${speciesId}`,
          attachment_id: `${attachment_id}`
        })
        // Toaster({ type: 'success', message: res.message || 'Attachment removed successfully' })
        Toaster({ type: 'success', message: 'Diet Deactivated Successfully' })
        await fetchTableData()
        await getSpecieDetail()
      } catch (error) {
        Toaster({ type: 'error', message: error.message || 'Failed to remove attachment' })
      } finally {
        setDetailsLoader(false)
      }
    }
  }

  const speciesAttachmentActiveFunc = async (speciesId, attachmentId) => {
    if (speciesId && attachmentId) {
      setDetailsLoader(true)
      try {
        const res = await speciesAttachmentActive({
          status: '1',
          species_id: `${speciesId}`,
          attachment_id: `${attachmentId}`
        })
        // Toaster({ type: 'success', message: 'Diet has been set as the primary diet successfully' })
        Toaster({ type: 'success', message: 'Diet Activated Successfully' })
        await fetchTableData()
        await getSpecieDetail()
      } catch (error) {
        Toaster({ type: 'error', message: 'Failed to set as the primary diet' })
      } finally {
        setDetailsLoader(false)
      }
    }
  }
  const DietitianAvatar = ({ item }) => {
    const [imgError, setImgError] = useState(false)

    const imageUrl = item?.dietitian_by_profile

    return imageUrl && !imgError ? (
      <Avatar
        variant='rounded'
        alt='Profile'
        sx={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: theme.palette.customColors.displaybgPrimary,
          overflow: 'hidden'
        }}
      >
        <img src={imageUrl} alt='Profile' style={{ width: '100%', height: '100%' }} onError={() => setImgError(true)} />
      </Avatar>
    ) : (
      <Avatar
        variant='rounded'
        sx={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: theme.palette.customColors.displaybgPrimary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Icon icon='mdi:user' />
      </Avatar>
    )
  }

  //////////////////-Cards-//////////////////////////////////////////

  const SpeciesDietCard = ({ default_icon, common_name, scientific_name, active_attachments_count }) => (
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
      <Avatar
        variant='rounded'
        alt='Medicine Image'
        sx={{
          width: 35,
          height: 35,
          border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
          borderRadius: '50%',
          background: theme.palette.customColors.displaybgPrimary,
          overflow: 'hidden'
        }}
      >
        {default_icon ? (
          <img style={{ width: '100%', height: '100%' }} src={default_icon} alt='Profile' />
        ) : (
          <Icon icon='mdi:user' />
        )}
      </Avatar>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <Tooltip title={scientific_name ? scientific_name : '-'}>
          <Typography
            sx={{
              color: theme.palette.primary.light,
              fontSize: '16px',
              fontWeight: '500',
              lineHeight: '19.36px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 360
            }}
          >
            {scientific_name ? scientific_name : '-'}
          </Typography>
        </Tooltip>
        <Tooltip title={common_name ? common_name : '-'}>
          <Typography
            sx={{
              color: theme.palette.primary.light,
              fontStyle: 'italic',
              fontSize: '14px',
              fontWeight: '400',
              lineHeight: '16.94px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 360
            }}
          >
            {common_name ? common_name : '-'}
          </Typography>
        </Tooltip>
      </Box>
    </Box>
  )

  const DietCard = ({ item, type }) => {
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
                  background: theme.palette.customColors.avatarBackground,
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
                        // minWidth: 150
                      }}
                    >
                      {item?.file_original_name}
                    </Typography>
                  </Tooltip>
                  <Switch
                    sx={{ marginLeft: -85 }}
                    onClick={e => {
                      e.stopPropagation()
                      if (type === 'attach') {
                        removeAttachment(speciesId, item?.attachment_id)
                      } else {
                        speciesAttachmentActiveFunc(speciesId, item.attachment_id)
                      }
                    }}
                    defaultChecked={type === 'attach' ? true : false}
                  />
                </Box>
                <Box
                  sx={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    mb: '6px',
                    maxWidth: '400px'
                  }}
                >
                  <DietitianAvatar item={item} />

                  <Tooltip title={item?.dietitian_name ? item?.dietitian_name : '-'}>
                    <Typography
                      sx={{
                        color: theme.palette.customColors.OnSurfaceVariant,
                        fontSize: '14px',
                        fontWeight: '500',
                        lineHeight: '100%',
                        letterSpacing: '0.1px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                        // maxWidth: 100
                      }}
                    >
                      {item?.dietitian_name ? item?.dietitian_name : '-'}
                    </Typography>
                  </Tooltip>

                  <Typography
                    sx={{
                      color: theme.palette.customColors.Outline,
                      fontSize: '14px',
                      fontWeight: '500',
                      lineHeight: '100%',
                      letterSpacing: '0.1px',
                      display: 'flex'
                    }}
                  >
                    <span style={{ margin: '0px 6px' }}>&#8226;</span> <span>Dietitian</span>
                  </Typography>
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
                {/* ///////////////////////////////////////// */}
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

  const handleChange = (event, newValue) => {
    setStatus(newValue)
  }
  const TabBadge = ({ label }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
      {label}
    </div>
  )

  return (
    <Drawer
      anchor='right'
      open={speciesDetailsDrawer}
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
          <Typography sx={{ fontSize: '24px', fontWeight: 500 }}>Species Details</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <IconButton
            size='small'
            sx={{ color: 'text.primary' }}
            onClick={() => {
              setspeciesId(null)
              setSpeciesDetailsDrawer(false)
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
            {SpeciesDietCard(specieDetails)}
            <TabContext sx={{ width: '100%' }} value={status}>
              <TabList
                sx={{ width: '100%', borderBottom: `1px solid ${theme.palette.customColors.Outline}` }}
                onChange={handleChange}
              >
                <Tab
                  sx={{ flex: 1 }}
                  value='1'
                  style={{ fontSize: 12 }}
                  label={<TabBadge label={`Active Diets - ${specieDetails?.active_attachments?.length}`} />}
                />
                <Tab
                  sx={{ flex: 1 }}
                  value='0'
                  style={{ fontSize: 12 }}
                  label={<TabBadge label={`Inactive Diets - ${specieDetails?.deactive_attachments?.length}`} />}
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
                  {specieDetails?.active_attachments?.map((item, index) => (
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
                  {specieDetails?.deactive_attachments?.map((item, index) => (
                    <DietCard key={index} item={item} type={'deAttach'} />
                  ))}
                </Box>
              </TabPanel>
            </TabContext>
          </>
        )}
      </Box>
      {/* bottom buttons */}
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
            const scientific_name = specieDetails.scientific_name
            const common_name = specieDetails.common_name
            const default_icon = specieDetails.default_icon
            setSpeciesData({ default_icon, scientific_name, common_name })
            setspeciesId(specieDetails.species_id)
            setUploadDietDrawer(true)
          }}
          // loading={loader}
        >
          UPLOAD NEW
        </LoadingButton>

        <UploadDiet
          fetchTableData={fetchTableData}
          getSpecieDetail={getSpecieDetail}
          speciesId={speciesId}
          speciesData={speciesData}
          setspeciesId={setspeciesId}
          fileInputRef={fileInputRef}
          uploadDietDrawer={uploadDietDrawer}
          setUploadDietDrawer={setUploadDietDrawer}
          speciesDetailsDrawer={speciesDetailsDrawer}
        />
      </Box>
    </Drawer>
  )
}

export default SpeciesDetails
