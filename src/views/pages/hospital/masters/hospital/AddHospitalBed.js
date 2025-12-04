import React, { useEffect, useMemo, useCallback } from 'react'
import { useTheme, Card, Typography, IconButton, Drawer, Box } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'

// Custom Form Components
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledRadioGroup from 'src/views/forms/form-fields/ControlledRadioGroup'

// Default Form Values
const defaultValues = {
  hospital_id: null,
  room_id: null,
  bed_name: '',
  status: true
}

const AddHospitalBed = props => {
  const {
    handleSidebarOpen,
    handleSidebarClose,
    handleSubmitData,
    submitLoader,
    editParams,
    roomDetails,
    hospitalId,
    roomId,
    roomStatus,
    isActive
  } = props

  const theme = useTheme()

  // Determine mode and occupancy
  const isRoomEditMode = Boolean(roomStatus)
  const isBedMode = !isRoomEditMode
  const hasOccupants = Number(roomDetails?.no_of_occupied || 0) > 0
  const canEditStatus = isRoomEditMode && !hasOccupants

  // Conditional rendering flags
  const showBedNameField = isBedMode
  const showStatusField = isBedMode || canEditStatus
  const hospitalNameDisabled = true
  const roomNameDisabled = isBedMode || (isRoomEditMode && hasOccupants)

  // Dynamic Validation Schema
  const schema = useMemo(() => {
    if (isRoomEditMode) {
      if (canEditStatus) {
        return yup.object().shape({
          hospital_id: yup.string().trim().required('Hospital Name is required'),
          room_id: yup.string().trim().required('Room Name is required'),
          status: yup.boolean().required('Status is required')
        })
      } else {
        return yup.object().shape({
          hospital_id: yup.string().trim().required('Hospital Name is required'),
          room_id: yup.string().trim().required('Room Name is required')
        })
      }
    }

    // Bed create/edit
    return yup.object().shape({
      hospital_id: yup.string().trim().required('Hospital Name is required'),
      room_id: yup.string().trim().required('Room Name is required'),
      bed_name: yup.string().trim().required('Cage/Stall/Enclosure Name is required'),
      status: yup.boolean().required('Status is required')
    })
  }, [isRoomEditMode, canEditStatus])

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  // Prefill form based on mode
  useEffect(() => {
    let prefill = { ...defaultValues }

    //  Room edit mode
    if (isRoomEditMode) {
      prefill = {
        hospital_id: roomDetails?.hospital_name || '',
        room_id: roomDetails?.room_name || '',
        ...(canEditStatus && { status: Boolean(isActive) })
      }
    }

    //  Bed edit mode
    else if (editParams?.id) {
      const statusValue = editParams.active === '1' || editParams.active === 1 || editParams.active === 'active'

      prefill = {
        hospital_id: roomDetails?.hospital_name || '',
        room_id: roomDetails?.room_name || '',
        bed_name: editParams.bed_name || '',
        status: statusValue
      }
    }

    // Bed create mode
    else {
      prefill = {
        hospital_id: roomDetails?.hospital_name || '',
        room_id: roomDetails?.room_name || '',
        bed_name: '',
        status: true
      }
    }

    reset(prefill, { keepIsValid: true })
  }, [isRoomEditMode, canEditStatus, roomDetails, editParams, isActive, reset])

  // Handle form submission to create or update bed  and  update room
  const onSubmit = useCallback(
    async formData => {
      try {
        if (isRoomEditMode) {
          // update room payload
          const payload = {
            room_name: formData.room_id,
            floor_name: roomDetails?.floor_name || '',
            status: canEditStatus ? (formData.status === true ? 1 : 0) : roomDetails?.status
          }
          await handleSubmitData(payload, 'room')
        } else {
          // Bed add/edit payload
          const payload = {
            hospital_id: hospitalId,
            room_id: roomId,
            bed_name: formData.bed_name,
            status: formData.status === true ? '1' : '0',
            prefix: hospitalId
          }
          await handleSubmitData(payload, 'bed')
        }
      } catch (error) {
        console.error('Error submitting form:', error)
      }
    },
    [isRoomEditMode, roomDetails, hospitalId, roomId, handleSubmitData, canEditStatus]
  )

  // Close handler
  const handleClose = useCallback(() => {
    reset(defaultValues)
    handleSidebarClose()
  }, [reset, handleSidebarClose])

  // Drawer title ---------
  const drawerTitle = useMemo(() => {
    if (isRoomEditMode) return 'Update Room'
    if (editParams?.id) return 'Edit Bed'

    return 'Add New Bed'
  }, [isRoomEditMode, editParams])

  return (
    <Drawer
      anchor='right'
      open={handleSidebarOpen}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', 500] } }}
    >
      {/* Drawer Header */}
      <Box
        className='sidebar-header'
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 6,
          borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`
        }}
      >
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <img src='/icons/activity_icon.png' style={{ width: '30px', height: '30px' }} alt='Bed Icon' />
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
            {drawerTitle}
          </Typography>
        </Box>

        <IconButton size='small' onClick={handleClose} sx={{ color: theme.palette.text.primary }}>
          <Icon icon='mdi:close' fontSize={24} />
        </IconButton>
      </Box>

      {/* Drawer Body */}
      <Box
        className='sidebar-body'
        sx={{
          backgroundColor: theme.palette.background.default,
          p: 6,
          flexGrow: 1
        }}
      >
        <form autoComplete='off' onSubmit={submitLoader ? undefined : handleSubmit(onSubmit)}>
          <Card sx={{ p: 6, boxShadow: 0, border: `2px solid ${theme.palette.customColors.SurfaceVariant}` }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <ControlledTextField
                control={control}
                errors={errors}
                label='Hospital Name'
                name='hospital_id'
                placeholder='Hospital Name'
                fullWidth
                disabled={hospitalNameDisabled}
              />
              <ControlledTextField
                control={control}
                errors={errors}
                label='Room Name*'
                name='room_id'
                placeholder='Enter Room Name'
                fullWidth
                disabled={roomNameDisabled}
              />
              {showBedNameField && (
                <ControlledTextField
                  control={control}
                  errors={errors}
                  label='Cage/Stall/Enclosure Name*'
                  name='bed_name'
                  placeholder='Enter Cage/Stall/Enclosure'
                  fullWidth
                />
              )}
              {showStatusField && (
                <ControlledRadioGroup
                  name='status'
                  control={control}
                  errors={errors}
                  label='Select Status'
                  required
                  options={[
                    { label: 'Active', value: true },
                    { label: 'Inactive', value: false }
                  ]}
                  row
                  radioColor='primary'
                  gap={4}
                />
              )}
            </Box>
          </Card>

          {/* Footer button */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              p: 4,
              display: 'flex',
              justifyContent: 'center',
              boxShadow: '0px -2px 6px rgba(0, 0, 0, 0.1)',
              backgroundColor: theme.palette.background.paper
            }}
          >
            <Box sx={{ display: 'flex', gap: 6, width: '100%' }}>
              {(editParams?.id || isRoomEditMode) && (
                <LoadingButton
                  variant='outlined'
                  type='button'
                  loading={submitLoader}
                  sx={{
                    flex: 1,
                    py: 4,
                    color: theme.palette.customColors.OnPrimaryContainer,
                    borderColor: theme.palette.customColors.OnPrimaryContainer
                  }}
                  onClick={handleSidebarClose}
                >
                  Cancel
                </LoadingButton>
              )}
              <LoadingButton
                variant='contained'
                type='submit'
                loading={submitLoader}
                sx={{ flex: 1, py: 4 }}
                disabled={!isValid || submitLoader}
              >
                {editParams?.id || isRoomEditMode ? 'Update' : 'Add Bed'}
              </LoadingButton>
            </Box>
          </Box>
        </form>
      </Box>
    </Drawer>
  )
}

export default AddHospitalBed

// 'use client'

// import { useEffect, useRef } from 'react'
// import 'quill/dist/quill.snow.css'
// import { Box, Typography, useTheme } from '@mui/material'

// const extractDelta = input => {
//   if (!input) return null
//   if (input?.delta?.ops) return input.delta
//   if (input?.ops) return input

//   return null
// }

// const extractHtml = input => {
//   if (!input) return ''
//   if (typeof input === 'string') return input

//   return input?.html || ''
// }

// const extractText = input => {
//   if (!input) return ''
//   if (typeof input === 'string') return input

//   return input?.text || ''
// }

// export default function RichTextEditor({ value, onChange, label, placeholder = 'Start typing...', minHeight = 200 }) {
//   const theme = useTheme()
//   const editorRef = useRef(null)
//   const quillRef = useRef(null)

//   useEffect(() => {
//     if (editorRef.current && !quillRef.current) {
//       import('quill').then(({ default: Quill }) => {
//         const quill = new Quill(editorRef.current, {
//           theme: 'snow',
//           placeholder,
//           modules: {
//             toolbar: [
//               [{ header: [1, 2, 3, 4, 5, 6, false] }],
//               ['blockquote', 'code-block'],
//               ['bold', 'italic', 'underline', 'strike'],
//               [{ script: 'sub' }, { script: 'super' }],
//               [{ indent: '-1' }, { indent: '+1' }],
//               [{ list: 'ordered' }, { list: 'bullet' }],
//               [{ size: ['small', false, 'large', 'huge'] }],
//               [{ align: [] }],
//               ['link', 'image'],
//               ['clean']
//             ]
//           }
//         })

//         const initialDelta = extractDelta(value)
//         const initialHtml = extractHtml(value)
//         const initialText = extractText(value)

//         if (initialDelta) {
//           quill.setContents(initialDelta)
//         } else if (initialHtml) {
//           quill.clipboard.dangerouslyPasteHTML(initialHtml)
//         } else if (initialText) {
//           quill.setText(initialText)
//         } else {
//           quill.setContents([{ insert: '\n' }])
//         }

//         // ✅ Listen for changes
//         quill.on('text-change', () => {
//           const delta = quill.getContents()
//           const html = quill.root.innerHTML
//           const text = quill.getText()

//           onChange?.({
//             delta,
//             html,
//             text,
//             ops: delta?.ops
//           })
//         })

//         quillRef.current = quill
//       })
//     }
//   }, [placeholder]) // only run once on mount

//   // ✅ Sync external value changes → update editor when prop changes
//   useEffect(() => {
//     if (!quillRef.current) return

//     const quill = quillRef.current
//     const delta = extractDelta(value)
//     const html = extractHtml(value)
//     const text = extractText(value)
//     const currentDelta = quill.getContents()

//     if (delta) {
//       if (JSON.stringify(currentDelta) !== JSON.stringify(delta)) {
//         quill.setContents(delta)
//       }
//     } else if (html) {
//       if (quill.root.innerHTML !== html) {
//         const selection = quill.getSelection()
//         quill.clipboard.dangerouslyPasteHTML(html)
//         if (selection) quill.setSelection(selection)
//       }
//     } else if (text) {
//       if (quill.getText() !== text) {
//         quill.setText(text)
//       }
//     } else if (!value) {
//       quill.setContents([{ insert: '\n' }])
//     }
//   }, [value])

//   return (
//     <Box>
//       {label && (
//         <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 600 }}>
//           {label}
//         </Typography>
//       )}
//       <Box
//         sx={{
//           border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
//           borderRadius: 1,
//           '& .ql-container': {
//             border: 'none',
//             fontSize: '0.95rem'
//           },
//           '& .ql-toolbar': {
//             border: 'none',
//             borderBottom: '1px solid',
//             borderColor: 'divider',
//             borderTopLeftRadius: 8,
//             borderTopRightRadius: 8
//           },
//           '& .ql-editor': {
//             minHeight
//           },
//           background: theme.palette.customColors.OnPrimary
//         }}
//       >
//         <div ref={editorRef} />
//       </Box>
//     </Box>
//   )
// }
