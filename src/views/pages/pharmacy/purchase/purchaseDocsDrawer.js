import { useTheme } from '@mui/material/styles'
import { Drawer, Box, Typography, IconButton, Paper, Dialog, Button } from '@mui/material'
import React, { useContext, useState } from 'react'
import Icon from 'src/@core/components/icon'
import { AuthContext } from 'src/context/AuthContext'
import Utility from 'src/utility'
import { useRouter } from 'next/router'
import { LoadingButton } from '@mui/lab'
import CloseIcon from '@mui/icons-material/Close'

const PurchaseDocsDrawer = ({
  openDocsDrawer,
  setOpenDocsDrawer,
  invoiceFile,
  fileArr,
  deleteId,
  removeSelectedImage,
  setDeleteId,
  setDeleteLoader,
  deleteLoader,
  confirmDeleteDialog,
  setConfirmDeleteDialog
}) => {
  const commonIconButtonStyle = {
    width: 25,
    height: 25,
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 0,
    padding: 0,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'error.main',
      cursor: 'pointer'
    }
  }
  const [openDialog, setOpenDialog] = useState(false)
  const authData = useContext(AuthContext)
  const [defaultIcon, setDefaultIcon] = useState(authData?.userData?.settings?.DEFAULT_IMAGE_MASTER)

  console.log('invoiceFile', invoiceFile)
  console.log('fileArr', fileArr)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const theme = useTheme()
  const router = useRouter()
  const { id, action, navigatedFrom } = router.query

  const handleOpenDialog = doc => {
    setSelectedDoc(doc)
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedDoc(null)
  }

  const isPDF = title => title?.toLowerCase().endsWith('.pdf')

  // console.log('isPDF', isPDF)

  const handleDelete = (e, index, doc) => {
    setSelectedDoc(doc)
    e.preventDefault()
    e.stopPropagation() // Stop the event from propagating to the <a> tag

    if (id) {
      if (doc?.id) {
        setConfirmDeleteDialog(true)
        setDeleteId(doc?.id)
      } else if (index) {
        removeSelectedImage(e, '', index)
      }
    } else {
      removeSelectedImage(e, '', index)
    }
  }

  const closeButton = (index, doc) => {
    return (
      <>
        <IconButton
          onClick={e => {
            handleDelete(e, index, doc)
          }}
          sx={{ ...commonIconButtonStyle, top: 2, right: 2, borderRadius: 0, padding: 0 }}
        >
          <CloseIcon sx={{ fontSize: 20, borderRadius: 'none !important' }} />
        </IconButton>
      </>
    )
  }

  return (
    <Drawer
      anchor='right'
      open={openDocsDrawer} // Make sure this is a boolean
      onClose={() => setOpenDocsDrawer(false)} // Trigger the close function when the drawer is clicked outside or swipe
      sx={{
        '& .MuiDrawer-paper': {
          width: ['100%', '396px'],
          height: '100vh',

          borderTopLeftRadius: '8px',
          borderBottomLeftRadius: '8px'
        },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'

        // backgroundColor: theme?.palette?.customColors?.lightBg
        // bgcolor: '#EFF5F2'
      }}
    >
      <Box
        sx={{
          backgroundColor: theme?.palette?.customColors?.lightBg,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header  */}
        <Box
          sx={{
            // borderBottom: 1,
            borderColor: '',
            p: '16px',
            display: 'flex',

            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: theme?.palette?.customColors?.lightBg,
            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)'
          }}
        >
          <Typography sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnPrimaryContainer }}>
            Attachments
          </Typography>
          <IconButton onClick={() => setOpenDocsDrawer(false)}>
            <Icon icon='maki:cross' width='15' height='15' color={theme.palette.customColors.OnPrimaryContainer} />
          </IconButton>
        </Box>
        {/* Media card */}

        <Box
          sx={{
            p: '16px',
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            overflowY: 'auto'
          }}
        >
          {invoiceFile?.length > 0 &&
            invoiceFile?.map((doc, index) => (
              <Box
                key={index}
                onClick={e => {
                  if (!isPDF(doc.title || fileArr[index]?.name)) {
                    e.preventDefault() // Prevent default anchor behavior
                    handleOpenDialog(doc, index)
                    setSelectedDoc(doc)
                  }
                }}
              >
                <a
                  href={isPDF(doc.title || fileArr[index]?.name) ? (doc.transcript ? doc.transcript : doc) : '#'}
                  target='_blank'
                  rel='noopener noreferrer'
                  style={{ textDecoration: 'none' }}
                >
                  {/* {console.log(' doc[index]', doc)} */}
                  <Box
                    key={index}
                    elevation={3}
                    sx={{
                      width: '174px',
                      height: '191px',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      borderRadius: '8px',
                      backgroundColor: '#fff' // Light background
                    }}
                  >
                    {/* Close Button */}

                    {closeButton(index, doc)}

                    {/* Icon */}
                    {isPDF(doc.title || fileArr[index]?.name) ? (
                      <Box
                        sx={{
                          m: 2,
                          width: '158px',
                          height: '133px',
                          backgroundColor: defaultIcon?.document?.bg_color,
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <img
                          src={defaultIcon?.document?.image_path ? defaultIcon?.document?.image_path : null}
                          alt={'Docs ICon'}

                          // style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          m: 2,
                          width: '158px',
                          height: '133px',

                          // backgroundColor: defaultIcon?.document?.bg_color,
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <img
                          src={doc.transcript ? doc.transcript : doc}
                          alt={'Docs ICon'}
                          style={{ width: '100%', height: '100%', borderRadius: '8px' }}
                        />
                      </Box>
                    )}

                    {/* Text */}
                    <Box sx={{ marginTop: -1, px: 2, pb: 1 }}>
                      <Typography
                        sx={{
                          fontS: '12px',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '200px'
                        }}
                      >
                        {doc?.title || fileArr[index]?.name}
                      </Typography>
                      <Typography sx={{ fontSize: '12px', fontWeight: 100 }}>
                        {' '}
                        {Utility.formatDisplayDate(Utility.convertUTCToLocal(doc.created_at))} -{' '}
                        {Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(doc.created_at))}
                      </Typography>
                    </Box>
                  </Box>
                </a>
              </Box>
            ))}
        </Box>
      </Box>

      {/* Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth='md'>
        <Box
          sx={{
            width: '100%',
            height: 'auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            backgroundColor: '#f0f0f0',
            position: 'relative' // Ensure the IconButton is positioned relative to this container
          }}
        >
          {/* Close Icon */}
          <IconButton
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute', // Position it absolutely within the parent container
              top: '10px', // Adjust top position
              right: '10px', // Adjust right position
              zIndex: 2 // Ensure it appears above the image
            }}
          >
            <Icon icon='solar:close-square-bold' width='40px' height='40px' color={'#7A8684'} />
          </IconButton>

          {/* Image */}
          <img
            src={selectedDoc?.transcript || selectedDoc}
            alt='Invoice doc'
            style={{
              maxWidth: '100%',
              minHeight: 400,
              maxHeight: '100%',
              objectFit: 'contain' // Prevent cropping and fits the content within the container
            }}
          />
        </Box>
      </Dialog>
      <Dialog open={confirmDeleteDialog} onClose={() => setConfirmDeleteDialog(false)} fullWidth maxWidth='sm'>
        <Box sx={{ p: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Icon
              icon='material-symbols:delete-outline-rounded'
              width='24px'
              height='24px'
              color={theme.palette.customColors.Error}
            />

            <Typography sx={{ fontSize: '20px', fontWeight: 500 }}>Delete File!</Typography>
          </Box>
          <Typography sx={{ fontSize: '16px', fontWeight: 400 }}>
            Are you sure you want to delete{' '}
            <span style={{ color: theme.palette.customColors.Error }}>{selectedDoc?.title}</span> ?
          </Typography>
          <Box sx={{ float: 'right', ml: 'auto', display: 'flex', gap: 4 }}>
            <Button
              variant='outlined'
              sx={{
                borderColor: theme.palette.customColors.OutlineVariant,
                color: theme.palette.customColors.neutralSecondary,
                '&:hover': {
                  borderColor: theme.palette.customColors.OutlineVariant,
                  color: theme.palette.customColors.neutralSecondary // Color on hover
                }
              }}
              onClick={() => setConfirmDeleteDialog(false)}

              // loading={submitLoader}
            >
              CANCEL
            </Button>
            {/* {id ? null : ( */}
            <LoadingButton
              onClick={e => removeSelectedImage(e, deleteId)}
              loading={deleteLoader}
              size='large'
              variant='contained'
              sx={{
                bgcolor: theme.palette.customColors.Error,
                '&:hover': {
                  bgcolor: theme.palette.customColors.Error // Color on hover
                }
              }}
            >
              DELETE
            </LoadingButton>
            {/* )} */}
          </Box>
        </Box>
      </Dialog>
    </Drawer>
  )
}

export default PurchaseDocsDrawer
