import Drawer from '@mui/material/Drawer'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Icon from 'src/@core/components/icon'
import DocumentTypeForm, { useDocumentTypeForm } from './DocumentTypeForm'

const defaultValues = {
  name: '',
  description: '',
  contexts: [],
  active: '0'
}

const AddDocumentType = ({
  addOpen,
  handleClose,
  handleSubmitData,
  submitLoader,
  tradeContextTypes = [],
  contextLoading = false
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useDocumentTypeForm(defaultValues)

  const onSubmit = async data => {
    const payload = {
      ...data,
      contexts: data.contexts.map(Number)
    }
    await handleSubmitData(payload)
  }

  return (
    <Drawer anchor='right' open={addOpen} onClose={handleClose} sx={{ '& .MuiDrawer-paper': { width: 400 } }}>
      <Box className='sidebar-header' sx={{ p: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant='h6'>Add Document Type</Typography>
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
          isEdit={false}
          tradeContextTypes={tradeContextTypes}
          contextLoading={contextLoading}
        />
      </Box>
    </Drawer>
  )
}

export default AddDocumentType
