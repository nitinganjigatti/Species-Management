import React, { useState, useEffect } from 'react'
import { Typography, Box, Drawer, IconButton, Tabs, Tab, Button } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import { CellInfo } from 'src/utility/render'
import AntzDatabaseTab from 'src/components/compliance/tabs/AntzDatabaseTab'
import NewSpeciesTab from 'src/components/compliance/tabs/NewSpeciesTab'

const SpeciesDrawer = ({ open, onClose, data, onSelect, selectedSpecies = [], title = 'Select Species' }) => {
  const theme = useTheme()
  const [activeTab, setActiveTab] = useState(0)
  const [prevSelectedItems, setPrevSelectedItems] = useState([])
  const [newlySelectedAntzItems, setNewlySelectedItems] = useState([])

  useEffect(() => {
    if (open) {
      setPrevSelectedItems(selectedSpecies)
      setNewlySelectedItems([])
      setActiveTab(0)
    }
  }, [open])

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  const handleToggle = speciesItem => {
    setNewlySelectedItems([speciesItem])
  }

  const handleAddCustomSpecies = newSpecies => {
    setNewlySelectedItems([newSpecies])
    handleDone(newSpecies)
  }

  const handleDone = specieItem => {
    const combined = specieItem ? [...prevSelectedItems, specieItem] : [...prevSelectedItems, ...newlySelectedAntzItems]
    onSelect(combined)
    onClose()
  }

  const totalSelectedCount = newlySelectedAntzItems.length

  return (
    <Drawer open={open} onClose={onClose} anchor='right'>
      <Box
        sx={{
          width: 570,
          maxWidth: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.palette.common.white

          // backgroundColor: theme.palette.customColors.Background
        }}
      >
        {/* Header */}
        <Box sx={{ px: 5, pt: 4, pb: 2 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 500 }}>{title}</Typography>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Tabs */}
        <Box
          sx={{
            px: 5,
            width: '100%',
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.common.white
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant='fullWidth' // This makes tabs take equal width
            sx={{
              '& .MuiTabs-indicator': {
                display: 'none' // Hide default indicator
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                position: 'relative',
                minWidth: 0, // Override default minWidth
                flex: 1, // Equal flex distribution
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                  '&::after': {
                    // Custom border indicator
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    backgroundColor: theme.palette.primary.main
                  }
                },
                '&:not(.Mui-selected)': {
                  color: theme.palette.customColors.OnSurfaceVariant
                }
              }
            }}
          >
            <Tab label='Antz Database' />
            <Tab label='Custom Species' />
          </Tabs>
        </Box>

        <Box sx={{ px: 5, flex: 1, overflowY: 'auto', backgroundColor: theme.palette.customColors.Background }}>
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

          {activeTab === 0 ? (
            <AntzDatabaseTab
              data={data}
              selectedItems={newlySelectedAntzItems}
              onToggle={handleToggle}
              prevSelectedItems={prevSelectedItems}
            />
          ) : (
            <NewSpeciesTab
              selectedItems={newlySelectedAntzItems}
              onToggle={handleToggle}
              prevSelectedItems={prevSelectedItems}
              onAddSpecies={handleAddCustomSpecies}
            />
          )}
        </Box>

        {/* Footer */}
        <Box
          sx={{
            position: 'sticky',
            bottom: 0,
            px: 5,
            py: 6,
            backgroundColor: theme.palette.common.white,
            boxShadow: `0px -4px 21px 0px ${
              theme.palette.mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.05)'
            }`,
            zIndex: 1
          }}
        >
          <Button fullWidth variant='contained' onClick={() => handleDone()} disabled={totalSelectedCount === 0}>
            Done ({totalSelectedCount})
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default React.memo(SpeciesDrawer)
