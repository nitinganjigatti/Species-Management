import React, { useState } from 'react'
import { Box, Typography, Button, IconButton, Switch, TextField, Avatar } from '@mui/material'
import { Icon } from '@iconify/react'
import { useTheme } from '@mui/material/styles'
import UserInfoCard from 'src/views/utility/insights/UserInfoCard'
import { styled } from '@mui/material/styles'
import UploadAnimalDiet from './UploadAnimalDiet'

const GreenSwitch = styled(Switch)(({ theme }) => ({
  width: 45.5,
  height: 28,
  padding: 0,
  borderRadius: '20px',
  display: 'flex',
  '&:active .MuiSwitch-thumb': {
    width: 21
  },
  '& .MuiSwitch-switchBase': {
    padding: 3,
    '&.Mui-checked': {
      transform: 'translateX(18px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        backgroundColor: '#4CAF50', // ✅ Green background
        opacity: 1
      }
    }
  },
  '& .MuiSwitch-thumb': {
    boxShadow: '0 2px 4px 0 rgb(0 0 0 / 20%)',
    width: 22,
    height: 22,
    borderRadius: '50%',
    backgroundColor: '#fff'
  },
  '& .MuiSwitch-track': {
    borderRadius: 26 / 2,
    backgroundColor: '#ccc',
    opacity: 1,
    transition: theme.transitions.create(['background-color'], {
      duration: 500
    })
  }
}))

const activeDietData = [
  {
    id: 1,
    fileName: 'Diet_Ringneck Parakeet.pdf',
    uploadedBy: 'Sourav',
    role: 'Dietitian',
    createdBy: {
      name: 'Jordan Stevenson',
      timestamp: '14 Apr 2024 | 12 : 35 PM',
      avatarUrl: ''
    },
    isActive: true,
    notes:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam'
  },
  {
    id: 2,
    fileName: 'Diet_Sun Conure.pdf',
    uploadedBy: 'Amit',
    role: 'Dietitian',
    createdBy: {
      name: 'Sarah Mills',
      timestamp: '12 Apr 2024 | 03 : 20 PM',
      avatarUrl: ''
    },
    isActive: true,
    notes: 'No significant changes in diet this week.'
  },
  {
    id: 3,
    fileName: 'Diet_Cockatoo.pdf',
    uploadedBy: 'Rhea',
    role: 'Assistant',
    createdBy: {
      name: 'Daniel Costa',
      timestamp: '10 Apr 2024 | 08 : 15 AM',
      avatarUrl: ''
    },
    isActive: true,
    notes: 'Include extra sunflower seeds for feather growth.'
  }
]
const inActiveDietData = [
  {
    id: 1,
    fileName: 'Diet_Ringneck Parakeet.pdf',
    uploadedBy: 'Sourav',
    role: 'Dietitian',
    createdBy: {
      name: 'Jordan Stevenson',
      timestamp: '14 Apr 2024 | 12 : 35 PM',
      avatarUrl: ''
    },
    isActive: false,
    notes: 'Lorem ipsum dolordunt ut labore et dolore magna aliqua. Ut enim ad minim veniam'
  },
  {
    id: 2,
    fileName: 'Diet_Sun Conure.pdf',
    uploadedBy: 'Amit',
    role: 'Dietitian',
    createdBy: {
      name: 'Sarah Mills',
      timestamp: '12 Apr 2024 | 03 : 20 PM',
      avatarUrl: ''
    },
    isActive: false,
    notes: 'No significant changes in diet this week.'
  },
  {
    id: 3,
    fileName: 'Diet_Cockatoo.pdf',
    uploadedBy: 'Rhea',
    role: 'Assistant',
    createdBy: {
      name: 'Daniel Costa',
      timestamp: '10 Apr 2024 | 08 : 15 AM',
      avatarUrl: ''
    },
    isActive: false,
    notes: 'Include extra sunflower seeds for feather growth.'
  }
]

const AnimalDiet = () => {
  const theme = useTheme()
  const [selectedTab, setSelectedTab] = useState('active') // or 'inactive'
  const [animalId, setAnimalId] = useState(123) // or 'inactive'


  const [activeDietData, setActiveDietData] = useState(
    [
      {
        id: 1,
        fileName: 'Diet_Ringneck Parakeet.pdf',
        uploadedBy: 'Sourav',
        role: 'Dietitian',
        createdBy: {
          name: 'Jordan Stevenson',
          timestamp: '14 Apr 2024 | 12 : 35 PM',
          avatarUrl: ''
        },
        isActive: true,
        notes:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam'
      },
      {
        id: 2,
        fileName: 'Diet_Sun Conure.pdf',
        uploadedBy: 'Amit',
        role: 'Dietitian',
        createdBy: {
          name: 'Sarah Mills',
          timestamp: '12 Apr 2024 | 03 : 20 PM',
          avatarUrl: ''
        },
        isActive: true,
        notes: 'No significant changes in diet this week.'
      },
      {
        id: 3,
        fileName: 'Diet_Cockatoo.pdf',
        uploadedBy: 'Rhea',
        role: 'Assistant',
        createdBy: {
          name: 'Daniel Costa',
          timestamp: '10 Apr 2024 | 08 : 15 AM',
          avatarUrl: ''
        },
        isActive: true,
        notes: 'Include extra sunflower seeds for feather growth.'
      }
    ])
  const [inActiveDietData, setInActiveDietData] = useState([
    {
      id: 1,
      fileName: 'Diet_Ringneck Parakeet.pdf',
      uploadedBy: 'Sourav',
      role: 'Dietitian',
      createdBy: {
        name: 'Jordan Stevenson',
        timestamp: '14 Apr 2024 | 12 : 35 PM',
        avatarUrl: ''
      },
      isActive: false,
      notes: 'Lorem ipsum dolordunt ut labore et dolore magna aliqua. Ut enim ad minim veniam'
    },
    {
      id: 2,
      fileName: 'Diet_Sun Conure.pdf',
      uploadedBy: 'Amit',
      role: 'Dietitian',
      createdBy: {
        name: 'Sarah Mills',
        timestamp: '12 Apr 2024 | 03 : 20 PM',
        avatarUrl: ''
      },
      isActive: false,
      notes: 'No significant changes in diet this week.'
    },
    {
      id: 3,
      fileName: 'Diet_Cockatoo.pdf',
      uploadedBy: 'Rhea',
      role: 'Assistant',
      createdBy: {
        name: 'Daniel Costa',
        timestamp: '10 Apr 2024 | 08 : 15 AM',
        avatarUrl: ''
      },
      isActive: false,
      notes: 'Include extra sunflower seeds for feather growth.'
    }
  ])
  const [dietStates, setDietStates] = useState(
    (selectedTab === 'active' ? activeDietData : inActiveDietData).map(d => d.isActive)
  )

  const [uploadAnimalDietDrawer, setUploadAnimalDietDrawer] = useState(false) // or 'inactive'
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Header */}
        <Typography
          sx={{ fontWeight: 500, fontSize: 20, letterSpacing: 0, color: theme.palette.customColors.OnSurfaceVariant }}
        >
          Diet Attached (3)
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          {/* Tabs */}

          <Box sx={{ display: 'flex', gap: '12px' }}>
            <Button
              onClick={() => setSelectedTab('active')}
              variant={selectedTab === 'active' ? 'contained' : 'text'}
              sx={{
                fontSize: 14,
                fontWeight: 500,
                letterSpacing: '0.1px',
                color:
                  selectedTab === 'active'
                    ? theme.palette.primary.contrastText
                    : theme.palette.customColors.OnSurfaceVariant,
                backgroundColor:
                  selectedTab === 'active'
                    ? theme.palette.customColors.OnPrimaryContainer
                    : theme.palette.customColors.displaybgSecondary,
                '&:hover': {
                  backgroundColor:
                    selectedTab === 'active'
                      ? theme.palette.customColors.OnPrimaryContainer
                      : theme.palette.customColors.displaybgSecondary
                }
              }}
            >
              Active diets - 1
            </Button>

            <Button
              onClick={() => setSelectedTab('inactive')}
              variant={selectedTab === 'inactive' ? 'contained' : 'text'}
              sx={{
                fontSize: 14,
                fontWeight: 500,
                letterSpacing: '0.1px',
                color:
                  selectedTab === 'inactive'
                    ? theme.palette.primary.contrastText
                    : theme.palette.customColors.OnSurfaceVariant,
                backgroundColor:
                  selectedTab === 'inactive'
                    ? theme.palette.customColors.OnPrimaryContainer
                    : theme.palette.customColors.displaybgSecondary,
                '&:hover': {
                  backgroundColor:
                    selectedTab === 'inactive'
                      ? theme.palette.customColors.OnPrimaryContainer
                      : theme.palette.customColors.displaybgSecondary
                }
              }}
            >
              Inactive diets - 2
            </Button>
          </Box>
          <Box sx={{ display: 'flex', gap: '8px' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                borderRadius: '8px',
                padding: '0 8px',
                height: '40px'
              }}
            >
              <Icon icon='mi:search' color={theme.palette.customColors.neutralSecondary} />
              <TextField
                variant='outlined'
                placeholder='Search...'
                onChange={e => {
                  setSearchValue(e.target.value)
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    border: 'none',
                    borderRadius: '90px',
                    padding: '0',
                    '& fieldset': {
                      border: 'none'
                    }
                  }
                }}
              />
            </Box>
            <Button onClick={() => setUploadAnimalDietDrawer(true)} sx={{ height: '38px' }} variant='contained'>
              <Icon icon='mdi:plus' /> Upload
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Diet Card */}
      {(selectedTab === 'active' ? activeDietData : inActiveDietData).map((diet, index) => (
        <Box
          key={diet.id}
          sx={{
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: selectedTab === 'active' ? 'transparent' : theme.palette.customColors.mdAntzNeutral,
            // border: selectedTab === 'active' ? `1px solid ${theme.palette.customColors.OutlineVariant}` : 'none',
            border: `1px solid ${selectedTab === 'active'
                ? theme.palette.customColors.OutlineVariant
                : 'transparent' // or use a light transparent color
              }`,
            borderRadius: '8px',
            gap: '24px',
            p: '16px',
            mb: 3
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Left: File Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Box
                sx={{
                  backgroundColor: '#FFE7E7',
                  p: 1,
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {/* <Icon icon='mdi:file-pdf-box' width={48} height={48} color='#F44336' /> */}
                <Avatar
                  variant='rounded'
                  alt='Medicine Image'
                  sx={{
                    pt: '6px',
                    width: 48,
                    height: 48,
                    background: theme.palette.customColors.avatarBackground,
                    overflow: 'hidden'
                  }}
                >
                  <img style={{ width: '100%', height: '100%' }} src={'/icons/pdf_icon2.svg'} alt='pdf' />
                </Avatar>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Typography
                  sx={{
                    fontSize: 16,
                    fontWeight: 500,
                    letterSpacing: 0,
                    color: theme.palette.customColors.OnSurfaceVariant
                  }}
                >
                  {diet.fileName}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: 400,
                    letterSpacing: 0,
                    color: theme.palette.customColors.OnSurfaceVariant
                  }}
                >
                  {diet.uploadedBy} • {diet.role}
                </Typography>
              </Box>
            </Box>

            {/* Right: User Info, Switch, Delete */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <UserInfoCard
                avatarUrl={diet.createdBy.avatarUrl}
                name={diet.createdBy.name}
                description={diet.createdBy.timestamp}
                textColor={theme.palette.customColors.OnSurfaceVariant}
                fontWeight={500}
              />
              {/* <GreenSwitch defaultChecked={diet.isActive} /> */}
              <GreenSwitch
                checked={diet.isActive}
                onChange={() => {
                  if (selectedTab === 'active') {
                    const updated = [...activeDietData]
                    updated[index].isActive = !updated[index].isActive
                    setActiveDietData(updated)
                  } else {
                    const updated = [...inActiveDietData]
                    updated[index].isActive = !updated[index].isActive
                    setInActiveDietData(updated)
                  }
                }}
              />
              <IconButton>
                <Icon icon='mdi:trash-can-outline' color={theme.palette.customColors.OnSurfaceVariant} />
              </IconButton>
            </Box>
          </Box>

          {/* Notes Section */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              backgroundColor:
                selectedTab === 'active'
                  ? theme.palette.customColors.antzNotesLight
                  : theme.palette.customColors.mdAntzNeutral,
              borderRadius: 1,
              p: '12px'
            }}
          >
            <Typography sx={{ fontSize: 12, fontWeight: 400, color: theme.palette.customColors.neutralPrimary }}>
              Notes
            </Typography>
            <Typography sx={{ fontSize: 14, color: theme.palette.customColors.OnTertiaryContainer, fontWeight: 400 }}>
              {diet.notes}
            </Typography>
          </Box>
        </Box>
      ))}

      <UploadAnimalDiet
        animalId={animalId}
        setAnimalId={setAnimalId}
        uploadAnimalDietDrawer={uploadAnimalDietDrawer}
        setUploadAnimalDietDrawer={setUploadAnimalDietDrawer} />
    </Box>
  )
}

export default AnimalDiet
