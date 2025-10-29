import React, { useEffect, useState, useRef } from 'react'
import {
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  TablePagination,
  TableSortLabel,
  CircularProgress,
  Select,
  MenuItem,
  Typography,
  Checkbox,
  TextField,
  InputAdornment,
  IconButton,
  Menu
} from '@mui/material'
import { Box } from '@mui/system'
import PushPinIcon from '@mui/icons-material/PushPin'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import SearchIcon from '@mui/icons-material/Search'
import { useTheme } from '@emotion/react'

const StickyTableChild = ({
  rows = [], // Data rows for the table
  columns = [], // Column definitions
  rowCount = 0, // Total number of rows (used for pagination)
  rowHeight = 74, // Row height
  headerHeight = 55, // Header row height
  subHeaderHeight = 50, // SubHeader row height
  pagination = true, // Enable or disable pagination
  pageSizeOptions = [5, 10, 20], // Options for number of rows per page
  rowsInView = 5, // Number of rows visible in the viewport
  rowsInViewOptions = [5, 7, 10, 20], // Options for rows visible in the viewport
  paginationModel = { page: 0, pageSize: 10 }, // Initial pagination model
  onPaginationModelChange = () => {}, // Fallback to a no-op function
  onSortChange = () => {}, // Fallback to a no-op function
  loading = false, // Loading state
  onCellClick, // Fallback to a no-op function
  onRowClick, // Fallback to a no-op function
  onRowSelect = () => {}, // Fallback to a no-op function
  rowSelection = false, // Enable or disable row selection
  downloadExcel = false,
  headerName = '',
  headerStyle = {},
  searchMode = 'local',
  onSearch = () => {},
  modifyColumnPinning = false
}) => {
  const theme = useTheme()
  const rowRefs = useRef([])

  const [defaultRowsInView, setDefaultRowsInView] = useState(rowsInView || 5)
  const [defaultRowsInViewOption, setDefaultRowsInViewOption] = useState(rowsInViewOptions)
  const [userChangedRowsInView, setUserChangedRowsInView] = useState(false)

  const [rowPerPageCount, setRowPerPageCount] = useState(paginationModel?.pageSize || 10)
  const [selectedRows, setSelectedRows] = useState([])
  const [sortStates, setSortStates] = useState({})

  const [searchText, setSearchText] = useState('')
  const [filteredRows, setFilteredRows] = useState(rows)

  const [rearrangedColumns, setRearrangedColumns] = useState(Array.isArray(columns) ? columns : [])
  const [anchorEl, setAnchorEl] = useState(null)

  const hasSubHeader =
    Array.isArray(rearrangedColumns) &&
    rearrangedColumns.some(col => Array.isArray(col?.subHeader) && col?.subHeader?.length > 0)
  const tableTotalHeight = defaultRowsInView * rowHeight + headerHeight + (hasSubHeader ? subHeaderHeight : 0)

  const [dynamicTableHeight, setDynamicTableHeight] = useState(
    defaultRowsInView * rowHeight + headerHeight + (hasSubHeader ? subHeaderHeight : 0)
  )

  // Calculate minimum height to prevent layout shift during loading
  const minTableHeight = defaultRowsInView * rowHeight + headerHeight + (hasSubHeader ? subHeaderHeight : 0)
  const finalTableHeight = loading ? minTableHeight : Math.max(dynamicTableHeight, minTableHeight)

  useEffect(() => {
    if (filteredRows.length > 0) {
      const totalVisibleHeight = rowRefs.current
        .slice(0, defaultRowsInView)
        .reduce((sum, ref) => sum + (ref?.offsetHeight || rowHeight), 0)

      setDynamicTableHeight(totalVisibleHeight + headerHeight + (hasSubHeader ? subHeaderHeight : 0))
    }
  }, [filteredRows, defaultRowsInView])

  useEffect(() => {
    if (!Array.isArray(columns)) {
      setRearrangedColumns([])

      return
    }

    const leftPinnedColumns = columns.filter(col => col.pinned === 'left')
    const rightPinnedColumns = columns.filter(col => col.pinned === 'right')
    const nonPinnedColumns = columns.filter(col => !col.pinned)

    // Rearrange columns: left pinned columns, non-pinned columns, and right pinned columns
    const Columns = [
      ...leftPinnedColumns,
      ...nonPinnedColumns,
      ...rightPinnedColumns // Right pinned columns in normal order
    ]

    // console.log('columns', columns)
    setRearrangedColumns(prev => Columns)
  }, [columns])

  useEffect(() => {
    if (rows.length > 0) {
      setFilteredRows(rows)
    }
  }, [rows])

  useEffect(() => {
    rowRefs.current = []
  }, [filteredRows])

  useEffect(() => {
    if (searchMode === 'server') {
      onSearch(searchText)
    } else {
      if (searchText.trim()) {
        const lowercasedSearch = searchText.toLowerCase()
        setFilteredRows(
          rows.filter(row =>
            Object.values(row).some(value => value?.toString().toLowerCase().includes(lowercasedSearch))
          )
        )
      } else {
        setFilteredRows(rows)
      }
    }
  }, [rows, searchText])

  // useEffect(() => {
  //   if (rowCount && rowPerPageCount && defaultRowsInView) {
  //     const limit = Math.min(Number(rowCount), Number(rowPerPageCount))

  //     if (defaultRowsInView > limit) {
  //       setDefaultRowsInView(limit)
  //     }

  //     let validatedOptions = rowsInViewOptions?.filter(option => option <= limit)
  //     if (!validatedOptions.includes(limit)) {
  //       validatedOptions.push(limit)
  //     }

  //     setDefaultRowsInViewOption(validatedOptions)
  //   }
  // }, [rowsInView, rowPerPageCount, rowCount])

  useEffect(() => {
    if (rowCount && rowPerPageCount) {
      const limit = Math.min(Number(rowCount), Number(rowPerPageCount))

      // ✅ Adjust rowsInView if user has not manually changed it
      if (!userChangedRowsInView) {
        if (defaultRowsInView > limit) {
          setDefaultRowsInView(limit)
        } else if (defaultRowsInView < limit && limit > rowsInView) {
          setDefaultRowsInView(rowsInView) // reset back to default
        }
      }

      let validatedOptions = rowsInViewOptions?.filter(option => option <= limit)
      if (!validatedOptions.includes(limit)) {
        validatedOptions.push(limit)
      }

      setDefaultRowsInViewOption(validatedOptions)
    }
  }, [rowCount, rowPerPageCount, rowsInView, defaultRowsInView, userChangedRowsInView])

  // Utility function for text transformation
  const transformText = (text, transformType) => {
    if (!text || typeof text !== 'string') return text
    try {
      switch (transformType) {
        case 'uppercase':
          return text.toUpperCase()
        case 'capitalize':
          return text
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
        case 'sentencecase':
          return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
        case 'lowercase':
          return text.toLowerCase()
        default:
          return text
      }
    } catch (error) {
      console.error('Error transforming text:', error)

      return text
    }
  }

  const handleMenuOpen = (event, field) => {
    setAnchorEl({ element: event.currentTarget, field })
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handlePinClick = pinDirection => {
    if (anchorEl) {
      const field = anchorEl.field
      setRearrangedColumns(prevColumns => {
        // Find the column to update

        const updatedColumns = prevColumns.map(col => {
          if (col.field === field) {
            null

            // Update the pinned value based on the selected pinDirection
            return {
              ...col,
              pinned: pinDirection === 'none' ? null : pinDirection // Reset `pinned` for "none"
            }
          }

          return col
        })

        const leftPinnedColumns = updatedColumns.filter(col => col.pinned === 'left')
        const rightPinnedColumns = updatedColumns.filter(col => col.pinned === 'right')
        const nonPinnedColumns = updatedColumns.filter(col => !col.pinned)

        const Columns = [
          ...leftPinnedColumns,
          ...nonPinnedColumns,
          ...rightPinnedColumns // Right pinned columns in normal order
        ]

        return Columns
      })
      setAnchorEl(null)
      handleMenuClose()
    }
  }

  const handleRowSelection = row => {
    try {
      setSelectedRows(prevSelected => {
        const isRowSelected = prevSelected.includes(row)

        const updatedRows = isRowSelected
          ? prevSelected.filter(selectedRow => selectedRow !== row)
          : [...prevSelected, row]

        onRowSelect({ currentRow: row, rows: updatedRows })

        return updatedRows
      })
    } catch (error) {
      console.error('Error handling row selection:', error)
    }
  }

  const renderTableHeader = () => {
    let leftOffset = rowSelection ? 78 : 0
    let rightOffset = 0

    const leftPinnedColumns = rearrangedColumns?.filter(col => col.pinned === 'left')
    const rightPinnedColumns = rearrangedColumns?.filter(col => col.pinned === 'right')

    const calculateTotalWidth = columns => {
      return columns.reduce((sum, column) => {
        // Check if the column has a subHeader
        if (Array.isArray(column?.subHeader)) {
          // Add the widths of all subHeader items
          const subHeaderWidth = column?.subHeader?.reduce((subSum, subCol) => subSum + (subCol?.width || 0), 0)

          return sum + subHeaderWidth
        }

        // Add the column's width if no subHeader
        return sum + (column?.width || 0)
      }, 0) // Initial sum is 0
    }
    const totalWidth = calculateTotalWidth(rightPinnedColumns)

    rightOffset = rightOffset + totalWidth

    return (
      <TableRow sx={{ position: 'relative', zIndex: 200 }}>
        {rowSelection && (
          <TableCell
            sx={{
              padding: 0,
              position: 'sticky',
              left: 0,
              zIndex: 200,
              fontWeight: 'bold',
              width: '48px'
            }}
          >
            <Checkbox
              indeterminate={selectedRows.length > 0 && selectedRows?.length < rows?.length}
              checked={selectedRows?.length === rows?.length}
              onChange={e => {
                try {
                  if (e.target.checked) {
                    setSelectedRows(rows)
                    onRowSelect({ rows })
                  } else {
                    setSelectedRows([])
                    onRowSelect({ rows: [] })
                  }
                } catch (error) {
                  console.error('Error handling select all rows:', error)
                }
              }}
            />
          </TableCell>
        )}
        {rearrangedColumns?.map((col, index) => {
          const isGrouped = !!col?.subHeader
          const widthWithSubHeader = isGrouped && col?.subHeader.reduce((sum, column) => sum + (column?.width || 0), 0)

          let pinnedStyle = {}
          let borderStyle = {}
          if (col.pinned === 'left') {
            pinnedStyle = {
              position: 'sticky',
              left: leftOffset,
              zIndex: 150 // Higher z-index for pinned columns
            }
            leftOffset += isGrouped ? widthWithSubHeader : col.width

            // Add a right border to the last left-pinned column
            if (index === leftPinnedColumns.length - 1) {
              borderStyle = {
                // borderRight: '1px solid #DAE7DF',
                boxShadow: '-4px 0 12px -6px rgba(0, 0, 0, 0.3) inset'

                // boxShadow: `-20px 0px 10px -24px rgba(0,0,0,0.45) inset`
              }
            }
          } else if (col.pinned === 'right') {
            rightOffset -= isGrouped ? widthWithSubHeader : col?.width
            pinnedStyle = {
              position: 'sticky',
              right: rightOffset,
              zIndex: 150 // Higher z-index for pinned columns
            }

            // Add a right border to the last left-pinned column
            if (index === rearrangedColumns.length - rightPinnedColumns.length) {
              borderStyle = {
                borderLeft: '1px solid #DAE7DF'

                // boxShadow: '-4px 0 12px -6px rgba(0, 0, 0, 0.3)',
                // boxShadow: `20px 0 10px -24px rgba(0,0,0,0.45) inset`
                // boxShadow: `rgba(33, 35, 38, 0.1) -10px 0px 10px -10px`
              }
            }
          }

          return (
            <TableCell
              key={col?.field || index}
              sx={{
                width: isGrouped ? widthWithSubHeader : col?.width,
                minWidth: isGrouped ? widthWithSubHeader : col?.width,
                maxWidth: isGrouped ? widthWithSubHeader : col?.width,
                fontWeight: 'bold',
                color: theme.palette.customColors.OnSecondaryContainer,

                // borderRight: '1px solid pink',
                borderBottom: 'none',
                ...pinnedStyle,
                ...borderStyle,
                ...col?.headerStyle
              }}
              style={{
                height: `${headerHeight}px`,
                paddingTop: 0,
                paddingBottom: 0
              }}
              colSpan={isGrouped ? col?.subHeader?.length : 1}
            >
              {/* {col.pinned && (
                <PushPinIcon
                  fontSize='10px'
                  style={{
                    position: 'absolute',
                    // top: headerHeight / 3,
                    left: 4,
                    color: col.pinned === 'left' ? '#1976d2' : '#d32f2f'
                  }}
                  titleAccess={`Pinned to ${col.pinned}`}
                />
              )} */}
              {isGrouped ? (
                transformText(col?.headerName, col?.textTransform)
              ) : (

                // <TableSortLabel
                //   onClick={() => {
                //     setSortStates(prevState => {
                //       const newStates = { ...prevState, [col.field]: prevState[col.field] === 'asc' ? 'desc' : 'asc' }
                //       onSortChange({
                //         field: col.field,
                //         direction: newStates[col.field]
                //       })

                //       return newStates
                //     })
                //   }}
                // >
                //   {transformText(col?.headerName, col?.textTransform)}
                // </TableSortLabel>
                <>
                  {col?.sortable === false ? (
                    transformText(col?.headerName, col?.textTransform)
                  ) : (
                    <TableSortLabel
                      active={!!sortStates[col?.field]}
                      direction={sortStates[col?.field] || 'asc'}
                      onClick={() => {
                        setSortStates(prevState => {
                          const newStates = {
                            ...prevState,
                            [col?.field]: prevState[col?.field] === 'asc' ? 'desc' : 'asc'
                          }
                          onSortChange({
                            field: col?.field,
                            direction: newStates[col?.field]
                          })

                          return newStates
                        })
                      }}
                    >
                      {transformText(col?.headerName, col?.textTransform)}
                    </TableSortLabel>
                  )}
                </>
              )}
              {/* Three-dot menu */}
              {modifyColumnPinning && (
                <IconButton
                  aria-label='more'
                  aria-controls='options-menu'
                  aria-haspopup='true'
                  onClick={event => handleMenuOpen(event, col?.field)}
                  size='small'
                  sx={{ position: 'absolute', top: 4, right: 4, marginTop: '1px' }}
                >
                  <MoreVertIcon />
                </IconButton>
              )}
              <Menu
                sx={{
                  '& .css-1uqao2l-MuiBackdrop-root-MuiModal-backdrop': {
                    backgroundColor: 'transparent'
                  }
                }}
                id='options-menu'
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right'
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right'
                }}
              >
                <MenuItem onClick={() => handlePinClick('left')}>left pin</MenuItem>
                <MenuItem onClick={() => handlePinClick('right')}>right pin</MenuItem>
                <MenuItem onClick={() => handlePinClick('none')}>unpin</MenuItem>
              </Menu>
            </TableCell>
          )
        })}
      </TableRow>
    )
  }

  const renderSubHeaders = () => {
    let leftOffset = rowSelection ? 78 : 0
    let rightOffset = 0

    const leftPinnedColumns = rearrangedColumns.filter(col => col.pinned === 'left')
    const rightPinnedColumns = rearrangedColumns.filter(col => col.pinned === 'right')

    const calculateTotalWidth = columns => {
      return columns.reduce((sum, column) => {
        // Check if the column has a subHeader
        if (Array.isArray(column.subHeader)) {
          // Add the widths of all subHeader items
          const subHeaderWidth = column.subHeader.reduce((subSum, subCol) => subSum + (subCol.width || 0), 0)

          return sum + subHeaderWidth
        }

        // Add the column's width if no subHeader
        return sum + (column.width || 0)
      }, 0) // Initial sum is 0
    }
    const totalWidth = calculateTotalWidth(rightPinnedColumns)

    // const totalWidth = rightPinnedColumns.reduce((sum, column) => sum + (column.width || 0), 0)
    rightOffset = rightOffset + totalWidth

    return (
      <TableRow sx={{ backgroundColor: '#f4f6f8', position: 'sticky', top: headerHeight + 10, zIndex: 200 }}>
        {rowSelection && (
          <TableCell
            sx={{
              width: 48,
              backgroundColor: '#f4f6f8',
              position: 'sticky',
              left: 0,
              zIndex: 150,
              height: `${subHeaderHeight}px`,
              py: '10px'
            }}
          />
        )}
        {rearrangedColumns.map((colGroup, index) => {
          let isSubHeader = !!colGroup?.subHeader ? true : false
          let pinnedStyle = {}
          let borderStyle = {}
          if (colGroup.pinned === 'left') {
            pinnedStyle = {
              position: 'sticky',
              left: leftOffset,
              zIndex: 150 // Higher z-index for pinned columns
            }
            if (leftPinnedColumns?.length - 1 === index && !isSubHeader) {
              borderStyle = {
                borderRight: '1px solid #DAE7DF'

                // boxShadow: `-20px 0 10px -24px rgba(0,0,0,0.45) inset`
              }
            }
            leftOffset += isSubHeader ? 0 : colGroup.width
          } else if (colGroup.pinned === 'right') {
            rightOffset -= isSubHeader ? 0 : colGroup.width
            pinnedStyle = {
              position: 'sticky',
              right: rightOffset,
              zIndex: 150 // Higher z-index for pinned columns
            }

            // Add a right border to the last left-pinned column
            if (index === rearrangedColumns.length - rightPinnedColumns.length && !isSubHeader) {
              borderStyle = {
                borderLeft: '1px solid #DAE7DF'

                // boxShadow: `20px 0 10px -24px rgba(0,0,0,0.45) inset`
              }
            }
          }

          return isSubHeader ? (
            colGroup.subHeader.map((subCol, subIndex) => {
              let borderStyle = {}

              if (colGroup.pinned === 'left') {
                pinnedStyle = {
                  position: 'sticky',
                  left: leftOffset,
                  zIndex: 150 // Higher z-index for pinned columns
                }
                leftOffset += subCol.width

                if (leftPinnedColumns?.length - 1 === index && subIndex === colGroup?.subHeader?.length - 1) {
                  // console.log('colGroup', colGroup.field)
                  borderStyle = {
                    borderRight: '1px solid #DAE7DF'

                    // boxShadow: `-20px 0 10px -24px rgba(0,0,0,0.45) inset`
                  }
                }
              } else if (colGroup.pinned === 'right') {
                rightOffset -= subCol.width

                // console.log('colGroup', colGroup.field)
                pinnedStyle = {
                  position: 'sticky',
                  right: rightOffset,
                  zIndex: 150 // Higher z-index for pinned columns
                }

                // Add a right border to the last left-pinned column
                if (subIndex === 0) {
                  borderStyle = {
                    borderLeft: '1px solid #DAE7DF'

                    // boxShadow: `20px 0 10px -24px rgba(0,0,0,0.45) inset`
                  }
                }
              }

              return (
                <TableCell
                  key={`${colGroup.field || index}-${subIndex}`}
                  sx={{
                    width: subCol.width,
                    minWidth: subCol.width,
                    maxWidth: subCol.width,
                    fontWeight: 'bold',
                    py: '10px',
                    height: `${subHeaderHeight}px`,
                    backgroundColor: '#f4f6f8',
                    textAlign: 'center',

                    // top: headerHeight,
                    // zIndex: 210,
                    ...pinnedStyle,
                    ...borderStyle,
                    ...subCol?.subheaderStyle // Optional: Custom subheader styles
                  }}
                >
                  <TableSortLabel
                    onClick={() => {
                      setSortStates(prevState => {
                        const newStates = {
                          ...prevState,
                          [subCol.field]: prevState[subCol.field] === 'asc' ? 'desc' : 'asc'
                        }
                        onSortChange({
                          field: subCol.field,
                          direction: newStates[subCol.field]
                        })

                        return newStates
                      })
                    }}
                  >
                    {transformText(subCol.label, subCol?.textTransform)}
                  </TableSortLabel>
                </TableCell>
              )
            })
          ) : (
            <TableCell
              key={`empty-${index}`}
              sx={{
                width: colGroup.width,
                minWidth: colGroup.width,
                maxWidth: colGroup.width,
                backgroundColor: '#f4f6f8',
                ...pinnedStyle,
                ...borderStyle
              }}
            />
          )
        })}
      </TableRow>
    )
  }

  const renderTableBody = () => {
    // if (loading) {
    //   return (
    //     <TableRow>
    //       <TableCell colSpan={columns.length + (rowSelection ? 1 : 0)} align='center'>
    //         <CircularProgress size={24} />
    //       </TableCell>
    //     </TableRow>
    //   )
    // }

    if (rows.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={columns.length + 1} align='center'>
            No data available.
          </TableCell>
        </TableRow>
      )
    }

    return filteredRows?.map((row, rowIndex) => {
      let leftOffset = rowSelection ? 78 : 0
      let rightOffset = 0

      const leftPinnedColumns = rearrangedColumns.filter(col => col.pinned === 'left')
      const rightPinnedColumns = rearrangedColumns.filter(col => col.pinned === 'right')

      const calculateTotalWidth = columns => {
        return columns.reduce((sum, column) => {
          // Check if the column has a subHeader
          if (Array.isArray(column.subHeader)) {
            // Add the widths of all subHeader items
            const subHeaderWidth = column.subHeader.reduce((subSum, subCol) => subSum + (subCol.width || 0), 0)

            return sum + subHeaderWidth
          }

          // Add the column's width if no subHeader
          return sum + (column.width || 0)
        }, 0) // Initial sum is 0
      }
      const totalWidth = calculateTotalWidth(rightPinnedColumns)
      rightOffset = rightOffset + totalWidth

      return (
        <TableRow
          ref={el => (rowRefs.current[rowIndex] = el)}
          key={rowIndex}
          onClick={e => {
            if (onRowClick) {
              onRowClick(row)
            }
          }}
          sx={{
            height: rowHeight,
            backgroundColor: 'white',
            position: 'relative',
            cursor: onRowClick && 'pointer'

            // '&:hover': {
            //   backgroundColor: !onCellClick && onRowClick && '#ECFFDC'
            // }
          }}
        >
          {rowSelection && (
            <TableCell
              sx={{
                padding: 0,
                height: rowHeight,
                position: 'sticky',
                left: 0,
                zIndex: 100,
                backgroundColor: 'inherit'
              }}
            >
              <Checkbox checked={selectedRows.includes(row)} onChange={() => handleRowSelection(row)} />
            </TableCell>
          )}
          {rearrangedColumns.map((col, index) => {
            let isSubHeader = !!col?.subHeader ? true : false
            let pinnedStyle = {}
            let borderStyle = {}
            if (col.pinned === 'left') {
              pinnedStyle = {
                position: 'sticky',
                left: leftOffset,
                zIndex: 150 // Higher z-index for pinned columns
              }
              if (leftPinnedColumns?.length - 1 === index && !isSubHeader) {
                borderStyle = {
                  borderRight: '1px solid #DAE7DF',
                  boxShadow: `-20px 0 10px -24px rgba(0,0,0,0.45) inset`
                }
              }
              leftOffset += isSubHeader ? 0 : col.width
            } else if (col.pinned === 'right') {
              rightOffset -= isSubHeader ? 0 : col.width
              pinnedStyle = {
                position: 'sticky',
                right: rightOffset,
                zIndex: 150 // Higher z-index for pinned columns
              }

              // Add a right border to the last left-pinned column
              if (index === rearrangedColumns.length - rightPinnedColumns.length && !isSubHeader) {
                borderStyle = {
                  borderLeft: '1px solid #DAE7DF'
                }
              }
            }

            return isSubHeader ? (
              col.subHeader.map((subCol, subIndex) => {
                let borderStyle = {}

                if (col.pinned === 'left') {
                  pinnedStyle = {
                    position: 'sticky',
                    left: leftOffset,
                    zIndex: 150 // Higher z-index for pinned columns
                  }
                  console.log('subCol', { c: subCol.label, w: subCol.width, L: leftOffset })
                  leftOffset += subCol.width

                  if (leftPinnedColumns?.length - 1 === index && subIndex === col?.subHeader?.length - 1) {
                    borderStyle = {
                      borderRight: '1px solid #DAE7DF'
                    }
                  }
                } else if (col.pinned === 'right') {
                  rightOffset -= subCol.width
                  console.log('colGroup', col.field)
                  pinnedStyle = {
                    position: 'sticky',
                    right: rightOffset,
                    zIndex: 150 // Higher z-index for pinned columns
                  }

                  // Add a right border to the last left-pinned column
                  if (subIndex === 0) {
                    borderStyle = {
                      borderLeft: '1px solid #DAE7DF'
                    }
                  }
                }

                return (
                  <TableCell
                    onClick={e => {
                      if (onCellClick) {
                        onCellClick({ cell: row[col.field], row })
                      }
                    }}
                    key={`${rowIndex}-${col.field}`}
                    sx={{
                      width: subCol.width,
                      minWidth: subCol.width,
                      maxWidth: subCol.width,
                      backgroundColor: 'inherit',
                      cursor: onCellClick && 'pointer',

                      // '&:hover': {
                      //   backgroundColor: onCellClick && '#ECFFDC'
                      // },
                      ...pinnedStyle,
                      ...borderStyle,
                      ...col.columnStyle,
                      ...subCol?.subheaderStyle,
                      borderBottom: filteredRows.length != rowIndex && '1px solid #DAE7DF'
                    }}
                  >
                    {/* {subCol.label || subCol.field} */}
                    {subCol.renderCell ? subCol.renderCell({ row }) : row[subCol.field[0]]}
                  </TableCell>
                )
              })
            ) : (
              <TableCell
                style={{ paddingTop: 0, paddingBottom: 0 }}
                onClick={e => {
                  if (onCellClick) {
                    onCellClick({ cell: row[col.field], row })
                  }
                }}
                key={`${rowIndex}-${col.field}`}
                sx={{
                  width: col.width,
                  minWidth: col.width,
                  maxWidth: col.width,

                  backgroundColor: 'inherit',
                  cursor: onCellClick && 'pointer',

                  // '&:hover': {
                  //   backgroundColor: onCellClick && '#ECFFDC'
                  // },
                  ...pinnedStyle,
                  ...borderStyle,
                  ...col.columnStyle,
                  minHeight: '70px',
                  maxHeight: '70px',
                  borderBottom: filteredRows.length != rowIndex && '1px solid #DAE7DF'
                }}
              >
                {col.renderCell ? col.renderCell({ row }) : row[col.field[0]]}
              </TableCell>
            )
          })}
        </TableRow>
      )
    })
  }

  // Render table pagination
  const renderFooter = () =>
    pagination && (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#fff'
        }}
      >
        <Box sx={{ marginLeft: 4, display: 'flex' }}>
          {rowSelection && (
            <Typography
              variant='body2'
              sx={{
                color: 'text.secondary'
              }}
            >
              Selected rows: {selectedRows?.length}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            display: 'flex',
            gap: '10px'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            {/* Label for rows per page */}
            <Typography
              variant='body2'
              sx={{
                color: 'text.secondary'
              }}
            >
              Rows in view:
            </Typography>

            {/* Dropdown for selecting the number */}
            <Select
              value={defaultRowsInView}

              // onChange={e => setDefaultRowsInView(e.target.value)}
              onChange={e => {
                setUserChangedRowsInView(true)
                setDefaultRowsInView(e.target.value)
              }}
              variant='standard'
              disabled={loading}
              disableUnderline
              sx={{
                fontSize: '0.875rem',
                color: 'text.secondary',
                minWidth: '0px !important',
                width: '40px !important',
                '& .MuiSelect-icon': {
                  color: 'text.secondary',
                  boxShadow: 'none !important', // ✅ forcefully remove any shadow
                  overflow: 'hidden',
                  maxHeight: 200 // optional: keeps menu compact
                },
                '& .MuiSelect-select': {
                  minWidth: '0px !important',
                  width: '40px !important',
                  paddingY: '8px' // optional: aligns better
                }
              }}
              MenuProps={{
                anchorOrigin: {
                  vertical: 'bottom',
                  horizontal: 'left'
                },
                transformOrigin: {
                  vertical: 'top',
                  horizontal: 'left'
                },
                PaperProps: {
                  elevation: 0 // ✅ fully disables the default shadow
                }
              }}
            >
              {defaultRowsInViewOption.map(num => (
                <MenuItem key={num} value={num}>
                  {num}
                </MenuItem>
              ))}
            </Select>
          </Box>
          <TablePagination
            component='div'
            count={rowCount}
            page={paginationModel.page}
            rowsPerPage={paginationModel.pageSize}
            onPageChange={(event, newPage) =>
              !loading &&
              onPaginationModelChange({
                ...paginationModel,
                page: newPage
              })
            }
            rowsPerPageOptions={[...new Set([...pageSizeOptions, paginationModel.pageSize].sort((a, b) => a - b))]}
            onRowsPerPageChange={event => {
              !loading &&
                onPaginationModelChange({
                  ...paginationModel,
                  pageSize: parseInt(event.target.value, 10)
                })
              setRowPerPageCount(parseInt(event.target.value, 10))
            }}
            sx={{
              background: loading ? '#f5f5f5' : '#fff',

              // borderTop: '1px solid #ddd',
              // boxShadow: '0px -2px 5px rgba(0,0,0,0.1)',
              pointerEvents: loading ? 'none' : 'auto' // Disable interactions when loading
            }}
          />
        </Box>
      </Box>
    )

  return (
    <>
      {/* <Box sx={{ m: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {headerName && (
            <Typography sx={{ fontSize: 22, fontWeight: '600', color: '#444', ...headerStyle }}>
              {headerName}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
          <TextField
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder='Search...'
            variant='outlined'
            size='small'
            sx={{ width: 240, marginLeft: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
        </Box>
      </Box> */}
      <div style={{ position: 'relative', borderRadius: 2 }}>
        <TableContainer
          style={{ borderRadius: 6 }}
          component={Paper}
          sx={{
            borderRadius: 2,
            height: finalTableHeight,
            overflowY: 'auto',
            position: 'relative',
            border: '1px solid #ddd',
            overflow: loading ? 'hidden' : 'auto'

            // '&::-webkit-scrollbar': { width: '0px', height: '0px' }
            // '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#888' },
            // '&::-webkit-scrollbar-track': { backgroundColor: '#f0f0f0' }
          }}
        >
          <Table stickyHeader>
            <TableHead>{renderTableHeader()}</TableHead>
            {rearrangedColumns.some(column => Array.isArray(column.subHeader) && column.subHeader.length > 0) && (
              <TableHead>{renderSubHeaders()}</TableHead>
            )}

            {<TableBody>{renderTableBody()}</TableBody>}
          </Table>
        </TableContainer>
        {loading && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              borderRadius: 8,
              height: '100%',
              zIndex: 800,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#00000030'
            }}
          >
            <CircularProgress />
          </div>
        )}
        {renderFooter()}
      </div>
    </>
  )
}

const StickyTable = ({
  rows = [], // Data rows for the table
  columns = [], // Column definitions
  rowCount = 0, // Total number of rows (used for pagination)
  rowHeight = 74, // Row height
  headerHeight = 55, // Header row height
  subHeaderHeight = 50, // SubHeader row height
  pagination = true, // Enable or disable pagination
  pageSizeOptions = [5, 10, 20], // Options for number of rows per page
  rowsInView = 5, // Number of rows visible in the viewport
  rowsInViewOptions = [5, 7, 10, 20], // Options for rows visible in the viewport
  paginationModel = { page: 0, pageSize: 10 }, // Initial pagination model
  onPaginationModelChange = () => {}, // Fallback to a no-op function
  onSortChange = () => {}, // Fallback to a no-op function
  loading = true, // Loading state
  onCellClick, // Fallback to a no-op function
  onRowClick, // Fallback to a no-op function
  onRowSelect = () => {}, // Fallback to a no-op function
  rowSelection = false, // Enable or disable row selection
  downloadExcel = false,
  headerName = '',
  headerStyle = {},
  searchMode = 'local',
  onSearch = () => {},
  modifyColumnPinning = false
}) => {
  const [initialLoader, setInitialLoader] = useState(true)
  const hasInitialLoaded = useRef(false)

  useEffect(() => {
    if (loading) {
      hasInitialLoaded.current = true
    }

    if (!loading && hasInitialLoaded.current) {
      // setTimeout(() => {
      setInitialLoader(false)

      // }, 20) // Optional delay for smoother UX
    }
  }, [loading])

  if (initialLoader) {
    return (
      <>
        <div style={{ position: 'relative', borderRadius: 2 }}>
          <TableContainer
            style={{ borderRadius: 6 }}
            component={Paper}
            sx={{
              borderRadius: 2,
              height: 200,
              overflowY: 'auto',
              position: 'relative',
              border: '1px solid #ddd',
              overflow: loading ? 'hidden' : 'auto'
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      fontSize: '24px',
                      height: '45px',
                      fontWeight: 'bold',
                      color: '#444',
                      ...headerStyle
                    }}
                  >
                    {headerName || 'Loading...'}
                  </TableCell>
                </TableRow>
              </TableHead>
            </Table>
          </TableContainer>
          {loading && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                borderRadius: 8,
                zIndex: 800,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#00000030'
              }}
            >
              <CircularProgress />
            </div>
          )}
          {/* {renderFooter()} */}
        </div>
      </>
    )
  } else {
    return (
      <StickyTableChild
        rows={rows}
        columns={columns}
        rowCount={rowCount}
        rowHeight={rowHeight}
        headerHeight={headerHeight}
        subHeaderHeight={subHeaderHeight}
        pagination={pagination}
        pageSizeOptions={pageSizeOptions}
        rowsInView={rowsInView}
        rowsInViewOptions={rowsInViewOptions}
        paginationModel={paginationModel}
        onPaginationModelChange={onPaginationModelChange}
        onSortChange={onSortChange}
        loading={loading}
        onCellClick={onCellClick}
        onRowClick={onRowClick}
        onRowSelect={onRowSelect}
        rowSelection={rowSelection}
        downloadExcel={downloadExcel}
        headerName={headerName}
        headerStyle={headerStyle}
        searchMode={searchMode}
        onSearch={onSearch}
        modifyColumnPinning={modifyColumnPinning}
      />
    )
  }
}

export default StickyTable
