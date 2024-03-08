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

  function convertToTitleCase(str) {
    const words = str?.split(/(?=[A-Z])/)
    const titleCaseWords = words?.map(word => {
      const firstLetter = word?.charAt(0).toUpperCase()
      const restOfWord = word?.slice(1)

      return firstLetter + restOfWord
    })
    const titleCaseStr = titleCaseWords?.join(' ')

    return titleCaseStr
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
              label={FeedDetailsValue.active === 1 ? 'Active' : 'InActive'}
              color={FeedDetailsValue?.active === 1 ? roleColors.active : roleColors.inactive}
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
                    {FeedDetailsValue.ingredients} ingredients
                  </Typography>
                  {/* <Typography variant='body2'>Task Done</Typography> */}
                </div>
              </Box>
              {/* <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CustomAvatar skin='light' variant='rounded' sx={{ mr: 3 }}>
                  <Icon icon='mdi:briefcase-variant-outline' />
                </CustomAvatar>
                <div>
                  <Typography variant='h6' sx={{ lineHeight: 1.3 }}>
                    568
                  </Typography>
                  <Typography variant='body2'>Project Done</Typography>
                </div>
              </Box> */}
            </Box>
          </CardContent>

          {/* <CardContent>
            <Typography variant='h6'>Details</Typography>
            <Divider sx={{ mt: theme => `${theme.spacing(4)} !important` }} />
            <Box sx={{ pt: 2, pb: 1 }}>
              <Box sx={{ display: 'flex', mb: 2.7 }}>
                <Typography variant='subtitle2' sx={{ mr: 2, color: 'text.primary' }}>
                  Username:
                </Typography>
                <Typography variant='body2'>@{data.username}</Typography>
              </Box>
              <Box sx={{ display: 'flex', mb: 2.7 }}>
                <Typography variant='subtitle2' sx={{ mr: 2, color: 'text.primary' }}>
                  Billing Email:
                </Typography>
                <Typography variant='body2'>{data.email}</Typography>
              </Box>
              <Box sx={{ display: 'flex', mb: 2.7 }}>
                <Typography variant='subtitle2' sx={{ mr: 2, color: 'text.primary' }}>
                  Status:
                </Typography>
                <CustomChip
                  skin='light'
                  size='small'
                  label={data.status}
                  color={statusColors[data.status]}
                  sx={{
                    height: 20,
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    borderRadius: '5px',
                    textTransform: 'capitalize'
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', mb: 2.7 }}>
                <Typography sx={{ mr: 2, fontWeight: 500, fontSize: '0.875rem' }}>Role:</Typography>
                <Typography variant='body2' sx={{ textTransform: 'capitalize' }}>
                  {data.role}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', mb: 2.7 }}>
                <Typography sx={{ mr: 2, fontWeight: 500, fontSize: '0.875rem' }}>Tax ID:</Typography>
                <Typography variant='body2'>Tax-8894</Typography>
              </Box>
              <Box sx={{ display: 'flex', mb: 2.7 }}>
                <Typography sx={{ mr: 2, fontWeight: 500, fontSize: '0.875rem' }}>Contact:</Typography>
                <Typography variant='body2'>+1 {data.contact}</Typography>
              </Box>
              <Box sx={{ display: 'flex', mb: 2.7 }}>
                <Typography sx={{ mr: 2, fontWeight: 500, fontSize: '0.875rem' }}>Language:</Typography>
                <Typography variant='body2'>English</Typography>
              </Box>
              <Box sx={{ display: 'flex' }}>
                <Typography sx={{ mr: 2, fontWeight: 500, fontSize: '0.875rem' }}>Country:</Typography>
                <Typography variant='body2'>{data.country}</Typography>
              </Box>
            </Box>
          </CardContent> */}

          <CardActions sx={{ display: 'flex', justifyContent: 'center' }}>
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
