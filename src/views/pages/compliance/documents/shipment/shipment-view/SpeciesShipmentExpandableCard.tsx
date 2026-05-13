import { alpha, Box, Chip, Collapse, Divider, Paper, Skeleton, Typography, useTheme } from '@mui/material'
import React, { useState } from 'react'

interface AnimalItem {
  gender?: string
  identifier_type?: string
  identifier_value?: string
  [key: string]: unknown
}

interface SpeciesData {
  id?: string | number
  common_name?: string
  scientific_name?: string
  total_count?: number | string
  male_count?: number | string
  female_count?: number | string
  undeterminate_count?: number | string
  animals?: AnimalItem[]
  [key: string]: unknown
}

interface OtherItem {
  species?: SpeciesData | SpeciesData[]
  [key: string]: unknown
}

interface ExportEntry {
  export_id?: string | number
  export_number?: string
  total_species?: number
  attachment?: {
    file_original_name?: string
    file_path?: string
    [key: string]: unknown
  }
  species: SpeciesData[]
  others?: OtherItem[]
  [key: string]: unknown
}

interface ExpandableCardData {
  total_species?: number
  total_animals?: number
  exports?: ExportEntry[]
  others?: OtherItem[]
}

interface SpeciesShipmentExpandableCardProps {
  data: ExpandableCardData
  loading?: boolean
  defaultCollapseStatus?: boolean
}

interface SpeciesRowProps {
  species: SpeciesData
  type?: string
}

interface OthersSectionProps {
  otherData: OtherItem[]
  isCollapsed: boolean
}

interface ExportSectionProps {
  data: ExportEntry
  isCollapsed: boolean
  isLast: boolean
}

const SpeciesShipmentExpandableCard = ({ data, loading, defaultCollapseStatus = false }: SpeciesShipmentExpandableCardProps) => {
  const theme = useTheme()

  const [collapsed, setCollapsed] = useState<boolean>(defaultCollapseStatus)

  const SpeciesRow = ({ species }: SpeciesRowProps) => (
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
            background: alpha(theme.palette.customColors.SecondaryContainer || '', 0.5),
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
            background: alpha(theme.palette.customColors.customDropdownColor || '', 0.15),
            borderRadius: '4px',
            px: 2,
            color: theme.palette.formContent?.tertiary,
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

  const OthersSection = ({ otherData, isCollapsed }: OthersSectionProps) => {
    const totalAnimals = otherData?.reduce((sum, item) => {
      const speciesArray = Array.isArray(item.species) ? item.species : [item.species as SpeciesData]

      return (
        sum +
        speciesArray.reduce(
          (speciesSum, species) =>
            speciesSum +
            (parseInt(String(species?.total_count)) ||
              (parseInt(String(species?.male_count)) || 0) +
                (parseInt(String(species?.female_count)) || 0) +
                (parseInt(String(species?.undeterminate_count)) || 0)),
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
                const speciesArray = Array.isArray(item.species) ? item.species : [item.species as SpeciesData] // Normalize to array

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
                        parseInt(String(species?.total_count)) ||
                        (parseInt(String(species?.male_count)) || 0) +
                          (parseInt(String(species?.female_count)) || 0) +
                          (parseInt(String(species?.undeterminate_count)) || 0)
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

  const ExportSection = ({ data, isCollapsed, isLast }: ExportSectionProps) => {
    const totalAnimals = data?.species?.reduce((sum, species) => {
      const totalCount = parseInt(String(species?.total_count))
      const male = parseInt(String(species?.male_count)) || 0
      const female = parseInt(String(species?.female_count)) || 0
      const undetermined = parseInt(String(species?.undeterminate_count)) || 0

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
                borderBottomLeftRadius: isLast && (data?.others?.length ?? 0) <= 0 ? '8px' : '0px',
                borderBottomRightRadius: isLast && (data?.others?.length ?? 0) <= 0 ? '8px' : '0px'
              }}
            >
              {data.species.map((s, i) => (
                <SpeciesRow key={i} species={s} type={'export'} />
              ))}
            </Paper>
          </Collapse>
        </Box>
        {!isLast || (data?.others?.length ?? 0) > 0 ? <Divider /> : ''}
      </>
    )
  }

  return (
    <>
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
              <Box key={i} sx={{ mb: 4 }}>
                <Skeleton variant='rectangular' height={40} sx={{ borderRadius: 2 }} />
              </Box>
            ))}
          </Box>
        ) : (
          <>
            {data?.exports?.map((exp, idx) => (
              <ExportSection key={idx} data={exp} isCollapsed={collapsed} isLast={idx === (data?.exports?.length ?? 0) - 1} />
            ))}
            {(data?.others?.length ?? 0) > 0 && <OthersSection otherData={data.others!} isCollapsed={collapsed} />}
          </>
        )}
      </Box>
    </>
  )
}

export default SpeciesShipmentExpandableCard
