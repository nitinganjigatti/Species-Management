import React, { useState } from 'react'
import { Drawer, IconButton, Typography, TextField, Button, Box, Avatar } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import moment from 'moment'
import { format } from 'date-fns'
import Utility from 'src/utility'

import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'

import Icon from 'src/@core/components/icon'
import Toaster from 'src/components/Toaster'
import { postComment } from 'src/lib/api/lab/getLabRequest'
import type { CommentSideSheetProps } from 'src/types/lab'

interface CommentFormValues {
  comment: string
}

const CommentSideSheet = ({ openCommentSheet, setOpenCommentSheet, CommentData, api }: CommentSideSheetProps) => {
  const [loading, setLoading] = useState(false)
  const [isEdit, setIsEdit] = useState(false)

  const schema = yup.object().shape({
    comment: yup.string().required('Notes is required')
  })

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<CommentFormValues>({
    resolver: yupResolver(schema)
  })

  const onSubmit = async (data: CommentFormValues) => {
    setLoading(true)
    try {
      const params = { notes: data.comment }
      const res = await postComment(CommentData.id, params)
      if (res?.status) {
        setLoading(false)
        setOpenCommentSheet(false)
        Toaster({ type: 'success', message: isEdit ? 'Notes updated successfully' : 'Notes added successfully' })
        api()
        setIsEdit(false)
      }
    } catch (error) {
      setLoading(false)
      setIsEdit(false)
      console.error('error', error)
    }
  }

  const handleEdit = () => {
    setIsEdit(true)
    setValue('comment', CommentData.notes ?? '')
  }

  return (
    <Drawer
      anchor='right'
      open={openCommentSheet}
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', '500px'] }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'background.default',
          p: (theme: { spacing: (...args: number[]) => string }) => theme.spacing(3, 3.255, 3, 5.255)
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Icon icon='fluent:comment-note-24-regular' width='28' height='28' color='rgba(68, 84, 74, 1)' />
          <Typography variant='h6'>Notes</Typography>
        </Box>
        <IconButton onClick={() => setOpenCommentSheet(false)}>
          <Icon icon='mdi:close' fontSize={20} />
        </IconButton>
      </Box>

      <Box sx={{ p: 6 }} component='form' onSubmit={handleSubmit(onSubmit)}>
        {CommentData.notes && !isEdit ? (
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{
                p: 3,
                backgroundColor: 'rgba(68, 84, 74, 0.05)',
                borderRadius: '8px',
                position: 'relative'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar
                  src={CommentData.notes_modified_by_profile_pic || CommentData.notes_added_by_profile_pic}
                  sx={{ width: 40, height: 40 }}
                />
                <Box>
                  <Typography sx={{ fontSize: '15px', fontWeight: 500, color: '#1F515B' }}>
                    {CommentData?.notes_modified_by || CommentData?.notes_added_by}
                  </Typography>
                  <Typography sx={{ fontSize: '12px', color: '#6F7F75' }}>
                    {format(
                      new Date(
                        Utility.convertUTCToLocal(
                          CommentData.notes_modified_at ? CommentData.notes_modified_at : CommentData.notes_added_at
                        )
                      ),
                      'dd MMM yyyy hh:mm a'
                    )}
                  </Typography>
                </Box>
                <IconButton
                  onClick={handleEdit}
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8
                  }}
                >
                  <Icon icon='mdi:pencil' fontSize={20} />
                </IconButton>
              </Box>
              <Typography sx={{ fontSize: '14px', color: '#44544A', whiteSpace: 'pre-wrap' }}>
                {CommentData.notes}
              </Typography>
            </Box>
          </Box>
        ) : (
          <>
            <TextField
              label='Add Notes'
              variant='outlined'
              fullWidth
              multiline
              rows={4}
              {...register('comment')}
              error={!!errors.comment}
              helperText={errors.comment?.message}
              sx={{ mb: 4 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              {isEdit && (
                <Button variant='outlined' onClick={() => setIsEdit(false)} sx={{ minWidth: 120 }}>
                  Cancel
                </Button>
              )}
              <LoadingButton loading={loading} type='submit' variant='contained' sx={{ minWidth: 120 }}>
                {isEdit ? 'Update Notes' : 'Add Notes'}
              </LoadingButton>
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  )
}

export default CommentSideSheet
