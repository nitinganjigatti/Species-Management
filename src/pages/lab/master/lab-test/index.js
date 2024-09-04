import React, { useCallback, useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  Grid,
  Typography,
  Container,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Pagination
} from '@mui/material'
import CardHeader from '@mui/material/CardHeader'
import { IconButton } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { Box, fontSize } from '@mui/system'
import { LoadingButton } from '@mui/lab'
import { useTheme } from '@emotion/react'
import toast from 'react-hot-toast'
import { AddButton } from 'src/components/Buttons'
import Icon from 'src/@core/components/icon'
import Toaster from 'src/components/Toaster'
import FallbackSpinner from 'src/@core/components/spinner/index'
import AddLabTest from 'src/views/pages/lab/test/addTest'
import { addLabTest, deleteLabTest, getLabTestList, updateLabTest } from 'src/lib/api/lab/master'
import Router, { useRouter } from 'next/router'
import ConfirmationDeleteDialog from 'src/components/ConfirmationDeleteDialog'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

const TestCard = ({ test, onEdit, onDelete }) => {
  return (
    <Card
      variant='outlined'
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative', // Needed for absolute positioning of icons
        p: 3
        // cursor: 'pointer'
      }}
    >
      {/* Icons positioned at the top right */}
      <Box
        sx={{
          position: 'absolute',
          top: 6,
          right: 6,
          display: 'flex',
          gap: 1 // Space between the icons
        }}
      >
        <IconButton
          onClick={e => {
            e.stopPropagation()
            onEdit(test)
          }}
          size='small'
        >
          <EditIcon />
        </IconButton>
        <IconButton
          onClick={e => {
            e.stopPropagation()
            onDelete(test)
          }}
          size='small'
        >
          <DeleteIcon />
        </IconButton>
      </Box>

      <CardContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        <Typography variant='h6' component='div'>
          {test.label}
        </Typography>
        <Typography color='text.secondary'>{test.description}</Typography>
      </CardContent>
    </Card>
  )
}

const LabTest = () => {
  const theme = useTheme()
  const router = useRouter()
  const [testData, setTestData] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const editParamsInitialState = { id: null, label: null, description: null, string_id: null }
  const [openDrawer, setOpenDrawer] = useState(false)
  const [resetForm, setResetForm] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [editParams, setEditParams] = useState(editParamsInitialState)
  const [loading, setLoading] = useState(false)
  const [isModalOpenDelete, setIsModalOpenDelete] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [btnLoader, setBtnLoader] = useState(false)

  const { sample_id } = router.query
  console.log(sample_id, 'sample_id')

  const fetchLabTestData = useCallback(
    async (sample_id, page) => {
      try {
        setLoading(true)

        const params = {
          sample_id: sample_id,
          page: page,
          is_child: 1,
          limit: limit
        }

        await getLabTestList({ params: params }).then(res => {
          if (res.success) {
            console.log(res, 'res')
            setTestData(res.data?.data)
            setTotalCount(res.data?.total_count)
          }
        })
        setLoading(false)
      } catch (e) {
        console.log(e)
        setLoading(false)
      }
    },
    [limit]
  )
  useEffect(() => {
    if (sample_id) {
      fetchLabTestData(sample_id, page)
    }
  }, [fetchLabTestData, sample_id, page])

  const handleSidebarClose = () => {
    setOpenDrawer(false)
  }
  const addEventSidebarOpen = () => {
    setEditParams({ id: null, label: null, description: null, string_id: null })
    setResetForm(true)
    setOpenDrawer(true)
  }

  const handleSubmitData = async payload => {
    try {
      setSubmitLoader(true)
      var response
      if (editParams?.id !== null) {
        response = await updateLabTest(editParams?.id, payload)
      } else {
        response = await addLabTest(payload)
      }
      if (response?.success) {
        Toaster({ type: 'success', message: response?.message })
        setSubmitLoader(false)
        setResetForm(true)
        setOpenDrawer(false)
        await fetchLabTestData(sample_id)
      } else {
        Toaster({ type: 'error', message: response?.message })
        setSubmitLoader(false)
      }
    } catch (e) {
      console.log(e)
      setSubmitLoader(false)
      toast.error(JSON.stringify(e))
    }
  }
  const handleEdit = sample => {
    console.log('Edit:', sample)
    setEditParams(sample)
    setResetForm(true)
    setOpenDrawer(true)
    // Add your logic to handle the edit action
  }

  const handleDelete = sample => {
    console.log('Delete:', sample)
    setIsModalOpenDelete(true)
    setSelectedId(sample?.id)
    // Add your logic to handle the delete action
  }

  const confirmDeleteAction = async () => {
    try {
      setBtnLoader(true)
      const res = await deleteLabTest(selectedId)
      if (res?.success) {
        setBtnLoader(false)
        setIsModalOpenDelete(false)
        Toaster({ type: 'success', message: res?.message })
        await fetchLabTestData(sample_id)
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

  const headerAction = (
    <>
      <AddButton title='Add Test' action={() => addEventSidebarOpen()} />
    </>
  )

  const titleAction = (
    <Box display='flex' alignItems='center'>
      <IconButton onClick={() => router.back()}>
        <ArrowBackIcon />
      </IconButton>
      <Typography variant='h6' ml={1}>
        Lab Test
      </Typography>
    </Box>
  )
  const handlePageChange = (event, value) => {
    setPage(value)
  }

  return (
    <>
      {loading ? (
        <FallbackSpinner />
      ) : (
        <Container>
          <Card variant='outlined' sx={{ mb: 2 }}>
            <CardHeader title={titleAction} action={headerAction} />
          </Card>

          {testData.length > 0 ? (
            <>
              <Grid container spacing={2}>
                {testData.map(test => (
                  <Grid item xs={12} key={test.id}>
                    <TestCard test={test} onEdit={handleEdit} onDelete={handleDelete} />
                  </Grid>
                ))}
              </Grid>
              <Box display='flex' justifyContent='end' mt={4}>
                <Pagination
                  count={Math.ceil(totalCount / limit)}
                  page={page}
                  onChange={handlePageChange}
                  color='primary'
                />
              </Box>
            </>
          ) : (
            <Box display='flex' justifyContent='center' mt={4}>
              <Typography variant='body1' color='textSecondary'>
                No data available
              </Typography>
            </Box>
          )}
        </Container>
      )}

      <AddLabTest
        drawerWidth={400}
        addEventSidebarOpen={openDrawer}
        handleSidebarClose={handleSidebarClose}
        handleSubmitData={handleSubmitData}
        resetForm={resetForm}
        submitLoader={submitLoader}
        editParams={editParams}
      />

      <ConfirmationDeleteDialog
        open={isModalOpenDelete}
        onClose={() => setIsModalOpenDelete(false)}
        confirmLoading={btnLoader}
        onConfirm={confirmDeleteAction}
        title='Are you sure you want to delete this lab test?'
      />
    </>
  )
}

export default LabTest
