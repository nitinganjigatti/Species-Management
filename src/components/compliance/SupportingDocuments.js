import React, { useState } from 'react'
import { Box, Typography, List, IconButton, Collapse, alpha, useMediaQuery, CircularProgress } from '@mui/material'
import { Edit as EditIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { useTheme } from '@mui/material/styles'
import DocumentUploadDrawer from './drawer/DocumentUploadDrawer'
import { useRouter } from 'next/router'
import dayjs from 'dayjs'
import Toaster from 'src/components/Toaster'
import { addDocument, updateDocument } from 'src/lib/api/compliance/exports'
import Utility from 'src/utility'

const SupportingDocuments = ({ isFetching, documentList, totalCount, onAddEditSuccess, type }) => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [currentDocumentType, setCurrentDocumentType] = useState(null)
  const [currentDocumentData, setCurrentDocumentData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const router = useRouter()

  const { id } = router.query

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const handleOpenDrawer = document => {
    setCurrentDocumentType(document.file_path)

    // Ensure dates are properly formatted when setting current document data
    setCurrentDocumentData({
      ...document,
      issued_date: document?.issued_date ? dayjs(document?.issued_date) : null
    })
    setDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setCurrentDocumentType(null)
    setCurrentDocumentData(null)
  }

  const handleDocumentSubmit = async formData => {
    setIsLoading(true)

    try {
      const payload = {
        issued_date: formData.issued_date ? dayjs(formData.issued_date).format('YYYY-MM-DD') : null,
        document_type_id: currentDocumentData.id,
        id: id,
        type: type, // Type 1 for export
        reference_number: formData.reference_number || ''
      }

      // Check if a new file was uploaded (not the existing file object)
      if (formData.file && formData.file instanceof File) {
        payload.document = formData.file
      }

      const response = currentDocumentData?.document_id
        ? await updateDocument(currentDocumentData?.document_id, payload)
        : await addDocument(payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message })
        onAddEditSuccess(response?.data)
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
      handleCloseDrawer()
    } catch (error) {
      Toaster({ type: 'error', message: error?.message })
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const completedCount = documentList?.filter(doc => doc.file_path).length || 0

  const handleAccordionChange = panel => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : null)
  }

  if (isFetching) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center'>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant='h6' sx={{ mb: 2, fontWeight: 'bold', fontSize: isMobile ? '1rem' : '1.25rem' }}>
        {completedCount}/{totalCount} Documents added
      </Typography>

      <List
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? 3 : 4
        }}
      >
        {documentList?.map(document => {
          const isExpanded = expanded === document.id

          return (
            <Box
              key={document.id}
              sx={{
                border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                borderRadius: '8px',
                p: isMobile ? 2 : 4,
                backgroundColor: document?.file_path
                  ? theme.palette.customColors.Surface
                  : alpha(theme.palette.customColors.addPrimary, 0.2)
              }}
            >
              {document?.file_path ? (
                <Box>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: isMobile ? 'column' : 'row',
                      alignItems: isMobile ? 'flex-start' : 'center',
                      justifyContent: 'space-between',
                      py: 1,
                      gap: isMobile ? 2 : 0
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: isMobile ? 2 : 4,
                        flexWrap: 'wrap'
                      }}
                    >
                      <CheckCircleOutlineIcon color='primary' />
                      <Box sx={{ flex: 1 }}>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                          onClick={e => handleAccordionChange(document.id)(e, !isExpanded)}
                        >
                          <Typography sx={{ fontWeight: 500, mr: 1 }}>{document.name}</Typography>
                          <ExpandMoreIcon
                            sx={{
                              transition: 'transform 0.2s',
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                              color: theme.palette.text.secondary
                            }}
                          />
                        </Box>

                        <Collapse in={isExpanded}>
                          <Box sx={{ py: 1 }}>
                            <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
                              Issued Date: {Utility.formatDisplayDate(document.issued_date) || 'Not specified'}
                            </Typography>
                            <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
                              Reference Number: {document.reference_number || 'Not specified'}
                            </Typography>
                          </Box>
                        </Collapse>
                      </Box>
                    </Box>
                    <IconButton onClick={() => handleOpenDrawer(document)} disabled={isLoading} size='small'>
                      <EditIcon fontSize='small' />
                    </IconButton>
                  </Box>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    justifyContent: 'space-between',
                    py: 1,
                    gap: isMobile ? 2 : 0
                  }}
                >
                  <Typography sx={{ fontWeight: 500 }}>{document?.name || ''}</Typography>
                  <Box
                    sx={{
                      border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                      p: 3,
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      mt: 1,
                      borderRadius: '10px',
                      position: 'relative',
                      width: '100%',
                      maxWidth: '215px',
                      bgcolor: theme.palette.common.white
                    }}
                    onClick={() => handleOpenDrawer(document)}
                  >
                    <img
                      src='/images/compliance/attach_file_add_colored.svg'
                      alt='Grocery Icon'
                      width='20px'
                      height={'20px'}
                      style={{ marginRight: '15px', marginLeft: '10px' }}
                    />
                    <Typography sx={{ color: theme.palette.primary.OnSurface, fontWeight: 400 }}>
                      Upload Document
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          )
        })}
      </List>

      <DocumentUploadDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        documentType={currentDocumentType}
        documentData={currentDocumentData}
        onAddEdit={handleDocumentSubmit}
        isLoading={isLoading}
      />
    </Box>
  )
}

export default SupportingDocuments
