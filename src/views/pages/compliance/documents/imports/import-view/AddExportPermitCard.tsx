import React from 'react'
import { Card, CardContent, Typography, Grid, Box, Button, Checkbox } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { ExportPermit, Id } from 'src/types/compliance'

interface DraftData {
  export: ExportPermit[]
  [key: string]: unknown
}

interface ExportCardProps {
  exportId?: Id
  exportNumber?: string
  exporter?: string
  species?: string
  animals?: string
  exporterCountry?: string
  draftData: DraftData
  setDraftData: React.Dispatch<React.SetStateAction<DraftData>>
  exportsList: ExportPermit[]
  sx?: Record<string, unknown>
  shipment_count?: number
  selectedExportData?: { export: ExportPermit[] }
  setSelectedExportData?: React.Dispatch<React.SetStateAction<{ export: ExportPermit[] }>>
  setexportPermitDrawerOpen?: (open: boolean) => void
}

const ExportCard = ({
  exportId,
  exportNumber,
  exporter,
  species,
  animals,
  exporterCountry,
  draftData,
  setDraftData,
  exportsList
}: ExportCardProps) => {
  const theme = useTheme()

  const exportObj = exportsList.find(item => item.id === exportId)
  const isSelected = draftData.export.some(item => item.id === exportId)

  const handleSelect = () => {
    setDraftData(prev => {
      if (isSelected) {
        return {
          ...prev,
          export: prev.export.filter(item => item.id !== exportId)
        }
      } else {
        return {
          ...prev,
          export: [...prev.export, exportObj!]
        }
      }
    })
  }

  const isInteractive = species !== '0'

  return (
    <>
      <Card
        sx={{
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'space-between',
          mb: 4,
          border: `1px solid ${theme.palette.customColors?.OutlineVariant}`,
          borderRadius: '8px',
          backgroundColor: theme.palette.common.white,
          boxShadow: 'none',
          minHeight: '121px',
          cursor: isInteractive ? 'pointer' : 'not-allowed'
        }}
        onClick={isInteractive ? handleSelect : undefined}
        onKeyDown={
          isInteractive
            ? (event: React.KeyboardEvent<HTMLDivElement>) => {
                if (event.target !== event.currentTarget) return
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  handleSelect()
                }
              }
            : undefined
        }
        tabIndex={isInteractive ? 0 : undefined}
        role={isInteractive ? 'button' : undefined}
      >
        {/* Left Section */}
        <CardContent sx={{ flex: 1, px: 4, py: 4 }}>
          <Typography
            variant='subtitle2'
            color={theme.palette.customColors.secondaryBg}
            fontWeight='400'
            sx={{ mb: 1 }}
          >
            Export ID :{' '}
            <span style={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: '500' }}>
              {exportNumber}
            </span>
          </Typography>
          <Typography variant='body2' color={theme.palette.customColors.secondaryBg} fontWeight='400' sx={{ mb: 3 }}>
            Exporter :{' '}
            <span style={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: '500' }}>
              {exporter},{exporterCountry}
            </span>
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid>
              <Button
                size='small'
                sx={{
                  backgroundColor: theme.palette.customColors.lightBg,
                  color: theme.palette.customColors.OnSurfaceVariant,
                  textTransform: 'none',
                  borderRadius: '26px',
                  minWidth: '80px',
                  boxShadow: 'none',
                  px: 4,
                  fontWeight: 400,
                  fontSize: '14px'
                }}
              >
                Species <Typography sx={{ fontWeight: 600, fontSize: '14px', pl: 1 }}>{species}</Typography>
              </Button>
            </Grid>
            <Grid>
              <Button
                size='small'
                sx={{
                  backgroundColor: theme.palette.customColors.lightBg,
                  color: theme.palette.customColors.OnSurfaceVariant,
                  textTransform: 'none',
                  borderRadius: '26px',
                  minWidth: '80px',
                  boxShadow: 'none',
                  px: 4,
                  fontWeight: 400,
                  fontSize: '14px'
                }}
              >
                Animals <Typography sx={{ fontWeight: 600, fontSize: '14px', pl: 1 }}> {animals}</Typography>
              </Button>
            </Grid>
          </Grid>
        </CardContent>

        {/* Right Section */}
        <Box
          sx={{
            background: theme.palette.customColors.Surface,

            // height: '121px',
            width: '45px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px', // Optional: better visual
            cursor: isInteractive ? 'pointer' : 'not-allowed',
            flexShrink: 0
          }}
          onClick={isInteractive ? handleSelect : undefined}
        >
          <Checkbox
            checked={isSelected}
            disabled={species === '0'}
            onClick={event => {
              event.stopPropagation()
            }}
            onChange={event => {
              event.stopPropagation()
              if (isInteractive) handleSelect()
            }}
            sx={{
              color: theme.palette.customColors.Outline,
              '&.Mui-checked': {
                color: theme.palette.primary.main
              }
            }}
          />
        </Box>
      </Card>
    </>
  )
}

export default ExportCard
