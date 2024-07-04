import { Box, Button, Card, Dialog, TextField, Typography } from '@mui/material'
import React, { useState } from 'react'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import { LoadingButton } from '@mui/lab'
import Toaster from 'src/components/Toaster'
import { AddDiscardEgg } from 'src/lib/api/egg/discard'

const DiscardDialogBox = ({ openDiscardDialog, setOpenDiscardDialog, selectionEggModel }) => {
  const theme = useTheme()
  const [comments, setComments] = useState('')
  console.log('comments :>> ', comments)

  const handleClose = () => {
    setOpenDiscardDialog(false)
    setComments('')
  }

  const handleDiscardClick = async () => {
    const payload = {
      egg_id: JSON.stringify(selectionEggModel),
      reason: comments
    }
    console.log('payload :>> ', payload)

    try {
      const response = await AddDiscardEgg(payload)
      if (response.success) {
        Toaster({ type: 'success', message: response.message })
        handleClose()
      }
    } catch (error) {
      console.log('error :>> ', error)
      setComments('')
      handleClose()
      Toaster({ type: 'error', message: 'An error occurred while discard' })
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
          gap: '32px'
        }}
      >
        <Box sx={{ bgcolor: '#FFD3D3', p: '16px', borderRadius: '12px', mt: 10 }}>
          <Icon icon='tdesign:error-triangle' fontSize={'48px'} color={'#E93353'} />
        </Box>
        <Box>
          <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '24px', fontWeight: 600 }}>
            Do you want to Discard?
          </Typography>
          <Typography
            sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '16px', fontWeight: 400, mt: 2 }}
          >
            You have selected {selectionEggModel?.length} eggs to discard
          </Typography>
        </Box>
        <Box sx={{ width: '100%', px: 4 }}>
          <TextField
            multiline
            rows={2}
            label='Add Comments*'
            variant='outlined'
            fullWidth
            value={comments} // Bind the value to state
            onChange={e => setComments(e.target.value)}
          />
        </Box>

        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', gap: 6, p: 4 }}>
          <Button variant='outlined' fullWidth sx={{ p: 4 }} onClick={handleClose}>
            CANCEL
          </Button>

          <LoadingButton variant='contained' fullWidth sx={{ p: 4 }} onClick={handleDiscardClick}>
            DISCARD
          </LoadingButton>
        </Box>
      </Card>
    </Dialog>
  )
}

export default DiscardDialogBox
