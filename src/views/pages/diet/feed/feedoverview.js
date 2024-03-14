import { Avatar, Button, Card, CardContent, Typography } from '@mui/material'

// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import CardActions from '@mui/material/CardActions'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Custom Components
import CustomChip from 'src/@core/components/mui/chip'
import CustomAvatar from 'src/@core/components/mui/avatar'
import { useRouter } from 'next/router'
import Router from 'next/router'

// ** Utils Import
import { getInitials } from 'src/@core/utils/get-initials'

const data = {
  id: 1,
  role: 'maintainer',
  status: 'active',
  username: 'gslixby0',
  avatarColor: 'primary',
  country: 'El Salvador',
  company: 'Yotz PVT LTD',
  contact: '(479) 232-9151',
  currentPlan: 'enterprise',
  fullName: 'Commercial feed',
  email: 'gslixby0@abc.net.au',
  avatar: '/images/avatars/4.png'
}

const roleColors = {
  active: 'success',
  inactive: 'error'
}

const FeedOverview = ({ FeedDetailsValue }) => {
  const handleEditClickOpen = () => setOpenEdit(true)
  const router = useRouter()

  const convertToTitleCase = str => {
    if (!str) return ''

    const firstLetter = str.charAt(0).toUpperCase()
    const restOfWord = str.slice(1).toLowerCase()

    return firstLetter + restOfWord
  }

  if (FeedDetailsValue) {
    return (
      <Grid item xs={4}>
        <Card>
          <CardContent sx={{ pt: 10, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
            <Typography variant='h6' sx={{ mb: 10 }}>
              Feed Type
            </Typography>
            {console.log(FeedDetailsValue, 'FeedDetailsValue')}
            <CustomAvatar
              src={FeedDetailsValue.feed_type_image ? FeedDetailsValue.feed_type_image : ''}
              variant='rounded'
              alt={FeedDetailsValue.feed_type_name}
              sx={{ width: 120, height: 120, fontWeight: 400, mb: 4 }}
            />
            <Typography variant='h7' sx={{ mb: 2, fontWeight: 500 }}>
              {convertToTitleCase(FeedDetailsValue.feed_type_name)}
            </Typography>
            <CustomChip
              skin='light'
              size='small'
              label={FeedDetailsValue.active === '1' ? 'Active' : 'InActive'}
              color={FeedDetailsValue?.active === '1' ? roleColors.active : roleColors.inactive}
              sx={{
                height: 20,
                fontWeight: 600,
                borderRadius: '5px',
                fontSize: '0.875rem',
                textTransform: 'capitalize',
                '& .MuiChip-label': { mt: -0.25 }
              }}
            />
          </CardContent>

          <CardContent sx={{ my: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'left', justifyContent: 'left' }}>
              <Box sx={{ mr: 8, display: 'flex', alignItems: 'left' }}>
                {FeedDetailsValue.image ? (
                  <CustomAvatar skin='light' variant='rounded' sx={{ mr: 3 }}>
                    <Avatar sx={{ width: 24, height: 24 }} src={FeedDetailsValue.image} />
                  </CustomAvatar>
                ) : (
                  <CustomAvatar skin='light' variant='rounded' sx={{ mr: 3 }}>
                    <Icon icon='arcticons:recipe-keeper' />
                  </CustomAvatar>
                )}
                <div>
                  <Typography variant='h6' sx={{ lineHeight: 1.9 }}>
                    {FeedDetailsValue.ingredients} Ingredients
                  </Typography>
                  {/* <Typography variant='body2'>Task Done</Typography> */}
                </div>
              </Box>
            </Box>
          </CardContent>

          <CardActions
            sx={{ display: 'flex', justifyContent: 'center' }}
            onClick={() => Router.push({ pathname: '/diet/feed/add-feed', query: { id: FeedDetailsValue?.id } })}
          >
            <Button variant='outlined' sx={{ mr: 2, mt: 2, pl: 40, pr: 40 }}>
              Edit
            </Button>
          </CardActions>
        </Card>
      </Grid>
    )
  } else {
    return null
  }
}

export default FeedOverview
