import React, { useState } from 'react'
import {
  Box,
  Typography,
  List,
  IconButton,
  Collapse,
  alpha,
  useMediaQuery
} from '@mui/material'
import { Edit as EditIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { useTheme } from '@mui/material/styles'
import DocumentUploadDrawer from '../drawer/DocumentUploadDrawer'
import FileUpload from 'src/views/forms/form-elements/file-uploader/ComplianceFileUploader'

const documentTypes = [
  { id: 1, name: 'Donation Letter', required: true },
  { id: 2, name: 'Acceptance Letter', required: true },
  { id: 3, name: 'Agreement', required: true },
  { id: 4, name: 'CZA Application', required: true },
  { id: 5, name: 'CZA Approval', required: false },
  { id: 6, name: 'Partvesh/CWLW NOC', required: false },
  { id: 7, name: 'AQCS NoC', required: false },
  { id: 8, name: 'Health Certificate', required: false },
  { id: 9, name: 'Test Reports', required: false },
  { id: 10, name: 'Certificate of Origin', required: false },
  { id: 11, name: 'Health Certificate submission letter to AQCS', required: false },
  { id: 12, name: 'AQCS Final Clearance Certificate', required: false },
  { id: 13, name: 'Final CITES Clearance', required: false },
  { id: 14, name: 'Reimbursement', required: false }
]

const SupportingDocuments = ({ initialDocuments = [] }) => {
  const [documents, setDocuments] = useState(initialDocuments)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [currentDocumentType, setCurrentDocumentType] = useState(null)
  const [currentDocumentData, setCurrentDocumentData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [expanded, setExpanded] = useState(null)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const handleOpenDrawer = (docType, docData = null) => {
    setCurrentDocumentType(docType)
    setCurrentDocumentData(docData)
    setDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setCurrentDocumentType(null)
    setCurrentDocumentData(null)
  }

  const handleDocumentSubmit = async (documentTypeId, formData) => {
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      const newDocument = {
        document_type_id: documentTypeId.toString(),
        file_path: formData.file ? URL.createObjectURL(formData.file) : currentDocumentData?.file_path,
        file_original_name: formData.file ? formData.file.name : currentDocumentData?.file_original_name,
        issued_date: formData.issued_date || '',
        reference_number: formData.reference_number || ''
      }

      setDocuments(prev => [...prev.filter(doc => doc.document_type_id !== documentTypeId.toString()), newDocument])
      handleCloseDrawer()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteDocument = async documentTypeId => {
    setIsLoading(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 500))

      setDocuments(prev => prev.filter(doc => doc.document_type_id !== documentTypeId.toString()))
      if (expanded === documentTypeId) {
        setExpanded(null)
      }
    } catch (error) {
      console.error('Delete failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getDocumentForType = documentTypeId => {
    return documents.find(doc => doc.document_type_id === documentTypeId.toString())
  }

  const completedCount = documents.filter(doc =>
    documentTypes.some(dt => dt.id.toString() === doc.document_type_id)
  ).length

  const handleAccordionChange = panel => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : null)
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant='h6' sx={{ mb: 2, fontWeight: 'bold', fontSize: isMobile ? '1rem' : '1.25rem' }}>
        {completedCount}/{documentTypes.length} Documents added
      </Typography>

      <List
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? 3 : 4,
        }}
      >
        {documentTypes.map(docType => {
          const document = getDocumentForType(docType.id)
          const isExpanded = expanded === docType.id

          return (
            <Box
              key={docType.id}
              sx={{
                border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                borderRadius: '8px',
                p: isMobile ? 2 : 4,
                backgroundColor: document
                  ? theme.palette.customColors.Surface
                  : alpha(theme.palette.customColors.addPrimary, 0.2)
              }}
            >
              {document ? (
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
                          onClick={e => handleAccordionChange(docType.id)(e, !isExpanded)}
                        >
                          <Typography sx={{ fontWeight: 500, mr: 1 }}>{docType.name}</Typography>
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
                              Issued Date: {document.issued_date || 'Not specified'}
                            </Typography>
                            <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
                              Reference Number: {document.reference_number || 'Not specified'}
                            </Typography>
                          </Box>
                        </Collapse>
                      </Box>
                    </Box>
                    <IconButton onClick={() => handleOpenDrawer(docType, document)} disabled={isLoading} size='small'>
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
                  <Typography sx={{ fontWeight: 500 }}>{docType.name}</Typography>
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
                    onClick={() => handleOpenDrawer(docType)}
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
        onUpload={handleDocumentSubmit}
        onEdit={handleDocumentSubmit}
        isLoading={isLoading}
      />
    </Box>
  )
}

export default SupportingDocuments
