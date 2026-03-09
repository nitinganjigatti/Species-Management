import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Drawer,
  IconButton,
  Divider,
  CircularProgress,
  Avatar
} from '@mui/material'
import { useTheme, Theme } from '@mui/material/styles'
import { Close as CloseIcon } from '@mui/icons-material'
import Icon from 'src/@core/components/icon'
import {
  getFoodWastageDetails,
  FoodWastageDetailItem,
  GetFoodWastageDetailsParams
} from 'src/lib/api/housing'
import { format, parse } from 'date-fns'

interface FoodWastageDetailsDrawerProps {
  open: boolean
  onClose: () => void
  enclosureId: string | number
  wastageDate: string
  totalWastage: string | number
  unit: string
}

const FoodWastageDetailsDrawer: React.FC<FoodWastageDetailsDrawerProps> = ({
  open,
  onClose,
  enclosureId,
  wastageDate,
  totalWastage,
  unit
}) => {
  const theme = useTheme() as Theme
  const [loading, setLoading] = useState<boolean>(false)
  const [detailsList, setDetailsList] = useState<FoodWastageDetailItem[]>([])
  const [page, setPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(true)

  // Format the date for display
  const getFormattedDate = () => {
    try {
      if (wastageDate) {
        const date = parse(wastageDate, 'yyyy-MM-dd', new Date())
        return format(date, 'dd MMM yyyy')
      }
    } catch {
      return wastageDate
    }
    return wastageDate
  }

  // Get user initials for avatar
  const getInitials = (name: string | undefined) => {
    if (!name) return 'NA'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  // Format datetime for display
  const formatDateTime = (dateStr: string | undefined) => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      return format(date, 'dd MMM yyyy • hh:mm a')
    } catch {
      return dateStr
    }
  }

  const fetchDetails = useCallback(async (pageNum: number) => {
    if (!enclosureId || !wastageDate) return

    setLoading(true)
    try {
      const params: GetFoodWastageDetailsParams = {
        enclosure_id: enclosureId,
        date: wastageDate,
        page_no: pageNum,
        limit: 25
      }

      const response = await getFoodWastageDetails(params)

      if (response?.success && response?.data?.list) {
        if (pageNum === 1) {
          setDetailsList(response.data.list)
        } else {
          setDetailsList(prev => [...prev, ...response.data?.list || []])
        }
        setHasMore((response.data.list?.length || 0) >= 25)
      } else {
        if (pageNum === 1) {
          setDetailsList([])
        }
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error fetching food wastage details:', error)
      if (pageNum === 1) {
        setDetailsList([])
      }
    } finally {
      setLoading(false)
    }
  }, [enclosureId, wastageDate])

  useEffect(() => {
    if (open) {
      setPage(1)
      setDetailsList([])
      fetchDetails(1)
    }
  }, [open, fetchDetails])

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchDetails(nextPage)
    }
  }

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 450 },
          borderTopLeftRadius: 16,
          borderBottomLeftRadius: 16
        }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            p: 3,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between'
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: '18px',
                fontWeight: 600,
                color: theme.palette.text.primary
              }}
            >
              Food Wastage
            </Typography>
            <Typography
              sx={{
                fontSize: '14px',
                color: theme.palette.text.secondary,
                mt: 0.5
              }}
            >
              {getFormattedDate()}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size='small'>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Total Wastage Summary */}
        <Box
          sx={{
            mx: 3,
            p: 3,
            backgroundColor: theme.palette.customColors?.tertiaryContainer || 'rgba(255, 200, 200, 0.1)',
            borderRadius: 2,
            textAlign: 'center'
          }}
        >
          <Typography
            sx={{
              fontSize: '36px',
              fontWeight: 700,
              color: theme.palette.customColors?.Tertiary || theme.palette.error.main
            }}
          >
            {totalWastage}
            <Typography
              component='span'
              sx={{
                fontSize: '18px',
                fontWeight: 600,
                color: theme.palette.customColors?.Tertiary || theme.palette.error.main,
                ml: 0.5
              }}
            >
              {unit || 'Kg'}
            </Typography>
          </Typography>
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 500,
              color: theme.palette.text.secondary,
              mt: 1
            }}
          >
            Total Wastage
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Entries List */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            px: 3,
            pb: 3
          }}
        >
          {loading && detailsList.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : detailsList.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Icon icon='mdi:clipboard-text-off-outline' fontSize={48} color={theme.palette.text.disabled} />
              <Typography sx={{ mt: 2, color: theme.palette.text.secondary }}>
                No entries found
              </Typography>
            </Box>
          ) : (
            <>
              {detailsList.map((item, index) => (
                <Box
                  key={item.id || index}
                  sx={{
                    mb: 2,
                    p: 2,
                    backgroundColor: theme.palette.grey[50],
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`
                  }}
                >
                  {/* Wastage Quantity */}
                  <Typography
                    sx={{
                      fontSize: '18px',
                      fontWeight: 600,
                      color: theme.palette.text.primary
                    }}
                  >
                    {item.wastage_quantity} {item.unit || 'Kg'}
                  </Typography>

                  {/* Notes if available */}
                  {item.notes && (
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: theme.palette.text.secondary,
                        mt: 1
                      }}
                    >
                      {item.notes}
                    </Typography>
                  )}

                  {/* User and DateTime */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mt: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {item.user_profile_pic ? (
                        <Avatar
                          src={item.user_profile_pic}
                          sx={{ width: 30, height: 30 }}
                        />
                      ) : (
                        <Avatar
                          sx={{
                            width: 30,
                            height: 30,
                            fontSize: '12px',
                            backgroundColor: theme.palette.info.light,
                            color: theme.palette.info.contrastText
                          }}
                        >
                          {getInitials(item.user_full_name)}
                        </Avatar>
                      )}
                      <Typography
                        sx={{
                          fontSize: '13px',
                          color: theme.palette.text.secondary
                        }}
                      >
                        {item.user_full_name || 'Unknown User'}
                      </Typography>
                    </Box>

                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: theme.palette.text.disabled
                      }}
                    >
                      {formatDateTime(item.wastage_date)}
                    </Typography>
                  </Box>
                </Box>
              ))}

              {/* Load More */}
              {hasMore && (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  {loading ? (
                    <CircularProgress size={24} />
                  ) : (
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: theme.palette.primary.main,
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                      onClick={handleLoadMore}
                    >
                      Load More
                    </Typography>
                  )}
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>
    </Drawer>
  )
}

export default FoodWastageDetailsDrawer
