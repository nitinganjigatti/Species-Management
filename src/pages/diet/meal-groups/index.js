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
  DialogContent
} from '@mui/material'
import { fontSize, fontWeight, textAlign } from '@mui/system'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import Icon from 'src/@core/components/icon'
import { AuthContext } from 'src/context/AuthContext'
import {
  getEnclosureList,
  getEnclosureListByGroup,
  getMealGroupList,
  getMealGroupStats,
  getSectionList,
  getSpeciesList,
  removeMealGroup
} from 'src/lib/api/diet/mealgroup'
import { useTheme } from '@emotion/react'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { useRouter } from 'next/router'
import CreateMealGroup from 'src/views/pages/diet/mealGroup/creategroup'
import toast from 'react-hot-toast'
import CreateEnclosure from 'src/views/pages/diet/mealGroup/createEnclosure'
import { debounce } from 'lodash'

const MealGroup = () => {
  const router = useRouter()
  const authData = useContext(AuthContext)
  const theme = useTheme()
  const firstSite = authData?.userData?.user?.zoos[0]?.sites?.[0] || null

  const [defaultSite, setDefaultSite] = useState(firstSite)
  const [selectedOption, setSelectedOption] = useState(firstSite?.site_id || '')
  const [status, setStatus] = useState('unmapped')
  const [openDrawer, setOpenDrawer] = useState(false)
  const [enclosureList, setEnclosureList] = useState([])
  const [menuGroupList, setMenuGroupList] = useState([])
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [groupId, setGroupId] = useState(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [Loader, setLoader] = useState(false)
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10
  })
  const [selectedItems, setSelectedItems] = useState([])
  const [enclosureDrawer, setEnclosureDrawer] = useState(false)
  const [editeditems, setEditItems] = useState([])
  const [siteStats, setSiteStats] = useState({
    meal_groups_count: '',
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

  console.log('Group >>', groupList)

  function loadServerRows(currentPage, data) {
    return data
  }

  const [checkedRows, setCheckedRows] = useState([])

  console.log('Checked >>', checkedRows, selectedItems)

  const handleSectionChange = event => {
    const value = event.target.value
    setSelectedSection(value) // value is string
  }

  const handleSpeciesChange = event => {
    const value = event.target.value
    setSelectedSpecies(value) // value is string
  }

  const handleGroupChange = event => {
    const value = event.target.value
    setSelectedGroup(value) // value is string
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

  // const fetchEnclosure = async () => {
  //   if (!selectedOption) return

  //   setLoading(true)

  //   if (status === '') {
  //     const groupparams = {
  //       site_id: selectedOption,
  //       page_no: paginationModel.page + 1
  //     }

  //     try {
  //       const response = await getMealGroupList(groupparams)
  //       if (response.success) {
  //         setMenuGroupList(loadServerRows(paginationModel.page, response?.data?.result))
  //         setTotal(response?.data?.count)
  //       } else {
  //         console.error('Failed to fetch meal groups:', response?.message || 'Unknown error')
  //       }
  //     } catch (error) {
  //       console.error('Error fetching meal groups:', error)
  //     } finally {
  //       setLoading(false)
  //     }

  //     return
  //   }

  //   const params = {
  //     type: status,
  //     // section_ids: JSON.stringify([selectedSection]),
  //     // species_ids: JSON.stringify(selectedSpecies),
  //     site_id: selectedOption,
  //     page_no: paginationModel.page + 1,
  //     limit: paginationModel.pageSize
  //   }

  //   try {
  //     const response = await getEnclosureList(params)
  //     if (response.success) {
  //       setEnclosureList(loadServerRows(paginationModel.page, response?.data?.result))
  //       setTotal(response?.data?.count)
  //     } else {
  //       console.error('Failed to fetch enclosures:', response?.message || 'Unknown error')
  //     }
  //   } catch (error) {
  //     console.error('Error fetching enclosures:', error)
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  const fetchEnclosure = async q => {
    debugger
    if (!selectedOption) return

    setLoading(true)

    if (status === '') {
      const groupparams = {
        site_id: selectedOption,
        page_no: paginationModel.page + 1
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

    // Build params conditionally
    const params = {
      type: status,
      q,
      site_id: selectedOption,
      page_no: paginationModel.page + 1,
      limit: paginationModel.pageSize
    }

    // Add section_ids only if selectedSection is NOT ['all']
    if (selectedSection !== 'all') {
      params.section_ids = JSON.stringify([selectedSection])
    }

    if (selectedSpecies !== 'all') {
      params.species_ids = JSON.stringify([selectedSpecies])
    }
    if (selectedGroup !== 'all') {
      params.meal_group_ids = JSON.stringify([selectedGroup])
    }
    // If you have species_ids or other filters, add them similarly
    // if (selectedSpecies.length > 0) {
    //   params.species_ids = JSON.stringify(selectedSpecies)
    // }

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
      debugger
      setSearchValue(q)
      setPaginationModel({ page: 0, pageSize: 10 })
      try {
        await fetchEnclosure({
          q: q,
          page_no: paginationModel.page, // reset page to 0 explicitly here
          limit: paginationModel.pageSize // reset limit explicitly here
        })
      } catch (err) {
        console.log(err)
      }
    }, 1000),
    [] // add dependencies you want to track here
  )

  const handleSearch = value => {
    debugger
    setSearchValue(value)
    debouncedSearch(value)
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
    debugger
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
    debugger
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
  }, [selectedOption, status, selectedSection, selectedSpecies, selectedGroup])

  // useEffect(() => {
  //   const fetchEnclosure = async () => {
  //     if (!selectedOption) return

  //     setLoading(true)

  //     if (status === '') {
  //       // If status is empty string, call the group list API
  //       const groupparams = {
  //         site_id: selectedOption,
  //         page_no: paginationModel.page + 1 // make it consistent with below
  //       }

  //       try {
  //         const response = await getMealGroupList(groupparams)
  //         if (response.success) {
  //           debugger
  //           setMenuGroupList(loadServerRows(paginationModel.page, response?.data?.result))
  //           setTotal(response?.data?.count)
  //         } else {
  //           console.error('Failed to fetch meal groups:', response?.message || 'Unknown error')
  //         }
  //       } catch (error) {
  //         console.error('Error fetching meal groups:', error)
  //       } finally {
  //         setLoading(false)
  //       }

  //       return
  //     }

  //     // If status is not empty string, call the enclosure list API
  //     const params = {
  //       type: status,
  //       site_id: selectedOption,
  //       page_no: paginationModel.page + 1,
  //       limit: paginationModel.pageSize
  //     }

  //     try {
  //       const response = await getEnclosureList(params)
  //       if (response.success) {
  //         console.log('Enclosure list response >', response?.data?.result)
  //         setEnclosureList(loadServerRows(paginationModel.page, response?.data?.result))
  //         setTotal(response?.data?.count)
  //       } else {
  //         console.error('Failed to fetch enclosures:', response?.message || 'Unknown error')
  //       }
  //     } catch (error) {
  //       console.error('Error fetching enclosures:', error)
  //     } finally {
  //       setLoading(false)
  //     }
  //   }

  //   fetchEnclosure()
  // }, [selectedOption, paginationModel, status])

  const StatCard = ({ value, label, bgColor, textColor }) => (
    <Card
      sx={{
        backgroundColor: bgColor,
        color: textColor || '#000',
        width: '154px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'none',
        px: 2,
        py: 1
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography
          variant='subtitle1'
          sx={{ fontWeight: 600, fontFamily: 'Inter', fontSize: '16px', color: textColor }}
        >
          {value}
        </Typography>
        <Typography
          variant='caption'
          sx={{ mt: 0.5, fontSize: '14px', fontFamily: 'Inter', fontWeight: 500, color: '#44544A' }}
        >
          {label}
        </Typography>
      </Box>
    </Card>
  )

  const FooterCard = ({ count }) => {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 3,
          py: 2,
          backgroundColor: '#fff'
        }}
      >
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter',
            color: '#44544A',
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
            backgroundColor: '#E8F4F2',
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
              color: '#2B7350',
              fontFamily: 'Inter'
            }}
          >
            Enclosures - {count}
          </Typography>
        </Card>
      </Box>
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
  }

  const handleEnclosureEvent = async id => {
    debugger
    try {
      setEnclosureDrawer(true)
      setLoader(true)
      setGroupId(id)

      const params = {
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

  const handleRemove = id => {
    debugger
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
      }
    } catch (error) {
      toast.error('something went wrong')
      console.error('Failed to delete group:', error)
    } finally {
      handleCloseDialog()
    }
  }

  const handleEdit = async row => {
    console.log('Row Detail >', row)
    try {
      setEditParam(row) // 👈 set the full row object
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

  const groupcolumns = [
    {
      flex: 0.2,
      width: 20,
      field: 'group_name',
      headerName: 'Meal Group Name ',
      headerAlign: 'center',
      align: 'center',
      renderHeader: () => (
        <Box display='flex' alignItems='center' justifyContent='start' gap={1}>
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
          textAlign='center'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '16px',
            fontWeight: 500,
            color: '#44544A',
            fontFamily: 'Inter'
          }}
        >
          {params.row.group_name}
        </Typography>
      )
    },
    {
      flex: 0.2,
      width: 20,
      field: 'enclosure_count',
      type: 'number',
      headerName: 'Enclosures',
      headerAlign: 'center',
      align: 'center',
      renderHeader: () => (
        <Box display='flex' alignItems='center' justifyContent='start' gap={1}>
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
            Enclosures
          </Typography>
        </Box>
      ),
      renderCell: params => (
        <Typography
          variant='body2'
          textAlign='center'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '16px',
            color: '#44544A',
            fontWeight: 400,
            fontFamily: 'Inter'
          }}
        >
          {params.row.enclosure_count ?? 0}
        </Typography>
      )
    },
    {
      flex: 0.2,
      width: 20,
      field: 'species_count',
      type: 'number',
      headerName: 'Species',
      headerAlign: 'center',
      align: 'center',
      renderHeader: () => (
        <Box display='flex' alignItems='center' justifyContent='start' gap={1}>
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
            SPECIES
          </Typography>
        </Box>
      ),
      renderCell: params => (
        <Typography
          variant='body2'
          textAlign='center'
          sx={{
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
      flex: 0.2,
      width: 20,
      field: 'animal_count',
      headerName: 'Animals',
      headerAlign: 'center',
      align: 'center',
      renderHeader: () => (
        <Box display='flex' alignItems='center' justifyContent='start' gap={1}>
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
          textAlign='center'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
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
      flex: 0.2,
      width: 20,
      field: 'actions', // Give a unique field name
      headerAlign: 'center',
      align: 'center',
      renderHeader: () => <></>, // No header
      renderCell: params => (
        console.log('Params ', params),
        (
          <Box display='flex'>
            <Button
              sx={{ borderColor: '#37BD69 ', color: '#37BD69', borderRadius: '4px', mr: 2 }}
              variant='outlined'
              onClick={() => handleEnclosureEvent(params.row.id)}
            >
              Add Enclosure
            </Button>
            <IconButton
              onClick={() => handleEdit(params.row)}
              size='small'
              sx={{ color: theme.palette.primary.light, mr: 3 }}
            >
              <Icon icon='mdi:pencil-outline' fontSize={24} />
            </IconButton>
            <IconButton
              onClick={() => handleRemove(params.row.id)} // ✅ correc
              size='small'
              sx={{ color: theme.palette.primary.light, mr: 4 }}
              t
            >
              <Icon icon='mdi:close' fontSize={24} />
            </IconButton>
          </Box>
        )
      )
    }
  ]

  const columns = [
    {
      flex: 0.2,
      width: 150,
      field: 'user_enclosure_name',
      headerName: 'Enclosure Name',
      headerAlign: 'left',
      align: 'left',
      renderHeader: () => (
        <Box display='flex' alignItems='center' justifyContent='start' gap={1}>
          <Checkbox
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
        <Box sx={{ ml: 2 }} display='flex' alignItems='center' justifyContent='start' gap={1} width='100%'>
          <Checkbox
            size='small'
            checked={checkedRows.includes(params.row.enclosure_id)}
            onChange={e => handleCheckboxChange(e, params.row)}
          />
          <Typography
            variant='body2'
            sx={{
              fontSize: '16px',
              fontFamily: 'Inter',
              fontWeight: 500,
              color: '#44544A',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {params.row.user_enclosure_name}
          </Typography>
        </Box>
      )
    },

    {
      flex: 0.2,
      width: 20,
      field: 'section_name',
      headerName: 'Section ',
      headerAlign: 'center',
      align: 'center',
      renderHeader: () => (
        <Box display='flex' alignItems='center' justifyContent='start' gap={1}>
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
            Section
          </Typography>
        </Box>
      ),
      renderCell: params => (
        <Typography
          variant='body2'
          textAlign='center'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '16px',
            fontWeight: 400,
            color: '#44544A',
            fontFamily: 'Inter'
          }}
        >
          {params.row.section_name}
        </Typography>
      )
    },
    {
      flex: 0.2,
      width: 20,
      field: 'species_count',
      type: 'number',
      headerName: 'Species',
      headerAlign: 'center',
      align: 'center',
      renderHeader: () => (
        <Box display='flex' alignItems='center' justifyContent='start' gap={1}>
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
            SPECIES
          </Typography>
        </Box>
      ),
      renderCell: params => (
        <Typography
          variant='body2'
          textAlign='center'
          sx={{
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
      flex: 0.2,
      width: 20,
      field: 'animal_count',
      headerName: 'Animals',
      headerAlign: 'center',
      align: 'center',
      renderHeader: () => (
        <Box display='flex' alignItems='center' justifyContent='start' gap={1}>
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
          textAlign='center'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
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
      flex: 0.2,
      width: 20,
      field: 'group_name',
      headerName: 'Meal Group Name',
      headerAlign: 'center',
      align: 'center',
      renderHeader: () => (
        <Box display='flex' alignItems='center' justifyContent='start' gap={1}>
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
            MEAL Group Name
          </Typography>
        </Box>
      ),
      renderCell: params => (
        <Typography
          variant='body2'
          textAlign='center'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {params.row.group_name ? (
            params.row.group_name
          ) : (
            <Typography sx={{ fontSize: '16px', fontFamily: 'Inter', fontWeight: 500, color: '#FA6140' }}>
              Not assigned
            </Typography>
          )}
        </Typography>
      )
    },

    {
      flex: 0.2,
      width: 20,
      field: 'actions', // Give a unique field name
      headerAlign: 'center',
      align: 'center',
      renderHeader: () => <></>, // No header
      renderCell: params => (
        <img src='/images/Vector.png' alt='action-icon' width={22} height={14} style={{ color: '#7A8684' }} />
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
      setSelectedOption(null) // or pass null if your API handles it
    } else {
      setDefaultSite(site)
      setSelectedOption(site.site_id)
    }
  }

  const addEventSidebarOpen = () => {
    console.log('Edit >>', editParam)
    setEditParam({})
    setOpenDrawer(true)
  }

  const handleCloseSideBar = () => {
    setOpenDrawer(false)
  }

  return (
    <React.Fragment>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography color='inherit'>Diet</Typography>
        <Typography color='inherit' sx={{ cursor: 'pointer' }} onClick={() => router.back()}>
          Meal groups
        </Typography>
      </Breadcrumbs>
      {/* Header Card */}
      <Card sx={{ p: 3, boxShadow: 'none' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderRadius: 2,
            padding: 2,
            gap: 2
          }}
        >
          <Box>
            <Box sx={{ display: 'flex' }}>
              <Box>
                <Typography
                  variant='body1'
                  sx={{ fontWeight: 500, mt: 2, fontSize: '24px', fontFamily: 'Inter', color: '#44544A' }}
                >
                  Meal group for the site -
                </Typography>
              </Box>
              <Box sx={{ ml: 4 }}>
                <Autocomplete
                  sx={{
                    width: '276px',
                    height: '50px',
                    borderRadius: '8px',
                    mt: 0,
                    '& .MuiInputBase-input': {
                      color: '#fff' // White text inside the input
                    },
                    '& .MuiAutocomplete-listbox': {
                      color: '#fff' // White text in dropdown options
                    }
                  }}
                  name='site_id'
                  value={defaultSite}
                  disablePortal
                  id='site_id'
                  options={authData?.userData?.user?.zoos?.[0]?.sites || []}
                  getOptionLabel={option => option?.site_name || ''}
                  isOptionEqualToValue={(option, value) => option?.site_id === value?.site_id}
                  onChange={(e, val) => handleSiteChange(val)}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label='' // Remove label at the top
                      placeholder='Search & Select'
                      sx={{
                        backgroundColor: '#59b66f',
                        borderRadius: '8px',
                        '& .MuiInputBase-input': {
                          color: '#fff' // White text in input
                        }
                      }}
                      InputLabelProps={{ shrink: false }} // Prevent label from floating
                    />
                  )}
                />
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 3 }}>
            <StatCard value={siteStats?.total_enclosures} label='Enclosures' bgColor='#EFF5F2' />
            <StatCard value={siteStats?.total_species} label='Species' bgColor='#E1F9ED' />
            <StatCard value={siteStats?.total_animals} label='Animals' bgColor='#FFBDA84D' textColor='#FA6140' />
          </Box>
        </Box>
      </Card>

      {/* Main Card */}
      <Card sx={{ mt: 5, p: 4, boxShadow: 'none' }}>
        <Grid>
          <TabContext value={status}>
            <Box>
              <TabList onChange={handleChange}>
                <Tab
                  value='unmapped'
                  label={<TabBadge label={`Enclosures not mapped - ${siteStats?.unmapped_enclosures}`} />}
                />
                <Tab value='mapped' label={<TabBadge label={`Enclosures mapped -${siteStats?.mapped_enclosures}`} />} />
                <Tab value='' label={<TabBadge label={`Meal group -${siteStats?.meal_groups_count}`} />} />
              </TabList>

              {/* Divider only below TabList, not full width */}
              <Divider
                sx={{
                  width: '680px', // Or fixed width like '300px'
                  borderBottomWidth: '3px',
                  mt: -0.5,
                  // marginTop: '1px',
                  ml: 1 // Optional: aligns with tabs
                }}
              />
            </Box>

            {/* Uncomment if needed */}
            <TabPanel value='unmapped'>{''}</TabPanel>
            <TabPanel value='mapped'>{''}</TabPanel>
            <TabPanel value=''>{''}</TabPanel>
          </TabContext>
        </Grid>

        {status !== '' && (
          <Box
            sx={{
              mt: 4,
              display: 'flex',
              gap: 4,
              padding: 2,
              borderRadius: 2,
              alignItems: 'center',
              flexWrap: 'wrap'
            }}
          >
            {/* Search Input */}
            <TextField
              placeholder='Search'
              size='small'
              value={searchValue}
              onChange={e => handleSearch(e.target.value)}
              variant='outlined'
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <Icon icon='mi:search' />
                  </InputAdornment>
                )
              }}
              sx={{
                width: '445px',
                height: '40px',
                backgroundColor: 'white'
              }}
            />
            {/* Dropdowns */}

            <Select
              value={selectedSection}
              onChange={handleSectionChange}
              displayEmpty
              renderValue={selected => {
                if (selected === 'all') {
                  return <Typography>All Sections</Typography>
                }
                const selectedItem = sectionList.find(item => item.section_id === selected)
                return selectedItem?.section_name || ''
              }}
              size='small'
              sx={{ backgroundColor: 'white', width: '280px', borderRadius: '4px' }}
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

            <Select
              value={selectedSpecies}
              onChange={handleSpeciesChange}
              displayEmpty
              renderValue={selected => {
                if (selected === 'all') {
                  return <Typography>All Species</Typography>
                }
                const selectedItem = speciesList.find(item => item.species_id === selected)
                return `${selectedItem.common_name}(${selectedItem.scientific_name})` || ''
              }}
              size='small'
              sx={{ backgroundColor: 'white', width: '280px', borderRadius: '4px' }}
            >
              <MenuItem value='all'>
                <Typography>All Species</Typography>
              </MenuItem>
              {speciesList.map(item => (
                <MenuItem key={item.species_id} value={item.species_id}>
                  {`${item.common_name}(${item.scientific_name})`}
                </MenuItem>
              ))}
            </Select>
            {/* 
            <Select
              value={''}
              onChange={''}
              displayEmpty
              size='small'
              sx={{ backgroundColor: 'white', minWidth: '280px', borderRadius: '4px' }}
            >
              <MenuItem value=''>All Meal groups</MenuItem>
              <MenuItem value='R & R'>R & R</MenuItem>
              <MenuItem value='Herbivores'>Herbivores</MenuItem>
            </Select> */}

            <Select
              value={selectedGroup}
              onChange={handleGroupChange}
              displayEmpty
              renderValue={selected => {
                if (selected === 'all') {
                  return <Typography>All Meal groups</Typography>
                }
                const selectedItem = groupList.find(item => item.id === selected)
                return selectedItem?.group_name || ''
              }}
              size='small'
              sx={{ backgroundColor: 'white', width: '280px', borderRadius: '4px' }}
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
          </Box>
        )}

        {status === '' ? (
          <Grid
            sx={{
              mx: { xs: 3, md: 2 }
              // mt: { xs:3 }
            }}
          >
            <CommonTable
              onRowClick={''}
              indexedRows={GroupindexedRows}
              total={total}
              handleSortModel={''}
              columns={groupcolumns}
              paginationModel={paginationModel}
              setPaginationModel={setPaginationModel}
              loading={loading}
              searchValue={''}
            />
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
          </Grid>
        ) : (
          <Grid
            sx={{
              mx: { xs: 3, md: 2 }
              // mt: { xs:3 }
            }}
          >
            <CommonTable
              onRowClick={''}
              indexedRows={indexedRows}
              total={total}
              handleSortModel={''}
              columns={columns}
              paginationModel={paginationModel}
              setPaginationModel={setPaginationModel}
              loading={loading}
              searchValue={''}
            />
          </Grid>
        )}
      </Card>

      {/* Footer Card */}

      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          width: '1393px',
          borderRadius: '4px',
          backgroundColor: 'white',
          zIndex: 900, // stays above most content
          p: 4
        }}
      >
        <Box display='flex' justifyContent='space-between' alignItems='center' mx='auto'>
          <FooterCard count={checkedRows.length} />

          <Box display='flex' gap={3} sx={{ mr: 2 }}>
            <Button
              disabled={checkedRows?.length <= 0}
              sx={{
                width: '160px',
                height: '56px',
                borderRadius: '4px',
                color: '#44544A', // Text color
                borderColor: '#839D8D', // Outline border color
                '&:hover': {
                  borderColor: '#839D8D', // Maintain border color on hover
                  backgroundColor: 'transparent' // Optional: keep hover bg clean
                }
              }}
              variant='outlined'
            >
              Cancel
            </Button>
            <Button
              disabled={checkedRows?.length <= 0}
              sx={{
                width: status === 'mapped' ? '220px' : '170px',
                borderRadius: '4px',
                height: '56px',
                color: '#37BD69', // Text color
                borderColor: '#37BD69' // Outline border color
              }}
              variant='outlined'
            >
              {status === 'mapped' ? 'Remove From Group' : 'Add to Group'}
            </Button>
            <Button
              disabled={checkedRows?.length <= 0}
              onClick={() => addEventSidebarOpen()}
              variant='contained'
              // disabled={!checkedRows.length > 0}
              sx={{
                backgroundColor: '#37BD69',
                borderRadius: '4px',
                width: '160px',
                height: '56px',
                '&:hover': {
                  borderColor: '#37BD69' // Maintain border color on hover
                }
              }}
            >
              {status === 'mapped' ? 'Add to Group' : 'Create New'}
            </Button>
          </Box>
        </Box>
      </Box>

      {openDrawer && (
        <CreateMealGroup
          openDrawer={openDrawer}
          handleCloseSideBar={handleCloseSideBar}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          checkedRows={checkedRows}
          setCheckedRows={setCheckedRows}
          selectedOption={selectedOption}
          editParam={editParam}
          editeditems={editeditems}
          fetchEnclosure={fetchEnclosure}
          siteStats={siteStats}
        />
      )}
      {enclosureDrawer && (
        <CreateEnclosure
          enclosureDrawer={enclosureDrawer}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          setEnclosureDrawer={setEnclosureDrawer}
          selectedOption={selectedOption}
          groupId={groupId}
          loader={Loader}
          fetchEnclosure={fetchEnclosure}
        />
      )}
    </React.Fragment>
  )
}
export default MealGroup
