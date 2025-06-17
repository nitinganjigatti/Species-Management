import Drawer from '@mui/material/Drawer'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Icon from 'src/@core/components/icon'
import DocumentTypeForm, { useDocumentTypeForm } from './DocumentTypeForm'
import { useEffect } from 'react'
import { useTheme } from '@mui/material/styles'

const defaultValues = {
  name: '',
  description: '',
  contexts: [],
  active: '1'
}

const AddEditDocumentType = ({
  open,
  handleClose,
  handleSubmitData,
  submitLoader,
  tradeContextTypes = [],
  contextLoading = false,
  editId = null,
  initialValues = null
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useDocumentTypeForm(defaultValues)

  const theme = useTheme()

  useEffect(() => {
    if (initialValues) {
      reset(initialValues)
    } else {
      reset(defaultValues)
    }
  }, [initialValues, reset])

  const onSubmit = async data => {
    const payload = {
      ...data,
      contexts: data.contexts.map(Number)
    }
    await handleSubmitData(payload, editId)
  }

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={handleClose}
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', '550px'] }
      }}
    >
      <Box
        className='sidebar-header'
        sx={{ p: 4, display: 'flex', justifyContent: 'space-between', bgcolor: theme.palette.customColors.Background }}
      >
        <Typography variant='h6'>{editId ? 'Edit Document Type' : 'Add Document Type'}</Typography>
        <IconButton size='small' onClick={handleClose}>
          <Icon icon='mdi:close' />
        </IconButton>
      </Box>

      <Box sx={{ bgcolor: theme.palette.customColors.Background, height: '100vh' }}>
        <DocumentTypeForm
          control={control}
          handleSubmit={handleSubmit}
          errors={errors}
          onSubmit={onSubmit}
          submitLoader={submitLoader}
          isEdit={Boolean(editId)}
          tradeContextTypes={tradeContextTypes}
          contextLoading={contextLoading}
        />
      </Box>
    </Drawer>
  )
}

export default AddEditDocumentType
