import { useTheme } from '@mui/material/styles'
import { Typography, Box, Divider, Menu, MenuItem, IconButton, Avatar } from '@mui/material'
import React, { useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'
import AnimalMortalityEditDrawer from 'src/views/pages/housing/animals/AnimalMortalityEditDrawer'
import RenderUtility from 'src/utility/render'
import useSafeRouter from 'src/hooks/useSafeRouter'
import {
  getAnimalMortalityReport,
  getCarcassCondition,
  getCarcassDeposition,
  getMannerOfDeath,
  revokeAnimalMortality
} from 'src/lib/api/housing'
import Utility from 'src/utility'
import AnimalRevokeDrawer from 'src/views/pages/housing/animals/AnimalRevokeDrawer'
import { AnimalOverview, Mortality, SelectOption } from 'src/types/housing'
import { useTranslation } from 'react-i18next'

interface AnimalMortalityProps {
  animalDetails: AnimalOverview | null
}

interface MortalityDataItem {
  label: string
  value: React.ReactNode
}

const AnimalMortality: React.FC<AnimalMortalityProps> = ({ animalDetails }) => {
  const theme = useTheme() as any
  const router = useSafeRouter()
  const { id } = router.query
  const { t } = useTranslation()
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [openEditMortalityDrawer, setOpenMortalityDrawer] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [mortality, setMortality] = useState<Mortality>({} as Mortality)
  const [mannerOfDeath, setMannerOfDeath] = useState<SelectOption[]>([])
  const [carcassCondition, setCarcassCondition] = useState<SelectOption[]>([])
  const [carcassDeposition, setCarcassDeposition] = useState<SelectOption[]>([])
  const [refetch, setRefetch] = useState<boolean>(false)
  const [openRevokeDrawer, setOpenRevokeDrawer] = useState<boolean>(false)

  // Open menu
  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>): void => {
    setAnchorEl(event.currentTarget)
  }

  // Close menu
  const handleMenuClose = (): void => {
    setAnchorEl(null)
  }

  const fetchMannerOfDeath = async (): Promise<void> => {
    try {
      await getMannerOfDeath().then((res: any) => {
        if (res?.is_success === true) {
          setMannerOfDeath(
            res?.data.map((item: any) => ({
              value: item?.id,
              label: item?.name
            }))
          )
        }
      })
    } catch (error) {
      console.error(error, 'Cannot fetch manner of death')
    }
  }

  const fetchCarcassCondition = async (): Promise<void> => {
    try {
      await getCarcassCondition().then((res: any) => {
        if (res?.is_success === true) {
          setCarcassCondition(
            res?.data?.map((item: any) => ({
              value: item?.id,
              label: item?.name
            }))
          )
        }
      })
    } catch (error) {
      console.error(error, 'Cannot fetch Carcass Condition')
    }
  }

  const fetchCarcassDeposition = async (): Promise<void> => {
    try {
      await getCarcassDeposition().then((res: any) => {
        if (res?.is_success === true) {
          setCarcassDeposition(
            res?.data?.map((item: any) => ({
              value: item?.id,
              label: item?.name
            }))
          )
        }
      })
    } catch (error) {
      console.error(error, 'Cannot fetch Carcass Deposition')
    }
  }

  useEffect(() => {
    fetchMannerOfDeath()
    fetchCarcassCondition()
    fetchCarcassDeposition()
  }, [])

  useEffect(() => {
    const getMortalityData = async (): Promise<void> => {
      const animalId = Array.isArray(id) ? id[0] : id
      if (!animalId) return
      try {
        setLoading(true)

        const params = {
          entity_id: animalId,
          type: 'animal' as const
        }

        await getAnimalMortalityReport(params).then((res: any) => {
          if (res?.success) {
            setMortality(res?.data[0])
          }
        })
      } catch (error) {}
    }

    getMortalityData()
  }, [id, refetch])

  const mortalityData: MortalityDataItem[] = [
    {
      label: t('animals_module.suspected_cause_of_death'),
      value: mortality?.manner_of_death
    },
    {
      label: t('animals_module.discovered_time_and_date'),
      value: (
        <>
          {Utility?.formatDisplayDate(mortality?.discovered_date)}
          <span style={{ margin: '0 8px', color: '#aaa' }}>•</span>
          {Utility?.convertUTCToLocaltime(mortality?.discovered_date)}
        </>
      )
    },
    {
      label: t('animals_module.carcass_condition'),
      value: mortality?.carcass_condition
    },
    {
      label: t('animals_module.carcass_disposition'),
      value: mortality?.carcass_disposition
    },
    {
      label: t('notes'),
      value: mortality?.notes
    },
    {
      label: t('animals_module.necropsy_requested'),
      value: `${mortality?.submitted_for_necropsy === '1' ? t('yes') : t('no')}`
    }
  ]

  const createdBy = mortality?.reported_by

  const createdAt = `${Utility?.formatDisplayDate(mortality?.reported_on)} | ${Utility?.convertUTCToLocaltime(
    mortality?.reported_on
  )}`

  const handleMortalityEdit = (): void => {
    setOpenMortalityDrawer(true)
    handleMenuClose()
  }

  return (
    <>
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography sx={{ fontSize: '20px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
            {t('animals_module.mortality_report')}
          </Typography>
          {animalDetails?.is_necropsy ||
          animalDetails?.is_deleted === '1' ||
          animalDetails?.animal_transfered !== '1' ? null : (
            <>
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
                    border: `1px solid ${theme.palette.primary.main}`,
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
                  {t('edit')}
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setOpenRevokeDrawer(true)
                    setAnchorEl(null)
                  }}
                  sx={{
                    fontWeight: 500,
                    p: 3,
                    fontSize: '16px',
                    color: theme.palette.customColors.OnSurfaceVariant,
                    display: 'none'
                  }}
                >
                  {t('animals_module.revoke')}
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
        <Box
          sx={{
            background: theme.palette.customColors?.Tertiary20,
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
              <img
                src={mortality?.reported_by_profile_picture}
                alt='user-profile'
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
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
          mortalityData={mortality as any}
          mannerOfDeath={mannerOfDeath as any}
          carcassCondition={carcassCondition as any}
          carcassDeposition={carcassDeposition as any}
          refetch={refetch}
          setRefetch={setRefetch}
        />
      )}
      {openRevokeDrawer && (
        <AnimalRevokeDrawer
          open={openRevokeDrawer}
          setDrawerOpen={setOpenRevokeDrawer}
          mortalityId={String(mortality?.mortality_id || '')}
        />
      )}
    </>
  )
}

export default AnimalMortality
