import React, { useState, useEffect, useCallback, memo, FC } from 'react'
import {
  Box,
  Drawer,
  IconButton,
  Typography,
  Skeleton,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import { useTheme, Theme } from '@mui/material/styles'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CheckIcon from '@mui/icons-material/Check'
import Icon from 'src/@core/components/icon'
import { getFilledChecklistList, getTransferChecklist } from 'src/lib/api/necropsy'
import NoDataFound from 'src/views/utility/NoDataFound'
import { TransferChecklistDrawerProps } from 'src/types/necropsy'

// Internal interfaces for checklist data structures
interface ChecklistItem {
  key?: string
  label?: string
  type?: 'checkbox' | 'textbox' | 'multi_line_textbox'
  value?: boolean | string
}

interface SubCategory {
  key?: string
  label?: string
  items?: ChecklistItem[]
  active?: boolean
}

interface ChecklistCategory {
  key?: string
  label?: string
  icon?: string
  items?: ChecklistItem[]
  sub_category?: SubCategory[]
  active?: boolean
}

interface FilledChecklistData {
  key: string
  value?: string
}

interface ExtendedTheme extends Theme {
  palette: Theme['palette'] & {
    customColors?: {
      OnSurfaceVariant?: string
      neutralSecondary?: string
      neutralPrimary?: string
      avatarBackground?: string
      OnPrimaryContainer?: string
      OnPrimary?: string
    }
  }
}

const TransferChecklistDrawer: FC<TransferChecklistDrawerProps> = ({ open, onClose, transferId }) => {
  const theme = useTheme<ExtendedTheme>()
  const [checklistData, setChecklistData] = useState<ChecklistCategory[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [expandedPanels, setExpandedPanels] = useState<number[]>([])

  const findItemByKey = (dataArray: FilledChecklistData[], key: string): FilledChecklistData | null => {
    if (!Array.isArray(dataArray)) return null
    for (let i = 0; i < dataArray.length; i++) {
      if (dataArray[i].key === key) {
        return dataArray[i]
      }
    }
    
return null
  }

  const fetchChecklistData = useCallback(async () => {
    if (!transferId) return
    setLoading(true)
    try {
      const [templateResponse, filledResponse] = await Promise.all([
        getTransferChecklist(),
        getFilledChecklistList(transferId)
      ])

      // Handle various API response formats
      const rawTemplateData = templateResponse?.data

      const templateData: ChecklistCategory[] = Array.isArray(rawTemplateData)
        ? rawTemplateData
        : (rawTemplateData as { result?: ChecklistCategory[] })?.result || []

      const rawFilledData = filledResponse?.data

      const filledData: FilledChecklistData[] = Array.isArray(rawFilledData)
        ? rawFilledData
        : (rawFilledData as unknown as { result?: FilledChecklistData[] })?.result || []

      if (!Array.isArray(templateData) || templateData.length === 0) {
        setChecklistData([])
        
return
      }
      templateData.forEach(category => {
        if (category.sub_category) {
          category.sub_category.forEach(subCategory => {
            if (subCategory.items) {
              subCategory.items.forEach(item => {
                const itemFind = findItemByKey(filledData, item?.key || '')

                if (item.type === 'checkbox') {
                  item.value = itemFind?.value ? Boolean(Number(itemFind?.value)) : false
                } else if (item.type === 'textbox' || item.type === 'multi_line_textbox') {
                  item.value = itemFind?.value ?? ''
                }
              })
            }
          })
        } else if (category.items) {
          category.items.forEach(item => {
            const itemFind = findItemByKey(filledData, item?.key || '')
            if (item.type === 'checkbox') {
              item.value = itemFind?.value ? Boolean(Number(itemFind?.value)) : false
            } else if (item.type === 'textbox' || item.type === 'multi_line_textbox') {
              item.value = itemFind?.value ?? ''
            }
          })
        }
      })

      const processedData = templateData.map(category => {
        if (category?.sub_category) {
          const processedSubCategories = category.sub_category.map(subCategory => ({
            ...subCategory,
            active: subCategory?.items?.some(item => {
              if (item.type === 'checkbox') return item.value === true
              if (item.type === 'textbox' || item.type === 'multi_line_textbox') return Boolean(item.value)
              
return false
            })
          }))
          
return {
            ...category,
            active: processedSubCategories.some(sub => sub.active),
            sub_category: processedSubCategories
          }
        } else if (category?.items) {
          return {
            ...category,
            active: category.items.some(item => {
              if (item.type === 'checkbox') return item.value === true
              if (item.type === 'textbox' || item.type === 'multi_line_textbox') return Boolean(item.value)
              
return false
            })
          }
        }
        
return { ...category, active: false }
      })

      const activeCategories = processedData.filter(cat => cat.active)
      setChecklistData(activeCategories)
      setExpandedPanels(activeCategories.map((_, index) => index))
    } catch (error) {
      console.error('Error fetching checklist data:', error)
      setChecklistData([])
    } finally {
      setLoading(false)
    }
  }, [transferId])

  useEffect(() => {
    if (open && transferId) {
      fetchChecklistData()
    }
  }, [open, transferId, fetchChecklistData])

  const handlePanelChange = (panelIndex: number): void => {
    setExpandedPanels(prev => (prev.includes(panelIndex) ? prev.filter(p => p !== panelIndex) : [...prev, panelIndex]))
  }

  const getVisibleItems = (items?: ChecklistItem[]): ChecklistItem[] => {
    if (!items) return []
    
return items.filter(item => {
      if (item.type === 'checkbox') return item.value === true
      if (item.type === 'textbox' || item.type === 'multi_line_textbox') return Boolean(item.value)
      
return false
    })
  }

  const renderChecklistItem = (item: ChecklistItem, index: number): React.ReactNode => {
    if (item?.type === 'checkbox' && item?.value) {
      return (
        <Box
          key={item?.key || index}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            py: 1.5,
            px: 3
          }}
        >
          <CheckIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 400,
              color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary,
              flex: 1
            }}
          >
            {item?.label || 'Checkbox Item'}
          </Typography>
        </Box>
      )
    }

    if ((item?.type === 'textbox' || item?.type === 'multi_line_textbox') && item?.value) {
      return (
        <Box
          key={item?.key || index}
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 2,
            py: 1.5,
            px: 3
          }}
        >
          <CheckIcon sx={{ color: theme.palette.primary.main, fontSize: 20, mt: 0.25 }} />
          <Box sx={{ flex: 1 }}>
            <Typography
              component='span'
              sx={{
                fontSize: '14px',
                fontWeight: 400,
                color: theme.palette.customColors?.neutralSecondary || theme.palette.text.secondary
              }}
            >
              {item?.label || 'Text Field'} -{' '}
            </Typography>
            <Typography
              component='span'
              sx={{
                fontSize: '14px',
                fontWeight: 400,
                color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary,
                wordBreak: 'break-word'
              }}
            >
              {item?.value}
            </Typography>
          </Box>
        </Box>
      )
    }

    return null
  }

  const renderSubCategory = (subCategory: SubCategory, subIndex: number): React.ReactNode => {
    if (!subCategory?.active) return null

    const visibleItems = getVisibleItems(subCategory?.items)
    if (visibleItems.length === 0) return null

    return (
      <Box key={subCategory?.key || subIndex} sx={{ mb: 1 }}>
        <Box
          sx={{
            backgroundColor: theme.palette.customColors?.avatarBackground || theme.palette.grey[100],
            px: 3,
            py: 1.5,
            mb: 1
          }}
        >
          <Typography
            sx={{
              fontSize: '13px',
              fontWeight: 500,
              color: theme.palette.customColors?.neutralPrimary || theme.palette.text.primary
            }}
          >
            {subCategory?.label || 'Sub Category'}
          </Typography>
        </Box>
        {visibleItems.map((item, itemIndex) => renderChecklistItem(item, itemIndex))}
      </Box>
    )
  }

  const renderCategory = (category: ChecklistCategory, categoryIndex: number): React.ReactNode => {
    const isExpanded = expandedPanels.includes(categoryIndex)

    return (
      <Accordion
        key={category?.key || categoryIndex}
        expanded={isExpanded}
        onChange={() => handlePanelChange(categoryIndex)}
        sx={{
          mb: 2,
          borderRadius: '8px !important',
          boxShadow: 'none',
          '&:before': { display: 'none' },
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden'
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: theme.palette.customColors?.OnPrimary }} />}
          sx={{
            backgroundColor: theme.palette.customColors?.OnPrimaryContainer || theme.palette.primary.main,
            minHeight: 56,
            '&.Mui-expanded': {
              minHeight: 56
            },
            '& .MuiAccordionSummary-content': {
              margin: '12px 0',
              alignItems: 'center',
              gap: 2
            }
          }}
        >
          {category?.icon && (
            <Box
              component='img'
              src={category.icon}
              alt=''
              sx={{ width: 24, height: 24, filter: 'brightness(0) invert(1)' }}
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          )}
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 600,
                color: theme.palette.customColors?.OnPrimary || theme.palette.common.white
              }}
            >
              {category?.label || 'Category'}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0, py: 1, backgroundColor: theme.palette.background.paper }}>
          {category?.sub_category
            ? category.sub_category.map((sub, subIndex) => renderSubCategory(sub, subIndex))
            : getVisibleItems(category?.items).map((item, itemIndex) => renderChecklistItem(item, itemIndex))}
        </AccordionDetails>
      </Accordion>
    )
  }

  const renderLoadingSkeleton = (): React.ReactNode => (
    <Box sx={{ p: 4 }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <Box key={i} sx={{ mb: 3 }}>
          <Skeleton variant='rounded' height={56} sx={{ mb: 1, borderRadius: '8px' }} />
          <Box sx={{ pl: 2 }}>
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} variant='text' height={40} sx={{ mb: 0.5 }} />
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  )

  const getTotalFilledCount = (): number => {
    let filledCount = 0

    checklistData.forEach(category => {
      const countFilledItems = (items?: ChecklistItem[]): void => {
        items?.forEach(item => {
          if (item?.type === 'checkbox' && item?.value === true) {
            filledCount++
          } else if ((item?.type === 'textbox' || item?.type === 'multi_line_textbox') && item?.value) {
            filledCount++
          }
        })
      }

      if (category?.sub_category) {
        category.sub_category.forEach(sub => countFilledItems(sub?.items))
      } else if (category?.items) {
        countFilledItems(category.items)
      }
    })

    return filledCount
  }

  const filledCount = getTotalFilledCount()

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: '80%', md: 560 },
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: theme.palette.customColors?.OnPrimary || theme.palette.background.paper
          }
        }
      }}
    >
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          backgroundColor: theme.palette.customColors?.OnPrimary || theme.palette.background.paper,
          p: 4,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: !loading && checklistData.length > 0 ? 2 : 0
          }}
        >
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '20px',
              color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
            }}
          >
            Transfer Checklist
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{ color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary }}
          >
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>
        {!loading && checklistData.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              backgroundColor: theme.palette.customColors?.avatarBackground || theme.palette.grey[100],
              borderRadius: 1,
              px: 3,
              py: 2
            }}
          >
            <Icon icon='uis:check-circle' fontSize={24} color={theme.palette.success.main} />
            <Typography
              sx={{
                fontSize: '16px',
                fontWeight: 500,
                color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
              }}
            >
              {filledCount} Items Filled
            </Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 4 }}>
        {loading ? (
          renderLoadingSkeleton()
        ) : checklistData.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 10 }}>
            <NoDataFound />
          </Box>
        ) : (
          checklistData.map((category, index) => renderCategory(category, index))
        )}
      </Box>
    </Drawer>
  )
}

export default memo(TransferChecklistDrawer)
