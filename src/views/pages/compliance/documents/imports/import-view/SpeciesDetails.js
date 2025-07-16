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
  CardContent
} from '@mui/material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import IconButton from '@mui/material/IconButton'
import moment from 'moment'

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
      sx={{ borderBottom: '1px solid #0000000D', px: 4, pb: 4, pt: 3 }}
      onClick={() => handleAnimalClick(species, type)}
    >
      <Box className='export_dtl_list'>
        <Typography fontWeight='medium' sx={{ color: '#44544A', fontWeight: 500, fontSize: '16px' }}>
          {species?.common_name || 'N/A'}
        </Typography>
        <Typography fontStyle='italic' sx={{ color: '#44544A', fontWeight: 400, fontSize: '14px' }}>
          {species?.scientific_name || 'N/A'}
        </Typography>
      </Box>
      <Box display='flex' alignItems='center' gap={2} flex={1}>
        <Typography sx={{ color: '#44544A', fontSize: '14px', fontWeight: 500, mr: 2 }}>
          Count : {species?.total_count || 0}
        </Typography>
        <Chip
          label={`M - ${species?.male_count || 0}`}
          size='small'
          sx={{
            background: '#AFEFEB80',
            borderRadius: '4px',
            px: 2,
            color: '#00AFD6',
            fontSize: '14px',
            fontWeight: 500
          }}
        />
        <Chip
          label={`F - ${species?.female_count || 0}`}
          size='small'
          sx={{
            background: '#FA614026',
            borderRadius: '4px',
            px: 2,
            color: '#FA6140',
            fontSize: '14px',
            fontWeight: 500
          }}
        />
        <Chip
          label={`U - ${species?.undeterminate_count || 0}`}
          size='small'
          sx={{
            background: '#DDEBE9',
            borderRadius: '4px',
            px: 2,
            color: '#1F515B',
            fontSize: '14px',
            fontWeight: 500
          }}
        />
      </Box>
      <ChevronRightIcon sx={{ fontSize: '30px', mt: 2 }} />
    </Box>
  )

  const ExportSection = ({ data, isCollapsed }) => {
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
            bgcolor={isCollapsed ? '#fff' : '#EFF5F2'}
            sx={{ px: 4, py: 4 }}
          >
            <Typography fontWeight={500} sx={{ color: '#44544A', fontSize: '14px' }}>
              <Box component='span' fontWeight={600} sx={{ color: '#006D35', fontWeight: 500, fontSize: '14px' }}>
                Export ID : <span>{data.export_number}</span>
              </Box>{' '}
              ({data.total_species} Species) ({totalAnimals} {totalAnimals === 1 ? 'Animal' : 'Animals'})
            </Typography>
          </Box>

          {/* Collapsible Species */}
          <Collapse in={!isCollapsed}>
            <Paper elevation={0} sx={{ borderRadius: 0 }}>
              {data.species.map((s, i) => (
                <SpeciesRow key={i} species={s} type={'export'} />
              ))}
            </Paper>
          </Collapse>
        </Box>
        <Divider />
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
              border: '1px solid #C3CEC7',
              p: 8,
              mb: 5
            }}
          >
            <Grid container spacing={2}>
              {/* Shipment ID */}
              <Grid size={{ xs: 6, md: 4 }}>
                <Typography fontWeight='400' color='#7A8684' fontSize='16px'>
                  Certificate ID
                </Typography>
                <Typography color={'#44544A'} sx={{ pt: 1 }}>
                  {airwaybillvalue}
                </Typography>
              </Grid>

              {/* Date Of Issue */}
              <Grid size={{ xs: 6, md: 4 }}>
                <Typography fontWeight='400' color='#7A8684' fontSize='16px'>
                  Date Of Issue
                </Typography>
                <Typography color='#44544A' sx={{ pt: 1 }}>
                  {moment(startDate).format('DD/MM/yyyy')}
                </Typography>
              </Grid>
            </Grid>

            {/* File Section */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                border: '1px solid #E0E0E0',
                borderRadius: '10px',
                backgroundColor: '#FFF',
                minWidth: '280px'
              }}
            >
              <img
                src='/icons/pdf_icon2.svg'
                alt='PDF Icon'
                width='18%'
                style={{ marginRight: '8px', background: '#FFBDA84D', borderRadius: '6px', padding: '10px' }}
              />
              <Typography
                sx={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '180px',
                  height: '40px',
                  pt: 2
                }}
              >
                {uploadedFile?.file_original_name}
              </Typography>
              <IconButton size='small'>{/* <MoreVertIcon /> */}</IconButton>
            </Box>
          </Box>

          <Box
            sx={{
              background: '#E8F4F2',
              borderRadius: '8px',
              border: '1px solid #C3CEC7',
              borderBottomLeftRadius: '4px',
              borderBottomRightRadius: '4px'
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
                  color: '#1F515B',
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
              <ExportSection key={idx} data={exp} isCollapsed={collapsed} />
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
