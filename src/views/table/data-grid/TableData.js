import { DataGrid } from '@mui/x-data-grid'
import { useTheme } from '@emotion/react'

const TableData = ({ onRowClick, indexedRows ,total, columns, paginationModel, handleSortModel, setPaginationModel, loading,searchValue}) => {
  const theme = useTheme()
  return (
    <DataGrid
      sx={{
        mt: 5,
        '.MuiDataGrid-cell:focus': {
          outline: 'none'
        },

        '& .MuiDataGrid-columnHeaders': {
          backgroundColor: theme.palette.customColors.customTableHeaderBg,
          color: theme.palette.customColors.customHeadingTextColor // Your desired background color
        },
        '& .MuiDataGrid-row:hover': {
          cursor: 'pointer'
        },
        '.MuiDataGrid-virtualScroller': {
          overflow: 'hidden'
        },
        '.MuiDataGrid-main': {
          margin: '2px',
          borderLeft: '1px solid #0000000D',
          borderRight: '1px solid #0000000D',
          // borderBottom: '1px solid #0000000D',
          borderRadius: '8px', // Ensure the right border extends to last row
          // Apply margin to the main container
          // borderRadius: '8px', // Apply border-radius to the main container
          border: '1px solid rgba(233, 233, 236, 1)' // Apply border to the main container
        },
        '& .MuiDataGrid-footerContainer': {
          borderTop: 'none' // Remove the border-top from footer container
        },

        '& .MuiDataGrid-row:last-of-type .MuiDataGrid-cell': {
          borderBottom: 'none' // Make sure no extra bottom border is applie
        }
      }}
      // columnVisibilityModel={{
      //   sl_no: false
      // }}
      hideFooterSelectedRowCount
      disableColumnSelector={true}
      autoHeight
      pagination
      rows={indexedRows === undefined ? [] : indexedRows}
      rowCount={total}
      columns={columns}
      sortingMode='server'
      paginationMode='server'
      pageSizeOptions={[7, 10, 25, 50]}
      paginationModel={paginationModel}
      onSortModelChange={handleSortModel}
      onPaginationModelChange={setPaginationModel}
      loading={loading}
      disableColumnMenu
      slotProps={{
        baseButton: {
          variant: 'outlined'
        },
        toolbar: {
          value: searchValue,
          clearSearch: () => handleSearch(''),
          onChange: event => handleSearch(event.target.value)
        }
      }}
      onRowClick={onRowClick}
    />
  )
}
export default TableData
