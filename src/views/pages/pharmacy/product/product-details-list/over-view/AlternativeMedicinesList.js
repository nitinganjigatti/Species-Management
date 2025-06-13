import { Box, CircularProgress, List, ListItem, ListItemText } from '@mui/material'
import Paper from '@mui/material/Paper'
import EditIcon from '@mui/icons-material/Edit'
import React from 'react'
import useInfiniteScroll from 'src/hooks/useInfiniteScroll'

const AlternativeMedicinesList = ({ data = [], isLoading = false, onLoadMore, hasMore, onEdit }) => {
  const loaderRef = useInfiniteScroll(onLoadMore, isLoading, hasMore)

  return (
    <Paper elevation={3}>
      {data?.list_items?.length === 0 && !isLoading ? (
        <Box
          sx={{
            p: 2,
            textAlign: 'center',
            color: 'customColors.neutralSecondary'
          }}>
          No items found.
        </Box>
      ) : (
        <List>
          {data?.list_items?.map((medicine, index) => (
            <ListItem key={index} sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <ListItemText
                primary={medicine?.stock_name || ''}
                secondary={medicine?.manufacturer_name || ''}
                slotProps={{
                  primary: {
                    sx: { color: 'primary.dark', fontWeight: 500, fontSize: '14px' }
                  },

                  secondary: {
                    sx: { color: 'customColors.neutralSecondary', fontWeight: 400, fontSize: '12px' }
                  }
                }} />
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  cursor: 'pointer',
                  ':hover': { color: 'primary.main' }
                }}
                onClick={() => onEdit?.(medicine)}
              >
                <EditIcon />
              </Box>
            </ListItem>
          ))}
          {hasMore && (
            <Box
              ref={loaderRef}
              sx={{
                p: 2,
                display: 'flex',
                justifyContent: 'center'
              }}>
              <CircularProgress />
            </Box>
          )}
        </List>
      )}
    </Paper>
  );
}

export default React.memo(AlternativeMedicinesList)
