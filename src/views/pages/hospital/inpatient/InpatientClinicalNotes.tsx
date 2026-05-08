'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Typography, Box, Button, IconButton, Skeleton, Grid } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import { alpha, useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { MedicalIdChip } from '../utility/hospitalSnippets'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import RichTextEditor from 'src/components/RichTextEditor'
import { useSelector } from 'react-redux'
import { createEmptyRichTextValue, getRichTextContent, getRichTextHtmlValue } from 'src/utility'
import 'quill/dist/quill.snow.css'

const STORAGE_KEY = 'medical_record_data'

interface InpatientClinicalNotesProps {
  clinicalNotesData?: any[]
  onSubmitNote?: any
  onDeleteNote?: any
  isInitialLoading?: boolean
  isLoading?: boolean
  isSubmitting?: boolean
  lastClinicalNoteRef?: any
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  patientData?: any
}

const InpatientClinicalNotes = (props: InpatientClinicalNotesProps) => {
  const {
    clinicalNotesData,
    onSubmitNote,
    onDeleteNote,
    isInitialLoading,
    isLoading,
    isSubmitting,
    lastClinicalNoteRef,
    hasNextPage,
    isFetchingNextPage,
    patientData
  } = props
  const { t } = useTranslation()
  const theme: any = useTheme()
  const [clinicalNote, setClinicalNote] = useState<any>(null)
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({})
  const [truncatedNotes, setTruncatedNotes] = useState<Record<string, boolean>>({})
  const noteRefs = useRef<Record<string, any>>({})

  const toggleNoteExpand = (noteId: string) => {
    setExpandedNotes(prev => ({
      ...prev,
      [noteId]: !prev[noteId]
    }))
  }

  const checkIfTruncated = (noteId: string, htmlContent: string) => {
    if (!htmlContent) return

    const tempContainer = document.createElement('div')
    tempContainer.innerHTML = htmlContent

    const hasMoreThanThree = tempContainer.children.length > 3

    setTruncatedNotes(prev => ({
      ...prev,
      [noteId]: hasMoreThanThree
    }))
  }

  const hospitalData: any = useSelector((state: any) => state.hospital.data)
  const medicalRecordData: any = hospitalData[STORAGE_KEY] || {}
  const medical_record_id = medicalRecordData?.medical_record_id
  const hospital_case_id = medicalRecordData?.hospital_case_id
  const discharge_at = medicalRecordData?.discharge_at
  const status = medicalRecordData?.status

  const { handleSubmit } = useForm()

  useEffect(() => {
    clinicalNotesData?.forEach((data: any) => {
      const htmlContent = getRichTextHtmlValue(data?.note)
      if (htmlContent) {
        checkIfTruncated(data?.note_id, htmlContent)
      }
    })
  }, [clinicalNotesData])

  const noteText = getRichTextContent(clinicalNote)?.trim()

  const onSubmit = async () => {
    const payload: any = {
      medical_record_id: medical_record_id,
      note: getRichTextContent(clinicalNote),
      hospital_case_id: hospital_case_id
    }

    const success = await onSubmitNote(payload)

    if (success) {
      setClinicalNote(createEmptyRichTextValue())
    }
  }

  if (isInitialLoading) {
    return (
      <Box sx={{ mt: 4 }}>
        <ClinicalNotesSkeleton clinicalNotesData={clinicalNotesData} />
      </Box>
    )
  }

  return (
    <>
      {(status == 'admitted' || status == 'discharge') && (
        <Box
          sx={{
            p: 6,
            backgroundColor: theme.palette.customColors.displaybgPrimary,
            borderRadius: '12px',
            mt: 8,
            mb: (clinicalNotesData?.length == 0 ? 20 : undefined) as any
          }}
        >
          <Typography sx={{ fontSize: '1rem', fontWeight: 500, color: theme.palette.customColors.deepDark, mb: 4 }}>
            {t('hospital_module.enter_clinical_notes')}
          </Typography>

          <form noValidate autoComplete='off' onSubmit={!isSubmitting ? handleSubmit(onSubmit) : undefined}>
            <Grid container>
              <Grid size={{ xs: 12 }}>
                <RichTextEditor
                  label={""}
                  value={clinicalNote}
                  onChange={setClinicalNote}
                  placeholder='Add notes'
                />
              </Grid>
            </Grid>

            {noteText && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
                <LoadingButton
                  startIcon={<Icon icon='mdi:close' width={24} height={24} />}
                  variant='text'
                  sx={{ color: theme.palette.customColors.OnPrimaryContainer, fontWeight: 600, fontSize: '1rem' }}
                  onClick={() => setClinicalNote(createEmptyRichTextValue())}
                  size='small'
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {t('hospital_module.clear_text')}
                </LoadingButton>
                <LoadingButton
                  variant='contained'
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  type='submit'
                  sx={{
                    padding: '0.625rem 0.75rem',
                    borderRadius: '4px',
                    minWidth: { sm: '12.5rem' }
                  }}
                >
                  {t('add')}
                </LoadingButton>
              </Box>
            )}
          </form>
        </Box>
      )}

      {/* Clinical Notes List or Skeletons */}
      {(clinicalNotesData?.length ?? 0) > 0 && (
        <>
          {clinicalNotesData?.map((data: any, index: number) => {
            const isLast = index === (clinicalNotesData?.length ?? 0) - 1

            return (
              <Box
                key={data?.note_id || index}
                ref={isLast ? lastClinicalNoteRef : null}
                sx={{
                  p: 6,
                  mb: 5,
                  mt: 6,
                  background: alpha(theme.palette.customColors.antzNotes80, 0.2),
                  borderRadius: '8px'
                }}
              >
                <MedicalIdChip
                  leftImage
                  medId={data?.medical_record_code}
                  rightDot
                  dotColor={theme.palette.primary.main}
                  textColor={theme.palette.customColors.OnSurface}
                />
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: truncatedNotes[data?.note_id] ? 2 : 3
                  }}
                >
                  {!expandedNotes[data?.note_id] ? (
                    <Box
                      className='ql-editor'
                      sx={{
                        fontSize: '0.95rem',
                        fontWeight: 400,
                        color: theme.palette.customColors.OnSurfaceVariant,
                        flex: 1,
                        padding: 0,
                        border: 'none',
                        '& p': { margin: 0 },
                        '& ol, & ul': { paddingLeft: '1.5em', margin: '0.5em 0' }
                      }}
                      dangerouslySetInnerHTML={{
                        __html: (() => {
                          const htmlContent = getRichTextHtmlValue(data?.note)
                          if (!htmlContent) return '<p>NA</p>'
                          const tempContainer = document.createElement('div')
                          tempContainer.innerHTML = htmlContent

                          const firstThreeElements = Array.from(tempContainer.children).slice(0, 3)
                          const firstThreeHtml = firstThreeElements.map((el: any) => el.outerHTML).join('')

                          return truncatedNotes[data?.note_id] ? `${firstThreeHtml}<p>...</p>` : firstThreeHtml || '<p>NA</p>'
                        })()
                      }}
                    />
                  ) : (
                    <Box
                      className='ql-editor'
                      sx={{
                        fontSize: '0.95rem',
                        fontWeight: 400,
                        color: theme.palette.customColors.OnSurfaceVariant,
                        flex: 1,
                        padding: 0,
                        border: 'none',
                        '& p': { margin: 0 },
                        '& ol, & ul': { paddingLeft: '1.5em', margin: '0.5em 0' }
                      }}
                      dangerouslySetInnerHTML={{
                        __html: getRichTextHtmlValue(data?.note) || '<p>NA</p>'
                      }}
                    />
                  )}

                  {(status == 'admitted' || status == 'discharge') && (
                    <IconButton
                      onClick={() => onDeleteNote(data?.note_id)}
                      sx={{ color: theme.palette.customColors.Tertiary, p: 0, ml: 3, flexShrink: 0 }}
                    >
                      <CancelOutlinedIcon fontSize='medium' />
                    </IconButton>
                  )}
                </Box>

                {truncatedNotes[data?.note_id] && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 3 }}>
                    <Button
                      variant='text'
                      size='small'
                      onClick={() => toggleNoteExpand(data?.note_id)}
                      sx={{
                        color: theme.palette.primary.main,
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        textTransform: 'capitalize',
                        p: 0,
                        minWidth: 'auto',
                        '&:hover': {
                          backgroundColor: 'transparent',
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      {expandedNotes[data?.note_id] ? 'Read Less' : 'Read More'}
                    </Button>
                  </Box>
                )}

                <UserAvatarDetails
                  user_name={data?.created_by_user_name}
                  date={data?.created_at}
                  show_time
                  size='medium'
                  profile_image={data?.user_created_profile_pic}
                />
              </Box>
            )
          })}

          {/* Show skeleton only when fetching more pages and we already have data */}
          {isFetchingNextPage && (
            <Box sx={{ mt: 2 }}>
              <ClinicalNotesSkeleton clinicalNotesData={clinicalNotesData} />
            </Box>
          )}

          {/*  Show "No more data" */}
          {!hasNextPage && (clinicalNotesData?.length ?? 0) > 9 && (
            <Typography
              sx={{
                mt: 4,
                textAlign: 'center',
                fontSize: '1rem',
                fontWeight: 500,
                color: theme.palette.text.disabled
              }}
            >
              {t('hospital_module.no_more_clinical_notes_to_load')}
            </Typography>
          )}
        </>
      )}
    </>
  )
}

export default InpatientClinicalNotes

// Skeleton loader
function ClinicalNotesSkeleton({ clinicalNotesData }: { clinicalNotesData?: any[] }) {
  const theme: any = useTheme()

  return (
    <>
      {clinicalNotesData?.length === 0 && (
        <Box
          sx={{
            p: 6,
            backgroundColor: theme.palette.customColors.displaybgPrimary,
            borderRadius: '12px',
            mt: 8,
            mb: 6
          }}
        >
          <Skeleton variant='text' animation='wave' width='25%' height={28} sx={{ mb: 4 }} />
          <Skeleton
            variant='rectangular'
            animation='wave'
            height={90}
            sx={{
              width: '100%',
              borderRadius: '8px'
            }}
          />
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 4
            }}
          >
            <Skeleton variant='rectangular' animation='wave' width={150} height={40} sx={{ borderRadius: '6px' }} />
            <Skeleton variant='rectangular' animation='wave' width={150} height={40} sx={{ borderRadius: '6px' }} />
          </Box>
        </Box>
      )}
      {Array.from({ length: 2 }).map((_, index) => (
        <Box
          key={index}
          sx={{
            p: 6,
            mb: 4,
            background: alpha(theme.palette.customColors.antzNotes80, 0.2),
            borderRadius: '8px'
          }}
        >
          <Skeleton variant='text' animation='wave' width='20%' height={24} sx={{ mb: 2 }} />
          <Skeleton variant='rectangular' width='100%' animation='wave' height={60} sx={{ mb: 4 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Skeleton variant='circular' width={40} height={40} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant='text' width='20%' height={20} />
              <Skeleton variant='text' width='20%' height={20} />
            </Box>
          </Box>
        </Box>
      ))}
    </>
  )
}
