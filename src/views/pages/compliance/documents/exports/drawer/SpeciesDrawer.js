import React, { useState, useEffect } from 'react'
import { Typography, Box, Drawer, IconButton, Tabs, Tab, Button } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import { CellInfo } from 'src/utility/render'
import AntzDatabaseTab from '../forms/AntzDatabaseTab'
import NewSpeciesTab from '../forms/NewSpeciesTab'

const SpeciesDrawer = ({ open, onClose, data, onSelect, selectedSpecies = [], title = 'Select Species' }) => {
  const theme = useTheme()
  const [activeTab, setActiveTab] = useState(0)
  const [prevSelectedItems, setPrevSelectedItems] = useState([])
  const [newlySelectedAntzItems, setNewlySelectedAntzItems] = useState([])
  const [newlySelectedCustomItems, setNewlySelectedCustomItems] = useState([])

  useEffect(() => {
    if (open) {
      setPrevSelectedItems(selectedSpecies)
      setNewlySelectedAntzItems([])
      setNewlySelectedCustomItems([])
      setActiveTab(0)
    }
  }, [open])

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  const handleAntzToggle = speciesItem => {
    const isSelected = newlySelectedAntzItems.some(item => item.tsn_id === speciesItem.tsn_id)

    const updated = isSelected
      ? newlySelectedAntzItems.filter(item => item.tsn_id !== speciesItem.tsn_id)
      : [...newlySelectedAntzItems, speciesItem]
    setNewlySelectedAntzItems(updated)
  }

  const handleCustomToggle = speciesItem => {
    const isSelected = newlySelectedCustomItems.some(item => item.tsn_id === speciesItem.tsn_id)

    const updated = isSelected
      ? newlySelectedCustomItems.filter(item => item.tsn_id !== speciesItem.tsn_id)
      : [...newlySelectedCustomItems, speciesItem]
    setNewlySelectedCustomItems(updated)
  }

  const handleAddCustomSpecies = newSpecies => {
    const customSpecies = {
      ...newSpecies,
      tsn_id: `custom_${Date.now()}`,
      isCustom: true
    }
    setNewlySelectedCustomItems(prev => [...prev, customSpecies])
  }

  const handleDone = () => {
    const combined = [...prevSelectedItems, ...newlySelectedAntzItems, ...newlySelectedCustomItems]
    onSelect(combined)
    onClose()
  }

  const totalSelectedCount = newlySelectedAntzItems.length + newlySelectedCustomItems.length

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
              onToggle={handleAntzToggle}
              prevSelectedItems={prevSelectedItems}
            />
          ) : (
            <NewSpeciesTab
              selectedItems={newlySelectedCustomItems}
              onToggle={handleCustomToggle}
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
          <Button fullWidth variant='contained' onClick={handleDone} disabled={totalSelectedCount === 0}>
            Done ({totalSelectedCount})
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default React.memo(SpeciesDrawer)
