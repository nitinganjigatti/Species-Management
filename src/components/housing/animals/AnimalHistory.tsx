import { Box, Grid } from '@mui/system'
import React, { useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'
import { Typography, Skeleton, Tabs, Tab } from '@mui/material'
import { useTheme } from '@emotion/react'
import AnimalDetailsHistory from 'src/views/pages/housing/animals/AnimalDetailsHistory'
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineItem,
  timelineItemClasses,
  TimelineSeparator
} from '@mui/lab'
import { getAnimalHistory } from 'src/lib/api/housing'
import useSafeRouter from 'src/hooks/useSafeRouter'
import Utility from 'src/utility'
import NoDataFound from 'src/views/utility/NoDataFound'
import { useTranslation } from 'react-i18next'

interface HistoryData {
  id: number
  in_date: string
  out_date?: string
  user_enclosure_name: string
  section_name: string
  site_name: string
  total_inmates: number
}

interface FormattedHistoryData {
  id: number
  label: string
  time: string
  enclosure: string
  section: string
  site: string
  inDate: string
  outDate?: string
  totalInmates: number
  reporter: string
  rawData: HistoryData
}

// Sub-tab configuration matching mobile implementation
const SUB_TABS = [
  { id: 'enclosurehistory', labelKey: 'animals_module.enclosure_history', icon: 'mdi:history' },
  { id: 'inmates', labelKey: 'animals_module.any_other', icon: 'mdi:store' }
]

const AnimalHistory: React.FC = () => {
  const theme = useTheme() as any
  const { t } = useTranslation()
  const router = useSafeRouter()
  const { id } = router.query

  const [selectedSubTab, setSelectedSubTab] = useState<string>('enclosurehistory')
  const [animalHistory, setAnimalHistory] = useState<HistoryData[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  const fetchHistoryData = async (): Promise<void> => {
    if (!id || Array.isArray(id)) return
    setLoading(true)

    try {
      const params = {
        animal_id: Number(id)
      }

      await getAnimalHistory(params).then((res: any) => {
        if (res?.success === true) {
          setAnimalHistory(res?.data?.result || [])
          setLoading(false)
        }
      })
    } catch (error) {
      console.error(error, 'Cannot fetch Animal History')
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id && selectedSubTab === 'enclosurehistory') {
      fetchHistoryData()
    }
  }, [id, selectedSubTab])

  const handleSubTabChange = (event: React.SyntheticEvent, newValue: string): void => {
    setSelectedSubTab(newValue)
  }

  const formatHistoryData = (historyData: HistoryData[]): FormattedHistoryData[] => {
    return historyData.map((item, index) => ({
      id: item.id,
      label: index === 0 ? t('animals_module.current_enclosure') : t('animals_module.previous_enclosure'),
      time: Utility.convertUTCToLocaltime(item.in_date),
      enclosure: item.user_enclosure_name,
      section: item.section_name,
      site: item.site_name,
      inDate: Utility.formatDisplayDate(item.in_date),
      outDate: item.out_date ? Utility.formatDisplayDate(item.out_date) : undefined,
      totalInmates: item.total_inmates,
      reporter: t('animals_module.system'),
      rawData: item
    }))
  }

  // Skeleton component for timeline items
  const TimelineSkeleton: React.FC = () => (
    <Timeline
      position='right'
      sx={{
        [`& .${timelineItemClasses.root}:before`]: {
          flex: 0,
          padding: 0
        }
      }}
    >
      {[1, 2, 3].map((item, idx) => (
        <TimelineItem key={item}>
          <TimelineSeparator
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Skeleton variant='circular' width={40} height={40} />
            {idx < 2 && <TimelineConnector />}
          </TimelineSeparator>
          <TimelineContent
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              justifyContent: 'flex-start',
              width: '100%',
              py: 0,
              pl: 2
            }}
          >
            {/* Left side - Timeline info skeleton */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                minWidth: '200px',
                justifyContent: 'center'
              }}
            >
              <Skeleton variant='text' width={140} height={20} />
              <Skeleton variant='text' width={120} height={24} />
              <Skeleton variant='text' width={80} height={16} />
            </Box>
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  gap: 1,
                  p: 4,
                  borderRadius: 1,
                  background: theme.palette.customColors.displaybgPrimary,
                  width: { xs: '100%', md: '400px' },
                  maxWidth: '400px',
                  mt: 1
                }}
              >
                <Skeleton variant='text' width={180} height={20} />
                <Skeleton variant='text' width={160} height={20} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Skeleton variant='circular' width={16} height={16} />
                  <Skeleton variant='text' width={120} height={20} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Skeleton variant='rectangular' width={16} height={16} />
                  <Skeleton variant='text' width={120} height={20} />
                </Box>
                <Skeleton variant='text' width={200} height={20} />
              </Box>
            </Box>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  )

  // Enclosure History Content
  const EnclosureHistoryContent: React.FC = () => {
    if (loading) {
      return <TimelineSkeleton />
    }

    if (animalHistory.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
          <NoDataFound />
        </Box>
      )
    }

    return (
      <Timeline
        position='right'
        sx={{
          [`& .${timelineItemClasses.root}:before`]: {
            flex: 0,
            padding: 0
          }
        }}
      >
        {formatHistoryData(animalHistory).map((item, idx) => (
          <TimelineItem key={item.id}>
            <TimelineSeparator
              sx={{
                py: '6px',
                '& span': {
                  ml: '1px',
                  background: 'transparent',
                  width: '1px',
                  height: '100%',
                  backgroundImage: `repeating-linear-gradient(
                    to bottom,
                    ${theme.palette.customColors.OutlineVariant},
                    ${theme.palette.customColors.OutlineVariant} 5px,
                    transparent 8px,
                    transparent 13px
                  )`,
                  opacity: 1
                }
              }}
            >
              <img
                src={
                  item?.label === 'Current Enclosure'
                    ? '/images/housing/current_enclosure.svg'
                    : '/images/housing/previous_enclosure.svg'
                }
                alt='enclosure_icon'
              />
              {idx < animalHistory.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 4,
                justifyContent: 'flex-start',
                width: '100%',
                py: 0
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: '200px' }}>
                <Typography variant='subtitle2' sx={{ color: theme.palette.customColors?.secondaryBg }}>
                  {item.label}
                </Typography>
                <Typography variant='body1' sx={{ fontWeight: 600 }}>
                  {item.enclosure}
                </Typography>
                <Typography variant='caption'>{item.time}</Typography>
              </Box>
              <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
                <AnimalDetailsHistory historyData={item} />
              </Box>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    )
  }

  // Inmates Content - Placeholder matching mobile implementation
  const InmatesContent: React.FC = () => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <NoDataFound />
        <Typography variant='body2' sx={{ mt: 2, color: theme.palette.text.secondary }}>
          {t('animals_module.no_inmates_record_found')}
        </Typography>
      </Box>
    )
  }

  return (
    <>
      <Grid container sx={{ mt: 4 }}>
        {/* Sub-tabs */}
        <Grid size={{ xs: 12 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4,display:'inline-block' }}>
            <Tabs
              value={selectedSubTab}
              onChange={handleSubTabChange}
              sx={{
                '& .MuiTab-root': {
                  minHeight: 48,
                  textTransform: 'none',
                  fontWeight: 500
                }
              }}
            >
              {SUB_TABS.map(tab => (
                <Tab
                  key={tab.id}
                  value={tab.id}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Icon icon={tab.icon} fontSize={18} />
                      <span>{t(tab.labelKey)}</span>
                    </Box>
                  }
                />
              ))}
            </Tabs>
          </Box>
        </Grid>

        {/* Tab Content */}
        <Grid size={{ xs: 12 }} sx={{ width: '100%' }}>
          {selectedSubTab === 'enclosurehistory' ? <EnclosureHistoryContent /> : <InmatesContent />}
        </Grid>
      </Grid>
    </>
  )
}

export default AnimalHistory
