import { Box, Button, Card, Dialog, TextField, Typography } from '@mui/material'
import React, { useState } from 'react'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import { LoadingButton } from '@mui/lab'
import Toaster from 'src/components/Toaster'
import { AddDiscardEgg } from 'src/lib/api/egg/discard'
import { useTranslation } from 'react-i18next'

const DiscardDialogBox = ({ openDiscardDialog, setOpenDiscardDialog, selectionEggModel, fetchTableData }) => {
  const theme = useTheme()
  const { t } = useTranslation()
  const [comments, setComments] = useState('')
  const [loading, setLoading] = useState(false)

  const handleClose = () => {
    setOpenDiscardDialog(false)
    setComments('')
  }

  const handleDiscardClick = async () => {
    setLoading(true)

    const payload = {
      egg_id: JSON.stringify(selectionEggModel),
      reason: comments
    }

    try {
      const response = await AddDiscardEgg(payload)
      if (response.success) {
        setComments('')
        Toaster({ type: 'success', message: response.message })
        handleClose()
        if (fetchTableData) {
          fetchTableData()
        }
        setLoading(false)
      } else {
        Toaster({ type: 'error', message: response.message })
        handleClose()
        setLoading(false)
      }
    } catch (error) {
      console.error('error :>> ', error)
      setComments('')
      handleClose()
      Toaster({ type: 'error', message: 'An error occurred while discard' })
      setLoading(false)
    }
  }

  return (
    <Dialog open={openDiscardDialog} onClose={() => setOpenDiscardDialog(false)}>
      <Card
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
          width: '500px',
          height: '460px',

          gap: '24px'
        }}
      >
        <Box sx={{ bgcolor: theme.palette.customColors.TertiaryLight, p: '16px', borderRadius: '12px', mt: 10 }}>
          <Icon icon='tdesign:error-triangle' fontSize={'48px'} color={theme.palette.customColors.Error} />
        </Box>
        <Box>
          <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '24px', fontWeight: 600 }}>
            {t('egg_module.do_you_want_to_discard')}
          </Typography>
          <Typography
            sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '16px', fontWeight: 400, mt: 2 }}
          >
            {t('egg_module.you_have_selected')} {selectionEggModel?.length} {t('egg_module.eggs_to_discard')}
          </Typography>
        </Box>
        <Box sx={{ width: '100%', px: 4 }}>
          <TextField
            multiline
            rows={2}
            label='Add Comments'
            variant='outlined'
            fullWidth
            value={comments}
            onChange={e => setComments(e.target.value)}
          />
        </Box>

        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', gap: 6, p: 4 }}>
          <Button variant='outlined' fullWidth sx={{ p: 4 }} onClick={handleClose}>
            {t('cancel')}
          </Button>

          <LoadingButton variant='contained' fullWidth sx={{ p: 4 }} loading={loading} onClick={handleDiscardClick}>
            {t('necropsy_module.discard')}
          </LoadingButton>
        </Box>
      </Card>
    </Dialog>
  )
}

export default DiscardDialogBox
