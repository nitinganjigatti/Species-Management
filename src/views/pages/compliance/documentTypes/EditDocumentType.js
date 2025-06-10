import Drawer from '@mui/material/Drawer'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Icon from 'src/@core/components/icon'
import DocumentTypeForm, { useDocumentTypeForm } from './DocumentTypeForm'

const EditDocumentType = ({
  editOpen,
  handleClose,
  editId,
  handleSubmitData,
  submitLoader,
  tradeContextTypes = [],
  contextLoading = false,
  defaultValues
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useDocumentTypeForm(defaultValues)

  const onSubmit = async data => {
    const payload = {
      ...data,
      contexts: data.contexts.map(Number)
    }
    await handleSubmitData(payload, editId)
  }

  return (
    <Drawer anchor='right' open={editOpen} onClose={handleClose} sx={{ '& .MuiDrawer-paper': { width: 400 } }}>
      <Box className='sidebar-header' sx={{ p: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant='h6'>Edit Document Type</Typography>
        <IconButton size='small' onClick={handleClose}>
          <Icon icon='mdi:close' />
        </IconButton>
      </Box>
      <Box sx={{ p: 4 }}>
        <DocumentTypeForm
          control={control}
          handleSubmit={handleSubmit}
          errors={errors}
          onSubmit={onSubmit}
          submitLoader={submitLoader}
          isEdit
          tradeContextTypes={tradeContextTypes}
          contextLoading={contextLoading}
        />
      </Box>
    </Drawer>
  )
}

export default EditDocumentType
