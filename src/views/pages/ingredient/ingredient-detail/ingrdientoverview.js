import {
  Autocomplete,
  Avatar,
  Button,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
  Typography,
  debounce
} from '@mui/material'
import SwapCallsIcon from '@mui/icons-material/SwapCalls'
import styled from '@emotion/styled'
import { Box } from '@mui/system'
import * as yup from 'yup'
import { Controller, useForm } from 'react-hook-form'
import { useCallback, useEffect, useState } from 'react'
import { yupResolver } from '@hookform/resolvers/yup'
import Icon from 'src/@core/components/icon'
import { getPreparationTypeList } from 'src/lib/api/diet/settings/preparationTypes'

const IngredientOverview = () => {
  const AutoComplete = styled(Autocomplete)`
    & .MuiInputBase-input {
      height: 5px;
    }
  `

  // Styled Grid component
  const StyledGrid = styled(Grid)(({ theme }) => ({
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    [theme.breakpoints.down('md')]: {
      borderBottom: `1px solid ${theme.palette.divider}`
    },
    [theme.breakpoints.up('md')]: {
      borderRight: `1px solid ${theme.palette.divider}`
    }
  }))

  const [options, setOptions] = useState([])
  const [sort, setSort] = useState('asc')
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('label')

  const defaultValues = {
    preprationTypes: []
  }

  const schema = yup.object().shape({
    preprationTypes: yup
      .array()
      .of(
        yup.object({
          id: yup.number().required(),
          label: yup.string().required()
        })
      )
      .min(1, 'At least one preparation type is required')
      .required('At least one preparation type is required')
  })

  useEffect(() => {
    getPreparationList(sort, searchValue, sortColumn)
  }, [])

  const getPreparationList = useCallback(async (sort, q, column) => {
    try {
      await getPreparationTypeList({ sort, q, limit: 10, column }).then(res => {
        setOptions(res?.data?.result)
      })
    } catch (e) {
      console.log(e)
    }
  }, [])

  const searchPreparationList = useCallback(
    debounce(async (sort, q, column) => {
      setSearchValue(q)
      try {
        await getPreparationTypeList(sort, q, column)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const {
    reset,
    control,
    setValue,
    watch,
    getValues,
    clearErrors,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  return (
    <>
      <Grid container>
        <Card>
          <form action=''>
            <StyledGrid item md={11}>
              <CardContent>
                <Grid item sx={{ display: 'flex' }}>
                  <Grid
                    item
                    sx={{
                      borderRadius: '6px',
                      border: '2px solid #e7f3ff',
                      margin: 'auto',
                      height: '64px',
                      mt: '30px',
                      ml: '30px'
                    }}
                  >
                    <img
                      src={
                        '/icons/icon_ingredient_fill.png' ||
                        'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg'
                      }
                      width={60}
                      height={60}
                    />
                  </Grid>
                  <Grid>
                    <Typography sx={{ m: 2, color: '#1F515B' }} variant='h5'>
                      Pineapple
                    </Typography>
                    <Typography sx={{ fontSize: '14px', m: 2, color: 'text.secondary' }}>Id - ING00001</Typography>
                    <Typography sx={{ fontSize: '14px', m: 1, ml: 2, mt: 3, color: 'text.secondary' }}>
                      Preparation Type
                    </Typography>
                  </Grid>
                  <Grid>
                    <Typography sx={{ fontSize: '14px', m: 2, mt: 12, ml: 0, color: 'text.secondary' }}>
                      Feed Type - Fruits
                    </Typography>

                    <FormControl sx={{ borderRadius: '3px', width: '140px', ml: 2 }}>
                      <Controller
                        name='preprationTypes'
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { value, onChange } }) => (
                          <AutoComplete
                            multiple
                            options={options?.length > 0 ? options : []}
                            getOptionLabel={option => option?.label}
                            id='preprationTypes'
                            isOptionEqualToValue={(option, value) => option?.id === value?.id}
                            onChange={(e, val) => {
                              onChange(val)
                            }}
                            filterSelectedOptions
                            value={value || []}
                            renderInput={params => (
                              <TextField
                                className='ll'
                                sx={{
                                  '& label': { top: '-8px' },
                                  '&:focus-within label': { top: '0px' }
                                }}
                                onChange={e => searchPreparationList(sort, e.target.value, sortColumn)}
                                {...params}
                                label='Select *'
                                placeholder='Select'
                              />
                            )}
                          />
                        )}
                      />
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
              <Grid sx={{ margin: 'auto', position: 'relative', left: '31px', top: 4 }}>
                <Icon style={{ transform: 'rotateY(180deg)' }} icon='akar-icons:arrow-repeat' fontSize={24} />
              </Grid>
            </StyledGrid>
          </form>
        </Card>
      </Grid>
    </>
  )
}

export default IngredientOverview
