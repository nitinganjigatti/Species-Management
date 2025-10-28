/* eslint-disable lines-around-comment */
import { DataGrid } from '@mui/x-data-grid'
import { useTheme } from '@emotion/react'

const CommonTable = ({
  onRowClick,
  indexedRows,
  total,
  columns,
  paginationModel,
  handleSortModel,
  setPaginationModel,
  pageSizeOptions,
  loading,
  hideFooterPagination = false,
  searchValue,
  onCellClick,
  columnVisibilityModel,
  checkBoxOption,
  onRowSelectionModelChange,
  selectedRows,
  disablePagination = false, // New prop to control pagination
  maxHeight,
  rowHeight = 52,
  externalTableStyle,
  getRowHeight,
  handleSearch,
  getRowClassName // New prop for conditional row styling
}) => {
  const theme = useTheme()

  return (
    <DataGrid
      sx={{
        '--DataGrid-cellFocusOutline': 'none',
        mt: 5,
        '.MuiDataGrid-cell:focus': {
          outline: 'none'
        },
        '.MuiDataGrid-cell:focus-within': {
          outline: 'none'
        },

        '& .MuiDataGrid-columnHeaders': {
          backgroundColor: theme.palette.customColors.customTableHeaderBg,
          color: theme.palette.customColors.customHeadingTextColor
        },
        '& .MuiDataGrid-row:hover': {
          cursor: 'pointer'
        },
        '.MuiDataGrid-virtualScroller': {
          // overflow: 'hidden',

          ...(maxHeight && { maxHeight: maxHeight, overflowY: 'auto !important' })
        },
        '.MuiDataGrid-main': {
          // margin: '2px',
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
        },
        ...(externalTableStyle || {})
      }}
      columnVisibilityModel={columnVisibilityModel ? columnVisibilityModel : {}}
      hideFooterSelectedRowCount
      disableColumnSelector={true}
      autoHeight
      // pagination
      pagination={!disablePagination}
      rows={indexedRows === undefined ? [] : indexedRows}
      // rowCount={total}
      rowCount={disablePagination ? undefined : total}
      columns={columns}
      sortingMode='server'
      rowHeight={rowHeight}
      hideFooterPagination={hideFooterPagination}
      // paginationMode='server'
      // pageSizeOptions={[7, 10, 25, 50]}
      paginationMode={disablePagination ? undefined : 'server'}
      pageSizeOptions={
        pageSizeOptions && pageSizeOptions.length > 0
          ? pageSizeOptions
          : disablePagination
          ? [total]
          : [7, 10, 25, 50, 100]
      }
      localeText={{
        noRowsLabel: 'No rows',
        noResultsOverlayLabel: 'No rows' // 👈 override the "No results found" case
      }}
      onCellClick={onCellClick ? onCellClick : null}
      // paginationModel={paginationModel}
      paginationModel={disablePagination ? undefined : paginationModel}
      onSortModelChange={handleSortModel}
      // onPaginationModelChange={setPaginationModel}
      onPaginationModelChange={disablePagination ? undefined : setPaginationModel}
      loading={loading ? loading : null}
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
      onRowClick={onRowClick ? onRowClick : null}
      checkboxSelection={checkBoxOption ? true : false}
      onRowSelectionModelChange={onRowSelectionModelChange ? onRowSelectionModelChange : null}
      rowSelectionModel={selectedRows ? selectedRows : []}
      getRowHeight={getRowHeight ? getRowHeight : null}
      getRowClassName={getRowClassName ? getRowClassName : undefined}
    />
  )
}

export default CommonTable
