import { useTheme, styled } from '@mui/material/styles'
import { LoadingButton } from '@mui/lab'
import {
  Box,
  Badge,
  Checkbox,
  CircularProgress,
  debounce,
  Divider,
  Drawer,
  Grid,
  IconButton,
  TextField,
  Typography
} from '@mui/material'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import Icon from 'src/@core/components/icon'
import { getClassList } from 'src/lib/api/diet/speciesDiet'
import { useTranslation } from 'react-i18next'

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    borderRadius: '20%'
  }
}))

interface Props {
  searchQuery: any
  setSearchQuery: (...args: any[]) => any
  openFilterDrawer: any
  setOpenFilterDrawer: (...args: any[]) => any
  setSelectedFiltersOptions: (...args: any[]) => any
  selectedOptions: any
  setSelectedOptions: (...args: any[]) => any
  setFilterCount: (...args: any[]) => any
}

const SpeciesDietFilterDrawer: React.FC<Props> = ({
  searchQuery,
  setSearchQuery,
  openFilterDrawer,
  setOpenFilterDrawer,
  setSelectedFiltersOptions,
  selectedOptions,
  setSelectedOptions,
  setFilterCount
}) => {
  const theme = useTheme()
  const { t } = useTranslation()
  const leftMenu = [{ id: 1, name: 'Class' }]
  const [selectedMenu, setSelectedMenu] = useState<any>(leftMenu[0])
  const [loading, setLoading] = useState<boolean>(false)
  const [classListData, setClassListData] = useState<any[]>([])
  const [classListCount, setClassListCount] = useState<number>(0)
  const [page_no, setPage_no] = useState<number>(1)
  const [limit, setLimit] = useState<number>(10)
  const [selectAll, setSelectAll] = useState<boolean>(false)

  const getMenuBadgeCount = useCallback(
    (menuName: string) => (selectedOptions?.[menuName]?.length ? selectedOptions[menuName].length : 0),
    [selectedOptions]
  )

  const getClassListData = async (q: string = '') => {
    try {
      setLoading(true)
      const res = await getClassList({ type: 'class', page_no, limit, q })
      if (res.success) {
        setClassListData(prev => (page_no === 1 ? res?.data?.result : [...prev, ...res?.data?.result]))
        setClassListCount(res?.data?.count)
      }
    } catch (e) {
      console.log(e)
    } finally {
      setLoading(false)
    }
  }

  const scrollContainerRef = useRef<any>(null)

  const handleScroll = () => {
    const container = scrollContainerRef.current
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isBottom = scrollTop + clientHeight >= scrollHeight - 50 // near bottom
      if (isBottom && !loading && classListData.length < classListCount) {
        setPage_no(prev => prev + 1)
      }
    }
  }

  useEffect(() => {
    if (openFilterDrawer) {
      getClassListData(searchQuery)
    }
  }, [page_no])

  const getOptionsForMenu = (menu: any) => {
    switch (menu.name) {
      case 'Class':
        return (
          classListData?.map(classItem => ({
            id: classItem?.tsn_id,
            name: classItem?.complete_name
          })) || []
        )
      default:
        return []
    }
  }

  const handleSelectAllChange = (event: any) => {
    const isChecked = event.target.checked
    setSelectAll(isChecked)

    if (isChecked) {
      const newSelectedOptions = {
        ...selectedOptions,
        [selectedMenu.name]: getOptionsForMenu(selectedMenu).map(item => ({
          id: item.id,
          name: item.name
        }))
      }
      setSelectedOptions(newSelectedOptions)
    } else {
      const newSelectedOptions = {
        ...selectedOptions,
        [selectedMenu.name]: []
      }
      setSelectedOptions(newSelectedOptions)
    }
  }

  const debouncedGetClassListData = useCallback(
    debounce((query: string) => {
      getClassListData(query)
    }, 1000),
    []
  )

  const handleSearchChange = (event: any) => {
    const query = event.target.value.toLowerCase()
    setSearchQuery(event.target.value)
    setPage_no(1)
    setClassListData([])
    debouncedGetClassListData(query)
  }

  const handleCheckboxChange = (id: any, name: string) => {
    const currentSelectedOptions = selectedOptions[selectedMenu.name] || []

    const isChecked = currentSelectedOptions.some((option: any) => option.id === id)

    const newSelectedOptions = isChecked
      ? currentSelectedOptions.filter((option: any) => option.id !== id)
      : [...currentSelectedOptions, { id, name }]

    const allOptions = getOptionsForMenu(selectedMenu)
    const areAllSelected = newSelectedOptions.length === allOptions.length

    setSelectedOptions({
      ...selectedOptions,
      [selectedMenu.name]: newSelectedOptions
    })

    if (searchQuery === '') {
      setSelectAll(areAllSelected)
    }
  }
  useEffect(() => {
    const allOptions = getOptionsForMenu(selectedMenu) || []
    const selected = selectedOptions[selectedMenu.name] || []

    const allSelected = allOptions.length > 0 && selected.length === allOptions.length
    setSelectAll(allSelected)
  }, [selectedOptions, selectedMenu, getOptionsForMenu])

  const handleApplyFilter = () => {
    const tabsWithSelection = Object.values(selectedOptions ?? {}).reduce((count: number, value: any) => {
      if (Array.isArray(value) && value.length > 0) {
        return count + 1
      }

      return count
    }, 0)

    setFilterCount(tabsWithSelection)
    setSelectedFiltersOptions(selectedOptions ?? {})
    handleCloseDrawer()
  }

  const handleCloseDrawer = () => {
    setOpenFilterDrawer(false)
    setSearchQuery('')
    setPage_no(1)
    setClassListData([])
    setClassListCount(0)
  }

  return (
    <Drawer
      anchor='right'
      open={openFilterDrawer}
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', '562px'], height: '100vh' },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        backgroundColor: 'background.default'
      }}
    >
      <Box
        className='sidebar-header'
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'background.default',
          p: theme => theme.spacing(3, 3.255, 3, 5.255)
        }}
      >
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
          <Icon icon='mage:filter' fontSize={30} />
          <Typography sx={{ fontSize: '24px', fontWeight: 500 }}>Filter</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleCloseDrawer}>
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>
      </Box>
      <Box
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '562px'] },
          backgroundColor: 'background.default',
          height: '100%'
        }}
      >
        <Grid container sx={{ px: 5 }}>
          <Grid size={{ xs: 4, sm: 4, md: 4 }}>
            {leftMenu.map(menu => {
              const badgeCount = getMenuBadgeCount(menu.name)

              return (
                <Box
                  key={menu.id}
                  sx={{
                    width: '190px',
                    bgcolor: selectedMenu?.id === menu.id ? 'white' : 'transparent',
                    cursor: 'pointer',
                    p: 4,
                    borderTopLeftRadius: '8px',
                    borderBottomLeftRadius: '8px'
                  }}

                  // onClick={() => handleMenuClick(menu)}
                >
                  <Typography component='div'
                    sx={{
                      color: theme.palette.primary.dark,
                      fontSize: '16px',
                      fontWeight: 400,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    {menu.name}
                    <StyledBadge badgeContent={badgeCount} color='primary' sx={{ ml: 2 }} />
                  </Typography>
                </Box>
              )
            })}
          </Grid>
          <Grid size={{ xs: 8, sm: 8, md: 8 }}>
            <Box
              ref={scrollContainerRef}
              onScroll={handleScroll}
              sx={{
                bgcolor: theme.palette.primary.contrastText,
                p: '16px',
                borderRadius: '8px',
                width: '345px',
                height: 'calc(100vh - 185px)',
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  width: 0,
                  height: 0
                },
                msOverflowStyle: 'none',
                scrollbarWidth: 'none'
              }}
            >
              <>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                    borderRadius: '4px',
                    padding: '0 8px',
                    height: '40px',
                    mb: 4
                  }}
                >
                  <Icon icon='mi:search' color={theme.palette.customColors.OnSurfaceVariant} />
                  <TextField
                    variant='outlined'
                    placeholder='Search'
                    value={searchQuery}
                    onChange={handleSearchChange}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        border: 'none',
                        padding: '0',
                        '& fieldset': {
                          border: 'none'
                        }
                      }
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Checkbox
                    disabled={classListData.length == 0}
                    checked={selectAll}
                    onChange={handleSelectAllChange}
                    inputProps={{ 'aria-label': 'controlled' }}
                  />
                  <Typography sx={{ fontSize: '16px', fontWeight: 400, color: theme.palette.customColors.Outline }}>
                    {t('diet_module.select_all')}
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
              </>

              {selectedMenu && (
                <Box sx={{ mt: 2 }}>
                  {getOptionsForMenu(selectedMenu)?.map((option, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Checkbox
                        checked={selectedOptions[selectedMenu.name]?.some((item: any) => item.id === option.id) ?? false}
                        onChange={() => handleCheckboxChange(option.id, option.name)}
                        inputProps={{ 'aria-label': 'controlled' }}
                      />
                      <Typography sx={{ fontSize: '16px', fontWeight: 400, color: theme.palette.customColors.Outline }}>
                        {option.name}
                      </Typography>
                    </Box>
                  ))}
                  {loading && (
                    <Box sx={{ textAlign: 'center' }}>
                      <CircularProgress />
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>
      <Box
        sx={{
          height: '122px',
          width: '100%',
          maxWidth: '562px',
          position: 'fixed',
          bottom: 0,
          px: 4,
          bgcolor: 'white',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          display: 'flex',
          boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.2)',
          zIndex: 123
        }}
      >
        <LoadingButton
          fullWidth
          variant='outlined'
          size='large'
          disabled={classListData.length == 0}
          onClick={() => {
            handleCloseDrawer()
            setSelectedOptions([])
            setFilterCount(0)
            setSelectedFiltersOptions({})
          }}
        >
          {t('cancel_all')}
        </LoadingButton>
        <LoadingButton
          disabled={classListData.length == 0}
          fullWidth
          variant='contained'
          size='large'
          onClick={handleApplyFilter}
        >
          {t('apply_filter')}
        </LoadingButton>
      </Box>
    </Drawer>
  )
}

export default SpeciesDietFilterDrawer
