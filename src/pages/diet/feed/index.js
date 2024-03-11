import {
  Avatar,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  TextField,
  Typography,
  TablePagination,
  IconButton
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Box } from '@mui/system'
import Icon from 'src/@core/components/icon'
import React, { useEffect, useState } from 'react'
import Router from 'next/router'
import PropTypes from 'prop-types'
import { getFeedTypeList } from 'src/lib/api/diet/feedType'

const FeedTypes = () => {
  const [page_no, setPage_no] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [feedRows, setFeedRows] = useState([])

  const emptyRows = page_no > 0 ? Math.max(0, (1 + page_no) * rowsPerPage - feedRows.length) : 0

  const handleChangePage = (event, newPage) => {
    setPage_no(newPage)
  }

  const handleChangeRowsPerPage = event => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage_no(0)
  }

  function TablePaginationActions(props) {
    const theme = useTheme()
    const { count, page, rowsPerPage, onPageChange } = props

    const handleFirstPageButtonClick = event => {
      onPageChange(event, 0)
    }

    const handleBackButtonClick = event => {
      onPageChange(event, page - 1)
    }

    const handleNextButtonClick = event => {
      onPageChange(event, page + 1)
    }

    const handleLastPageButtonClick = event => {
      onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1))
    }

    return (
      <Box sx={{ flexShrink: 0, ml: 2.5 }}>
        <IconButton onClick={handleFirstPageButtonClick} disabled={page === 0} aria-label='first page'>
          {theme.direction === 'rtl' ? <Icon icon='mdi:last-page' /> : <Icon icon='mdi:first-page' />}
        </IconButton>
        <IconButton onClick={handleBackButtonClick} disabled={page === 0} aria-label='previous page'>
          {theme.direction === 'rtl' ? (
            <Icon icon='mdi:keyboard-arrow-right' />
          ) : (
            <Icon icon='mdi:keyboard-arrow-left' />
          )}
        </IconButton>
        <IconButton
          onClick={handleNextButtonClick}
          disabled={page >= Math.ceil(count / rowsPerPage) - 1}
          aria-label='next page'
        >
          {theme.direction === 'rtl' ? (
            <Icon icon='mdi:keyboard-arrow-left' />
          ) : (
            <Icon icon='mdi:keyboard-arrow-right' />
          )}
        </IconButton>
        <IconButton
          onClick={handleLastPageButtonClick}
          disabled={page >= Math.ceil(count / rowsPerPage) - 1}
          aria-label='last page'
        >
          {theme.direction === 'rtl' ? <Icon icon='mdi:first-page' /> : <Icon icon='mdi:last-page' />}
        </IconButton>
      </Box>
    )
  }

  TablePaginationActions.propTypes = {
    count: PropTypes.number.isRequired,
    onPageChange: PropTypes.func.isRequired,
    page: PropTypes.number.isRequired,
    rowsPerPage: PropTypes.number.isRequired
  }

  useEffect(() => {
    try {
      getFeedTypeList({ page_no }).then(res => {
        setFeedRows(res?.data?.result)
      })
    } catch (error) {
      console.log('feed type list error', error)
    }
  }, [])

  const onRowClick = id => {
    console.log(id, 'id')
    Router.push({
      pathname: `/diet/feed/${id}`
    })
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', height: '32px', justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: 600 }} variant='h6'>
            Feed Types
          </Typography>
          <Button sx={{ px: 7 }} size='small' variant='contained' onClick={() => Router.push('/diet/feed/add-feed')}>
            <Icon icon='mdi:add' fontSize={20} />
            &nbsp; NEW
          </Button>
        </Box>
        <Box sx={{ my: 4, height: '40px', display: 'flex', justifyContent: 'space-between' }}>
          <FormControlLabel control={<Switch defaultChecked />} label='Show Active Only' />
          <TextField
            variant='outlined'
            placeholder='Search feed'
            InputProps={{
              startAdornment: <Icon style={{ marginRight: 10 }} color='#a7a7a7' icon='mdi:search' fontSize={20} />
            }}
            sx={{ '& input': { py: 2 } }}
          />
        </Box>

        <TableContainer sx={{ border: '1px solid #e8ebf1' }}>
          <Table aria-label='simple table'>
            <TableHead>
              <TableRow sx={{ height: '56px', backgroundColor: '#E8F4F2' }}>
                <TableCell>Feeds</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align='right'></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(rowsPerPage > 0
                ? feedRows.slice(page_no * rowsPerPage, page_no * rowsPerPage + rowsPerPage)
                : feedRows
              ).map(item => (
                <TableRow key={item.id}>
                  <TableCell sx={{ pr: 10 }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Avatar variant='square' src={item?.feed_type_image} alt={item.id} />
                      {item.feed_type_name}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'justify', pr: 40 }}>{item.desc}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Icon
                        style={{ cursor: 'pointer' }}
                        onClick={() => onRowClick(item.id)}
                        color='#a7a7a7'
                        icon='mdi:eye-outline'
                      />
                      <Icon
                        style={{ cursor: 'pointer' }}
                        onClick={() => Router.push({ pathname: '/diet/feed/add-feed', query: { id: item.id } })}
                        color='#a7a7a7'
                        icon='mdi:edit'
                      />
                      {/* <Icon color='#a7a7a7' icon='mdi:dots-vertical' /> */}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={6} />
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
                  colSpan={3}
                  count={feedRows.length}
                  rowsPerPage={rowsPerPage}
                  page={page_no}
                  slotProps={{
                    select: {
                      inputProps: {
                        'aria-label': 'rows per page'
                      },
                      native: true
                    }
                  }}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  ActionsComponent={TablePaginationActions}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  )
}

export default FeedTypes
