import React, { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Chip,
  Collapse,
  Divider,
  Icon,
  Grid,
  CircularProgress,
  CardContent,
  alpha
} from '@mui/material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import IconButton from '@mui/material/IconButton'
import moment from 'moment'
import { useAuth } from 'src/hooks/useAuth'
import { useTheme } from '@mui/material/styles'
import AnimalDetailsDrawer from '../drawer/AnimalDetailsDrawer'

const SpeciesDetailsContainer = ({
  totalSpecies,
  selectedExportData,
  totalAnimals,
  setAnimalDetails,
  animalDetails,
  animalDetailsDrawerOpen,
  setanimalDetailsDrawerOpen,
  setanimalCountDrawerOpen,
  detailtype,
  setDetailType,
  uploadedFile,
  startDate,
  airwaybillvalue,
  loader
}) => {
  const [collapsed, setCollapsed] = useState(false)
  const auth = useAuth()
  const theme = useTheme()
  const imgPath = auth?.userData?.settings?.DEFAULT_IMAGE_MASTER

  const getFileIcon = () => {
    const fileName = (uploadedFile?.name || uploadedFile?.file_original_name || '').toLowerCase()
    const ext = fileName?.split('.')?.pop()?.toLowerCase()

    if (!ext) return imgPath?.default

    if (['jpeg', 'jpg', 'png', 'svg', 'gif', 'webp'].includes(ext)) {
      return imgPath?.image
    }

    if (['pdf'].includes(ext)) {
      return imgPath?.pdf
    }

    if (['xls', 'xlsx'].includes(ext)) {
      return imgPath?.xls
    }

    if (['doc', 'docx'].includes(ext)) {
      return imgPath?.document
    }

    if (['mp3', 'wav', 'ogg'].includes(ext)) {
      return imgPath?.audio
    }

    return imgPath?.default
  }

  const handleAnimalClick = (speciesdata, type) => {
    setanimalDetailsDrawerOpen(true)
    setAnimalDetails(speciesdata)
    setDetailType(type)
  }

  const SpeciesRow = ({ species, type }) => (
    <Box

      //key={idx}
      display='flex'
      justifyContent='space-between'

      // py={2}
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
      onClick={() => handleAnimalClick(species, type)}
    >
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
      <Box display='flex' alignItems='center' gap={2} flex={1}>
        <Typography
          sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '14px', fontWeight: 500, mr: 2 }}
        >
          Count : {species?.total_count || 0}
        </Typography>
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
            color: theme.palette?.formContent?.tertiary,
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
      <Box display='flex' alignItems='center'>
        <ChevronRightIcon sx={{ fontSize: '30px' }} />
      </Box>
    </Box>
  )

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
          {/* Export Header */}
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
                sx={{ color: theme.palette?.primary?.dark, fontWeight: 500, fontSize: '14px', cursor: 'pointer' }}
                onClick={() => {
                  window.open(`/compliance/documents/exports/${data.id}/?id=${data.id}`, '_blank')
                }}
              >
                Export ID : <span>{data.export_number}</span>
              </Box>{' '}
              ({data.total_species} Species) ({totalAnimals} {totalAnimals === 1 ? 'Animal' : 'Animals'})
            </Typography>
          </Box>

          {/* Collapsible Species */}
          <Collapse in={!isCollapsed}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 0,
                borderBottomLeftRadius: isLast ? '8px' : '0px',
                borderBottomRightRadius: isLast ? '8px' : '0px'
              }}
            >
              {data.species.map((s, i) => (
                <SpeciesRow key={i} species={s} type={'export'} />
              ))}
            </Paper>
          </Collapse>
        </Box>
        {!isLast && <Divider />}
      </>
    )
  }

  return (
    <>
      {!loader ? (
        <>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1px',
              background: '#EFF5F266',
              borderRadius: '10px',
              border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
              p: 8,
              mb: 5
            }}
          >
            <Grid container spacing={2}>
              {/* Shipment ID */}
              <Grid size={{ xs: 6, md: 4 }}>
                <Typography fontWeight='400' color={theme.palette.customColors.secondaryBg} fontSize='16px'>
                  Certificate ID
                </Typography>
                <Typography color={theme.palette.customColors.OnSurfaceVariant} sx={{ pt: 1 }}>
                  {airwaybillvalue}
                </Typography>
              </Grid>

              {/* Date Of Issue */}
              <Grid size={{ xs: 6, md: 4 }}>
                <Typography fontWeight='400' color={theme.palette.customColors.secondaryBg} fontSize='16px'>
                  Date Of Issue
                </Typography>
                <Typography color={theme.palette.customColors.OnSurfaceVariant} sx={{ pt: 1 }}>
                  {startDate ? moment(startDate).format('DD MMM YYYY') : '-'}
                </Typography>
              </Grid>
            </Grid>

            {/* File Section */}
            {uploadedFile?.file_path && (
              <a
                href={uploadedFile.file_path}
                target='_blank'
                rel='noopener noreferrer'
                style={{ textDecoration: 'none' }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 12px',
                    border: `1px solid ${theme?.palette?.grey[300]}`,
                    borderRadius: '10px',
                    backgroundColor: theme.palette.common.white,
                    minWidth: '280px',
                    cursor: 'pointer'
                  }}
                >
                  <img
                    src={getFileIcon()?.image_path}
                    alt='PDF Icon'
                    width='18%'
                    style={{
                      marginRight: '8px',
                      background: theme.palette.customColors.Tertiary30,
                      borderRadius: '6px',
                      padding: '10px'
                    }}
                  />
                  <Typography
                    sx={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '180px',
                      height: '40px',
                      pt: 2

                      // color: 'inherit'
                    }}
                  >
                    {uploadedFile?.file_original_name}
                  </Typography>
                  <IconButton size='small'>{/* Optional: Add an icon here if needed */}</IconButton>
                </Box>
              </a>
            )}
          </Box>

          <Box
            sx={{
              background: theme.palette.customColors.tableHeaderBg,
              borderRadius: '8px',
              border: `1px solid ${theme.palette.customColors?.OutlineVariant}`,
              borderBottomLeftRadius: '8px',
              borderBottomRightRadius: '8px'
            }}
          >
            {/* Header with Toggle */}

            <Box display='flex' justifyContent='space-between' alignItems='center' sx={{ px: 4, py: 3 }}>
              <Typography
                fontWeight={500}
                sx={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
              >
                {totalSpecies} Species • {totalAnimals} Animals
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
                  <img src='/icons/expand.svg' width='24px' />
                ) : (
                  <img src='/icons/collapse.svg' width='24px' />
                )}
              </Typography>
            </Box>

            {selectedExportData?.export?.map((exp, idx) => (
              <ExportSection
                key={idx}
                data={exp}
                isCollapsed={collapsed}
                isLast={idx === selectedExportData?.export?.length - 1}
              />
            ))}
          </Box>
        </>
      ) : (
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      )}

      <AnimalDetailsDrawer
        open={animalDetailsDrawerOpen}
        onClose={() => setanimalDetailsDrawerOpen(false)}
        animalDetails={animalDetails}
        detailtype={detailtype}
        setanimalCountDrawerOpen={setanimalCountDrawerOpen}
        title='Animal Details'
      />
    </>
  )
}

export default SpeciesDetailsContainer
