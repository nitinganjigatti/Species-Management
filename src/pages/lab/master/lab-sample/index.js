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
  DialogContent
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
import AddLabSample from 'src/views/pages/lab/sample/addSample'
import { addLabSample, deleteLabSample, getLabSampleList, updateLabSample } from 'src/lib/api/lab/master'
import Router from 'next/router'
import LabelIcon from '@mui/icons-material/Label'
import DescriptionIcon from '@mui/icons-material/Description'
import ConfirmationDeleteDialog from 'src/components/ConfirmationDeleteDialog'

// const SampleCard = ({ sample, onEdit, onDelete }) => {
//   return (
//     <Card
//       variant='outlined'
//       sx={{
//         height: '100%',
//         display: 'flex',
//         flexDirection: 'column',
//         position: 'relative', // Needed for absolute positioning of icons
//         p: 3
//       }}
//     >
//       {/* Icons positioned at the top right */}
//       <Box
//         sx={{
//           position: 'absolute',
//           top: 6,
//           right: 6,
//           display: 'flex',
//           gap: 1 // Space between the icons
//         }}
//       >
//         <IconButton onClick={() => onEdit(sample)} size='small'>
//           <EditIcon />
//         </IconButton>
//         <IconButton onClick={() => onDelete(sample)} size='small'>
//           <DeleteIcon />
//         </IconButton>
//       </Box>

//       <CardContent
//         sx={{
//           flexGrow: 1,
//           display: 'flex',
//           flexDirection: 'column',
//           justifyContent: 'center'
//         }}
//       >
//         <Typography variant='h6' component='div'>
//           {sample.label}
//         </Typography>
//         <Typography color='text.secondary'>{sample.description}</Typography>
//       </CardContent>
//     </Card>
//   )
// }
const SampleCard = ({ sample, onEdit, onDelete, handleCardClick }) => {
  return (
    <Card
      variant='outlined'
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative', // Needed for absolute positioning of icons
        p: 3,
        cursor: 'pointer'
      }}
      onClick={() => handleCardClick(sample?.id)}
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
        <IconButton onClick={() => onEdit(sample)} size='small'>
          <EditIcon />
        </IconButton>
        <IconButton onClick={() => onDelete(sample)} size='small'>
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
          {sample.label}
        </Typography>
        <Typography color='text.secondary'>{sample.description}</Typography>
      </CardContent>
    </Card>
  )
}

const LabSamples = () => {
  const theme = useTheme()
  const [sampleData, setSampleData] = useState([])
  const editParamsInitialState = { id: null, label: null, description: null, string_id: null }
  const [openDrawer, setOpenDrawer] = useState(false)
  const [resetForm, setResetForm] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [editParams, setEditParams] = useState(editParamsInitialState)
  const [loading, setLoading] = useState(false)
  const [isModalOpenDelete, setIsModalOpenDelete] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [btnLoader, setBtnLoader] = useState(false)

  const fetchLabSampleData = useCallback(async () => {
    try {
      setLoading(true)

      const params = {}

      await getLabSampleList({ params: params }).then(res => {
        if (res.success) {
          setSampleData(res.data)
        }
      })
      setLoading(false)
    } catch (e) {
      console.log(e)
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    fetchLabSampleData()
  }, [fetchLabSampleData])

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
        response = await updateLabSample(editParams?.id, payload)
      } else {
        response = await addLabSample(payload)
      }
      if (response?.success) {
        Toaster({ type: 'success', message: response?.message })
        setSubmitLoader(false)
        setResetForm(true)
        setOpenDrawer(false)
        await fetchLabSampleData()
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
      const res = await deleteLabSample(selectedId)
      if (res?.success) {
        setBtnLoader(false)
        setIsModalOpenDelete(false)
        Toaster({ type: 'success', message: res?.message })
        await fetchLabSampleData()
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
      <AddButton title='Add Samples' action={() => addEventSidebarOpen()} />
    </>
  )
  const handleCardClick = sampleId => {
    Router.push(`/lab/master/lab-test/ ?${sampleId}`)
  }

  return (
    <>
      {loading ? (
        <FallbackSpinner />
      ) : (
        <Container>
          <Card variant='outlined' sx={{ mb: 2 }}>
            <CardHeader title='Lab Samples' action={headerAction} />
          </Card>

          <Grid container spacing={2}>
            {sampleData.map(sample => (
              // <Grid item xs={12} sm={6} md={4} key={sample.id}>
              //   <SampleCard sample={sample} onEdit={handleEdit} onDelete={handleDelete} />
              // </Grid>
              <Grid item xs={12} key={sample.id}>
                <SampleCard
                  sample={sample}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  handleCardClick={handleCardClick}
                />
              </Grid>
            ))}
          </Grid>
        </Container>
      )}

      <AddLabSample
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
        title='Are you sure you want to delete this lab sample?'
      />
    </>
  )
}

export default LabSamples
