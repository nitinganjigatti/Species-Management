import { Box, Button, Card, Dialog, Typography } from '@mui/material'
import React from 'react'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import { LoadingButton } from '@mui/lab'

const EditRedirectionDialog = ({
  message,
  refType,
  openRedirectionDialog,
  setOpenRedirectionDialog,
  EditRedirectionFunc
}) => {
  const theme = useTheme()

  return (
    <Dialog open={openRedirectionDialog} onClose={() => setOpenRedirectionDialog(false)}>
      <Card
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
          width: '500px',
          gap: '24px'
        }}
      >
        <Box sx={{ bgcolor: '#ffe5e5', p: '16px', borderRadius: '12px', mt: 10 }}>
          <Icon icon='tdesign:error-triangle' fontSize={'48px'} color={'#E93353'} />
        </Box>

        <Box>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '24px',
              fontWeight: 600,
              textAlign: 'center'
            }}
          >
            {`Do you want to edit this ${refType}?`}
          </Typography>

          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: 400,
              mt: 2,
              textAlign: 'center'
            }}
          >
            {`The ${refType} name is already in use. `} <br />
            {`Please rename the  ${refType} to proceed.`}
          </Typography>

          {/* {message && (
            <Typography
              sx={{
                color: theme.palette.customColors.OnSurfaceVariant,
                fontSize: '16px',
                fontWeight: 400,
                textAlign: 'center'
              }}
            >
              {message}
            </Typography>
          )} */}
        </Box>
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', gap: 6, p: 4 }}>
          <Button variant='outlined' fullWidth sx={{ p: 4 }} onClick={() => setOpenRedirectionDialog(false)}>
            No
          </Button>

          <LoadingButton variant='contained' fullWidth sx={{ p: 4 }} onClick={EditRedirectionFunc}>
            Yes
          </LoadingButton>
        </Box>
      </Card>
    </Dialog>
  )
}

export default EditRedirectionDialog
