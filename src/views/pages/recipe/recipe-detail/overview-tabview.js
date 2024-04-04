import { useState } from 'react'
import { Grid, Box, Typography, Chip, Divider, Avatar } from '@mui/material'
import Icon from 'src/@core/components/icon'
import moment from 'moment'

const RecipeOverviewTabView = ({ IngredientsDetailsval }) => {
  const [expanded, setExpanded] = useState(false)
  const toggleExpanded = () => {
    setExpanded(!expanded)
  }

  const convertToTitleCase = str => {
    if (!str) return ''

    const firstLetter = str.charAt(0).toUpperCase()
    const restOfWord = str.slice(1).toLowerCase()

    return firstLetter + restOfWord
  }
  return (
    <Grid>
      {IngredientsDetailsval.desc ? (
        <div>
          <Typography sx={{ mb: 2, fontSize: '16px', fontWeight: '600' }}>Description</Typography>
          <Typography
            variant='body2'
            sx={{
              width: '100%',
              color: '#7A8684',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: expanded ? 'unset' : 3,
              WebkitBoxOrient: 'vertical',
              transition: 'max-height 2s ease-in-out',
              maxHeight: expanded ? '1000px' : '60px'
            }}
          >
            {convertToTitleCase(IngredientsDetailsval.desc)}
          </Typography>
          {IngredientsDetailsval.desc.length > 180 ? (
            <Typography
              onClick={toggleExpanded}
              sx={{
                mt: 1,
                fontWeight: '600',
                fontSize: '13px',
                textDecoration: 'underline',
                color: '#000',
                cursor: 'pointer',
                float: 'right',
                paddingBottom: '30px'
              }}
            >
              {expanded ? 'View less' : 'View more'}
            </Typography>
          ) : (
            ''
          )}
        </div>
      ) : (
        ''
      )}
      <div>
        <Divider sx={{ mt: 4, borderColor: '#C3CEC7' }} />
        <Box className='demo-space-x' sx={{ display: 'flex' }}>
          <Avatar
            src={
              IngredientsDetailsval?.created_by_user ? IngredientsDetailsval.created_by_user?.profile_pic : undefined
            }
            alt={IngredientsDetailsval?.created_by_user ? IngredientsDetailsval?.created_by_user?.user_name : 'User'}
          >
            {!IngredientsDetailsval.created_by_user ? <Icon icon='mdi:user' /> : null}
          </Avatar>
          <Typography sx={{ color: '#000000' }}>
            {IngredientsDetailsval?.created_by_user ? IngredientsDetailsval?.created_by_user?.user_name : '-'} <br />
            <div style={{ color: '#44544A', fontSize: 12, margin: 0 }}>
              {'Created on' + ' ' + moment(IngredientsDetailsval?.created_at).format('DD/MM/YYYY')}
            </div>
          </Typography>

          <Box sx={{ display: 'flex', marginLeft: 'auto', cursor: 'pointer' }}>
            <Typography sx={{ color: '#000000', my: 3, fontSize: 14 }}>Activity Log</Typography>
            <Icon icon='ph:clock' style={{ marginLeft: '4px', marginTop: '13px', fontSize: 20 }} />
          </Box>
        </Box>
      </div>
    </Grid>
  )
}

export default RecipeOverviewTabView
