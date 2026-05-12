import React, { useState, useEffect } from 'react'
import { Typography, Box, Drawer, IconButton, CircularProgress, Button } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Search from 'src/views/utility/Search'
import CloseIcon from '@mui/icons-material/Close'
import ExportCard from '../import-view/AddExportPermitCard'
import SelectedExportDrawer from './SelectedExportDrawer'
import type { ExportPermit } from 'src/types/compliance'

interface DraftData {
  export: ExportPermit[]
  [key: string]: unknown
}

interface ExportPermitDrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  handleSearch: (val: string) => void
  exportsList: ExportPermit[]
  exportsTotalCount: number
  handleScroll: (e: React.UIEvent<HTMLElement>) => void
  scrollContainerRef: React.RefObject<HTMLElement>
  selectedExportData: { export: ExportPermit[] }
  setSelectedExportData: React.Dispatch<React.SetStateAction<{ export: ExportPermit[] }>>
  setexportPermitDrawerOpen: (open: boolean) => void
  isLoading: boolean
  loader: boolean
  draftData: DraftData
  setDraftData: React.Dispatch<React.SetStateAction<DraftData>>
  setSearchValue: (val: string) => void
}

const ExportPermitDrawer = ({
  open,
  onClose,
  title,
  handleSearch,
  exportsList,
  exportsTotalCount,
  handleScroll,
  scrollContainerRef,
  selectedExportData,
  setSelectedExportData,
  setexportPermitDrawerOpen,
  isLoading,
  loader,
  draftData,
  setDraftData,
  setSearchValue
}: ExportPermitDrawerProps) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const [selectedSidebarOpen, setSelectedSidebarOpen] = useState<boolean>(false)

  const handleAdd = () => {
    setSelectedExportData({
      export: [...draftData.export]
    })
    setexportPermitDrawerOpen(false)
    setSearchValue('')
  }

  const handleCancel = () => {
    setDraftData(prev => ({
      ...prev,
      export: prev.export.filter(draftItem =>
        selectedExportData.export.some(selectedItem => selectedItem.id === draftItem.id)
      )
    }))
    onClose()
  }

  useEffect(() => {
    if (open) {
      setDraftData({
        export: [...selectedExportData.export]
      })
    }
  }, [open])

  return (
    <Drawer
      open={open}
      //onClose={onClose}
      anchor='right'
    >
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
            <IconButton onClick={handleCancel}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Scrollable content */}
        <Box
          sx={{ px: 5, flex: 1, mt: 2, overflowY: 'auto', height: '600px' }}
          onScroll={handleScroll}
          ref={scrollContainerRef as React.RefObject<HTMLDivElement>}
        >
          <Search
            sx={{ width: '100%' }}
            textFielsSX={{
              width: '100%',
              height: 52,
              borderRadius: '8px',
              backgroundColor: theme.palette.common.white
            }}
            placeholder={t('compliance_module.search_for_export_id')}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
            onClear={() => handleSearch('')}
          />

          <Typography sx={{ fontSize: '1.25rem', fontWeight: 500, my: 4 }}>
            {t('compliance_module.exports')} {exportsTotalCount ? `(${exportsTotalCount})` : ''}
          </Typography>

          <Box
            sx={{
              padding: 2,
              gap: 2,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box>
              {/* Initial loader */}
              {loader ? (
                <Box sx={{ padding: 6, textAlign: 'center' }}>
                  <CircularProgress size={28} />
                </Box>
              ) : exportsList.length > 0 ? (
                <>
                  {exportsList.map((item, index) => (
                    <ExportCard
                      key={index}
                      sx={{
                        marginBottom: 2,
                        '&:last-child': { marginBottom: 0 }
                      }}
                      exportId={item.id}
                      exportNumber={item.export_number}
                      exporter={item.exporter_name}
                      species={item.species_count as unknown as string}
                      animals={item.animal_count as unknown as string}
                      exporterCountry={item.exporting_country}
                      shipment_count={item.shipment_count as unknown as number}
                      selectedExportData={selectedExportData}
                      setSelectedExportData={setSelectedExportData}
                      setDraftData={setDraftData}
                      draftData={draftData}
                      setexportPermitDrawerOpen={setexportPermitDrawerOpen}
                      exportsList={exportsList}
                    />
                  ))}

                  {/* Infinite scroll loader */}
                  {isLoading && (
                    <Box sx={{ padding: 2, textAlign: 'center' }}>
                      <CircularProgress size={20} />
                    </Box>
                  )}
                </>
              ) : (
                <Typography
                  sx={{
                    background: theme.palette.customColors.mdAntzNeutral,
                    p: 12,
                    textAlign: 'center',
                    borderRadius: '8px',
                    fontWeight: '500'
                  }}
                >
                  {t('compliance_module.no_exports_to_show')}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
        <Box
          sx={{
            position: 'sticky',
            bottom: 0,
            px: 5,
            py: 4,
            mt: 4,
            boxShadow: `0px -4px 21px 0px ${
              theme.palette.mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.05)'
            }`,
            zIndex: 1,
            marginTop: 'auto',
            backgroundColor: theme.palette.customColors.Background
          }}
        >
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            {draftData.export.length > 0 && (
              <Typography
                onClick={() => setSelectedSidebarOpen(true)}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  color: theme.palette.primary.main,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {draftData.export.length} {t('selected')} <ExpandMoreIcon sx={{ fontSize: '28px' }} />
              </Typography>
            )}
            <Button
              variant='contained'
              onClick={handleAdd}
              disabled={draftData.export.length === 0}
              sx={{ width: draftData.export.length > 0 ? '65%' : '100%' }}
            >
              {t('add')}
            </Button>
          </Box>
        </Box>
      </Box>
      <SelectedExportDrawer
        selectedSidebarOpen={selectedSidebarOpen}
        setSelectedSidebarOpen={setSelectedSidebarOpen}
        selectedExportData={selectedExportData}
        draftData={draftData}
        setDraftData={setDraftData}
      />
    </Drawer>
  )
}

export default React.memo(ExportPermitDrawer)
