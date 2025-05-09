
import { Box, CircularProgress, List, ListItem, ListItemText, Typography } from '@mui/material'
import Paper from '@mui/material/Paper'
import React from 'react'
import useInfiniteScroll from 'src/hooks/useInfiniteScroll'

const AlternativeMedicinesList = ({ data = [], isLoading = false, onLoadMore, hasMore }) => {
    const loaderRef = useInfiniteScroll(onLoadMore, isLoading, hasMore)

    return (
      <>
        <Typography
          variant='h6'
          gutterBottom
          sx={{ color: 'customColors.customHeadingTextColor', fontSize: '16px', fontWeight: 500 }}
        >
          Alternative Medicines {data?.total_count && `(${data?.total_count})`}
        </Typography>

        <Paper elevation={3}>
          {data?.list_items?.length === 0 && !isLoading ? (
            <Box p={2} textAlign='center' color='customColors.neutralSecondary'>
              No items found.
            </Box>
          ) : (
            <List>
              {data?.list_items?.map((medicine, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={medicine?.stock_name || ''}
                    secondary={medicine?.manufacturer_name || ''}
                    primaryTypographyProps={{
                      sx: { color: 'primary.dark', fontWeight: 500, fontSize: '14px' }
                    }}
                    secondaryTypographyProps={{
                      sx: { color: 'customColors.neutralSecondary', fontWeight: 400, fontSize: '12px' }
                    }}
                  />
                </ListItem>
              ))}
              {hasMore && (
                <Box ref={loaderRef} p={2} display='flex' justifyContent='center'>
                  <CircularProgress />
                </Box>
              )}
            </List>
          )}
        </Paper>
      </>
    )
  }

  export default React.memo(AlternativeMedicinesList)