import React from 'react'
import { Typography, Box, Drawer, IconButton, CircularProgress } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import Search from 'src/views/utility/Search'
import CloseIcon from '@mui/icons-material/Close'
import ExportCard from '../shipment-view/AddExportPermitCard'

interface DraftData {
  export: unknown[]
  others: unknown[]
}

interface SelectedExportData {
  export: unknown[]
  others: unknown[]
}

interface ExportListItem {
  id: string | number
  export_number?: string
  exporter_name?: string
  species_count?: number
  animal_count?: number
  exporting_country?: string
  shipment_count?: number
  shipments?: unknown[]
  [key: string]: unknown
}

interface ExportPermitDrawerProps {
  open: boolean
  onClose: () => void
  title: string
  handleSearch: (value: string) => void
  exportsList: ExportListItem[]
  exportsTotalCount: number
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void
  scrollContainerRef: React.RefObject<HTMLDivElement>
  onExportCardSelect: (data: SelectedExportData) => void
  selectedExportData: SelectedExportData
  setSelectedExportData: React.Dispatch<React.SetStateAction<SelectedExportData>>
  setexportPermitDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>
  isLoading: boolean
  loader: boolean
  draftData: DraftData
  setDraftData: React.Dispatch<React.SetStateAction<DraftData>>
  setSearchValue: React.Dispatch<React.SetStateAction<string>>
  shipmentId?: string | number
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
  onExportCardSelect,
  selectedExportData,
  setSelectedExportData,
  setexportPermitDrawerOpen,
  isLoading,
  loader,
  draftData,
  setDraftData,
  setSearchValue,
  shipmentId
}: ExportPermitDrawerProps) => {
  const { t } = useTranslation()
  const theme = useTheme()

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

        <Box
          sx={{ px: 5, flex: 1, mt: 2, overflowY: 'auto', height: '600px' }}
          onScroll={handleScroll}
          ref={scrollContainerRef}
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
              // padding: 2,
              gap: 2,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box>
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
                      species={item.species_count}
                      animals={item.animal_count}
                      exporterCountry={item.exporting_country}
                      onExportCardSelect={onExportCardSelect}
                      shipment_count={item.shipment_count}
                      shipments={item.shipments}
                      selectedExportData={selectedExportData}
                      setSelectedExportData={setSelectedExportData}
                      setDraftData={setDraftData}
                      draftData={draftData}
                      setexportPermitDrawerOpen={setexportPermitDrawerOpen}
                      setSearchValue={setSearchValue}
                      shipmentId={shipmentId}
                    />
                  ))}

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
      </Box>
    </Drawer>
  )
}

export default React.memo(ExportPermitDrawer)
