import { useTheme } from '@mui/material/styles'
import { Typography, Box, Divider, Menu, MenuItem, IconButton, Avatar } from '@mui/material'
import React, { useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'
import AnimalMortalityEditDrawer from 'src/views/pages/housing/animals/AnimalMortalityEditDrawer'
import RenderUtility from 'src/utility/render'
import { useRouter } from 'next/router'
import { getAnimalMortalityReport, getCarcassCondition, getCarcassDeposition, getMannerOfDeath, revokeAnimalMortality } from 'src/lib/api/housing'
import Utility from 'src/utility'
import AnimalRevokeDrawer from 'src/views/pages/housing/animals/AnimalRevokeDrawer'

const AnimalMortality = () => {
  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query
  const [anchorEl, setAnchorEl] = useState(null)
  const [openEditMortalityDrawer, setOpenMortalityDrawer] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mortality, setMortality] = useState({})
  const [mannerOfDeath, setMannerOfDeath] = useState([])
  const [carcassCondition, setCarcassCondition] = useState([])
  const [carcassDeposition, setCarcassDeposition] = useState([])
  const [refetch, setRefetch] = useState(false)
  const [openRevokeDrawer, setOpenRevokeDrawer] = useState(false)

  // Open menu
  const handleMenuOpen = event => {
    setAnchorEl(event.currentTarget)
  }

  // Close menu
  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const fetchMannerOfDeath = async () => {
    const params = {}
    try {
      await getMannerOfDeath(params).then(res => {
        if (res?.is_success === true) {
          setMannerOfDeath(res?.data.map(item => ({
            value: item?.id,
            label: item?.name
          })))
        }
      })
    } catch (error) {
      console.error(error, "Cannot fetch manner of death")
    }
  }

  const fetchCarcassCondition = async () => {
    const params = {}
    try {
      await getCarcassCondition(params).then(res => {
        if (res?.is_success === true) {
          setCarcassCondition(res?.data?.map(item => ({
            value: item?.id,
            label: item?.name
          })))
        }
      })
    } catch (error) {
      console.error(error, "Canot fetch Carcass Condition")
    }
  }

  const fetchCarcassDeposition = async () => {
    const params = {}
    try {
      await getCarcassDeposition(params).then(res => {
        if (res?.is_success === true) {
          setCarcassDeposition(res?.data?.map(item => ({
            value: item?.id,
            label: item?.name
          })))
        }
      })
    } catch (error) {
      console.error(error, "Canot fetch Carcass Condition")
    }
  }

  useEffect(() => {
    fetchMannerOfDeath()
    fetchCarcassCondition()
    fetchCarcassDeposition()
  }, [])

  useEffect(() => {
    const getMortalityData = async () => {
      try {
        setLoading(true)

        const params = {
          entity_id: id,
          type: 'animal'
        }

        await getAnimalMortalityReport(params).then(res => {
          if (res?.success) {
            setMortality(res?.data[0])
          }
        })
      } catch (error) {

      }
    }

    getMortalityData()
  }, [id, refetch])

  const mortalityData = [
    {
      label: 'Suspected Cause of Death',
      value: mortality?.manner_of_death
    },
    {
      label: 'Discovered Time and Date',
      value: (
        <>
          {Utility?.formatDisplayDate(mortality?.discovered_date)}
          <span style={{ margin: '0 8px', color: '#aaa' }}>•</span>
          {Utility?.convertUTCToLocaltime(mortality?.discovered_date)}
        </>
      )
    },
    {
      label: 'Carcass Condition',
      value: mortality?.carcass_condition
    },
    {
      label: 'Carcass Disposition',
      value: mortality?.carcass_disposition
    },
    {
      label: 'Notes',
      value: mortality?.notes
    },
    {
      label: 'Necropsy Requested',
      value: `${mortality?.submitted_for_necropsy === "1" ? 'Yes' : 'No'
        }`
    }
  ]

  const createdBy = mortality?.reported_by
  const createdAt = `${Utility?.formatDisplayDate(mortality?.reported_on)} | ${Utility?.convertUTCToLocaltime(mortality?.reported_on)}`

  const handleMortalityEdit = () => {
    setOpenMortalityDrawer(true)
    handleMenuClose()
  }

  return (
    <>
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography sx={{ fontSize: '20px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
            Mortality Report
          </Typography>
          <IconButton
            size='small'
            aria-controls={anchorEl ? 'mortality-menu' : undefined}
            aria-haspopup='true'
            onClick={handleMenuOpen}
          >
            <Icon icon='mdi:dots-vertical' />
          </IconButton>
          <Menu
            id='mortality-menu'
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                border: '1px solid #37BD69',
                borderRadius: 2,
                minWidth: 120,
                boxShadow: 2,
                px: 1
              }
            }}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right'
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right'
            }}
          >
            <MenuItem
              onClick={handleMortalityEdit}
              sx={{ fontWeight: 500, p: 3, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}
            >
              Edit
            </MenuItem>
            <MenuItem
              onClick={() => {
                setOpenRevokeDrawer(true)
                setAnchorEl(false)
              }}
              sx={{ fontWeight: 500, p: 3, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant, display: 'none' }}
            >
              Revoke
            </MenuItem>
          </Menu>
        </Box>
        <Box
          sx={{
            background: '#FFBDA833',
            borderRadius: 1,
            px: { xs: 3, sm: 6 },
            py: { xs: 2, sm: 6 },
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            mt: 4
          }}
        >
          {mortalityData.map(({ label, value }) => (
            <Box key={label} sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography
                component='div'
                sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant, mb: 1, fontSize: '16px' }}
              >
                {label}
              </Typography>
              <Typography
                sx={{ fontSize: '16px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant }}
              >
                {value}
              </Typography>
            </Box>
          ))}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Avatar
              sx={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                backgroundColor: theme.palette.customColors.displaybgPrimary
              }}
            >
              <img src={mortality?.reported_by_profile_picture} alt='user-profile' style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </Avatar>
            <Box>
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 500,
                  letterSpacing: '0.1px',
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                {createdBy}
              </Typography>
              <Typography
                sx={{
                  fontSize: '12px',
                  fontWeight: 400,
                  letterSpacing: 0,
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                {createdAt}
              </Typography>
            </Box>
          </Box>

        </Box>
      </Box>
      {openEditMortalityDrawer && (
        <AnimalMortalityEditDrawer
          open={openEditMortalityDrawer}
          setDrawerOpen={setOpenMortalityDrawer}
          mortalityData={mortality}
          mannerOfDeath={mannerOfDeath}
          carcassCondition={carcassCondition}
          carcassDeposition={carcassDeposition}
          refetch={refetch}
          setRefetch={setRefetch}
        />
      )}
      {openRevokeDrawer && (
        <AnimalRevokeDrawer
          open={openRevokeDrawer}
          setDrawerOpen={setOpenRevokeDrawer}
          mortalityId={mortality?.mortality_id}
        />
      )}
    </>
  )
}

export default AnimalMortality
