import { Drawer, IconButton, Typography, TextField, Button, Card, Avatar } from '@mui/material'
import { Box } from '@mui/system'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import Icon from 'src/@core/components/icon'
import { LoadingButton } from '@mui/lab'
import { postComment } from 'src/lib/api/lab/getLabRequest'
import Toaster from 'src/components/Toaster'
import moment from 'moment'

const CommentSideSheet = ({ openCommentSheet, setOpenCommentSheet, CommentData, api }) => {
  console.log(CommentData)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)
  const [isEdit, setIsEdit] = useState(false)

  function extractHoursAndMinutes(date) {
    //9:21 PM
    return moment(date).format('hh:mm A')
  }

  function convertUTCToLocal(date) {
    var stillUtc = moment.utc(date).toDate()
    var local = moment(stillUtc).local(true).format('YYYY-MM-DD HH:mm:ss')

    return local
  }

  const schema = yup.object().shape({
    comment: yup.string().required('Comment is required')
  })

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema)
  })

  const onSubmit = async data => {
    console.log(data)
    setLoading(true)

    try {
      const params = { notes: data.comment }
      const res = await postComment(CommentData.id, params)
      if (res?.status) {
        setLoading(false)
        setOpenCommentSheet(false)
        Toaster({ type: 'success', message: res.message })
        api()
        setIsEdit(false)
      }
    } catch (error) {
      setLoading(false)
      setIsEdit(false)
      console.log('error', error)
    }

    // const newComment = {
    //   name: 'John Doe',
    //   avatar: '',
    //   date: new Date().toLocaleString(),
    //   text: data.comment
    // }

    // if (editingIndex !== null) {
    //   const updatedComments = [...comments]
    //   updatedComments[editingIndex] = newComment
    //   setComments(updatedComments)
    //   setEditingIndex(null)
    // } else {
    //   setComments([...comments, newComment])
    // }

    setValue('comment', '')
  }

  const handleEdit = () => {
    setIsEdit(true)
    setValue('comment', CommentData.notes)
  }

  return (
    <Drawer
      anchor='right'
      open={openCommentSheet}
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', '500px'], display: 'flex', flexDirection: 'column' },
        position: 'relative'
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
          <Icon icon='fluent:comment-add-28-regular' width='28' height='28' color={'rgba(68, 84, 74, 1)'} />
          <Typography variant='h6'>Add Comment</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <IconButton size='small' sx={{ color: 'text.primary' }}>
            <Icon icon='mdi:close' fontSize={20} onClick={() => setOpenCommentSheet(false)} />
          </IconButton>
        </Box>
      </Box>

      <Box
        sx={{ flexGrow: 1, px: 6, py: 4, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        component='form'
        onSubmit={handleSubmit(onSubmit)}
      >
        <TextField
          label='Add Comment'
          variant='outlined'
          fullWidth
          {...register('comment')}
          error={!!errors.comment}
          helperText={errors.comment?.message}
          focused={isEdit}
        />

        <Box sx={{ py: 4 }}>
          {CommentData.notes && !isEdit && (
            <Box
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                border: '1px solid #f2f2f2',
                borderRadius: '8px',
                boxShadow: '0px 0px 5px 0px rgba(0,0,0,0.1)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar src={CommentData.user_profile_pic} alt='User Icon' sx={{ width: 40, height: 40 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography sx={{ fontSize: '15px', fontWeight: 500 }}>
                      {CommentData?.user_profile?.first_name}{' '}
                      <span style={{ fontSize: '13px' }}>
                        {extractHoursAndMinutes(convertUTCToLocal(CommentData.notes_added_at))}
                      </span>
                    </Typography>
                    <Typography sx={{ fontSize: '15px', fontWeight: 500 }}>{CommentData.notes}</Typography>
                  </Box>
                </Box>
                <IconButton size='small' onClick={() => handleEdit()}>
                  <Icon icon='mdi:pencil' fontSize={24} />
                </IconButton>
              </Box>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto', pb: 4 }}>
          <LoadingButton loading={loading} fullWidth type='submit' variant='contained' color='primary'>
            {isEdit ? 'Update Comment' : 'Add Comment'}
          </LoadingButton>
        </Box>
      </Box>
    </Drawer>
  )
}

export default CommentSideSheet
