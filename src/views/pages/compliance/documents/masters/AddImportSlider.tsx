import { Icon } from '@iconify/react'
import { Box, Drawer, IconButton, Typography } from '@mui/material'
import { useTheme } from '@emotion/react'
import NewForm, { useTradePartiesForm } from './NewForm'
import { useEffect } from 'react'
import type { TradeContextType, Id } from 'src/types/compliance'
import { useTranslation } from 'react-i18next'

interface NewFormValues {
  name: string
  contexts: string[]
}

interface AddImportSliderProps {
  name?: string
  open: boolean
  handleClose: () => void
  handleSubmitData: (payload: NewFormValues, editId: Id | null) => void | Promise<void>
  submitLoader?: boolean
  tradeContextTypes?: TradeContextType[]
  contextLoading?: boolean
  editId?: Id | null
  initialValues?: NewFormValues | null
}

const defaultValues: NewFormValues = {
  name: '',
  contexts: []
}

const AddImportSlider = ({
  name,
  open,
  handleClose,
  handleSubmitData,
  submitLoader,
  tradeContextTypes = [],
  contextLoading = false,
  editId = null,
  initialValues = null
}: AddImportSliderProps) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useTradePartiesForm(defaultValues)
  const { t } = useTranslation()
  const theme = useTheme()

  useEffect(() => {
    if (initialValues) {
      reset(initialValues)
    } else {
      reset(defaultValues)
    }
  }, [initialValues, reset])

  const onSubmit = async (data: NewFormValues) => {
    const payload = {
      ...data

      //   contexts: data.contexts.map(Number)
    }
    await handleSubmitData(payload, editId)
  }

  return (
    <>
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
          sx={{
            p: 4,
            display: 'flex',
            justifyContent: 'space-between',
            bgcolor: (theme as any).palette.customColors.Background
          }}
        >
          <Typography variant='h6'>{editId ? `${t('update')} ${name}` : `${t('add')} ${name}`}</Typography>
          <IconButton size='small' onClick={handleClose}>
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>

        <Box sx={{ bgcolor: (theme as any).palette.customColors.Background, height: '100vh' }}>
          <NewForm
            name={name}
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
    </>
  )
}

export default AddImportSlider
