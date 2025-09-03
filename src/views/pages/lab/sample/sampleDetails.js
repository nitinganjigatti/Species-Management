import { useCallback, useEffect, useState } from 'react'
import { LoadingButton } from '@mui/lab'
import {
  Box,
  Drawer,
  IconButton,
  Typography,
  Button,
  CardContent,
} from '@mui/material'

import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import Toaster from 'src/components/Toaster'

import { deleteLabTest, getLabSampleListById, getLabTestDetailsById } from 'src/lib/api/lab/master'
import FallbackSpinner from 'src/@core/components/spinner'
import ConfirmationDeleteDialog from 'src/components/ConfirmationDeleteDialog'

const SampleDetails = props => {
  const theme = useTheme()
  const { addEventSidebarOpen, setOpenDetailsDrawer, setOpenDrawer, submitLoader, editParams, fetchTableData } = props
  const [sampleDetails, setSampleDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isModalOpenDelete, setIsModalOpenDelete] = useState(false)
  const [btnLoader, setBtnLoader] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  const getLabTestById = useCallback(async id => {
    const params = {
      id
    }
    setLoading(true)
    const response = await getLabSampleListById(params)
    if (response?.success) {
      setSampleDetails(response.data?.result)
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (editParams?.id !== null) {
      getLabTestById(editParams?.id)
    }
  }, [editParams, , getLabTestById])

  const confirmDeleteAction = async () => {
    try {
      setBtnLoader(true)
      const res = await deleteLabTest(selectedId)
      if (res?.success) {
        setBtnLoader(false)
        setIsModalOpenDelete(false)
        setOpenDetailsDrawer(false)
        Toaster({ type: 'success', message: res?.message })
        await fetchTableData()
      } else {
        setBtnLoader(false)
        setIsModalOpenDelete(false)
        Toaster({ type: 'error', message: res?.message })
      }
    } catch (error) {
      console.error('Error uploading files:', error)
    } finally {
      setIsModalOpenDelete(false)
      setBtnLoader(false)
    }
  }

  const handleDelete = sample => {
    setIsModalOpenDelete(true)
    setSelectedId(sampleDetails?.id)
  }

  return (
    <>
      <Drawer
        anchor='right'
        open={addEventSidebarOpen}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '500px'] },
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        <Box sx={{ width: '100%', height: '100%' }}>
          <Box
            className='sidebar-header'
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              p: theme => theme.spacing(3, 3.255, 3, 5.255),
              px: '24px',
              backgroundColor: 'background.default'
            }}
          >
            <Box sx={{ gap: 2, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <Typography variant='h6'>{editParams?.id !== null && 'Lab Sample Details'}</Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size='small' onClick={() => setOpenDetailsDrawer(false)} sx={{ color: 'text.primary' }}>
                <Icon icon='mdi:close' fontSize={20} onClick={() => setOpenDetailsDrawer(false)} />
              </IconButton>
            </Box>
          </Box>

          {/* drower */}
          <Box
            sx={{
              flex: 1, // Allow this content to expand and take remaining space
              overflowY: 'auto',
              m: 5,
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              backgroundColor: '#fff',
              borderRadius: '8px',
              boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
              maxHeight: '79vh'
            }}
          >
            {loading ? (
              <FallbackSpinner />
            ) : (
              <>
                {sampleDetails && (
                  <Box>
                    <CardContent>
                      <Box sx={{ bgcolor: '#E1F9ED', p: 3, mb: 6, borderRadius: 1 }}>
                        <Typography
                          variant='caption'
                          sx={{
                            color: 'text.secondary'
                          }}
                        >
                          Test Name
                        </Typography>
                        <Typography variant='h5' component='div'>
                          {sampleDetails.label}
                        </Typography>
                      </Box>

                      {/* <Typography variant='subtitle2' color='text.secondary' mt={2} mb={2}>
                        Sample Types
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', mb: 6 }}>
                        {sampleDetails?.sample_types?.map(type => (
                          <Chip
                            key={type.id}
                            label={type.name}
                            size='small'
                            sx={{
                              bgcolor: '#E8F4F2',
                              color: '#44544A',
                              '&:hover': { bgcolor: '#c8e6c9' },
                              borderRadius: '6px'
                            }}
                          />
                        ))}
                      </Box> */}

                      <Typography
                        variant='subtitle2'
                        sx={{
                          color: 'text.secondary',
                          mt: 2,
                          mb: 2
                        }}
                      >
                        No Lab Tests
                      </Typography>
                      {sampleDetails?.lab_test_count}
                      {/* {sampleDetails?.lab_test_count}
                      <List disablePadding>
                        {sampleDetails?.child_tests?.map((test, index) => (
                          <ListItem
                            key={test.id}
                            sx={{
                              bgcolor: '#EFF5F2',
                              mb: 2,
                              borderRadius: 1,
                              color: '#44544A',
                              '&:hover': { bgcolor: '#c8e6c9' }
                            }}
                          >
                            <ListItemText primary={`${index + 1}. ${test.name}`} />
                          </ListItem>
                        ))}
                      </List> */}
                    </CardContent>
                  </Box>
                )}
              </>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {sampleDetails != null && sampleDetails?.zoo_id != '0' ? (
                <Box
                  sx={{
                    position: 'relative',
                    right: 0,
                    height: '6rem',
                    width: '100%',
                    maxWidth: '500px',
                    position: 'fixed',
                    bottom: 0,
                    px: 4,
                    bgcolor: 'white',
                    alignItems: 'center',
                    justifyContent: 'center',
                    display: 'flex',
                    zIndex: 1234,
                    gap: 2
                  }}
                >
                  <Button fullWidth onClick={handleDelete} size='large' type='reset' color='error' variant='outlined'>
                    Delete
                  </Button>
                  <LoadingButton
                    fullWidth
                    variant='contained'
                    onClick={() => {
                      setOpenDrawer(true)
                      setOpenDetailsDrawer(false)
                    }}
                    size='large'
                    loading={submitLoader}
                  >
                    {editParams?.id !== null && `Edit`}
                  </LoadingButton>
                </Box>
              ) : null}
            </Box>
          </Box>
        </Box>
      </Drawer>
      <ConfirmationDeleteDialog
        open={isModalOpenDelete}
        onClose={() => setIsModalOpenDelete(false)}
        confirmLoading={btnLoader}
        onConfirm={confirmDeleteAction}
        title='Are you sure you want to delete this lab sample?'
      />
    </>
  )
}

export default SampleDetails
