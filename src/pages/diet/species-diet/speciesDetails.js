import { LoadingButton, TabContext, TabList, TabPanel } from '@mui/lab'
import {
  Avatar,
  Button,
  Chip,
  CircularProgress,
  Drawer,
  IconButton,
  LinearProgress,
  Switch,
  Tab,
  Tooltip,
  Typography
} from '@mui/material'
import { Box } from '@mui/system'
import React, { useEffect, useRef, useState, useContext } from 'react'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import {
  getSpecieDetailById,
  speciesAttachmentActive,
  speciesAttachmentRemoveById,
  speciesAttachmentUpload
} from 'src/lib/api/diet/speciesDiet'
import { AuthContext } from 'src/context/AuthContext'
import Toaster from 'src/components/Toaster'
import Utility from 'src/utility'
import moment from 'moment'
import UploadDiet from './uploadDiet'

function SpeciesDetails({ speciesDetailsDrawer, setSpeciesDetailsDrawer, speciesId, setspeciesId, fetchTableData }) {
  const theme = useTheme()
  const fileInputRef = useRef(null)

  const authData = useContext(AuthContext)
  const dietModule = authData?.userData?.roles?.settings?.diet_module
  const dietModuleAccess = authData?.userData?.roles?.settings?.diet_module_access

  const [detailsLoader, setDetailsLoader] = useState(true)
  const [specieDetails, setSpecieDetails] = useState({})
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const [uploadingFileName, setUploadingFileName] = useState('')

  const [status, setStatus] = useState('1')

  const [uploadDietDrawer, setUploadDietDrawer] = useState(false) // has to be modified
  const [speciesData, setSpeciesData] = useState({})

  const [dietAttachmentActiveConfirm, setDietAttachmentActiveConfirm] = useState(false)
  const [dietAttachmentUploadConfirm, setDietAttachmentUploadConfirm] = useState(false)
  const [dietAttachmentId, setDietAttachmentId] = useState(null)

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
        // const res = await speciesAttachmentRemoveById(attachment_id)
        const res = await speciesAttachmentActive({
          status: '0',
          species_id: `${speciesId}`,
          attachment_id: `${attachment_id}`
        })
        Toaster({ type: 'success', message: res.message || 'Attachment removed successfully' })
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
        Toaster({ type: 'success', message: 'Diet has been set as the primary diet successfully' })

        // Toaster({ type: 'success', message: res.message || 'Diet has been set as the primary diet successfully' })
        await fetchTableData()
        await getSpecieDetail()
      } catch (error) {
        Toaster({ type: 'error', message: 'Failed to set as the primary diet' })

        // Toaster({ type: 'error', message: error.message || 'Failed to set as the primary diet' })
      } finally {
        setDetailsLoader(false)
        setDietAttachmentActiveConfirm(false)
      }
    }
  }

  const handleFileUpload = async (event, speciesId) => {
    const file = event?.target?.files[0]

    const allowedTypes = [
      'application/pdf'

      // 'image/jpeg',
      // 'image/png',
      // 'image/gif',
      // 'application/msword',
      // 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      // 'application/vnd.ms-excel',
      // 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // 'text/csv'
    ]
    if (!file || !allowedTypes.includes(file.type)) {
      Toaster({ type: 'error', message: 'Please select a valid file.' })

      return
    }
    setUploadingFileName(file.name)
    setUploadingAttachment(true)

    try {
      const res = await speciesAttachmentUpload({ species_id: speciesId, attachment: file })
      Toaster({ type: 'success', message: res.message })
      fetchTableData()
      getSpecieDetail()
    } catch (error) {
      Toaster({ type: 'error', message: error.message || 'File upload failed.' })
    } finally {
      event.target.value = null
      setDietAttachmentUploadConfirm(false)
      setUploadingAttachment(false)
      setUploadingFileName('')
    }
  }

  ////////////////////////////////////////////////////////////

  const SpeciesDietCard = ({ default_icon, common_name, scientific_name, active_attachments_count }) => (
    <Box
      sx={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        border: '1px solid #C3CEC7',
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
          border: '1px solid #C3CEC7',
          borderRadius: '50%',
          background: '#E8F4F2',
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

  const SpeciesDietUploadingCard = () => (
    <Box sx={{}}>
      <Box
        sx={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          border: '1px solid #C3CEC7',
          display: 'flex',
          gap: 1,
          padding: '20px 16px'
        }}
      >
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Avatar
              variant='rounded'
              alt='Medicine Image'
              sx={{
                width: 48,
                height: 48,
                background: '#E8F4F2',
                overflow: 'hidden'
              }}
            >
              <img style={{ width: '100%', height: '100%' }} src={'/icons/files_green.png'} alt='Profile' />
            </Avatar>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Typography
                sx={{
                  color: theme.palette.primary.light,
                  fontSize: '16px',
                  fontWeight: '500',
                  lineHeight: '19.36px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: 240
                }}
              >
                Uploading
              </Typography>
              <Typography
                sx={{
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontSize: '14px',
                  fontWeight: '400',
                  lineHeight: '16.94px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: 240
                }}
              >
                {uploadingFileName}
              </Typography>
              <LinearProgress value={50} />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )

  const DietAttachedCard = ({ item }) => {
    return (
      <Box>
        <Box
          sx={{
            boxShadow: '0px 2px 2px 0px #0000001A',
            backgroundColor: '#fff',
            borderRadius: '8px',
            display: 'flex',
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
                  background: '#FFD3D34D',
                  overflow: 'hidden'
                }}
              >
                <img style={{ width: '100%', height: '100%' }} src={'/icons/pdf_Icon2.svg'} alt='Profile' />
              </Avatar>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
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
                        width: 240
                      }}
                    >
                      {item?.file_original_name}
                    </Typography>
                  </Tooltip>

                  {/* <Box sx={{ backgroundColor: '#0000000D', padding: '5px 8px', borderRadius: '4px' }}>
                    <Typography
                      sx={{ color: '#00000066', fontSize: '12px', fontWeight: '5040', lineHeight: '14.52px' }}
                    >
                      {Number(item?.file_size) >= 1048576
                        ? (item?.file_size / (1024 * 1024)).toFixed(2) + ' MB'
                        : (item?.file_size / 1024).toFixed(2) + ' KB'}
                    </Typography>
                  </Box> */}
                </Box>
                <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Avatar
                    variant='rounded'
                    alt='dietitian_by_profile'
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: '#E8F4F2',
                      overflow: 'hidden'
                    }}
                  >
                    {item?.dietitian_by_profile ? (
                      <img style={{ width: '100%', height: '100%' }} src={item?.dietitian_by_profile} alt='Profile' />
                    ) : (
                      <Icon icon='mdi:user' />
                    )}
                  </Avatar>

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
                        whiteSpace: 'nowrap',
                        maxWidth: 100
                      }}
                    >
                      {item?.dietitian_name ? item?.dietitian_name : '-'}
                    </Typography>
                  </Tooltip>

                  {/* <Tooltip title={item?.attached_by ? item?.attached_by : '-'}> */}
                  <Typography
                    sx={{
                      color: theme.palette.customColors.Outline,
                      fontSize: '14px',
                      fontWeight: '500',
                      lineHeight: '100%',
                      letterSpacing: '0.1px'

                      // overflow: 'hidden',
                      // textOverflow: 'ellipsis',
                      // whiteSpace: 'nowrap',
                      // maxWidth: 100
                    }}
                  >
                    &#8226; Dietitian
                  </Typography>
                  {/* </Tooltip> */}
                </Box>
                {item?.notes && (
                  <Typography
                    sx={{
                      color: theme.palette.customColors.OnSurfaceVariant,
                      fontSize: '14px',
                      fontWeight: '400',
                      lineHeight: '20px',
                      letterSpacing: '0%'
                    }}
                  >
                    {item?.notes}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                    •&nbsp; {moment(Utility.convertUTCToLocalDate(item.created_at)).format('DD MMM YYYY')}
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
                    •&nbsp; {Utility.convertUTCToLocaltime(item.created_at)}
                  </Typography>
                </Box>
              </Box>
            </Box>
            {(dietModuleAccess === 'EDIT' || dietModuleAccess === 'DELETE') && (
              <Box>
                <Switch
                  onClick={e => {
                    e.stopPropagation()
                    removeAttachment(speciesId, item?.attachment_id)
                  }}
                  defaultChecked
                />
              </Box>
            )}
          </Box>
        </Box>
        {/* <Typography sx={{ color: '#00000066', fontSize: '12px', fontWeight: '5040', lineHeight: '14.52px' }}>
          {Number(item?.file_size) >= 1048576
            ? (item?.file_size / (1024 * 1024)).toFixed(2) + ' MB'
            : (item?.file_size / 1024).toFixed(2) + ' KB'}
        </Typography> */}
      </Box>
    )
  }

  const DietDetachedCard = ({ item }) => (
    <Box
      sx={{
        backgroundColor: '#DAE7DF',
        borderRadius: '8px',

        // alignItems: 'center',
        boxShadow: '0px 2px 2px 0px #0000001A',
        justifyContent: 'space-between',
        display: 'flex',
        gap: 1,
        cursor: 'pointer',
        padding: '20px 16px'
      }}
      onClick={() => {
        window.open(item.file, '_blank')
      }}
    >
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '8px' }}>
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'start', gap: '8px' }}>
          <Avatar
            variant='rounded'
            alt='Medicine Image'
            sx={{
              pt: '6px',
              width: 48,
              height: 48,
              background: '#FFD3D34D',
              overflow: 'hidden'
            }}
          >
            <img style={{ width: '100%', height: '100%' }} src={'/icons/pdf_Icon2.svg'} alt='Profile' />
          </Avatar>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
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
                    width: 240
                  }}
                >
                  {item?.file_original_name}
                </Typography>
              </Tooltip>

              {/* <Box sx={{ backgroundColor: '#0000000D', padding: '5px 8px', borderRadius: '4px' }}>
                    <Typography
                      sx={{ color: '#00000066', fontSize: '12px', fontWeight: '5040', lineHeight: '14.52px' }}
                    >
                      {Number(item?.file_size) >= 1048576
                        ? (item?.file_size / (1024 * 1024)).toFixed(2) + ' MB'
                        : (item?.file_size / 1024).toFixed(2) + ' KB'}
                    </Typography>
                  </Box> */}
            </Box>
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Avatar
                variant='rounded'
                alt='dietitian_by_profile'
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: '#E8F4F2',
                  overflow: 'hidden'
                }}
              >
                {item?.dietitian_by_profile ? (
                  <img style={{ width: '100%', height: '100%' }} src={item?.dietitian_by_profile} alt='Profile' />
                ) : (
                  <Icon icon='mdi:user' />
                )}
              </Avatar>

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
                    whiteSpace: 'nowrap',
                    maxWidth: 100
                  }}
                >
                  {item?.dietitian_name ? item?.dietitian_name : '-'}
                </Typography>
              </Tooltip>

              {/* <Tooltip title={item?.attached_by ? item?.attached_by : '-'}> */}
              <Typography
                sx={{
                  color: theme.palette.customColors.Outline,
                  fontSize: '14px',
                  fontWeight: '500',
                  lineHeight: '100%',
                  letterSpacing: '0.1px'

                  // overflow: 'hidden',
                  // textOverflow: 'ellipsis',
                  // whiteSpace: 'nowrap',
                  // maxWidth: 100
                }}
              >
                &#8226; Dietitian
              </Typography>
              {/* </Tooltip> */}
            </Box>
            {item?.notes && (
              <Typography
                sx={{
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontSize: '14px',
                  fontWeight: '400',
                  lineHeight: '20px',
                  letterSpacing: '0%'
                }}
              >
                {item?.notes}
              </Typography>
            )}
            <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
              <Tooltip title={item?.detached_by ? item?.detached_by : '-'}>
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
                  {item?.detached_by}
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
                •&nbsp; {moment(Utility.convertUTCToLocalDate(item.created_at)).format('DD MMM YYYY')}
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
                •&nbsp; {Utility.convertUTCToLocaltime(item.created_at)}
              </Typography>
            </Box>
          </Box>
        </Box>
        {(dietModuleAccess === 'EDIT' || dietModuleAccess === 'DELETE') && (
          <Box>
            <Switch
              onClick={e => {
                e.stopPropagation()
                setDietAttachmentId(item.attachment_id)

                // if (Number(specieDetails.active_attachments_count) === 0) {
                //   speciesAttachmentActiveFunc(speciesId, dietAttachmentId)
                // } else {
                //   setDietAttachmentActiveConfirm(true)
                // }
                speciesAttachmentActiveFunc(speciesId, dietAttachmentId)
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  )

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
          {/* <Icon icon='mage:filter' fontSize={30} /> */}
          <Avatar
            variant='rounded'
            alt='Medicine Image'
            sx={{
              width: 32,
              height: 32,
              background: '#E8F4F2',
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
          gap: 6
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
                  label={<TabBadge label={`Active Diets - ${specieDetails?.active_attachments?.length}`} />}
                />
                <Tab
                  sx={{ flex: 1 }}
                  value='0'
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
                    <DietAttachedCard index={index} item={item} />
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
                    <DietDetachedCard index={index} item={item} />
                  ))}
                </Box>
              </TabPanel>
            </TabContext>
            {/* <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3
              }}
            >
              {specieDetails?.active_attachments_count > 0 && (
                <Typography
                  sx={{
                    fontSize: 20,
                    fontWeight: 500,
                    color: theme.palette.customColors.OnSurfaceVariant,
                    lineHeight: '24.2px'
                  }}
                >
                  Primary diet{specieDetails.active_attachments_count > 1 && `s`}{' '}
                  {specieDetails.active_attachments_count > 1 && `(${specieDetails.active_attachments_count})`}
                </Typography>
              )}
              {uploadingAttachment && specieDetails?.active_attachments_count > 0 && <SpeciesDietUploadingCard />}
              {specieDetails?.active_attachments?.map((item, index) => (
                <DietAttachedCard index={index} item={item} />
              ))}
            </Box>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3
              }}
            >
              {specieDetails?.deactive_attachments_count > 0 && (
                <Typography sx={{ fontSize: 20, fontWeight: 500, color: '#E93353', lineHeight: '24.2px' }}>
                  Additional diet ({specieDetails.deactive_attachments_count})
                </Typography>
              )}
              {specieDetails?.deactive_attachments?.map((item, index) => (
                <DietDetachedCard index={index} item={item} />
              ))}
            </Box> */}
          </>
        )}
      </Box>
      {/* bottom buttons */}
      {(dietModuleAccess === 'ADD' || dietModuleAccess === 'EDIT' || dietModuleAccess === 'DELETE') && (
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
            sx={{ height: '58px', width: '514px' }}
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

          {/* <input
          type='file'
          multiple
          accept='application/pdf, image/*, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv'
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={e => {
            handleFileUpload(e, speciesId)
          }}
        /> */}
        </Box>
      )}

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

      {/* ///////////////////////////dietAttachmentActiveConfirm////////////////////////////////// */}
      {/* <Drawer
        anchor='bottom'
        open={dietAttachmentActiveConfirm}
        sx={{
          '& .MuiDrawer-paper': {
            width: 562, // Set a fixed width
            marginLeft: 'auto', // Push it to the right
            right: 0 // Ensure it aligns to the right
          },
          height: '248px',
          '& .css-e1dg5m-MuiCardContent-root': {
            pt: 0
          }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px', py: '16px' }}>
          <Box
            className='sidebar-header'
            sx={{
              px: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#fff',
              borderBottom: '1px solid #C3CEC7'
            }}
          >
            <Box sx={{ my: '16px', display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
              <Typography sx={{ fontSize: '24px', fontWeight: 500 }}>Activate diet</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <IconButton
                size='small'
                sx={{ color: 'text.primary' }}
                onClick={() => {
                  setDietAttachmentActiveConfirm(false)
                }}
              >
                <Icon icon='mdi:close' fontSize={24} />
              </IconButton>
            </Box>
          </Box>

          <Typography
            sx={{
              px: '16px',
              color: theme.palette.formContent.tertiary,
              fontSize: '16px',
              fontWeight: 500,
              lineHeight: '19.36px',
              letterSpacing: '0.1px',
              textAlign: 'center'
            }}
          >
            Activating this diet will deactivate the current primary diet for this species. You can still edit this
            later.
          </Typography>

          <LoadingButton
            fullWidth
            variant='contained'
            size='large'
            sx={{ mx: '24px', height: '58px', width: '514px' }}
            onClick={() => {
              speciesAttachmentActiveFunc(speciesId, dietAttachmentId)
            }}
            loading={detailsLoader}
          >
            CONFIRM
          </LoadingButton>
        </Box>
      </Drawer> */}
      {/* ////////////////////////dietAttachmentUploadConfirm///////////////////////////////////// */}
      {/* <Drawer
        anchor='bottom'
        open={dietAttachmentUploadConfirm}
        sx={{
          '& .MuiDrawer-paper': {
            width: 562, // Set a fixed width
            marginLeft: 'auto', // Push it to the right
            right: 0 // Ensure it aligns to the right
          },
          height: '248px',
          '& .css-e1dg5m-MuiCardContent-root': {
            pt: 0
          }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px', py: '16px' }}>
          <Box
            className='sidebar-header'
            sx={{
              px: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#fff',
              borderBottom: '1px solid #C3CEC7'
            }}
          >
            <Box sx={{ my: '16px', display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
              <Typography sx={{ fontSize: '24px', fontWeight: 500 }}>Upload new diet</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <IconButton
                size='small'
                sx={{ color: 'text.primary' }}
                onClick={() => {
                  setDietAttachmentUploadConfirm(false)
                }}
              >
                <Icon icon='mdi:close' fontSize={24} />
              </IconButton>
            </Box>
          </Box>

          <Typography
            sx={{
              px: '16px',
              color: theme.palette.formContent.tertiary,
              fontSize: '16px',
              fontWeight: 500,
              lineHeight: '19.36px',
              letterSpacing: '0.1px',
              textAlign: 'center'
            }}
          >
            New upload will become the primary diet for this species. You can still edit this later.
          </Typography>

          <LoadingButton
            fullWidth
            variant='contained'
            size='large'
            sx={{ mx: '24px', height: '58px', width: '514px' }}
            onClick={() => {
              // speciesAttachmentActiveFunc(speciesId, dietAttachmentId)
              fileInputRef.current.click()
            }}
            loading={detailsLoader || uploadingAttachment}
          >
            CONTINUE
          </LoadingButton>
        </Box>
      </Drawer> */}
    </Drawer>
  )
}

export default SpeciesDetails
