import { useState, useEffect } from 'react'
import { Box, Chip, CircularProgress, Drawer, IconButton, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { getKeeperAnimals } from 'src/lib/api/caretaker'
import AnimalCard from 'src/views/utility/AnimalCard'

const AnimalListItem = ({ animal, theme }) => {
  const isPrimary = animal.is_primary === '1' || animal.is_primary === 1 || animal.is_primary === true

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        width: '100%',
        p: 4
      }}
    >
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <AnimalCard data={animal} />
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

const UserAnimalsDrawer = ({ open, onClose, user }) => {
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [animals, setAnimals] = useState([])

  useEffect(() => {
    if (open && user?.user_id) {
      fetchAnimals()
    }
  }, [open, user])

  const fetchAnimals = async () => {
    setLoading(true)
    try {
      const response = await getKeeperAnimals(user.user_id)
      if (response?.success && response?.data) {
        setAnimals(response.data?.result || response.data || [])
      }
    } catch (error) {
      console.error('Error fetching user animals:', error)
    } finally {
      setLoading(false)
    }
  }

  const userName = user?.keeper_name || user?.user_name || 'User'

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
        {/* Header */}
        <Box
          sx={{
            p: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: theme.palette.customColors?.lightBg || '#F5F5F5'
          }}
        >
          <Typography
            sx={{
              fontSize: '20px',
              fontWeight: 600,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            {userName}'s Animals ({animals.length})
          </Typography>
          <IconButton
            onClick={onClose}
            size='small'
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '50%'
            }}
          >
            <Icon icon='mdi:close' fontSize={20} />
          </IconButton>
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
          ) : animals.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 10 }}>
              <Typography sx={{ color: theme.palette.text.secondary }}>No animals assigned</Typography>
            </Box>
          ) : (
            animals.map(animal => (
              <AnimalListItem key={animal.animal_id} animal={animal} theme={theme} />
            ))
          )}
        </Box>
      </Box>
    </Drawer>
  )
}

export default UserAnimalsDrawer
