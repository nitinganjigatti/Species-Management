import { Drawer, IconButton, Typography } from '@mui/material'
import { Box } from '@mui/system'
import Icon from 'src/@core/components/icon'
import React from 'react'
import AnimalParentCard from '../../../../utility/animalParentCard'
import { useTheme } from '@mui/material/styles'

const ProbableParent = ({ probableParentSideBar, setProbableParentSideBar, parent, parentList }) => {
  const theme = useTheme()

  return (
    <Drawer
      anchor='right'
      open={probableParentSideBar}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', 560], height: '100vh' } }}
    >
      <Box sx={{ height: '100%', backgroundColor: 'background.default' }}>
        <Box
          className='sidebar-header'
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'background.default',
            p: theme => theme.spacing(3, 3.255, 3, 5.255)
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'background.default'
            }}
          >
            <Box sx={{ mt: 2 }}>
              <img src='/icons/activity_icon.png' alt='Grocery Icon' width='30px' />
            </Box>
            <Typography variant='h6'>
              {parentList?.length > 1 && 'Probable'} {parent} - {parentList?.length}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size='small' sx={{ color: 'text.primary' }} onClick={() => setProbableParentSideBar(false)}>
              <Icon icon='mdi:close' fontSize={20} />
            </IconButton>
          </Box>
        </Box>

        <Box
          sx={{
            backgroundColor: 'background.default',
            px: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            pb: '24px'
          }}
        >
          {parentList?.length &&
            parentList?.map((item, i) => (
              <AnimalParentCard backgroundColor={theme.palette.primary.contrastText} key={i} data={item} />
            ))}
        </Box>
      </Box>
    </Drawer>
  )
}

export default ProbableParent
