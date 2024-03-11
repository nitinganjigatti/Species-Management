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
  IconButton,
  debounce,
  InputAdornment,
  CircularProgress
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Box } from '@mui/system'
import Icon from 'src/@core/components/icon'
import React, { useCallback, useEffect, useState } from 'react'
import Router from 'next/router'
import { getFeedTypeList } from 'src/lib/api/diet/feedType'

const FeedTypes = () => {
  const theme = useTheme()
  const [page_no, setPage_no] = useState(1)
  const [limit, setLimit] = useState(10)
  const [searchColumns, setSearchColumns] = useState('feed_type_name')
  const [sortBy, setSortBy] = useState('ASC')
  const [searchValue, setSearchValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedRows, setFeedRows] = useState([])
  const [status, setStatus] = useState(1)
  const [totalFeeds, setTotalFeeds] = useState(0)

  const handleChangePage = (event, newPage) => {
    setLoading(true)
    getFeedTypeList({ page_no: newPage, limit, q: searchValue, searchColumns, status }).then(res => {
      setFeedRows(res?.data?.result)
      setTotalFeeds(res?.data?.total_count)
      setLoading(false)
    })
    setPage_no(newPage)
  }

  function TablePaginationActions(props) {
    const theme = useTheme()
    const { count, page, rowsPerPage, onPageChange } = props

    const handleBackButtonClick = event => {
      onPageChange(event, page - 1)
    }

    const handleNextButtonClick = event => {
      onPageChange(event, page + 1)
    }

    return (
      <Box sx={{ flexShrink: 0, ml: 2.5 }}>
        <span>
          Page {page_no} of {Math.ceil(count / rowsPerPage)}
        </span>
        <IconButton onClick={handleBackButtonClick} disabled={page === 1} aria-label='previous page'>
          {theme.direction === 'rtl' ? (
            <Icon icon='mdi:keyboard-arrow-right' />
          ) : (
            <Icon icon='mdi:keyboard-arrow-left' />
          )}
        </IconButton>
        <IconButton
          onClick={handleNextButtonClick}
          disabled={page >= Math.round(count / rowsPerPage)}
          aria-label='next page'
        >
          {theme.direction === 'rtl' ? (
            <Icon icon='mdi:keyboard-arrow-left' />
          ) : (
            <Icon icon='mdi:keyboard-arrow-right' />
          )}
        </IconButton>
      </Box>
    )
  }

  const handleSearch = useCallback(
    debounce(async value => {
      setPage_no(1)
      setSearchValue(value)
      try {
        setLoading(true)
        await getFeedTypeList({ page_no: 1, limit, q: value, sortBy, searchColumns, status }).then(res => {
          setFeedRows(res?.data?.result)
          setTotalFeeds(res?.data?.total_count)
          setLoading(false)
        })
      } catch (error) {
        setLoading(false)
        console.error(error)
      }
    }, 500),
    []
  )

  const handleClear = useCallback(
    debounce(async () => {
      try {
        setSearchValue('')
        setFeedRows([])
        setTotalFeeds(0)
        setPage_no(1)
        setLoading(true)
        await getFeedTypeList({ page_no: 1, limit, q: '', sortBy, searchColumns, status }).then(res => {
          setFeedRows(res?.data?.result)
          setTotalFeeds(res?.data?.total_count)
          setLoading(false)
        })
      } catch (error) {
        setLoading(false)
        console.error(error)
      }
    }, 500),
    []
  )

  const onStatusChange = async e => {
    setPage_no(1)
    try {
      setLoading(true)
      await getFeedTypeList({
        page_no: 1,
        limit,
        q: searchValue,
        sortBy,
        searchColumns,
        status: Number(e?.target?.checked)
      }).then(res => {
        setFeedRows(res?.data?.result)
        setTotalFeeds(res?.data?.total_count)
        setLoading(false)
      })
    } catch (error) {
      setLoading(false)
      console.error(error)
    }
  }

  useEffect(() => {
    try {
      setLoading(true)
      getFeedTypeList({ page_no, limit, status }).then(res => {
        // console.log('first', res?.data?.result)
        setFeedRows(res?.data?.result)
        setTotalFeeds(res?.data?.total_count)
        setLoading(false)
      })
    } catch (error) {
      setLoading(false)
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
          <FormControlLabel
            control={
              <Switch
                checked={status}
                onChange={e => {
                  // console.log('e.target.checked', e.target.checked)
                  setStatus(Number(e.target.checked))
                  onStatusChange(e)
                }}
              />
            }
            label='Show Active Only'
          />
          <TextField
            value={searchValue}
            variant='outlined'
            placeholder='Search feed'
            InputProps={{
              startAdornment: <Icon style={{ marginRight: 10 }} color='#a7a7a7' icon='mdi:search' fontSize={20} />,
              endAdornment: (
                <InputAdornment sx={{ m: 3 }} position='end'>
                  {searchValue && (
                    <IconButton edge='end' onClick={handleClear}>
                      &#10005;
                    </IconButton>
                  )}
                </InputAdornment>
              )
            }}
            onChange={event => {
              setSearchValue(event.target.value)
              handleSearch(event.target.value)
            }}
            sx={{ '& input': { py: 2 } }}
          />
        </Box>

        <TableContainer sx={{ border: '1px solid #e8ebf1' }}>
          <Table aria-label='simple table'>
            <TableHead>
              <TableRow sx={{ height: '56px', backgroundColor: theme.palette.customColors.tableHeaderBg }}>
                <TableCell>Feeds</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align='right'></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <Box
                  sx={{
                    paddingY: '14px',
                    width: '301%',
                    textAlign: 'center',
                    backgroundColor: theme.palette?.customColors?.lightBg
                  }}
                >
                  <CircularProgress color={theme?.palette?.customColors?.primary?.light} />
                </Box>
              ) : feedRows.length > 0 ? (
                feedRows?.map(item => (
                  <TableRow key={item.id}>
                    <TableCell sx={{ pr: 10 }}>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Avatar variant='square' src={item?.image} alt={item.id} />
                        {item.feed_type_name}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'justify', pr: 40 }}>{item.desc}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Icon
                          style={{ cursor: 'pointer' }}
                          onClick={() => console.log('ghj')}
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
                ))
              ) : null}
            </TableBody>
            {loading ? null : (
              <TableFooter>
                <TableRow>
                  <TablePagination
                    sx={{
                      '& .css-re6ba-MuiTablePagination-selectLabel': {
                        display: 'none'
                      },
                      '& .css-1twleqn-MuiInputBase-root-MuiTablePagination-select': {
                        display: 'none'
                      },
                      '& .css-nbjgsh-MuiTablePagination-displayedRows': {
                        display: 'none'
                      }
                    }}
                    count={totalFeeds}
                    rowsPerPage={limit}
                    page={page_no}
                    onPageChange={handleChangePage}
                    ActionsComponent={TablePaginationActions}
                  />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  )
}

export default FeedTypes
