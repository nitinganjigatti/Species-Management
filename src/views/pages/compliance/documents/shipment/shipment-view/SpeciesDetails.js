import React, { useState } from 'react'
import { Box, Typography, Paper, Chip, Collapse, Divider, Icon, alpha } from '@mui/material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ShippedAnimalsDrawer from '../drawer/ShippedAnimals'
import AnimalDetailsDrawer from '../drawer/AnimalDetailsDrawer'
import { useTheme } from '@mui/material/styles'
import { useAuth } from 'src/hooks/useAuth'

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
  setDetailType
}) => {
  const [collapsed, setCollapsed] = useState(false)
  const [shippedAnimalsDrawerOpen, setshippedAnimalsDrawerOpen] = useState(false)
  const auth = useAuth()
  const theme = useTheme()
  const imgPath = auth?.userData?.settings?.DEFAULT_IMAGE_MASTER

  const handleShippedClick = () => {
    setshippedAnimalsDrawerOpen(true)
  }

  const handleAnimalClick = (speciesdata, type) => {
    setanimalDetailsDrawerOpen(true)
    setAnimalDetails(speciesdata)
    setDetailType(type)
  }

  // const handleDownload = async data => {
  //   const response = await fetch(data.file_path)
  //   const blob = await response.blob()
  //   const url = window.URL.createObjectURL(blob)

  //   const link = document.createElement('a')
  //   link.href = url
  //   link.download = data.file_original_name || 'file'
  //   document.body.appendChild(link)
  //   link.click()
  //   document.body.removeChild(link)

  //   window.URL.revokeObjectURL(url)
  // }

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

      <Box display='flex' alignItems='center'>
        <ChevronRightIcon sx={{ fontSize: '30px' }} />
      </Box>
    </Box>
  )

  const OthersSection = ({ data, isCollapsed }) => {
    const totalAnimals = data?.reduce((sum, item) => {
      const species = item.species

      return (
        sum +
        (parseInt(species?.total_count) ||
          (parseInt(species?.male_count) || 0) +
            (parseInt(species?.female_count) || 0) +
            (parseInt(species?.undeterminate_count) || 0))
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
              {data?.map((item, index) => {
                const species = item.species

                return (
                  <SpeciesRow
                    key={index}
                    type={'others'}
                    species={{
                      common_name: species?.common_name || 'N/A',
                      scientific_name: species?.scientific_name || 'N/A',
                      male_count: species?.male_count || 0,
                      female_count: species?.female_count || 0,
                      undeterminate_count: species?.undeterminate_count || 0,
                      animals: species?.animals,
                      total_count:
                        parseInt(species?.total_count) ||
                        (parseInt(species?.male_count) || 0) +
                          (parseInt(species?.female_count) || 0) +
                          (parseInt(species?.undeterminate_count) || 0)
                    }}
                  />
                )
              })}
            </Paper>
          </Collapse>
        </Box>
        {/* <Divider /> */}
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

    const getFileIcon = () => {
      const fileName = (data?.attachment?.name || data?.attachment?.file_original_name || '').toLowerCase()
      const ext = fileName?.split('.')?.pop()?.toLowerCase()

      if (!ext) return imgPath?.default // Fallback if no extension found

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
                sx={{ color: theme.palette.primary.dark, fontWeight: 500, fontSize: '14px', cursor: 'pointer' }}
                onClick={() => {
                  window.open(`/compliance/documents/exports/${data?.export_id}/?id=${data?.export_id}`, '_blank')
                }}
              >
                Export ID : <span>{data.export_number}</span>
              </Box>{' '}
              ({data.total_species} Species) ({totalAnimals} {totalAnimals === 1 ? 'Animal' : 'Animals'}) • Importer
              name : {'India'} • Country Of origin :{'Argentina'}
            </Typography>
            {data?.attachment?.file_original_name ? (
              <Box display='flex' alignItems='center' gap={1}>
                <Typography
                  sx={{
                    //mr: 2,
                    display: 'flex',
                    alignItems: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '200px'
                  }}
                >
                  <img src={getFileIcon()?.image_path} width='18px' />
                </Typography>
                {/* <Typography
                  variant='body2'
                  sx={{ color: '#006D35', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
                  onClick={() => handleDownload(data)}
                >
                  {data?.attachment?.file_original_name}
                </Typography> */}
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
                borderBottomLeftRadius: isLast && selectedExportData?.others?.length <= 0 ? '8px' : '0px',
                borderBottomRightRadius: isLast && selectedExportData?.others?.length <= 0 ? '8px' : '0px'
              }}
            >
              {data.species.map((s, i) => (
                <SpeciesRow key={i} species={s} type={'export'} />
              ))}
            </Paper>
          </Collapse>
        </Box>
        {!isLast || selectedExportData?.others?.length > 0 ? <Divider /> : ''}
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
            onClick={handleShippedClick}
          >
            {totalSpecies} Species • {totalAnimals} Animals
            <ChevronRightIcon sx={{ fontSize: '22px', color: theme.palette.primary.main }} />
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
            {collapsed ? <img src='/icons/expand.svg' width='24px' /> : <img src='/icons/collapse.svg' width='24px' />}
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

        {selectedExportData?.others?.length > 0 && (
          <OthersSection data={selectedExportData.others} isCollapsed={collapsed} />
        )}
      </Box>
      <ShippedAnimalsDrawer
        open={shippedAnimalsDrawerOpen}
        onClose={() => setshippedAnimalsDrawerOpen(false)}
        selectedExportData={selectedExportData}
        title='Shipped Animals'
      />
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
