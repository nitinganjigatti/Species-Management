import React from 'react'
import { Box, Card, Typography, CircularProgress } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import { getTaxonomyHierarchy, TaxonomyHierarchyData } from 'src/lib/api/housing'

interface AnimalTaxonomyProps {
  animalDetails?: {
    taxonomyId?: string
  }
}

interface TaxonomyCardProps {
  title: string
  name?: string
  commonName?: string
}

const TaxonomyCard: React.FC<TaxonomyCardProps> = ({ title, name, commonName }) => {
  const theme = useTheme()

  // Display logic matching mobile:
  // Main text: commonName if available, otherwise name
  // Secondary text: always show name (scientific name)
  const mainText = commonName || name || '-'
  const secondaryText = name

  return (
    <Card
      sx={{
        py: 3,
        px: 2,
        mb: 3,
        backgroundColor: 'transparent',
        borderRadius: 2,
        boxShadow: 'none',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1px solid ${theme.palette.divider}`
      }}
    >
      <Typography
        sx={{
          fontSize: '14px',
          fontWeight: 500,
          color: theme.palette.text.secondary,
          textAlign: 'center',
          mb: 0.5
        }}
      >
        {title}
      </Typography>
      <Typography
        sx={{
          fontSize: '24px',
          fontWeight: 500,
          color: theme.palette.text.primary,
          textAlign: 'center',
          mb: 0.5
        }}
      >
        {mainText}
      </Typography>
      <Typography
        sx={{
          fontSize: '16px',
          fontWeight: 400,
          fontStyle: 'italic',
          color: theme.palette.text.secondary,
          textAlign: 'center'
        }}
      >
        {secondaryText || 'NA'}
      </Typography>
    </Card>
  )
}

const AnimalTaxonomy: React.FC<AnimalTaxonomyProps> = ({ animalDetails }) => {
  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query

  const taxonomyId = animalDetails?.taxonomyId

  const { data, isLoading, error } = useQuery({
    queryKey: ['taxonomy-hierarchy', taxonomyId],
    queryFn: () => getTaxonomyHierarchy({ species_id: taxonomyId as string }),
    enabled: !!taxonomyId
  })

  const taxonomyData: TaxonomyHierarchyData | undefined = data?.data

  // Define taxonomy levels with their display properties
  const taxonomyLevels = [
    { key: 'class', title: 'Class' },
    { key: 'order', title: 'Order' },
    { key: 'famely', title: 'Family' }, // API uses "famely" (typo preserved)
    { key: 'genus', title: 'Genus' },
    { key: 'species', title: 'Species', isSpecies: true }
  ]

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography color='error'>Failed to load taxonomy data</Typography>
      </Box>
    )
  }

  if (!taxonomyId) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography color='text.secondary'>No taxonomy information available</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ py: 4 }}>
      <Typography
        sx={{
          fontSize: '18px',
          fontWeight: 600,
          color: theme.palette.text.primary,
          mb: 3
        }}
      >
        Taxonomy Hierarchy
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {taxonomyLevels.map(level => {
          let name: string | undefined
          let commonName: string | undefined

          if (level.isSpecies) {
            // For species: name = complete_name (scientific), commonName = species_common_name
            name = taxonomyData?.complete_name || taxonomyData?.species_common_name
            commonName = taxonomyData?.species_common_name
          } else {
            const levelData = taxonomyData?.[level.key as keyof TaxonomyHierarchyData] as
              | { name?: string; default_common_name?: string }
              | undefined
            // For other levels: name = scientific name, commonName = default_common_name
            name = levelData?.name || levelData?.default_common_name
            commonName = levelData?.default_common_name
          }

          return (
            <TaxonomyCard
              key={level.key}
              title={level.title}
              name={name}
              commonName={commonName}
            />
          )
        })}
      </Box>
    </Box>
  )
}

export default AnimalTaxonomy
