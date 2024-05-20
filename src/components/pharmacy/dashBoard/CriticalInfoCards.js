// ** MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

// ** Custom Components Imports
import CustomAvatar from 'src/@core/components/mui/avatar'
import { styled } from '@mui/material/styles'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

const Avatar = styled(CustomAvatar)(({ theme }) => ({
  width: 40,
  height: 40,
  marginRight: theme.spacing(4)
}))

const CriticalInfoCards = ({ title, subTitle, modifiedProperties }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <Avatar
        skin='light'
        sx={{
          backgroundColor: modifiedProperties(subTitle).bgColor,
          mb: 1
        }}
        variant='rounded'
      >
        <Icon icon={modifiedProperties(subTitle).icon} color={modifiedProperties(subTitle).color} />
      </Avatar>

      <Typography
        color={modifiedProperties(subTitle).color}
        variant='h6'
        sx={{ mb: 1, width: '100%', textAlign: 'center', marginLeft: -4 }}
      >
        {title ? title : null}
      </Typography>
      <Typography variant='body2'>{subTitle ? modifiedProperties(subTitle).name : null}</Typography>
    </Box>
  )
}

export default CriticalInfoCards
