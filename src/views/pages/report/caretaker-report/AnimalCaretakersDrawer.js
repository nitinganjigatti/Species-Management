import { useState, useEffect } from 'react'
import { Box, Drawer, Typography, IconButton, Avatar, Chip, CircularProgress } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { getAnimalKeepers } from 'src/lib/api/caretaker'
import AnimalCard from 'src/views/utility/AnimalCard'

const CaretakerCard = ({ caretaker, theme }) => {
  const isPrimary = caretaker.is_primary === '1' || caretaker.is_primary === 1 || caretaker.is_primary === true
  const name = caretaker.user_name || caretaker.keeper_name || caretaker.name || caretaker.full_name || '-'
  const email = caretaker.user_email || caretaker.email || ''

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        p: 4
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <Avatar
          src={caretaker.profile_pic || caretaker.user_profile_pic}
          sx={{
            width: 48,
            height: 48,
            backgroundColor: theme.palette.customColors?.primaryLight || '#E8F5E9'
          }}
        >
          <Icon icon='mdi:account-outline' fontSize={24} color={theme.palette.primary.main} />
        </Avatar>
        <Box>
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 500,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            {name}
          </Typography>
          {email && (
            <Typography
              sx={{
                fontSize: '14px',
                color: theme.palette.text.secondary
              }}
            >
              {email}
            </Typography>
          )}
        </Box>
      </Box>
      {isPrimary && (
        <Chip
          icon={<Icon icon='mdi:crown-outline' fontSize={14} />}
          label='Primary'
          size='small'
          sx={{
            backgroundColor: '#F4E4D4',
            color: '#8B5A2B',
            fontWeight: 500,
            fontSize: '12px',
            height: '28px',
            flexShrink: 0,
            ml: 2,
            '& .MuiChip-icon': {
              color: '#8B5A2B'
            }
          }}
        />
      )}
    </Box>
  )
}

const AnimalCaretakersDrawer = ({ open, onClose, animal }) => {
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [caretakers, setCaretakers] = useState([])

  useEffect(() => {
    if (open && animal?.animal_id) {
      fetchCaretakers()
    }
  }, [open, animal])

  const fetchCaretakers = async () => {
    setLoading(true)
    try {
      const response = await getAnimalKeepers(animal.animal_id)
      if (response?.success) {
        setCaretakers(response.data?.result || response.data || [])
      }
    } catch (error) {
      console.error('Error fetching animal caretakers:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: ['100%', '450px'],
          backgroundColor: theme.palette.customColors?.lightBg || '#F5F5F5'
        }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header with Animal Card and close button */}
        <Box
          sx={{
            p: 4,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            backgroundColor: theme.palette.customColors?.lightBg || '#F5F5F5'
          }}
        >
          {animal && (
            <Box
              sx={{
                flex: 1,
                p: 3,
                backgroundColor: theme.palette.background.paper,
                borderRadius: '12px',
                mr: 2
              }}
            >
              <AnimalCard data={animal} />
            </Box>
          )}
          <IconButton
            onClick={onClose}
            size='small'
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '50%',
              flexShrink: 0
            }}
          >
            <Icon icon='mdi:close' fontSize={20} />
          </IconButton>
        </Box>

        {/* Caretakers count header */}
        <Box sx={{ px: 4, pb: 2 }}>
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 600,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            Caretakers ({caretakers.length})
          </Typography>
        </Box>

        {/* Content */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: 4,
            pb: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 3
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
              <CircularProgress />
            </Box>
          ) : caretakers.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 10 }}>
              <Typography sx={{ color: theme.palette.text.secondary }}>No caretakers assigned</Typography>
            </Box>
          ) : (
            caretakers.map((caretaker, index) => (
              <CaretakerCard key={caretaker.user_id || caretaker.id || index} caretaker={caretaker} theme={theme} />
            ))
          )}
        </Box>
      </Box>
    </Drawer>
  )
}

export default AnimalCaretakersDrawer
