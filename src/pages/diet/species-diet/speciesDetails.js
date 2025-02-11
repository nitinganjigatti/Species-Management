import { LoadingButton } from '@mui/lab'
import { Avatar, CircularProgress, Drawer, IconButton, LinearProgress, Tooltip, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React, { useEffect, useRef, useState } from 'react'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import { getSpecieDetailById, speciesAttachmentRemoveById, speciesAttachmentUpload } from 'src/lib/api/diet/speciesDiet'
import Toaster from 'src/components/Toaster'
import moment from 'moment'
import Utility from 'src/utility'

function SpeciesDetails({ speciesDetailsDrawer, setSpeciesDetailsDrawer, speciesId, setspeciesId, fetchTableData }) {
  const theme = useTheme()
  const fileInputRef = useRef(null)

  const [detailsLoader, setDetailsLoader] = useState(true)
  const [specieDetails, setSpecieDetails] = useState({})
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const [uploadingFileName, setUploadingFileName] = useState('')

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

  const removeAttachment = async attachment_id => {
    // console.log(attachment_id)
    if (attachment_id) {
      setDetailsLoader(true)
      try {
        const res = await speciesAttachmentRemoveById(attachment_id)
        Toaster({ type: 'success', message: res.message || 'Attachment removed successfully' })
        fetchTableData()
        getSpecieDetail()
      } catch (error) {
        Toaster({ type: 'error', message: error.message || 'Failed to remove attachment' })
      } finally {
        setDetailsLoader(false)
      }
    }
  }

  const handleFileUpload = async (event, speciesId) => {
    const file = event?.target?.files[0]

    if (!file || file.type !== 'application/pdf') {
      Toaster({ type: 'error', message: 'Please select a valid PDF file.' })
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
      setUploadingAttachment(false)
      setUploadingFileName('')
    }
  }
  ////////////////////////////////////////////////////////////

  const SpeciesDietCard = ({ default_icon, common_name, scientific_name, active_attachments_count }) => (
    <Box
      sx={{
        width: '100%'
      }}
    >
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
                width: 35,
                height: 35,
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
        </Box>
        <Box
          sx={{
            backgroundColor: theme.palette.customColors.tableHeaderBg,
            borderRadius: '4px',
            width: '64px',
            height: '24px',
            p: '3px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1
          }}
        >
          <Typography
            sx={{ color: theme.palette.primary.light, fontSize: '16px', fontWeight: '600', lineHeight: '19.36px' }}
          >
            {active_attachments_count}
          </Typography>
          <Typography
            sx={{ color: theme.palette.primary.light, fontSize: '14px', fontWeight: '400', lineHeight: '16.94px' }}
          >
            Deits
          </Typography>
        </Box>
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
            backgroundColor: '#fff',
            borderRadius: '8px',
            border: '1px solid #C3CEC7',
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
                  width: 48,
                  height: 48,
                  background: '#FFD3D34D',
                  overflow: 'hidden'
                }}
              >
                <img style={{ width: '100%', height: '100%' }} src={'/icons/pdf_Icon.png'} alt='Profile' />
              </Avatar>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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

                  <Box sx={{ backgroundColor: '#0000000D', padding: '5px 8px', borderRadius: '4px' }}>
                    <Typography
                      sx={{ color: '#00000066', fontSize: '12px', fontWeight: '5040', lineHeight: '14.52px' }}
                    >
                      {Number(item?.file_size) >= 1048576
                        ? (item?.file_size / (1024 * 1024)).toFixed(2) + ' MB'
                        : (item?.file_size / 1024).toFixed(2) + ' KB'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Avatar
                    variant='rounded'
                    alt='Medicine Image'
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      background: '#E8F4F2',
                      overflow: 'hidden'
                    }}
                  >
                    {item?.attached_by_profile ? (
                      <img style={{ width: '100%', height: '100%' }} src={item?.attached_by_profile} alt='Profile' />
                    ) : (
                      <Icon icon='mdi:user' />
                    )}
                  </Avatar>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <Tooltip title={item?.attached_by ? item?.attached_by : '-'}>
                      <Typography
                        sx={{
                          color: theme.palette.primary.light,
                          fontSize: '14px',
                          fontWeight: '500',
                          lineHeight: '16.96px',
                          letterSpacing: '0.1px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          width: 240
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
                        whiteSpace: 'nowrap',
                        width: 240
                      }}
                    >
                      {Utility.convertUTCToLocalDate(item.created_at) +
                        ' | ' +
                        Utility.convertUTCToLocaltime(item.created_at)}{' '}
                      {/* which time wll be use here modified or created? */}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
            <Box>
              <Icon
                onClick={e => {
                  e.stopPropagation()
                  removeAttachment(item?.attachment_id)
                }}
                icon='akar-icons:cross'
                style={{ cursor: 'pointer' }}
                fontSize={20}
                color={'#839D8D'}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    )
  }

  const DietDetachedCard = ({ item }) => (
    <Box>
      <Box
        sx={{
          backgroundColor: '#DAE7DF',
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
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Avatar
            variant='rounded'
            alt='Medicine Image'
            sx={{
              width: 48,
              height: 48,
              background: '#0000000D',
              overflow: 'hidden'
            }}
          >
            <img style={{ width: '100%', height: '100%' }} src={'/icons/pdf_Icon.png'} alt='Profile' />
          </Avatar>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
              <Tooltip title={item.file_original_name ? item.file_original_name : '-'}>
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
                  {item.file_original_name}
                </Typography>
              </Tooltip>

              <Box sx={{ backgroundColor: '#0000000D', padding: '5px 8px', borderRadius: '4px' }}>
                <Typography sx={{ color: '#00000066', fontSize: '12px', fontWeight: '5040', lineHeight: '14.52px' }}>
                  {Number(item?.file_size) >= 1048576
                    ? (item?.file_size / (1024 * 1024)).toFixed(2) + ' MB'
                    : (item?.file_size / 1024).toFixed(2) + ' KB'}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: '8px', alignItems: 'end' }}>
              <Typography
                sx={{
                  color: '#E93353',
                  fontSize: '12px',
                  fontWeight: 400,
                  lineHeight: '14.52px',
                  mr: 1
                }}
              >
                Detached by
              </Typography>
              <Typography
                sx={{
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontSize: '14px',
                  fontWeight: 500,
                  lineHeight: '16.96px',
                  letterSpacing: '0.1px'
                }}
              >
                {item.detached_by}
              </Typography>
              <Typography
                sx={{
                  color: theme.palette.customColors.neutralSecondary,
                  fontSize: '12px',
                  fontWeight: 400,
                  lineHeight: '14.52px'
                }}
              >
                {Utility.convertUTCToLocalDate(item.modified_at) +
                  ' | ' +
                  Utility.convertUTCToLocaltime(item.modified_at)}{' '}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
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
            <Box
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
                  Diets attached ({specieDetails.active_attachments_count})
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
                  Diets detached ({specieDetails.deactive_attachments_count})
                </Typography>
              )}
              {specieDetails?.deactive_attachments?.map((item, index) => (
                <DietDetachedCard index={index} item={item} />
              ))}
            </Box>
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
          sx={{ height: '58px', width: '514px' }}
          onClick={() => {
            fileInputRef.current.click()
          }}
          // loading={loader}
        >
          UPLOAD NEW
        </LoadingButton>
        <input
          type='file'
          multiple
          accept='application/pdf'
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={e => {
            handleFileUpload(e, speciesId)
          }}
        />
      </Box>
    </Drawer>
  )
}

export default SpeciesDetails
