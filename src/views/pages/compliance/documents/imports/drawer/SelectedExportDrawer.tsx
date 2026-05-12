import React from 'react'
import { Typography, Box, Drawer, IconButton } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import Icon from 'src/@core/components/icon'
import type { ExportPermit } from 'src/types/compliance'
import { useTranslation } from 'react-i18next'

interface DraftData {
  export: ExportPermit[]
  [key: string]: unknown
}

interface SelectedExportDrawerProps {
  selectedSidebarOpen: boolean
  setSelectedSidebarOpen: (open: boolean) => void
  selectedExportData?: { export: ExportPermit[] }
  draftData: DraftData
  setDraftData: React.Dispatch<React.SetStateAction<DraftData>>
}

const SelectedExportDrawer = ({
  selectedSidebarOpen,
  setSelectedSidebarOpen,
  draftData,
  setDraftData
}: SelectedExportDrawerProps) => {
  const { t } = useTranslation()
  const theme = useTheme()

  return (
    <Drawer
      open={selectedSidebarOpen}
      //onClose={() => setSelectedSidebarOpen(false)}
      anchor='right'
      sx={{
        '& .MuiDrawer-paper': {
          mt: '8%',
          borderTopLeftRadius: '7px',
          borderTopRightRadius: '7px',
          width: 570,
          maxWidth: '100vw',
          height: 'calc(92vh)',
          backgroundColor: '#F3F7F5',
          overflow: 'hidden'
        }
      }}
    >
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          p: 4,
          overflowY: 'auto',
          mb: 18
        }}
      >
        <Box display='flex' justifyContent='space-between' alignItems='center' mb={4}>
          <Typography sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
            {t('compliance_module.selected_exports')} ({draftData?.export?.length})
          </Typography>
          <IconButton onClick={() => setSelectedSidebarOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box display='flex' flexDirection='column' gap={3}>
          {draftData?.export?.length > 0 ? (
            draftData?.export?.map((item, index) => (
              <Box
                key={item.id as React.Key}
                sx={{
                  backgroundColor: theme.palette.common.white,
                  borderRadius: '8px',
                  px: 5,
                  pt: 3,
                  pb: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 0 4px rgba(0, 0, 0, 0.05)',
                  position: 'relative'
                }}
              >
                <IconButton
                  edge='end'
                  onClick={() =>
                    setDraftData(prev => ({
                      ...prev,
                      export: prev.export.filter(exp => exp.id !== item.id)
                    }))
                  }
                  sx={{
                    position: 'absolute',
                    top: 32,
                    right: 25,
                    color: 'error.main'
                  }}
                >
                  <Icon icon='carbon:close-outline' fontSize={24} />
                </IconButton>

                <Typography
                  sx={{ fontWeight: 400, mb: 0.5, color: theme.palette.customColors.secondaryBg, fontSize: '14px' }}
                >
                  {t('compliance_module.export_id_label')}{' '}
                  <Box
                    component='span'
                    fontWeight='500'
                    sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '14px' }}
                  >
                    {item?.export_number || 'N/A'}
                  </Box>
                </Typography>
                <Typography
                  sx={{ fontWeight: 400, mb: 0.5, color: theme.palette.customColors.secondaryBg, fontSize: '14px' }}
                >
                  {t('compliance_module.exporter')} :{' '}
                  <Box
                    component='span'
                    fontWeight='500'
                    sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '14px' }}
                  >
                    {item?.exporter_name || 'N/A'}
                  </Box>
                </Typography>

                <Box display='flex' gap={2} mt={2}>
                  <Box
                    sx={{
                      background: theme.palette.customColors.lightBg,
                      px: 2.5,
                      pt: 1.2,
                      pb: 1.4,
                      borderRadius: '16px',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    {t('species')} {item.species?.length || 0}
                  </Box>
                  <Box
                    sx={{
                      background: theme.palette.customColors.lightBg,
                      px: 2.5,
                      pt: 1.2,
                      pb: 1.4,
                      borderRadius: '16px',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    {t('animals')} {item.species?.reduce((sum, s) => sum + Number(s.total_count || 0), 0)}
                  </Box>
                </Box>
              </Box>
            ))
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
    </Drawer>
  )
}

export default React.memo(SelectedExportDrawer)
