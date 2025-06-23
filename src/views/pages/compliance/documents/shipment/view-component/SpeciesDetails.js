import React, { useState } from 'react'
import { Box, Typography, Paper, Chip, IconButton, Collapse, Divider, Icon } from '@mui/material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ShippedAnimalsDrawer from '../drawer/ShippedAnimals'
import { useRouter } from 'next/router'
import AnimalDetailsDrawer from '../drawer/AnimalDetailsDrawer'

const exportData = [
  {
    id: '55555555',
    totalAnimals: 12,
    species: [
      {
        name: 'Red fox',
        scientificName: 'Vulpes vulpes',
        appendix: 'CITES Appendix 1',
        count: 4,
        male: 2,
        female: 2,
        unknown: 0
      },
      {
        name: 'Cheetah',
        scientificName: 'Acinonyx jubatus',
        appendix: 'CITES Appendix 1',
        count: 2,
        male: 2,
        female: 0,
        unknown: 0
      },
      {
        name: 'Giant Panda',
        scientificName: 'Ailuropoda melanoleuca',
        appendix: 'CITES Appendix 1',
        count: 2,
        male: 0,
        female: 0,
        unknown: 2
      }
    ]
  },
  {
    id: '1534233',
    totalAnimals: 20,
    species: [
      {
        name: 'Giant Panda',
        scientificName: 'Ailuropoda melanoleuca',
        appendix: 'CITES Appendix 1',
        count: 20,
        male: 10,
        female: 10,
        unknown: 0
      }
    ]
  }
]

const SpeciesDetailsContainer = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [shippedAnimalsDrawerOpen, setshippedAnimalsDrawerOpen] = useState(false)
  const [animalDetailsDrawerOpen, setanimalDetailsDrawerOpen] = useState(false)

  const handleShippedClick = () => {
    setshippedAnimalsDrawerOpen(true)
  }

  const handleAnimalClick = () => {
    setanimalDetailsDrawerOpen(true)
  }

  const SpeciesRow = ({ species }) => (
    <Box
      //key={idx}
      display='flex'
      justifyContent='space-between'
      // py={2}
      sx={{ borderBottom: '1px solid #0000000D', px: 4, py: 2 }}
      onClick={() => handleAnimalClick()}
    >
      <Box sx={{ minWidth: '420px' }}>
        <Typography fontWeight='medium' sx={{ color: '#44544A', fontWeight: 500, fontSize: '16px' }}>
          {species.name}
        </Typography>
        <Typography fontStyle='italic' sx={{ color: '#44544A', fontWeight: 400, fontSize: '14px' }}>
          {species.scientificName}
        </Typography>
      </Box>
      <Box display='flex' alignItems='center' gap={2} flex={1}>
        <Typography sx={{ color: '#44544A', fontSize: '14px', fontWeight: 500, mr: 2 }}>
          Count : {species.count}
        </Typography>
        <Chip
          label={`M - ${species.male}`}
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
          label={`F - ${species.female}`}
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
          label={`U - ${species.unknown}`}
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

  const ExportSection = ({ data, isCollapsed }) => (
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
              Export ID : <span>{data.id}</span>
            </Box>{' '}
            ({data.totalAnimals} Animals)
          </Typography>

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
              <img src='/icons/pdf_icon2.svg' width='18px' />
            </Typography>
            <Typography variant='body2' sx={{ color: '#006D35', fontSize: '14px', fontWeight: 500 }}>
              Export_123123123.pdf
            </Typography>
          </Box>
        </Box>

        {/* Collapsible Species */}
        <Collapse in={!isCollapsed}>
          <Paper elevation={0} sx={{ borderRadius: 0 }}>
            {data.species.map((s, i) => (
              <SpeciesRow key={i} species={s} />
            ))}
          </Paper>
        </Collapse>
      </Box>
      <Divider />
    </>
  )

  return (
    <>
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
            onClick={handleShippedClick}
          >
            3 Species • 12 Animals
            <ChevronRightIcon sx={{ fontSize: '22px', color: '#37BD69' }} />
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
            {collapsed ? <img src='/icons/expand.svg' width='24px' /> : <img src='/icons/collapse.svg' width='24px' />}
          </Typography>
        </Box>

        {exportData.map((exp, idx) => (
          <ExportSection key={idx} data={exp} isCollapsed={collapsed} />
        ))}
      </Box>
      <ShippedAnimalsDrawer
        open={shippedAnimalsDrawerOpen}
        onClose={() => setshippedAnimalsDrawerOpen(false)}
        title='Shipped Animals'
      />
      <AnimalDetailsDrawer
        open={animalDetailsDrawerOpen}
        onClose={() => setanimalDetailsDrawerOpen(false)}
        title='Animal Details'
      />
    </>
  )
}

export default SpeciesDetailsContainer
