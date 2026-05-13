import React, { useState, useMemo, useCallback } from 'react'
import { Avatar, Box, Card, Button, IconButton, Switch, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { debounce } from 'lodash'
import Icon from 'src/@core/components/icon'
import Search from 'src/views/utility/Search'
import DietUploadDrawer from 'src/components/collection/DietUploadDrawer'
import { getSpecieDetailById } from 'src/lib/api/diet/speciesDiet'
import Utility from 'src/utility'

interface DietAttachment {
  attachment_id: number
  file: string
  file_original_name: string
  file_type: string
  notes: string | null
  attached_by: string
  attached_by_profile: string
  dietitian_name: string | null
  dietitian_role_name: string | null
  dietitian_by_profile: string | null
  created_at: string
}

interface DietTabProps {
  speciesId?: string
  speciesName?: string
  scientificName?: string
  speciesImage?: string
}

const formatDate = (iso?: string | null) => {
  if (!iso) return '-'
  const d = new Date(iso.replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return iso
  const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const timePart = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

  return `${datePart} | ${timePart}`
}

const DietTab: React.FC<DietTabProps> = ({
  speciesId,
  speciesName = '',
  scientificName = '',
  speciesImage = ''
}) => {
  const { t } = useTranslation()
  const theme = useTheme() as any
  const [searchValue, setSearchValue] = useState('')
  const [dietUploadOpen, setDietUploadOpen] = useState(false)

  const debouncedSearch = useMemo(() => debounce(() => {}, 500), [])
  const handleSearch = useCallback((value: string) => {
    setSearchValue(value)
    debouncedSearch()
  }, [debouncedSearch])

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['species-diet-detail', speciesId],
    queryFn: () => getSpecieDetailById(speciesId!),
    enabled: Boolean(speciesId)
  })

  const dietData = data?.data?.data || data?.data || {}
  const activeAttachments: DietAttachment[] = dietData?.active_attachments || []
  const activeCount = Number(dietData?.active_attachments_count) || activeAttachments.length

  const filteredAttachments = useMemo(() => {
    if (!searchValue) return activeAttachments

    return activeAttachments.filter(a =>
      a.file_original_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      a.dietitian_name?.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [activeAttachments, searchValue])

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Typography variant='h6' sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}>
          {t('species_module.diet_attached_header')} ({activeCount})
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Search
            borderRadius='4px'
            width='200px'
            placeholder={t('search')}
            value={searchValue}
            onClear={() => handleSearch('')}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
          />
          <Button
            variant='contained'
            startIcon={<Icon icon='mdi:plus' />}
            onClick={() => setDietUploadOpen(true)}
            sx={{ textTransform: 'uppercase', borderRadius: '4px', fontWeight: 600, whiteSpace: 'nowrap' }}
          >
            {t('species_module.upload')}
          </Button>
        </Box>
      </Box>

      {isLoading ? (
        <Typography variant='body2' sx={{ color: theme.palette.customColors.neutralSecondary }}>{t('species_module.loading')}</Typography>
      ) : filteredAttachments.length === 0 ? (
        <Typography variant='body2' sx={{ color: theme.palette.customColors.neutralSecondary }}>{t('species_module.no_diet_attachments')}</Typography>
      ) : (
        filteredAttachments.map((item: DietAttachment) => (
          <Card key={item.attachment_id} sx={{ mb: 4, border: `0.5px solid ${theme.palette.customColors.OutlineVariant}`, boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, p: 4, gap: 2 }}>
              {/* File info */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: 1, backgroundColor: theme.palette.customColors.BgTeritary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon icon='mdi:file-pdf-box' fontSize={28} color='#E53935' />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}>
                    {item.file_original_name || '-'}
                  </Typography>
                  <Typography variant='body2' sx={{ color: theme.palette.customColors.neutralSecondary }}>
                    {item.dietitian_name || item.attached_by || '-'}{item.dietitian_role_name ? ` • ${item.dietitian_role_name}` : ''}
                  </Typography>
                </Box>
              </Box>

              {/* Right side: uploader + toggle + delete */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar src={item.attached_by_profile} sx={{ width: 28, height: 28, bgcolor: theme.palette.customColors.Surface }}>
                    <Icon icon='mdi:account' fontSize={16} />
                  </Avatar>
                  <Box>
                    <Typography variant='body2' sx={{ fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
                      {item.attached_by || '-'}
                    </Typography>
                    <Typography variant='caption' sx={{ color: theme.palette.customColors.neutralSecondary }}>
                      {formatDate(item.created_at)}
                    </Typography>
                  </Box>
                </Box>
                <Switch defaultChecked size='small' />
                <IconButton size='small' onClick={() => Utility.downloadFileFromURLWithBlob(item.file, item.file_original_name)}>
                  <Icon icon='solar:download-square-linear' fontSize={20} color={theme.palette.customColors.OnSurface} />
                </IconButton>
                <IconButton size='small'>
                  <Icon icon='mdi:delete-outline' fontSize={20} color={theme.palette.customColors.Outline} />
                </IconButton>
              </Box>
            </Box>

            {/* Notes */}
            {item.notes && (
              <Box sx={{ mx: 4, mb: 4, p: 3, backgroundColor: theme.palette.customColors.antzNotes, borderRadius: 1, borderLeft: `3px solid ${theme.palette.customColors.antzNotes80}` }}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', mb: 0.5, color: theme.palette.customColors.OnSurfaceVariant }}>{t('species_module.notes_label')}</Typography>
                <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant, lineHeight: 1.6 }}>
                  {item.notes}
                </Typography>
              </Box>
            )}
          </Card>
        ))
      )}

      <DietUploadDrawer
        open={dietUploadOpen}
        onClose={() => setDietUploadOpen(false)}
        speciesName={speciesName}
        scientificName={scientificName}
        speciesImage={speciesImage}
      />
    </Box>
  )
}

export default DietTab
