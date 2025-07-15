import React, { useCallback, useEffect, useState } from 'react'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  FormControl,
  TextField,
  Drawer,
  IconButton,
  Select,
  MenuItem,
  InputLabel,
  FormHelperText,
  FormControlLabel,
  Checkbox,
  CardHeader,
  debounce,
  CardActions
} from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import Icon from 'src/@core/components/icon'
import { LoadingButton } from '@mui/lab'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { AddNote, getNotesList, getSubTypeList } from 'src/lib/api/notes'
import { AddButton } from 'src/components/Buttons'
import toast from 'react-hot-toast'
import { DataGrid } from '@mui/x-data-grid'
import TableBasic from 'src/views/table/data-grid/TableBasic'
import { useRouter } from 'next/router'
import CommonDialogBox from 'src/components/CommonDialogBox'
import ConfirmDialogBox from 'src/components/ConfirmDialogBox'
import SubTypeDetails from 'src/views/pages/notes/SubTypeDetails'
import FallbackSpinner from 'src/@core/components/spinner'

const Notes = () => {
  const editInitialValues = { id: null, type_name: '' }
  const [openDrawer, setOpenDrawer] = useState(false)
  const [noteValue, setNoteValue] = useState([])
  const [loader, setLoader] = useState(false)
  const [editParams, setEditParams] = useState(editInitialValues)
  const [modalOpen, setModalOpen] = useState(false)
  const [typeName, setTypeName] = useState('')
  const [subArr, setSubArr] = useState([])

  /***** Serverside pagination */
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('asc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('label')

  // const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(false)

  function loadServerRows(currentPage, data) {
    return data
  }

  const AddNotesSlideBar = ({ setNoteValue, noteValue, setOpenDrawer }) => {
    const onSubmit = async params => {
      console.log('Payload>>', editParams, params)
      var response
      if (editParams && editParams.type_name !== '') {
        const payload = {
          parent_id: editParams.id,
          type_name: params.type_name
        }
        response = await AddNote(payload)
      } else {
        response = await AddNote(params)
      }

      if (response.success) {
        const successMessage = editParams ? 'Note SubType is added Successfully' : 'Note is added Successfully'
        toast.success(successMessage)
        setOpenDrawer(false)
      } else {
        toast.error('Something went wrong')
      }
    }

    console.log('Notes >>>', noteValue)

    const schema = yup.object().shape({
      type_name: yup.string().required('Title is required')
    })

    const defaultValues = {
      type_name: ''
    }

    const {
      control,
      handleSubmit,
      formState: { errors }
    } = useForm({
      defaultValues,
      resolver: yupResolver(schema),
      mode: 'onBlur',
      reValidateMode: 'onChange'
    })

    console.log('Rows >>>', rows)

    return (
      <>
        <Drawer
          anchor='right'
          open={addEventSidebarOpen}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: ['100%', 400], transitionDuration: '1s' } }}
        >
          <Box
            className='sidebar-header'
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              backgroundColor: 'background.default',
              p: theme => theme.spacing(3, 3.255, 3, 5.255)
            }}
          >
            <Typography>{editParams.type_name ? `Add SubType Of - ${editParams.type_name}` : 'Add Notes'} </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size='small' onClick={handleSidebarClose} sx={{ color: 'text.primary' }}>
                <Icon icon='mdi:close' fontSize={20} />
              </IconButton>
            </Box>
          </Box>
          <Box className='sidebar-body' sx={{ p: theme => theme.spacing(5, 6) }}>
            <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
              <FormControl fullWidth sx={{ mb: 6 }}>
                <Controller
                  name='type_name'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      label={editParams.type_name ? 'SubType Title' : 'Notes Title*'}
                      value={value}
                      error={errors.type_name}
                      onChange={onChange}
                      placeholder='Notes Title'
                      name='type_name'
                    />
                  )}
                />
                {errors.type_name && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.type_name.message}</FormHelperText>
                )}
              </FormControl>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LoadingButton size='medium' type='submit' variant='contained'>
                  Submit
                </LoadingButton>
              </Box>
            </form>
          </Box>
        </Drawer>
      </>
    )
  }

  const handleSubType = (event, id, name) => {
    console.log('Types Values', id, name)
    event.stopPropagation()

    setEditParams({ id: id, type_name: name })
    setOpenDrawer(true)
    setModalOpen(false)
  }
  console.log('set >', editParams)

  const columns = [
    {
      flex: 0.4,
      minWidth: 20,
      field: 'Id',
      headerName: 'Id',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.id}
        </Typography>
      )
    },

    {
      flex: 0.4,
      minWidth: 20,
      field: 'type_name',
      headerName: 'Type Name',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.type_name}
        </Typography>
      )
    },

    {
      flex: 0.4,
      minWidth: 20,
      field: 'Action',
      headerName: 'Action',
      renderCell: params => (
        <>
          {
            <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right' }}>
              <Button
                variant='contained'
                size='small'
                onClick={e => handleSubType(e, params.row.id, params.row.type_name)}
              >
                Add SubType
              </Button>
            </Box>
          }
        </>
      )
    }
  ]

  const fetchTableData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getNotesList({ type: 'parent' })

      // setTotal(parseInt(res?.data?.total_count));
      setTotal(res?.data?.length)
      console.log(res.data, 'response>>>>>>>')
      setRows(res?.data)
    } catch (error) {
      console.error(error)
    }
    setLoading(false)
  }, [currentPage, pageSize, searchValue])

  const handlePageChange = newPage => {
    setCurrentPage(newPage)
  }

  const handlePageSizeChange = newPageSize => {
    setPageSize(newPageSize)
  }

  const handleSearch = value => {
    setSearchValue(value)
    setCurrentPage(1) // Reset page to 1 when searching
  }

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      fetchTableData(newModel[0].sort, searchValue, newModel[0].field)
    } else {
      // setSort('asc')
      // setSortColumn('label')
    }
  }

  const addEventSidebarOpen = () => {
    setEditParams({ parent_id: null, type_name: '' })
    setOpenDrawer(true)
  }

  const handleSidebarClose = () => {
    setOpenDrawer(false)
  }

  useEffect(() => {
    fetchTableData(sort, searchValue, sortColumn)
  }, [fetchTableData])

  const searchTableData = useCallback(
    debounce(async (sort, q, column) => {
      setSearchValue(q)
      try {
        await fetchTableData(sort, q, column)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  // const handleSearch = value => {
  //   setSearchValue(value)
  //   searchTableData(sort, value, sortColumn)
  // }

  const getSlNo = index => (currentPage - 1) * pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const handleRowClick = async params => {
    try {
      const response = await getSubTypeList(params.id)
      setSubArr(response.data)
      setModalOpen(true)
      setTypeName(params.type_name)

      return response
    } catch (error) {
      console.error('Error fetching subtype list:', error)
      toast.error('Something went wrong')

      return null
    }
  }

  // const handleCheckBox = (e, title, noteType) => {
  //   const isChecked = e.target.checked;

  //   // Find if the title already exists in selectedCheckbox array
  //   const titleIndex = selectedCheckbox.findIndex(item => item.title === title);

  //   // If the title exists
  //   if (titleIndex !== -1) {
  //     const titleObj = { ...selectedCheckbox[titleIndex] };

  //     // Update the selected noteType
  //     if (isChecked) {
  //       // Only allow one noteType to be selected at a time
  //       titleObj.selectedCheckboxes = [noteType];
  //     } else {
  //       titleObj.selectedCheckboxes = [];
  //     }

  //     // Update the state
  //     setSelectedCheckbox(prevState => {
  //       const newState = [...prevState];
  //       newState[titleIndex] = titleObj;
  //       return newState;
  //     });
  //   } else {
  //     // If the title does not exist, create a new entry
  //     setSelectedCheckbox(prevState => {
  //       const newState = [
  //         ...prevState,
  //         {
  //           title: title,
  //           selectedCheckboxes: isChecked ? [noteType] : []
  //         }
  //       ];
  //       return newState;
  //     });
  //   }
  // };

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          <Card>
            <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Grid>
                <CardHeader title='Notes' />
              </Grid>
              <Grid>
                <CardActions>
                  <Button
                    sx={{ mt: 2 }}
                    onClick={() => addEventSidebarOpen()}
                    variant='contained'
                    size='small'
                    color='primary'
                  >
                    Add New Note
                  </Button>
                </CardActions>
              </Grid>
            </Grid>

            <CardContent>
              <Box>
                <TableBasic
                  columns={columns}
                  rows={rows}
                  onRowClick={params => handleRowClick(params.row)}
                ></TableBasic>
              </Box>
            </CardContent>
            {modalOpen && (
              <CommonDialogBox
                title={`Details -${typeName}`}
                dialogBoxStatus={open}
                close={() => setModalOpen(false)}
                formComponent={<SubTypeDetails subArr={subArr} />}
              />
            )}
          </Card>
          {openDrawer && (
            <AddNotesSlideBar
              drawerWidth={400}
              addEventSidebarOpen={openDrawer}
              handleSidebarClose={handleSidebarClose}
              setNoteValue={setNoteValue}
              noteValue={noteValue}
              setOpenDrawer={setOpenDrawer}
              editParams={editParams}
            />
          )}
        </>
      )}
    </>
  )
}

export default Notes
