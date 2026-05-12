import React, { useState, useEffect, useCallback } from 'react'

import { useTheme } from '@mui/material/styles'
import {
  Box,
  Typography,
  TextField,
  Button,
  Drawer,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Radio,
  InputAdornment,
  IconButton,
  debounce,
  CardContent,
  CircularProgress
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'

import Icon from 'src/@core/components/icon'
import FallbackAvatar from 'src/views/utility/FallbackAvatar'
import { getEnclosureList } from 'src/lib/api/diet/dietList'
import { useTranslation } from 'react-i18next'

interface EnclosureRecord {
  enclosure_id: string | number
  user_enclosure_name: string
  default_icon?: string
  [key: string]: unknown
}

interface TempSelectedItems {
  Enclosure?: (string | number)[]
  [key: string]: unknown
}

interface SingleSelectEnclosureListProps {
  tempSelectedItems?: TempSelectedItems
  enclosuresData: EnclosureRecord[]
  open: boolean
  onClose?: () => void
  sectionId?: string | number
  onSelectEnclosures: (enclosures: (string | number)[]) => void
  setEnclosuresData: (data: EnclosureRecord[] | ((prev: EnclosureRecord[]) => EnclosureRecord[])) => void
  selectedEnclosures?: (string | number)[]
  setSelectedEnclosures?: (enclosures: (string | number)[]) => void
}

const SingleSelectEnclosureList = ({
  tempSelectedItems,
  enclosuresData,
  open,
  onClose,
  sectionId,
  onSelectEnclosures,
  setEnclosuresData,
  selectedEnclosures,
  setSelectedEnclosures
}: SingleSelectEnclosureListProps) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const [loading, setLoading] = useState<boolean>(false)
  const [pageNo, setPageNo] = useState<number>(1)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')

  const selectedEnclosureId = selectedEnclosures?.[0] || null

  const debouncedSearch = useCallback(
    debounce((searchValue: string) => {
      setPageNo(1)
      fetchEnclosures(searchValue)
    }, 500),
    [sectionId]
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    debouncedSearch(value)
  }

  const handleEnclosureRadioChange = (enclosureId: string | number) => {
    if (setSelectedEnclosures) {
      setSelectedEnclosures([enclosureId])
    }
  }

  useEffect(() => {
    if (open && sectionId) {
      setPageNo(1)
      setEnclosuresData([])
      fetchEnclosures()
    }
  }, [open, sectionId])

  useEffect(() => {
    if (open && sectionId && pageNo > 1) {
      fetchEnclosures()
    }
  }, [pageNo])

  useEffect(() => {
    if (open && tempSelectedItems?.Enclosure?.length) {
      const firstSelected = tempSelectedItems.Enclosure[0]
      if (setSelectedEnclosures) {
        setSelectedEnclosures([firstSelected])
      }
    }
  }, [open])

  const fetchEnclosures = async (searchQuery: string = searchTerm) => {
    if (!sectionId) return
    setLoading(true)
    try {
      const params = {
        section_id: sectionId,
        page_no: pageNo,
        limit: 15,
        q: searchQuery
      }
      const response = await getEnclosureList(params)
      const newEnclosures: EnclosureRecord[] = response.data?.result || []
      setTotalCount(response.data?.total_count || 0)

      setEnclosuresData(prev => (pageNo === 1 ? newEnclosures : [...prev, ...newEnclosures]))
      setHasMore(newEnclosures.length > 0)
    } catch (error) {
      console.error('Error fetching enclosures:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget
    const threshold = 50

    if (
      scrollHeight - (scrollTop + clientHeight) < threshold &&
      !loading &&
      hasMore &&
      enclosuresData.length < totalCount
    ) {
      setPageNo(prev => prev + 1)
    }
  }

  return (
    <Drawer
      anchor='right'
      open={open}
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', '562px'], height: '100%' },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        backgroundColor: 'background.default'
      }}
    >
      <Box
        sx={{
          bgcolor: theme.palette.common.white,
          borderRadius: '8px',
          overflow: 'hidden',
          width: '100%',
          maxWidth: 522,
          margin: '15px 20px 0px 20px',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography
              variant='h6'
              sx={{
                fontWeight: '500',
                color: theme.palette.customColors.OnPrimaryContainer
              }}
            >
              {t('compliance_module.choose_enclosure')}
            </Typography>
            <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
              {t('compliance_module.select_enclosure_from_list')}
            </Typography>
          </Box>
          <IconButton
            size='small'
            sx={{ color: 'text.primary' }}
            onClick={() => {
              onClose?.()
              setSearchTerm('')
            }}
          >
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>

        <Box sx={{ p: 2, borderBottom: '1px solid #E0E0E0' }}>
          <TextField
            fullWidth
            placeholder={t('search')}
            variant='outlined'
            size='small'
            value={searchTerm}
            onChange={handleSearchChange}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon sx={{ color: theme.palette.customColors.OnPrimaryContainer }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position='end'>
                    <IconButton
                      size='small'
                      onClick={() => {
                        setSearchTerm('')
                        fetchEnclosures('')
                      }}
                    >
                      <Icon icon='mdi:close' fontSize={20} />
                    </IconButton>
                  </InputAdornment>
                ),
                style: {
                  background: theme.palette.customColors.bodyBg,
                  borderRadius: '4px',
                  padding: '4px 8px',
                  color: theme.palette.customColors.OnPrimaryContainer
                }
              }
            }}
          />
        </Box>

        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
            {loading ? '' : `Selected ${selectedEnclosureId ? 1 : 0}/${enclosuresData?.length}`}
          </Typography>
        </Box>

        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            p: 2,
            '&::-webkit-scrollbar': {
              width: '4px'
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: theme.palette.grey[400],
              borderRadius: '2px'
            }
          }}
          onScroll={handleScroll}
        >
          {!loading ? (
            enclosuresData.length > 0 ? (
              [...enclosuresData]
                .sort((a, b) => a.user_enclosure_name.localeCompare(b.user_enclosure_name))
                .map(enclosure => {
                  const isSelected = selectedEnclosureId === enclosure.enclosure_id
                  return (
                    <ListItem
                      key={enclosure.enclosure_id}
                      sx={{
                        pr: 1.5,
                        pl: 3,
                        mb: 4,
                        height: '70px',
                        border: '1px solid',
                        borderColor: isSelected ? '#80E0A3' : theme.palette.customColors.OutlineVariant,
                        borderRadius: '8px',
                        bgcolor: isSelected ? theme.palette.customColors.OnBackground : 'transparent',
                        transition: theme.transitions.create(['border-color', 'background-color'], {
                          duration: theme.transitions.duration.shortest
                        })
                      }}
                      onClick={() => handleEnclosureRadioChange(enclosure.enclosure_id)}
                    >
                      <ListItemAvatar>
                        <FallbackAvatar
                          src={enclosure.default_icon}
                          fallback='/images/housing/site-icon-colored.svg'
                          variant='rounded'
                          sx={{
                            backgroundColor: theme.palette.customColors.displaybgPrimary,
                            p: enclosure?.default_icon ? 0 : 2,
                            height: '40px',
                            width: '40px',
                            borderRadius: '8px'
                          }}
                        />
                      </ListItemAvatar>
                      <ListItemText
                        primary={enclosure?.user_enclosure_name}
                        slotProps={{
                          primary: {
                            sx: {
                              fontWeight: 'bold',
                              color: theme.palette.customColors.OnPrimaryContainer
                            }
                          },
                          secondary: {
                            sx: {
                              color: theme.palette.customColors.OnSurfaceVariant
                            }
                          }
                        }}
                      />
                      <Radio
                        checked={isSelected}
                        onChange={() => handleEnclosureRadioChange(enclosure.enclosure_id)}
                        value={enclosure.enclosure_id}
                        sx={{
                          color: theme.palette.customColors.OnSurfaceVariant,
                          '&.Mui-checked': {
                            color: theme.palette.primary.main
                          }
                        }}
                      />
                    </ListItem>
                  )
                })
            ) : (
              <Typography sx={{ textAlign: 'center', mt: 15 }}>{t('compliance_module.no_enclosures_found')}</Typography>
            )
          ) : (
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 20 }}>
                <CircularProgress />
              </Box>
            </CardContent>
          )}
        </Box>

        <Box
          sx={{
            p: 2,
            pt: 4,
            position: 'sticky',
            bottom: 0,
            background: theme.palette.common.white,
            zIndex: 1,
            pb: 4
          }}
        >
          <Button
            variant='contained'
            fullWidth
            sx={{
              bgcolor: '#28A745',
              color: theme.palette.common.white,
              p: 2,
              borderRadius: '8px',
              '&:hover': { bgcolor: '#218838' }
            }}
            onClick={() => {
              onSelectEnclosures(selectedEnclosureId ? [selectedEnclosureId] : [])
              setSearchTerm('')
              onClose?.()
            }}
            disabled={!selectedEnclosureId}
          >
            {t('continue')}
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default SingleSelectEnclosureList
