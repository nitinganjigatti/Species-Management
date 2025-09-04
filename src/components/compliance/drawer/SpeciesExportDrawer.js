import {
  alpha,
  Box,
  Chip,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  Paper,
  Skeleton,
  Typography,
  useTheme
} from '@mui/material'
import React, { useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'
import { getShipmentSpeciesData } from 'src/lib/api/compliance/shipment'

const SpeciesExportDrawer = ({ open, onClose, shipmentId, shipmentNumber }) => {
  const theme = useTheme()

  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({})
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const getExportSpecies = async () => {
      setLoading(true)
      try {
        await getShipmentSpeciesData(shipmentId).then(res => {
          if (res?.success === true) {
            setData(res?.data)
            setLoading(false)
          }
        })
      } catch (error) {
        console.error(error, 'Cannot Fetch Species Export')
      }
    }

    getExportSpecies()
  }, [shipmentId])

  const SpeciesRow = ({ species }) => (
    <Box
      display='flex'
      flexDirection='column'
      gap={4}
      sx={{
        borderBottom: `1px solid ${theme.palette.customColors.mdAntzNeutral}`,
        px: 4,
        pb: 4,
        pt: 3,
        cursor: 'pointer',
        '&:last-child': {
          borderBottom: 'none'
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box className='export_dtl_list'>
          <Typography
            fontWeight='medium'
            sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500, fontSize: '16px' }}
          >
            {species?.common_name || 'N/A'}
          </Typography>
          <Typography
            fontStyle='italic'
            sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 400, fontSize: '14px' }}
          >
            {species?.scientific_name || 'N/A'}
          </Typography>
        </Box>
        <Typography
          sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '14px', fontWeight: 500, mr: 2 }}
        >
          Count : {species?.total_count || 0}
        </Typography>
      </Box>
      <Box display='flex' alignItems='center' gap={2} flex={1}>
        <Chip
          label={`M - ${species?.male_count || 0}`}
          size='small'
          sx={{
            background: alpha(theme.palette.customColors.SecondaryContainer, 0.5),
            borderRadius: '4px',
            px: 2,
            color: theme.palette.customColors.addPrimary,
            fontSize: '14px',
            fontWeight: 500
          }}
        />
        <Chip
          label={`F - ${species?.female_count || 0}`}
          size='small'
          sx={{
            background: alpha(theme.palette.customColors.customDropdownColor, 0.15),
            borderRadius: '4px',
            px: 2,
            color: theme.palette.formContent.tertiary,
            fontSize: '14px',
            fontWeight: 500
          }}
        />
        <Chip
          label={`U - ${species?.undeterminate_count || 0}`}
          size='small'
          sx={{
            background: theme.palette.customColors.displaybgSecondary,
            borderRadius: '4px',
            px: 2,
            color: theme.palette.customColors.OnPrimaryContainer,
            fontSize: '14px',
            fontWeight: 500
          }}
        />
      </Box>
    </Box>
  )

  const OthersSection = ({ otherData, isCollapsed }) => {
    console.log(otherData, 'otherdata')

    const totalAnimals = otherData?.reduce((sum, item) => {
      const speciesArray = Array.isArray(item.species) ? item.species : [item.species]
      console.log(speciesArray, 'spe')

      return (
        sum +
        speciesArray.reduce(
          (speciesSum, species) =>
            speciesSum +
            (parseInt(species?.total_count) ||
              (parseInt(species?.male_count) || 0) +
                (parseInt(species?.female_count) || 0) +
                (parseInt(species?.undeterminate_count) || 0)),
          0
        )
      )
    }, 0)

    return (
      <>
        <Box>
          <Box
            display='flex'
            justifyContent='space-between'
            alignItems='center'
            bgcolor={isCollapsed ? theme.palette.common.white : theme.palette.customColors.lightBg}
            sx={{
              px: 4,
              py: 4,

              borderBottomLeftRadius: '8px',
              borderBottomRightRadius: '8px'
            }}
          >
            <Typography fontWeight={500} sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '14px' }}>
              <Box
                component='span'
                fontWeight={600}
                sx={{
                  color: theme.palette.primary.dark,
                  fontSize: '14px'
                }}
              >
                Other Animals
              </Box>{' '}
              ({totalAnimals} Animals)
            </Typography>
          </Box>

          <Collapse in={!isCollapsed}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 0,
                '&:last-child': {
                  borderBottomLeftRadius: '8px',
                  borderBottomRightRadius: '8px'
                }
              }}
            >
              {otherData?.map((item, index) => {
                const speciesArray = Array.isArray(item.species) ? item.species : [item.species] // ✅ Normalize to array

                return speciesArray.map((species, speciesIndex) => (
                  <SpeciesRow
                    key={`${index}-${speciesIndex}`}
                    type='others'
                    species={{
                      common_name: species?.common_name || 'N/A',
                      scientific_name: species?.scientific_name || 'N/A',
                      male_count: species?.male_count || 0,
                      female_count: species?.female_count || 0,
                      undeterminate_count: species?.undeterminate_count || 0,
                      animals: species?.animals || [],
                      total_count:
                        parseInt(species?.total_count) ||
                        (parseInt(species?.male_count) || 0) +
                          (parseInt(species?.female_count) || 0) +
                          (parseInt(species?.undeterminate_count) || 0)
                    }}
                  />
                ))
              })}
            </Paper>
          </Collapse>
        </Box>
      </>
    )
  }

  const ExportSection = ({ data, isCollapsed, isLast }) => {
    const totalAnimals = data?.species?.reduce((sum, species) => {
      const totalCount = parseInt(species?.total_count)
      const male = parseInt(species?.male_count) || 0
      const female = parseInt(species?.female_count) || 0
      const undetermined = parseInt(species?.undeterminate_count) || 0

      return sum + (isNaN(totalCount) ? male + female + undetermined : totalCount)
    }, 0)

    return (
      <>
        <Box>
          <Box
            display='flex'
            justifyContent='space-between'
            alignItems='center'
            bgcolor={isCollapsed ? theme.palette.common.white : theme.palette.customColors.lightBg}
            sx={{
              px: 4,
              py: 4,
              borderBottomLeftRadius: isLast ? '8px' : '0px',
              borderBottomRightRadius: isLast ? '8px' : '0px'
            }}
          >
            <Typography fontWeight={500} sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '14px' }}>
              <Box
                component='span'
                fontWeight={600}
                sx={{ color: theme.palette.primary.dark, fontWeight: 500, fontSize: '14px' }}
              >
                Export ID : <span>{data.export_number}</span>
              </Box>{' '}
              ({data.total_species} Species) ({totalAnimals} {totalAnimals === 1 ? 'Animal' : 'Animals'})
            </Typography>
            {data?.attachment?.file_original_name ? (
              <Box display='flex' alignItems='center' gap={1}>
                <a
                  href={data?.attachment?.file_path}
                  target='_blank'
                  rel='noopener noreferrer'
                  style={{
                    color: theme.palette.primary.dark,
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textDecoration: 'none'
                  }}
                >
                  {data?.attachment?.file_original_name}
                </a>
              </Box>
            ) : (
              ''
            )}
          </Box>

          <Collapse in={!isCollapsed}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 0,
                borderBottomLeftRadius: isLast && data?.others?.length <= 0 ? '8px' : '0px',
                borderBottomRightRadius: isLast && data?.others?.length <= 0 ? '8px' : '0px'
              }}
            >
              {data.species.map((s, i) => (
                <SpeciesRow key={i} species={s} type={'export'} />
              ))}
            </Paper>
          </Collapse>
        </Box>
        {!isLast || data?.others?.length > 0 ? <Divider /> : ''}
      </>
    )
  }

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        onClose={onClose}
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '562px'], height: '100vh' },
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          backgroundColor: theme.palette.customColors.OnPrimary
        }}
      >
        <Box
          className='sidebar-header'
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: theme.palette.customColors.OnPrimary,
            p: theme => theme.spacing(3, 3.255, 3, 5.255),
            borderBottom: `0.5px solid ${theme.palette.divider}`
          }}
        >
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
            <Typography sx={{ fontSize: '24px', fontWeight: 500 }}>{`Export List - ${shipmentNumber}`}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <IconButton size='small' sx={{ color: 'text.primary' }} onClick={onClose}>
              <Icon icon='mdi:close' fontSize={24} />
            </IconButton>
          </Box>
        </Box>
        <Box
          sx={{
            '& .MuiDrawer-paper': { width: ['100%', '562px'] },
            backgroundColor: theme.palette.customColors.OnPrimary,
            height: '100%',
            p: theme => theme.spacing(3, 3.255, 3, 5.255),
            mt: 6
          }}
        >
          <Box
            sx={{
              background: theme.palette.customColors.tableHeaderBg,
              borderRadius: '8px',
              border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
              borderBottomLeftRadius: '8px',
              borderBottomRightRadius: '8px'
            }}
          >
            <Box display='flex' justifyContent='space-between' alignItems='center' sx={{ px: 4, py: 3 }}>
              <Typography
                fontWeight={500}
                sx={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
              >
                {data?.total_species} Species • {data?.total_animals} Animals
              </Typography>
              <Typography
                onClick={() => setCollapsed(!collapsed)}
                size='small'
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: theme.palette.customColors.OnPrimaryContainer,
                  fontWeight: 500,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                {collapsed ? 'Expand' : 'Collapse'}
                {collapsed ? (
                  <img src='/icons/expand.svg' width='24px' alt='' />
                ) : (
                  <img src='/icons/collapse.svg' width='24px' alt='' />
                )}
              </Typography>
            </Box>

            {loading ? (
              <Box sx={{ px: 4 }}>
                {[...Array(3)].map((_, i) => (
                  <Box key={i} sx={{ mb: 2 }}>
                    <Skeleton variant='rectangular' height={40} sx={{ borderRadius: 2 }} />
                  </Box>
                ))}
              </Box>
            ) : (
              <>
                {data?.exports?.map((exp, idx) => (
                  <ExportSection
                    key={idx}
                    data={exp}
                    isCollapsed={collapsed}
                    isLast={idx === data?.exports?.length - 1}
                  />
                ))}
                {console.log(data, 'exportData')}
                {data?.others?.length > 0 && <OthersSection otherData={data.others} isCollapsed={collapsed} />}
              </>
            )}
          </Box>
        </Box>
      </Drawer>
    </>
  )
}

export default SpeciesExportDrawer
