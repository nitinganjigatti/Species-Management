import React, { useEffect, useMemo, useState } from 'react'
import { Typography, Box, Drawer, IconButton } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import debounce from 'lodash/debounce'
import Search from 'src/views/utility/Search'
import { getAllSpeciesList } from 'src/lib/api/housing'
import CloseIcon from '@mui/icons-material/Close'
import { CellInfo } from 'src/utility/render'
import ExportCard from '../view-component/AddExportPermitCard'
import AddAnimalsDrawer from './AddAnimalsDrawer'

const ExportPermitDrawer = ({ open, onClose, title }) => {
  const data = [
    { exportId: '55555555', exporter: 'National Park, United States', species: 3, animals: 15 },
    { exportId: '12423423', exporter: 'National Park, United States', species: 2, animals: 4 }
  ]
  const theme = useTheme()

  const [localSearch, setLocalSearch] = useState('')
  const [search, setSearch] = useState('')

  const debouncedSearch = useMemo(() => debounce(setSearch, 500), [])

  const handleSearchChange = e => {
    const value = e.target.value
    setLocalSearch(value)
    debouncedSearch(value)
  }

  const handleSearchClear = () => {
    setLocalSearch('')
    debouncedSearch('')
  }

  return (
    <Drawer open={open} onClose={onClose} anchor='right'>
      <Box
        sx={{
          width: 570,
          maxWidth: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.palette.customColors.Background
        }}
      >
        {/* Header */}
        <Box sx={{ px: 5, pt: 4, pb: 2 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Box display='flex' alignItems='center' gap={3}>
              {/* <Box component='img' src='/images/housing/Enclosure icon.png' alt='icon' sx={{ width: 32, height: 32 }} /> */}
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 500 }}>{title}</Typography>
            </Box>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Scrollable content */}
        <Box sx={{ px: 5, flex: 1, overflowY: 'auto' }}>
          {data?.name && (
            <Box
              sx={{
                my: 4,
                p: 3,
                border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                borderRadius: '8px',
                backgroundColor: theme.palette.common.white,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <CellInfo
                value={data?.name}
                imgUrl={data?.image}
                color={theme.palette.customColors.OnSurfaceVariant}
                subtitleColor={theme.palette.customColors.secondaryBg}
              />
            </Box>
          )}

          <Search
            sx={{ width: '100%' }}
            textFielsSX={{
              width: '100%',
              height: 52,
              borderRadius: '8px',
              backgroundColor: theme.palette.common.white
            }}
            placeholder='Search for Export ID'
            value={localSearch}
            onChange={handleSearchChange}
            onClear={handleSearchClear}
            backgroundColor={theme.palette.common.white}
          />

          <Typography sx={{ fontSize: '1.25rem', fontWeight: 500, my: 4 }}>
            Exports {'total' ? `(${'23'})` : ''}
          </Typography>

          <Box>
            {data.map((item, index) => (
              <ExportCard
                key={index}
                exportId={item.exportId}
                exporter={item.exporter}
                species={item.species}
                animals={item.animals}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}

export default React.memo(ExportPermitDrawer)
