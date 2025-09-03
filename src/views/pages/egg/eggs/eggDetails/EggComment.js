import React, { useEffect, useState } from 'react'
import { Avatar, Button, Card, CardContent, IconButton, LinearProgress, TextField, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { styled } from '@mui/material/styles'
import { useTheme } from '@mui/material/styles'

import moment from 'moment'
import Utility from 'src/utility'
import Icon from 'src/@core/components/icon'
import FallbackSpinner from 'src/@core/components/spinner'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import { addEggComment, deleteEggComments, getEggComments } from 'src/lib/api/egg/egg'

const EggComment = ({ eggDetails, eggId }) => {
  const theme = useTheme()

  const CustomBox = styled(Box)({
    '::-webkit-scrollbar': {
      width: '5px',
      height: '10px'
    },
    '::-webkit-scrollbar-track': {
      background: 'transparent'
    },
    '::-webkit-scrollbar-thumb': {
      background: theme.palette.customColors.Outline,
      borderRadius: '10px'
    },
    '::-webkit-scrollbar-thumb:hover': {
      background: theme.palette.customColors.neutralSecondary
    }
  })

  const [limit, setLimit] = useState(10)
  const [reachedEnd, setReachedEnd] = useState(false)
  let [commentsPage, setCommentsPage] = useState(1)
  const [commentList, setCommentList] = useState([])
  const [commentListCount, setCommentListCount] = useState(0)
  const [commentLoader, setCommentLoader] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentBtnLoader, setCommentBtnLoader] = useState(false)
  const [deleteDialogBox, setDeleteDialogBox] = useState(false)
  const [commentId, setCommentId] = useState(null)
  const [shouldCallList, setShouldCallList] = useState(true)

  const getEggCommentsFunc = () => {
    const params = {
      egg_id: eggId,
      page_no: commentsPage,
      limit
    }
    try {
      getEggComments(params).then(res => {
        if (res.success) {
          setCommentLoader(false)
          if (res?.data?.result?.length > 0) {
            setCommentList(prevArray => [...prevArray, ...res?.data?.result])
            setReachedEnd(false)
          }
          setCommentListCount(res?.data?.total_count)
          setCommentsPage(prev => prev + 1)
        } else {
          setCommentList(prevArray => [...prevArray])
          setShouldCallList(false)
          setReachedEnd(false)
          setCommentLoader(false)
        }
      })
    } catch (error) {
      setCommentLoader(false)
    }
  }
  useEffect(() => {
    setCommentLoader(true)
    getEggCommentsFunc()
  }, [])

  const handleScroll = async e => {
    const container = e.target
    const hasReachedBottom = container.scrollHeight - Math.round(container.scrollTop) === container.clientHeight
    const allCommentsLoaded = commentList.length >= eggDetails.total_count
    if (
      hasReachedBottom &&
      shouldCallList &&
      !allCommentsLoaded &&
      Number(commentList?.length) < Number(commentListCount)
    ) {
      setReachedEnd(true)
      try {
        getEggCommentsFunc()
      } catch (error) {
        setReachedEnd(false)
        console.error(error)
      }
    }
  }

  function formatDate(dateString) {
    const now = moment()
    const date = Utility.convertUTCToLocal(dateString)

    const diffInSeconds = now.diff(date, 'seconds')
    const diffInMinutes = now.diff(date, 'minutes')
    const diffInHours = now.diff(date, 'hours')

    if (now.isSame(date, 'day')) {
      if (diffInSeconds < 60) {
        return `Just now`
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes} Min${diffInMinutes !== 1 ? 's' : ''} ago`
      } else {
        return `${diffInHours} Hour${diffInHours !== 1 ? 's' : ''} ago`
      }
    } else {
      return Utility?.formatDisplayDate(date)
    }
  }

  const addCommentForEgg = () => {
    const payload = {
      egg_id: eggId,
      comments: commentText
    }
    try {
      setCommentBtnLoader(true)
      addEggComment(payload).then(res => {
        if (res.success) {
          setCommentBtnLoader(false)
          setCommentText('')
          setShouldCallList(true)
          if (commentList?.length < 10) {
            getEggComments({ egg_id: eggId, page_no: 1, limit }).then(res => {
              if (res.success) {
                if (res?.data?.result?.length > 0) {
                  setCommentList(res?.data?.result)
                  setCommentLoader(false)
                  setReachedEnd(false)
                }
              } else {
                setShouldCallList(ṭrue)
                setReachedEnd(false)
                setCommentLoader(false)
              }
            })
          }
        } else {
          setCommentBtnLoader(false)
        }
      })
    } catch (error) {
      setCommentBtnLoader(false)
    }
  }

  const handleClosenew = () => {
    setDeleteDialogBox(false)
  }

  const confirmDeleteAction = async () => {
    setCommentLoader(true)
    try {
      setDeleteDialogBox(false)
      const response = await deleteEggComments({ id: commentId })
      if (response.success) {
        setCommentLoader(true)
        setCommentsPage(1)
        setShouldCallList(true)
        setCommentList([])

        getEggComments({ egg_id: eggId, page_no: 1, limit }).then(res => {
          if (res.success) {
            if (res?.data?.result?.length > 0) {
              setCommentList(res?.data?.result)
              setCommentLoader(false)
              setReachedEnd(false)
            } else {
              setCommentList([])
              setCommentLoader(false)
              setReachedEnd(false)
            }
          } else {
            setShouldCallList(ṭrue)
            setReachedEnd(false)
            setCommentLoader(false)
          }
        })
      } else {
        setCommentLoader(false)
      }
    } catch (error) {
      console.error('error', error)
      setCommentLoader(false)
    }
  }

  return (
    <Card>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '20px',
              lineHeight: '24.2px',
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            Add Comment
          </Typography>
          <TextField
            sx={{
              '& .MuiOutlinedInput-root': {
                paddingRight: '0 !important',
                '& fieldset': {
                  borderColor: theme.palette.divider
                },
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.primary.main
                }
              }
            }}
            fullWidth
            variant='outlined'
            placeholder='Enter your comments'
            value={commentText}
            onChange={e => {
              setCommentText(e.target.value)
            }}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                addCommentForEgg()
              }
            }}
            slotProps={{
              input: {
                endAdornment: (
                  <Button
                    sx={{ borderBottomLeftRadius: 0, borderTopLeftRadius: 0, height: '57px' }}
                    variant='contained'
                    position='end'
                    disabled={commentBtnLoader || commentText === ''}
                    onClick={() => addCommentForEgg()}
                  >
                    <Icon icon={'fluent:send-16-filled'} fontSize='28px' color={theme.palette.primary.contrastText} />
                  </Button>
                )
              }
            }}
          />
        </Box>
        {commentLoader ? (
          <CardContent sx={{ height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <FallbackSpinner />
          </CardContent>
        ) : commentList?.length ? (
          <>
            <Box>
              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: '20px',
                  lineHeight: '24.2px',
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                Previous Comments
              </Typography>
            </Box>
            <CustomBox
              onScroll={handleScroll}
              sx={{ maxHeight: commentList?.length ? '400px' : '20px', overflowY: 'auto' }}
            >
              {commentList?.length ? (
                commentList?.map((item, index) => (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      py: '24px',
                      borderBottom:
                        commentList?.length === index + 1
                          ? 'none'
                          : `0.5px solid ${theme.palette.customColors.OutlineVariant}`
                    }}
                    key={index}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          variant='square'
                          alt='Medicine Image'
                          sx={{
                            width: 30,
                            height: 30,
                            mr: 4,
                            borderRadius: '50%',
                            background: theme.palette.customColors.displaybgPrimary,
                            overflow: 'hidden'
                          }}
                        >
                          {item?.user_profile_pic ? (
                            <img
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              src={item?.user_profile_pic}
                              alt={item?.created_by}
                            />
                          ) : (
                            <Icon icon='mdi:user' />
                          )}
                        </Avatar>
                        <Typography
                          noWrap
                          sx={{
                            color: theme.palette.customColors.OnSurfaceVariant,
                            fontSize: '16px',
                            fontWeight: '500',
                            lineHeight: '19.36px',
                            mr: '32px'
                          }}
                        >
                          {item?.created_by ? item?.created_by : '-'}
                        </Typography>
                        {item.created_at && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Icon
                              color={theme.palette.customColors.secondaryBg}
                              icon='ion:time-outline'
                              fontSize={20}
                            />
                            <Typography
                              noWrap
                              sx={{
                                color: theme.palette.customColors.secondaryBg,
                                fontSize: '14px',
                                fontWeight: '400',
                                lineHeight: '16.94px',
                                verticalAlign: 'middle'
                              }}
                            >
                              {item.created_at ? formatDate(item.created_at) : '-'}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: '12px', justifyContent: { xs: 'end' } }}>
                        <IconButton
                          onClick={() => {
                            setCommentId(item?.id)
                            setDeleteDialogBox(true)
                          }}
                        >
                          <Icon
                            color={theme.palette.customColors.secondaryBg}
                            icon='material-symbols:delete-outline'
                            fontSize={20}
                            style={{ cursor: 'pointer' }}
                          />
                        </IconButton>
                      </Box>
                    </Box>
                    <Typography
                      sx={{
                        fontWeight: 400,
                        fontSize: '16px',
                        lineHeight: '19.36px',
                        color: theme.palette.customColors.OnSurfaceVariant,
                        ml: 12
                      }}
                    >
                      {item.comments}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography
                  sx={{
                    fontWeight: 500,
                    fontSize: '20px',
                    lineHeight: '24.2px',
                    color: theme.palette.customColors.OnSurfaceVariant
                  }}
                >
                  No Comments
                </Typography>
              )}
              {reachedEnd ? <LinearProgress /> : null}
            </CustomBox>
          </>
        ) : null}
      </CardContent>
      <ConfirmationDialog
        icon={'mdi:delete'}
        iconColor={theme.palette.customColors.Error}
        title={'Are you sure you want to delete this comment?'}
        dialogBoxStatus={deleteDialogBox}
        onClose={handleClosenew}
        ConfirmationText={'Delete'}
        confirmAction={confirmDeleteAction}
      />
    </Card>
  )
}

export default EggComment
