import React, { useState } from 'react'
import { Box, Typography, List, IconButton, Collapse, alpha, useMediaQuery, CircularProgress } from '@mui/material'
import { Edit as EditIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { useTheme } from '@mui/material/styles'
import DocumentUploadDrawer from './drawer/DocumentUploadDrawer'
import useSafeRouter from 'src/hooks/useSafeRouter'
import dayjs from 'dayjs'
import Toaster from 'src/components/Toaster'
import { addDocument, updateDocument } from 'src/lib/api/compliance/exports'
import Utility from 'src/utility'
import type { SupportingDocumentsProps } from 'src/types/compliance'
import type { ComplianceDocument } from 'src/types/compliance'
import type { Id } from 'src/types/compliance'

const SupportingDocuments = ({ isFetching, documentList, totalCount, onAddEditSuccess, type }: SupportingDocumentsProps) => {
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false)
  const [currentDocumentType, setCurrentDocumentType] = useState<string | null>(null)
  const [currentDocumentData, setCurrentDocumentData] = useState<ComplianceDocument | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [expanded, setExpanded] = useState<Id | null>(null)
  const router = useSafeRouter()

  const { id } = router.query

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const handleOpenDrawer = (document: ComplianceDocument) => {
    setCurrentDocumentType(document.file_path ?? null)

    // Ensure dates are properly formatted when setting current document data
    setCurrentDocumentData({
      ...document,
      issued_date: document?.issued_date ? (dayjs(document?.issued_date) as any) : undefined
    })
    setDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setCurrentDocumentType(null)
    setCurrentDocumentData(null)
  }

  const handleDocumentSubmit = async (formData: Record<string, unknown>) => {
    setIsLoading(true)

    try {
      const payload: Record<string, unknown> = {
        issued_date: formData.issued_date ? dayjs(formData.issued_date as string).format('YYYY-MM-DD') : null,
        document_type_id: currentDocumentData?.id,
        id: id,
        type: type, // Type 1 for export
        reference_number: formData.reference_number || ''
      }

      // Check if a new file was uploaded (not the existing file object)
      if (formData.file && formData.file instanceof File) {
        payload.document = formData.file
      }

      const response = currentDocumentData?.document_id
        ? await (updateDocument as any)(currentDocumentData?.document_id, payload)
        : await (addDocument as any)(payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message })
        onAddEditSuccess?.()
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
      handleCloseDrawer()
    } catch (error) {
      Toaster({ type: 'error', message: (error as Error)?.message })
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const completedCount = documentList?.filter(doc => doc.file_path).length || 0

  const handleAccordionChange = (panel: Id) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : null)
  }

  if (isFetching) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center'>
        <CircularProgress />
      </Box>
    )
  }

  const handleOpenLink = (document: ComplianceDocument) => {
    if (document?.file_path) {
      window.open(document.file_path, '_blank', 'noopener,noreferrer')
    } else {
      Toaster({ type: 'error', message: 'No file available to view' })
    }
  }

  return (
    <Box sx={{ mt: 2 }}>
      {documentList?.length ? (
        <Typography variant='h6' sx={{ mb: 2, fontWeight: 'bold', fontSize: isMobile ? '1rem' : '1.25rem' }}>
          {completedCount}/{totalCount} Documents added
        </Typography>
      ) : null}

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
                  : alpha(theme.palette.customColors.addPrimary || '', 0.2)
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
                      py: 2,
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
                          onClick={e => handleAccordionChange(document.id!)(e, !isExpanded)}
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
                              Reference Number: {(document.reference_number as string) || 'Not specified'}
                            </Typography>
                          </Box>
                        </Collapse>
                      </Box>
                    </Box>
                    {type === '1' || type === '2' || type === '3' ? (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton
                          onClick={() => handleOpenLink(document)}
                          disabled={isLoading}
                          size='small'
                          sx={{ padding: 0, marginRight: 3, cursor: 'pointer' }}
                        >
                          <VisibilityIcon fontSize='small' />
                        </IconButton>
                        <IconButton
                          onClick={() => handleOpenDrawer(document)}
                          disabled={isLoading}
                          size='small'
                          sx={{ cursor: 'pointer' }}
                        >
                          <EditIcon fontSize='small' />
                        </IconButton>
                      </Box>
                    ) : (
                      ''
                    )}
                  </Box>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    justifyContent: 'space-between',
                    py: 0,
                    gap: isMobile ? 2 : 0
                  }}
                >
                  <Typography sx={{ fontWeight: 500 }}>{document?.name || ''}</Typography>
                  <Box
                    sx={{
                      border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                      p: 0,
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
                      height={'40px'}
                      style={{ marginRight: '15px', marginLeft: '15px' }}
                    />
                    <Typography sx={{ color: theme.palette.primary.main, fontWeight: 400 }}>
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
