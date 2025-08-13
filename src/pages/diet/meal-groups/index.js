import { TabContext, TabList, TabPanel } from '@mui/lab'
import {
  Typography,
  Card,
  CardContent,
  Box,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Tab,
  Grid,
  Divider,
  Checkbox,
  Button,
  Autocomplete,
  Breadcrumbs,
  IconButton,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  CircularProgress,
  Tooltip,
  Chip
} from '@mui/material'
import { fontSize, fontWeight, textAlign } from '@mui/system'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'
import { AuthContext } from 'src/context/AuthContext'
import {
  getEnclosureList,
  getEnclosureListByGroup,
  getMealGroupList,
  getMealGroupStats,
  getSectionList,
  getSpeciesList,
  removeMealGroup,
  updateMealGroup
} from 'src/lib/api/diet/mealgroup'
import { useTheme } from '@emotion/react'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { useRouter } from 'next/router'
import CreateMealGroup from 'src/views/pages/diet/mealGroup/creategroup'
import toast from 'react-hot-toast'
import CreateEnclosure from 'src/views/pages/diet/mealGroup/createEnclosure'
import { debounce } from 'lodash'
import select from 'src/@core/theme/overrides/select'
import FixedFooterWrapper from 'src/components/diet/FixedFooterWrapper'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import Error404 from 'src/pages/404'
import AddEnclosureToGroup from 'src/views/pages/diet/mealGroup/addEnclosureToGroup'

const MealGroup = () => {
  const router = useRouter()
  const authData = useContext(AuthContext)
  const dietModule = authData?.userData?.roles?.settings?.diet_module
  const theme = useTheme()
  const firstSite = authData?.userData?.user?.zoos[0]?.sites?.[0] || null

  const updateUrlParams = params => {
    const query = { ...router.query, ...params }
    router.push({ pathname: router.pathname, query }, undefined, { shallow: true })
  }

  const [defaultSite, setDefaultSite] = useState(firstSite)

  const [selectedOption, setSelectedOption] = useState(
    router.query.site_id ? router.query.site_id : firstSite?.site_id || ''
  )
  const [status, setStatus] = useState(router.query.status || 'unmapped')
  const [openDrawer, setOpenDrawer] = useState(false)
  const [enclosureList, setEnclosureList] = useState([])
  const [menuGroupList, setMenuGroupList] = useState([])
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [openDeleteEnclosureDialog, setopenDeleteEnclosureDialog] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [groupId, setGroupId] = useState(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [Loader, setLoader] = useState(false)

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 50
  })
  const [originalItems, setOriginalItems] = useState([])
  const [selectedItems, setSelectedItems] = useState([])
  const [enclosureDrawer, setEnclosureDrawer] = useState(false)
  const [editeditems, setEditItems] = useState([])

  const [siteStats, setSiteStats] = useState({
    meal_groups_count: '0',
    unmapped_enclosures: '',
    mapped_enclosures: '',
    total_enclosures: '',
    total_animals: '',
    total_species: ''
  })
  const [sectionList, setSectionList] = useState([])
  const [selectedSection, setSelectedSection] = useState('all') // new state to hold selected value
  const [speciesList, setSpeciesList] = useState([])
  const [selectedSpecies, setSelectedSpecies] = useState('all')
  const [groupList, setGroupList] = useState([])
  const [selectedGroup, setSelectedGroup] = useState('all')
  const [editParam, setEditParam] = useState({})
  const [searchValue, setSearchValue] = useState('')
  const [editSearchValue, setEditSearchValue] = useState('')
  const [selectedForDrawer, setSelectedForDrawer] = useState([])
  const [mealId, setMealId] = useState(null)
  const [addEnclosureDrawer, setAddEnclosureDrawer] = useState(false)

  const [mealType, setmealType] = useState({
    type: 'view'
  })

  useEffect(() => {
    const siteIdFromQuery = router.query.site_id
    const allSites = authData?.userData?.user?.zoos || []

    // Only run if authData is loaded
    if (allSites.length > 0) {
      if (siteIdFromQuery) {
        console.log('All Sites >', allSites[0])

        const matchedSite = allSites[0].sites.find(site => site.site_id == siteIdFromQuery)
        if (matchedSite) {
          setDefaultSite(matchedSite)
          setSelectedOption(matchedSite.site_id)

          return
        }
      }

      // If no site_id in query or no match, fallback to first site
      const first = authData?.userData?.user?.zoos[0]?.sites?.[0] || null
      if (first) {
        setDefaultSite(first)
        setSelectedOption(first.site_id)
        router.replace(
          {
            pathname: router.pathname,
            query: { ...router.query, site_id: first.site_id }
          },
          undefined,
          { shallow: true }
        )
      }
    }
  }, [router.query.site_id])

  function loadServerRows(currentPage, data) {
    return data
  }

  const [checkedRows, setCheckedRows] = useState([])

  console.log('Checked >>', checkedRows, selectedItems)

  const handleSectionChange = event => {
    const value = event.target.value
    setSelectedSection(value) // value is string
    setCheckedRows([])
  }

  const handleSpeciesChange = event => {
    const value = event.target.value
    setSelectedSpecies(value) // value is string
    setCheckedRows([])
  }

  const handleGroupChange = event => {
    const value = event.target.value
    setSelectedGroup(value) // value is string
    setCheckedRows([])
  }

  const handleCheckboxChange = (e, row) => {
    const id = row.enclosure_id

    if (e.target.checked) {
      setCheckedRows(prev => [...prev, id])
      setSelectedItems(prev => [...prev, row])
    } else {
      setCheckedRows(prev => prev.filter(i => i !== id))
      setSelectedItems(prev => prev.filter(item => item.enclosure_id !== id))
    }
  }

  const handleSelectAll = e => {
    if (e.target.checked) {
      const allIds = enclosureList.map(item => item.enclosure_id)
      setCheckedRows(allIds)
      setSelectedItems(enclosureList)
    } else {
      setCheckedRows([])
      setSelectedItems([])
    }
  }

  const fetchEnclosure = async passedParams => {
    if (!selectedOption) return

    setLoading(true)

    if (status === 'mealgroup') {
      const groupparams = {
        site_id: selectedOption,
        page_no: paginationModel.page + 1,
        limit: paginationModel.pageSize
      }

      try {
        const response = await getMealGroupList(groupparams)
        if (response.success) {
          setMenuGroupList(loadServerRows(paginationModel.page, response?.data?.result))
          setTotal(response?.data?.count)
        } else {
          console.error('Failed to fetch meal groups:', response?.message || 'Unknown error')
        }
      } catch (error) {
        console.error('Error fetching meal groups:', error)
      } finally {
        setLoading(false)
      }

      return
    }

    const params = passedParams || {
      type: status,
      q: searchValue,
      site_id: selectedOption,
      page_no: paginationModel.page + 1,
      limit: paginationModel.pageSize
    }

    if (selectedSection !== 'all') {
      params.section_ids = JSON.stringify([selectedSection])
    }
    if (selectedSpecies !== 'all') {
      params.species_ids = JSON.stringify([selectedSpecies])
    }
    if (selectedGroup !== 'all') {
      params.meal_group_ids = JSON.stringify([selectedGroup])
    }

    try {
      const response = await getEnclosureList(params)
      if (response.success) {
        setEnclosureList(loadServerRows(paginationModel.page, response?.data?.result))
        setTotal(response?.data?.count)
      } else {
        console.error('Failed to fetch enclosures:', response?.message || 'Unknown error')
      }
    } catch (error) {
      console.error('Error fetching enclosures:', error)
    } finally {
      setLoading(false)
    }
  }

  const debouncedSearch = useCallback(
    debounce(async q => {
      setSearchValue(q)

      setPaginationModel({ page: 0, pageSize: 50 })

      try {
        await fetchEnclosure({
          q,
          type: status,
          site_id: selectedOption,
          page_no: 1,
          limit: 10
        })
      } catch (err) {
        console.log(err)
      }
    }, 1000),
    [selectedOption, status] // track selectedOption in dependencies
  )

  const debouncedEnclosureSearch = useCallback(
    debounce(async q => {
      setSearchValue(q)
      setLoader(true)
      setPaginationModel({ page: 0, pageSize: 50 })

      try {
        const res = await getEnclosureListByGroup({
          q,
          type: 'unmapped',
          site_id: selectedOption
        })

        if (res) {
          if (res?.success) {
            const list = res.data?.result || []

            // Filter the result based on enclosure_id in checkedRows
            // const selected = list.filter(item => checkedRows.includes(item.enclosure_id))

            setSelectedItems(list)
          }
          setLoader(false)
        }
      } catch (err) {
        console.log(err)
      }
    }, 1000),
    [selectedOption] // ✅ dependency added here to track selectedOption changes
  )

  const debouncedEditEnclosureSearch = useCallback(
    debounce(async (q, id) => {
      console.log('Edit >', editeditems)

      setEditSearchValue(q)
      setPaginationModel({ page: 0, pageSize: 50 })

      try {
        const res = await getEnclosureListByGroup({
          q,
          type: 'mapped',
          site_id: selectedOption, // ✅ this will now be up-to-date
          meal_group_ids: JSON.stringify([id]) // Send as array
        })

        if (res) {
          setEditItems(res?.data?.result)
        }
      } catch (err) {
        console.log(err)
      }
    }, 1000),
    [selectedOption] // ✅ make sure to track this
  )

  const handleSearch = value => {
    setSearchValue(value)
    debouncedSearch(value)
  }

  const handleEnclosureSearch = value => {
    setSearchValue(value)
    debouncedEnclosureSearch(value)
  }

  const handleEditSearch = (value, mealId) => {
    setEditSearchValue(value)
    debouncedEditEnclosureSearch(value, mealId)
  }

  const fetchSiteStats = async () => {
    if (!selectedOption) return

    try {
      const response = await getMealGroupStats({ site_id: selectedOption }) // you can replace this with actual API call
      if (response.success) {
        setSiteStats(response.data)
      } else {
        console.error('Failed to fetch site stats:', response?.message || 'Unknown error')
      }
    } catch (error) {
      console.error('Error fetching site stats:', error)
    }
  }

  const fetchSectionList = async () => {
    if (!selectedOption) return
    try {
      const response = await getSectionList({
        site_id: selectedOption,
        page_no: paginationModel.page,
        limit: paginationModel.pageSize
      })
      if (response.success) {
        setSectionList(response.data.result)
      } else {
        console.error('Failed to fetch site stats:', response?.message || 'Unknown error')
      }
    } catch (error) {
      console.log('Error fetching site section:', error)
    }
  }

  const fetchSpeciesList = async () => {
    try {
      const response = await getSpeciesList({
        page_no: paginationModel.page,
        limit: paginationModel.pageSize
      })
      if (response.success) {
        setSpeciesList(response.data.result)
      } else {
        console.error('Failed to fetch site species:', response?.message || 'Unknown error')
      }
    } catch (error) {
      console.log('Error fetching site species:', error)
    }
  }

  const fetchMealGroupNames = async () => {
    const groupparams = {
      site_id: selectedOption,
      page_no: paginationModel.page + 1
    }
    try {
      const response = await getMealGroupList(groupparams)
      if (response.success) {
        setGroupList(response.data.result)
      } else {
        console.error('Failed to fetch group names', response?.message || 'Unknown error')
      }
    } catch (error) {
      console.log('Error', error)
    }
  }

  useEffect(() => {
    fetchEnclosure()
    fetchSiteStats()
    fetchSectionList()
    fetchSpeciesList()
    fetchMealGroupNames()
    updateUrlParams({
      status: status,
      site_id: selectedOption,
      page: paginationModel.page,
      limit: paginationModel.pageSize
    })
  }, [
    selectedOption,
    status,
    paginationModel.page,
    paginationModel.pageSize,
    selectedSection,
    selectedSpecies,
    selectedGroup
  ])

  const StatCard = ({ value, label, bgColor, textColor }) => (
    <Card
      sx={{
        backgroundColor: bgColor,
        color: textColor || '#000',
        width: { xs: '100%', sm: '140px', md: '154px' },
        height: { xs: 'auto', sm: '56px' },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'none',
        px: 2,
        py: 1
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: { xs: 0.5, sm: 1 },
          textAlign: { xs: 'left', sm: 'center' }
        }}
      >
        <Typography
          variant='subtitle1'
          sx={{
            fontWeight: 600,
            fontFamily: 'Inter',
            fontSize: { xs: '16px', sm: '16px' },
            color: textColor || '#000'
          }}
        >
          {value}
        </Typography>
        <Typography
          variant='caption'
          sx={{
            fontSize: { xs: '13px', sm: '14px' },
            fontFamily: 'Inter',
            fontWeight: 500,
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          {label}
        </Typography>
      </Box>
    </Card>
  )

  const FooterCard = ({ count }) => {
    return (
      <>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: { xs: '50px', sm: '205px', md: 3 },
            py: 2,
            backgroundColor: '#fff'
          }}
        >
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'Inter',
              color: theme.palette.customColors.OnSurfaceVariant,
              mr: 1
            }}
          >
            Selected:
          </Typography>

          <Card
            sx={{
              width: '158px',
              ml: 4,
              height: '48px',
              backgroundColor: theme.palette.customColors.tableHeaderBg,
              borderRadius: '4px',
              boxShadow: 'none',

              // px: 2,
              // py: 0.5,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 600,
                color: theme.palette.primary.dark,
                fontFamily: 'Inter'
              }}
            >
              Enclosures - {count}
            </Typography>
          </Card>
        </Box>
      </>
    )
  }

  const TabBadge = ({ label, totalCount }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
      {label}
      {totalCount ? (
        <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' label={totalCount} color='secondary' />
      ) : null}
    </div>
  )

  const handleChange = (event, newValue) => {
    setStatus(newValue)
    setSelectedSection('all')
    setSelectedGroup('all')
    setSelectedSpecies('all')
    setCheckedRows([])
    setSearchValue('')
    setEditItems([])
    setSelectedItems([])
    setPaginationModel({ page: 0, pageSize: 50 })
    setEditParam({})
  }

  const handleEnclosureEvent = async (event, id) => {
    event.stopPropagation()
    try {
      setEnclosureDrawer(true)
      setLoader(true)
      setGroupId(id)
      // setCheckedRows([])
      console.log('Checked rows >>', checkedRows)

      const params = {
        q: searchValue,
        type: 'unmapped',
        site_id: selectedOption

        // meal_group_ids: JSON.stringify([id]) // Send as array
      }

      const response = await getEnclosureListByGroup(params)

      if (response.success) {
        setLoader(false)
        console.log('Enclosure list by group:', response.data.result)
        setSelectedItems(response?.data?.result)
      } else {
        setLoader(true)
        console.error('Failed to fetch enclosure list:', response.message || 'Unknown error')
      }
    } catch (error) {
      console.error('Error fetching enclosure list by group:', error)
    }
  }

  const handleRemove = (event, id) => {
    event.stopPropagation()
    setDeleteId(id)
    setOpenDeleteDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDeleteDialog(false)
    setDeleteId(null)
  }

  const handleConfirmDelete = async () => {
    try {
      const params = {
        site_id: selectedOption,
        meal_group_id: deleteId
      }

      // Call delete API with deleteId
      const response = await removeMealGroup(params) // <-- your API
      if (response.success) {
        // Refresh your data or state
        toast.success('Meal Group deleted successfully')
        fetchEnclosure()
        fetchSiteStats()
      }
    } catch (error) {
      toast.error('something went wrong')
      console.error('Failed to delete group:', error)
    } finally {
      handleCloseDialog()
    }
  }

  const handleEdit = async (event, row) => {
    console.log('Row Detail >', row)
    event.stopPropagation()

    try {
      setEditParam(row)
      setmealType({ type: 'edit' })
      setLoader(true)
      setMealId(row.id)
      setOpenDrawer(true) // 👈 open the drawer

      const params = {
        type: 'mapped',
        site_id: selectedOption,
        meal_group_ids: JSON.stringify([row.id]) // Send as array
      }
      const response = await getEnclosureListByGroup(params)

      if (response.success) {
        setLoader(false)
        console.log('Enclosure list by group:', response.data.result)
        setEditItems(response?.data?.result)
      } else {
        setLoader(true)
        console.error('Failed to fetch enclosure list:', response.message || 'Unknown error')
      }
    } catch (error) {
      console.error('Error fetching enclosure list by group:', error)
    }
  }

  const cancelEnclosureDialog = () => {
    setopenDeleteEnclosureDialog(false)
  }

  const confirmEnclosureDelete = async () => {
    const removedEnclosureIds = selectedItems?.map(item => item.enclosure_id)

    // // Since API expects a single integer, we pick the first group_id
    const removeGroupId = parseInt(selectedItems?.[0]?.group_id)

    const groupNames = Array.from(new Set(selectedItems?.map(item => item.group_name))).join(', ')

    const params = {
      site_id: selectedOption,
      group_name: groupNames,
      meal_group_id: removeGroupId, // pass as single integer
      remove_enclosure_ids: JSON.stringify(removedEnclosureIds)
    }

    const response = await updateMealGroup(params)

    if (response) {
      handleCloseSideBar()
      setCheckedRows([])
      toast.success(`Enclosure Removed from Group successfully`)
      setopenDeleteEnclosureDialog(false)
      fetchEnclosure()
      fetchSiteStats()
    } else {
      toast.error('Something went wrong')
    }
  }

  const removeEnclosure = async () => {
    console.log('removed Ids >>', selectedItems, selectedOption)
    setopenDeleteEnclosureDialog(true)
  }

  // const addEnclosure = async () => {
  //   debugger
  //   console.log('checked Rows >', checkedRows)
  //   try {
  //     setEnclosureDrawer(true)
  //     setLoader(true)
  //     setGroupId('')

  //     const params = {
  //       type: 'unmapped',
  //       site_id: selectedOption

  //       //     // meal_group_ids: JSON.stringify([id]) // Send as array
  //     }

  //     const response = await getEnclosureListByGroup(params)

  //     if (response.success) {
  //       setLoader(false)
  //       console.log('Enclosure list by group:', response.data.result)
  //       const list = response.data.result
  //       if (list.includes(checkedRows)) setSelectedItems(list)
  //     } else {
  //       setLoader(true)
  //       console.error('Failed to fetch enclosure list:', response.message || 'Unknown error')
  //     }
  //   } catch (error) {
  //     console.error('Error fetching enclosure list by group:', error)
  //   }
  // }

  const addEnclosure = async () => {
    try {
      // setEnclosureDrawer(true)
      setAddEnclosureDrawer(true)
      setLoader(true)
      setGroupId('')

      const params = {
        type: 'unmapped',
        site_id: selectedOption
      }

      const response = await getEnclosureListByGroup(params)

      if (response.success) {
        setLoader(false)
        console.log('Enclosure list by group:', response.data.result)

        const list = response.data.result || []

        // Filter the list to only include items whose enclosure_id is in checkedRows
        const selected = list.filter(item => checkedRows.includes(item.enclosure_id))

        setSelectedItems(selected)
      } else {
        setLoader(true)
        console.error('Failed to fetch enclosure list:', response.message || 'Unknown error')
      }
    } catch (error) {
      console.error('Error fetching enclosure list by group:', error)
      setLoader(false)
    }
  }

  const groupcolumns = [
    {
      flex: 0.4,
      width: 40,
      sortable: false,
      field: 'group_name',
      headerName: 'Meal Group Name ',
      headerAlign: 'left',
      align: 'left',
      renderHeader: () => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'start',
            gap: 1
          }}
        >
          <Typography
            variant='subtitle2'
            sx={{
              fontWeight: 600,
              fontSize: '12px',
              fontFamily: 'Inter',
              color: theme.palette.customColors.OnSurfaceVariant,
              textTransform: 'uppercase'
            }}
          >
            Meal Group Name
          </Typography>
        </Box>
      ),
      renderCell: params => (
        <>
          <Tooltip title={params?.row.group_name}>
            <Typography
              variant='body2'
              sx={{
                textAlign: 'center',
                color: theme.palette.customColors.customHeadingTextColor,
                fontSize: '16px',
                fontWeight: 500,
                color: theme.palette.customColors.OnSurfaceVariant,
                fontFamily: 'Inter'
              }}
            >
              {params?.row.group_name}
            </Typography>
          </Tooltip>
        </>
      )
    },
    {
      flex: 0.2,
      width: 20,
      field: 'enclosure_count',
      type: 'number',
      sortable: false,
      headerName: 'Enclosures',
      headerAlign: 'center',
      align: 'center',
      renderHeader: () => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'start',
            gap: 3
          }}
        >
          <Typography
            variant='subtitle2'
            sx={{
              fontWeight: 600,
              fontSize: '12px',
              fontFamily: 'Inter',
              color: theme.palette.customColors.OnSurfaceVariant,
              textTransform: 'uppercase'
            }}
          >
            Enclosures
          </Typography>
        </Box>
      ),
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            textAlign: 'center',
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '16px',
            color: theme.palette.customColors.OnSurfaceVariant,
            fontWeight: 400,
            fontFamily: 'Inter'
          }}
        >
          {params.row.enclosure_count ?? 0}
        </Typography>
      )
    },
    {
      flex: 0.15,
      width: 10,
      field: 'species_count',
      sortable: false,
      type: 'number',
      headerName: 'Species',
      headerAlign: 'center',
      align: 'center',
      renderHeader: () => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'start',
            gap: 1
          }}
        >
          <Typography
            variant='subtitle2'
            sx={{
              fontWeight: 600,
              fontSize: '12px',
              fontFamily: 'Inter',
              color: theme.palette.customColors.OnSurfaceVariant,
              textTransform: 'uppercase'
            }}
          >
            SPECIES
          </Typography>
        </Box>
      ),
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            textAlign: 'center',
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '16px',
            color: '#44544A',
            fontWeight: 400,
            fontFamily: 'Inter'
          }}
        >
          {params.row.species_count ?? 0}
        </Typography>
      )
    },
    {
      flex: 0.15,
      width: 20,
      field: 'animal_count',
      headerName: 'Animals',
      sortable: false,
      headerAlign: 'center',
      align: 'center',
      renderHeader: () => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'start',
            gap: 1
          }}
        >
          <Typography
            variant='subtitle2'
            sx={{
              fontWeight: 600,
              fontSize: '12px',
              fontFamily: 'Inter',
              color: theme.palette.customColors.OnSurfaceVariant,
              textTransform: 'uppercase'
            }}
          >
            Animals
          </Typography>
        </Box>
      ),
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            textAlign: 'center',
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '16px',
            fontWeight: 400,
            color: theme.palette.customColors.OnSurfaceVariant,
            fontFamily: 'Inter'
          }}
        >
          {params.row.animal_count ?? 0}
        </Typography>
      )
    },
    {
      flex: 0.35, // increased flex
      minWidth: 200, // minimum width for small screens
      field: 'actions',
      sortable: false,
      headerAlign: 'center',
      align: 'center',
      renderHeader: () => (
        <>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'start',
              gap: 1
            }}
          >
            <Typography
              variant='subtitle2'
              sx={{
                fontWeight: 600,
                fontSize: '12px',
                fontFamily: 'Inter',
                color: theme.palette.customColors.OnSurfaceVariant,
                textTransform: 'uppercase'
              }}
            >
              Actions
            </Typography>
          </Box>
        </>
      ),
      renderCell: params => (
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            justifyContent: 'center',
            width: '100%'
          }}
        >
          {siteStats.unmapped_enclosures !== '0' && (
            <Button
              sx={{
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                borderRadius: '4px',

                // minWidth: '120px',
                height: '36px',
                fontSize: '12px'
              }}
              variant='outlined'
              onClick={e => handleEnclosureEvent(e, params.row.id)}
            >
              Add Enclosure
            </Button>
          )}

          <IconButton onClick={e => handleEdit(e, params.row)} size='small' sx={{ color: theme.palette.primary.light }}>
            <Icon icon='mdi:pencil-outline' fontSize={20} />
          </IconButton>
          <IconButton
            onClick={e => handleRemove(e, params.row.id)}
            size='small'
            sx={{ color: theme.palette.primary.light }}
          >
            <Icon icon='mdi:close' fontSize={20} />
          </IconButton>
        </Box>
      )
    }
  ]

  const columns = [
    {
      field: 'user_enclosure_name',
      headerName: 'Enclosure Name',
      headerAlign: 'left',
      align: 'left',
      sortable: false,
      flex: 1,
      minWidth: 180,
      renderHeader: () => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'start',
            gap: 1
          }}
        >
          <Checkbox
            sx={{
              '&.Mui-checked': {
                color: theme.palette.primary.main
              },
              '& .MuiSvgIcon-root': {
                width: '19px',
                height: '19px',
                border: '2px dotted'
              },
              mr: 1
            }}
            size='small'
            checked={checkedRows.length === enclosureList.length && enclosureList.length > 0}
            indeterminate={checkedRows.length > 0 && checkedRows.length < enclosureList.length}
            onChange={handleSelectAll}
          />
          <Typography
            variant='subtitle2'
            sx={{
              fontWeight: 600,
              fontSize: '12px',
              fontFamily: 'Inter',
              color: '#44544A',
              textTransform: 'uppercase'
            }}
          >
            Enclosure Name
          </Typography>
        </Box>
      ),
      renderCell: params => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            width: '100%',
            ml: 2
          }}
        >
          <Checkbox
            size='small'
            checked={checkedRows.includes(params.row.enclosure_id)}
            onChange={e => handleCheckboxChange(e, params.row)}
          />
          <Tooltip title={params.row.user_enclosure_name}>
            <Typography
              noWrap
              variant='body2'
              sx={{
                fontSize: '16px',
                fontFamily: 'Inter',
                fontWeight: 500,
                color: '#44544A',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {params.row.user_enclosure_name}
            </Typography>
          </Tooltip>
        </Box>
      )
    },
    {
      field: 'section_name',
      headerName: 'Section',
      headerAlign: 'left',
      sortable: false,
      align: 'left',
      flex: 0.5,
      minWidth: 60,
      renderHeader: () => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'start',
            gap: 1
          }}
        >
          <Typography
            variant='subtitle2'
            sx={{
              fontWeight: 600,
              fontSize: '12px',
              fontFamily: 'Inter',
              color: '#44544A',
              transform: 'elipses',
              textTransform: 'uppercase'
            }}
          >
            Section
          </Typography>
        </Box>
      ),
      renderCell: params => (
        <>
          <Tooltip title={params.row.section_name}>
            <Typography
              variant='body2'
              sx={{
                textAlign: 'center',
                fontSize: '16px',
                fontWeight: 400,
                color: '#44544A',
                fontFamily: 'Inter',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {params.row.section_name}
            </Typography>
          </Tooltip>
        </>
      )
    },
    {
      field: 'species_count',
      headerName: 'Species',
      type: 'number',
      sortable: false,
      headerAlign: 'center',
      align: 'center',
      flex: 0.4,
      minWidth: 80,
      renderHeader: () => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'start',
            gap: 1
          }}
        >
          <Typography
            variant='subtitle2'
            sx={{
              fontWeight: 600,
              fontSize: '12px',
              fontFamily: 'Inter',
              color: '#44544A',
              textTransform: 'uppercase'
            }}
          >
            Species
          </Typography>
        </Box>
      ),
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            textAlign: 'center',
            fontSize: '16px',
            fontWeight: 400,
            color: '#44544A',
            fontFamily: 'Inter'
          }}
        >
          {params.row.species_count ?? 0}
        </Typography>
      )
    },
    {
      field: 'animal_count',
      headerName: 'Animals',
      sortable: false,
      headerAlign: 'center',
      align: 'center',
      flex: 0.4,
      minWidth: 80,
      renderHeader: () => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'start',
            gap: 1
          }}
        >
          <Typography
            variant='subtitle2'
            sx={{
              fontWeight: 600,
              fontSize: '12px',
              fontFamily: 'Inter',
              color: '#44544A',
              textTransform: 'uppercase'
            }}
          >
            Animals
          </Typography>
        </Box>
      ),
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            textAlign: 'center',
            fontSize: '16px',
            fontWeight: 400,
            color: '#44544A',
            fontFamily: 'Inter'
          }}
        >
          {params.row.animal_count ?? 0}
        </Typography>
      )
    },
    {
      field: 'group_name',
      headerName: 'Meal Group Name ',
      sortable: false,
      headerAlign: 'center',
      align: 'center',
      flex: 0.6,
      minWidth: 150,
      renderHeader: () => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'start',
            gap: 1
          }}
        >
          <Typography
            variant='subtitle2'
            sx={{
              fontWeight: 600,
              fontSize: '12px',
              fontFamily: 'Inter',
              color: '#44544A',
              textTransform: 'uppercase'
            }}
          >
            Meal Group Name
          </Typography>
        </Box>
      ),
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter',

            color: params.row.group_name
              ? theme.palette.customColors.OnSurfaceVariant
              : theme.palette.customColors.customDropdownColor
          }}
        >
          {params.row.group_name || 'Not assigned'}
        </Typography>
      )
    }
  ]

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = enclosureList?.map((row, index) => ({
    ...row,
    id: `${row.enclosure_id}`,
    sl_no: getSlNo(index)
  }))

  const GroupindexedRows = menuGroupList?.map((row, index) => ({
    // console.log
    ...row,
    id: `${row.id}`,
    sl_no: getSlNo(index)
  }))

  console.log('Indexed >', indexedRows)

  const handleSiteChange = site => {
    if (!site) {
      setDefaultSite(null)
      setSelectedOption(null)
      router.replace(
        {
          pathname: router.pathname,
          query: { ...router.query, site_id: undefined }
        },
        undefined,
        { shallow: true }
      )
    } else {
      setDefaultSite(site)
      setSelectedOption(site.site_id)
      setEditItems([])
      setCheckedRows([])
      updateUrlParams({
        status: status,
        site_id: site.site_id,
        page: paginationModel.page,
        limit: paginationModel.pageSize
      })
    }
  }

  const addEventSidebarOpen = event => {
    event.stopPropagation()

    // Collect selected row objects from checkedRows
    const selected = enclosureList.filter(row => checkedRows.includes(row.enclosure_id))

    setSelectedItems(selected)
    setEditParam({})
    setEditItems(selected)
    setmealType({ type: 'edit' })
    setOpenDrawer(true)
  }

  const handleCloseSideBar = () => {
    setOpenDrawer(false)
  }

  const handleView = async parm => {
    setLoader(true)
    setOpenDrawer(true)
    setEditParam(parm.row)
    setmealType({ type: 'view' })
    console.log('params >', parm)

    const params = {
      type: 'mapped',
      site_id: selectedOption,
      meal_group_ids: JSON.stringify([parm.row.id]) // Send as array
    }
    const response = await getEnclosureListByGroup(params)

    if (response.success) {
      setLoader(false)
      console.log('Enclosure list by group:', response.data.result)
      setEditItems(response?.data?.result)
    } else {
      setLoader(true)
      console.error('Failed to fetch enclosure list:', response.message || 'Unknown error')
    }
  }

  return dietModule ? (
    <React.Fragment>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography color='inherit'>Diet</Typography>
        <Typography color='inherit' sx={{ cursor: 'pointer' }} onClick={() => router.back()}>
          Meal groups
        </Typography>
      </Breadcrumbs>
      {/* Header Card */}
      <Card sx={{ p: { xs: 0, sm: 3 }, boxShadow: 'none' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', md: 'center' },
            borderRadius: 2,
            p: { xs: 2, sm: 3 },
            gap: 2
          }}
        >
          {/* Left side: Title + Autocomplete */}
          <Box sx={{ width: '100%' }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: { xs: 2, sm: 4 }
              }}
            >
              <Typography
                variant='body1'
                sx={{
                  fontWeight: 500,
                  fontSize: { xs: '18px', sm: '20px', md: '24px' },
                  fontFamily: 'Inter',
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                Meal group for the site -
              </Typography>

              <Autocomplete
                sx={{
                  width: '100%',
                  maxWidth: { sm: '276px' },
                  borderRadius: '8px',
                  '& .MuiInputBase-input': {
                    color: '#fff'
                  },
                  '& .MuiAutocomplete-listbox': {
                    color: '#fff'
                  }
                }}
                name='site_id'
                value={defaultSite}
                disablePortal
                id='site_id'
                // clearIcon={firstSite?.site_id ? true: false}
                disableClearable={defaultSite?.site_id === firstSite?.site_id}
                options={authData?.userData?.user?.zoos?.[0]?.sites || []}
                getOptionLabel={option => option?.site_name || ''}
                isOptionEqualToValue={(option, value) => option?.site_id === value?.site_id}
                onChange={(e, val) => handleSiteChange(val)}
                renderInput={params => (
                  <TextField
                    {...params}
                    placeholder='Search & Select'
                    sx={{
                      backgroundColor: theme.palette.primary.main,
                      borderRadius: '8px',
                      '& .MuiInputBase-input': {
                        color: '#fff'
                      }
                    }}
                    slotProps={{
                      inputLabel: { shrink: false }
                    }}
                  />
                )}
              />
            </Box>
          </Box>

          {/* Right side: Stats */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: { md: 'flex-end' },
              px: 2,
              py: 1,
              alignItems: 'center',
              gap: 2,
              flexWrap: { sm: 'nowrap' },
              width: { xs: '100%', md: 'auto' },
              mt: { xs: 2, md: 0 }
            }}
          >
            <StatCard
              value={siteStats?.total_enclosures}
              label='Enclosures'
              bgColor={theme.palette.customColors.lightBg}
            />
            <StatCard
              value={siteStats?.total_species}
              label='Species'
              bgColor={theme.palette.customColors.OnBackground}
            />
            <StatCard
              value={siteStats?.total_animals}
              label='Animals'
              bgColor={theme.palette.customColors.Tertiary30}
              textColor={theme.palette.customColors.Tertiary}
            />
          </Box>
        </Box>
      </Card>

      {/* Main Card */}
      <Card sx={{ mt: 5, p: { xs: 2, md: 4 }, boxShadow: 'none', mb: 20 }}>
        <Grid>
          <TabContext value={status}>
            <Box>
              <TabList onChange={handleChange} variant='scrollable' scrollButtons='auto'>
                <Tab
                  value='unmapped'
                  label={<TabBadge label={`Enclosures not mapped - ${siteStats?.unmapped_enclosures}`} />}
                />
                <Tab
                  value='mapped'
                  label={<TabBadge label={`Enclosures mapped - ${siteStats?.mapped_enclosures}`} />}
                />
                <Tab
                  value='mealgroup'
                  label={
                    <TabBadge
                      label={`Meal group - ${siteStats?.meal_groups_count ? siteStats.meal_groups_count : 0}`}
                    />
                  }
                />
              </TabList>

              {/* Divider only below TabList, responsive width */}
              <Divider
                sx={{
                  width: { xs: '100%', sm: '630px' },
                  borderBottomWidth: '3px',
                  mt: -0.5,
                  ml: 1
                }}
              />
            </Box>

            <TabPanel value='unmapped'>{''}</TabPanel>
            <TabPanel value='mapped'>{''}</TabPanel>
            <TabPanel value='mealgroup'>{''}</TabPanel>
          </TabContext>
        </Grid>

        {status !== 'mealgroup' && (
          <Box
            sx={{
              mt: 4,
              display: 'flex',
              gap: 2,
              padding: 2,
              borderRadius: 2,
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: { xs: 'space-between', sm: 'flex-start' }
            }}
          >
            {/* Search Input */}
            <TextField
              placeholder='Search'
              size='small'
              value={searchValue}
              onChange={e => handleSearch(e.target.value)}
              variant='outlined'
              sx={{
                flexGrow: 1,
                minWidth: { xs: '100%', sm: '200px', md: '300px' },
                height: '40px',
                backgroundColor: 'white'
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Icon icon='mi:search' />
                    </InputAdornment>
                  )
                }
              }}
            />
            {/* Section Dropdown */}
            <Select
              value={selectedSection}
              onChange={handleSectionChange}
              displayEmpty
              renderValue={selected => {
                if (selected === 'all') return <Typography>All Sections</Typography>
                const selectedItem = sectionList.find(item => item.section_id === selected)

                return selectedItem?.section_name || ''
              }}
              size='small'
              sx={{
                flexGrow: 1,
                minWidth: { xs: '100%', sm: '200px', md: '240px' },
                backgroundColor: 'white',
                borderRadius: '4px'
              }}
            >
              <MenuItem value='all'>
                <Typography>All Sections</Typography>
              </MenuItem>
              {sectionList.map(item => (
                <MenuItem key={item.section_id} value={item.section_id}>
                  {item.section_name}
                </MenuItem>
              ))}
            </Select>

            <Autocomplete
              options={[{ species_id: 'all', common_name: 'All Species', scientific_name: '' }, ...speciesList]}
              getOptionLabel={option => {
                if (option.species_id === 'all') return 'All Species'

                if (!option.common_name) return ` NA (${option.scientific_name})` || ''

                return `${option.common_name} (${option.scientific_name})`
              }}
              value={
                selectedSpecies === 'all'
                  ? { species_id: 'all', common_name: 'All Species', scientific_name: '' }
                  : speciesList.find(item => item.species_id === selectedSpecies) || null
              }
              onBlur={event => {
                if (!selectedSpecies) {
                  // if nothing is selected, default to "All Species"
                  handleSpeciesChange({
                    target: { value: 'all' }
                  })
                }
              }}
              onChange={(event, newValue) => {
                handleSpeciesChange({
                  target: { value: newValue?.species_id || '' }
                })
              }}
              size='small'
              isOptionEqualToValue={(option, value) => option.species_id === value.species_id}
              renderInput={params => (
                <TextField
                  {...params}
                  label='search and select'
                  placeholder='Search and select'
                  variant='outlined'
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '4px'
                    }
                  }}
                />
              )}
              sx={{
                flexGrow: 1,
                minWidth: { xs: '100%', sm: '200px', md: '240px' },
                backgroundColor: 'white'

                // borderRadius: '4px'
              }}
            />
            {/* Meal Group Dropdown */}
            {status !== 'unmapped' && (
              <Select
                value={selectedGroup}
                onChange={handleGroupChange}
                displayEmpty
                renderValue={selected => {
                  if (selected === 'all') return <Typography>All Meal groups</Typography>
                  const selectedItem = groupList.find(item => item.id === selected)

                  return selectedItem?.group_name || ''
                }}
                size='small'
                sx={{
                  flexGrow: 1,
                  minWidth: { xs: '70%', sm: '20px', md: '20px' },
                  backgroundColor: 'white',
                  borderRadius: '4px'
                }}
              >
                <MenuItem value='all'>
                  <Typography>All Meal groups</Typography>
                </MenuItem>
                {groupList.map(item => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.group_name}
                  </MenuItem>
                ))}
              </Select>
            )}
          </Box>
        )}
        <Grid
          sx={{
            mx: { xs: 1, sm: 3, md: 2 },
            mb: 5,
            pb: { xs: 0, sm: 5 }
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {(() => {
                const dataRows = status === 'mealgroup' ? GroupindexedRows : indexedRows
                if (!dataRows || dataRows.length === 0) {
                  return (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                      <Typography
                        sx={{
                          color: 'text.secondary',
                          fontSize: '16px'
                        }}
                      >
                        No record found
                      </Typography>
                    </Box>
                  )
                }

                return (
                  <CommonTable
                    onRowClick={status === 'mealgroup' ? handleView : undefined}
                    indexedRows={dataRows}
                    total={total}
                    handleSortModel={''}
                    columns={status === 'mealgroup' ? groupcolumns : columns}
                    paginationModel={paginationModel}
                    setPaginationModel={setPaginationModel}
                    loading={loading}
                    searchValue={''}
                  />
                )
              })()}
            </>
          )}

          <Dialog open={openDeleteEnclosureDialog} onClose={cancelEnclosureDialog}>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogContent>Are you sure you want to remove the enclosure?</DialogContent>
            <DialogActions>
              <Button onClick={cancelEnclosureDialog} color='primary'>
                Cancel
              </Button>
              <Button onClick={confirmEnclosureDelete} color='error' variant='contained'>
                Delete
              </Button>
            </DialogActions>
          </Dialog>

          {status === 'mealgroup' && (
            <Dialog open={openDeleteDialog} onClose={handleCloseDialog}>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogContent>Are you sure you want to delete this group?</DialogContent>
              <DialogActions>
                <Button onClick={handleCloseDialog} color='primary'>
                  Cancel
                </Button>
                <Button onClick={handleConfirmDelete} color='error' variant='contained'>
                  Delete
                </Button>
              </DialogActions>
            </Dialog>
          )}
        </Grid>
      </Card>

      {/* Footer Card */}
      {status !== 'mealgroup' && (
        <FixedFooterWrapper>
          <Box
            sx={{
              p: { xs: 2, sm: 4 }
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mx: 'auto',
                flexWrap: 'wrap'
              }}
            >
              {checkedRows?.length > 0 ? <FooterCard count={checkedRows.length} /> : <Box />}

              <Box
                sx={{
                  display: 'flex',
                  gap: 3,
                  ml: { xs: 0, sm: 25 },
                  mr: { xs: 10, sm: 0 },
                  justifyContent: { xs: 'center', sm: 'center', md: 'flex-end' }
                }}
              >
                <Button
                  disabled={checkedRows?.length <= 0}
                  onClick={() => setCheckedRows([])}
                  sx={{
                    width: { xs: '100%', sm: '160px' },
                    height: '56px',
                    borderRadius: '4px',
                    color: theme.palette.customColors.OnSurfaceVariant,
                    borderColor: theme.palette.customColors.Outline,
                    '&:hover': {
                      borderColor: theme.palette.customColors.Outline,
                      backgroundColor: 'transparent'
                    }
                  }}
                  variant='outlined'
                >
                  Cancel
                </Button>

                <Button
                  disabled={checkedRows?.length <= 0}
                  onClick={status === 'mapped' ? removeEnclosure : addEnclosure}
                  sx={{
                    width: { xs: '100%', sm: status === 'mapped' ? '220px' : '160px' },
                    borderRadius: '4px',
                    height: '56px',
                    color: theme.palette.primary.main,
                    borderColor: theme.palette.primary.main
                  }}
                  variant='outlined'
                >
                  {status === 'mapped' ? 'Remove From Group' : 'Add to Group'}
                </Button>

                {status === 'unmapped' && (
                  <Button
                    disabled={checkedRows?.length <= 0}
                    onClick={e => addEventSidebarOpen(e)}
                    variant='contained'
                    sx={{
                      backgroundColor: theme.palette.primary.main,
                      borderRadius: '4px',
                      width: { xs: '100%', sm: '160px' },
                      height: '56px',
                      '&:hover': {
                        borderColor: theme.palette.primary.main
                      }
                    }}
                  >
                    Create New
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        </FixedFooterWrapper>
      )}

      {openDrawer && (
        <CreateMealGroup
          openDrawer={openDrawer}
          handleCloseSideBar={handleCloseSideBar}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          originalItems={originalItems}
          setOriginalItems={setOriginalItems}
          checkedRows={checkedRows}
          setCheckedRows={setCheckedRows}
          mealType={mealType}
          selectedOption={selectedOption}
          editParam={editParam}
          editeditems={editeditems}
          setEditItems={setEditItems}
          loader={Loader}
          fetchEnclosure={fetchEnclosure}
          siteStats={siteStats}
          setStatus={setStatus}
          searchValue={searchValue}
          groupId={groupId}
          mealId={mealId}
          handleEditSearch={handleEditSearch}
        />
      )}
      {enclosureDrawer && (
        <CreateEnclosure
          enclosureDrawer={enclosureDrawer}
          setSelectedItems={setSelectedItems}
          selectedItems={selectedItems}
          setEnclosureDrawer={setEnclosureDrawer}
          selectedOption={selectedOption}
          groupId={groupId}
          setGroupId={setGroupId}
          loader={Loader}
          selectedForDrawer={selectedForDrawer}
          fetchEnclosure={fetchEnclosure}
          checkedRows={checkedRows}
          setStatus={setStatus}
          setCheckedRows={setCheckedRows}
          fetchSiteStats={fetchSiteStats}
          setEditItems={setEditItems}
          editSearchValue={editSearchValue}
          handleEnclosureSearch={handleEnclosureSearch}
        />
      )}
      {addEnclosureDrawer && (
        <AddEnclosureToGroup
          addEnclosureDrawer={addEnclosureDrawer}
          setSelectedItems={setSelectedItems}
          selectedItems={selectedItems}
          setAddEnclosureDrawer={setAddEnclosureDrawer}
          selectedOption={selectedOption}
          groupId={groupId}
          setGroupId={setGroupId}
          siteStats={siteStats}
          loader={Loader}
          selectedForDrawer={selectedForDrawer}
          fetchEnclosure={fetchEnclosure}
          checkedRows={checkedRows}
          setStatus={setStatus}
          setCheckedRows={setCheckedRows}
          fetchSiteStats={fetchSiteStats}
          setEditItems={setEditItems}
          editSearchValue={editSearchValue}
          handleEnclosureSearch={handleEnclosureSearch}
        />
      )}
    </React.Fragment>
  ) : (
    <Error404 />
  )
}

export default MealGroup
