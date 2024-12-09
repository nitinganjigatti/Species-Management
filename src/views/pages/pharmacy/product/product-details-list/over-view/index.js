import React, { useState } from 'react'
import {
  Box,
  Typography,
  Grid,
  Divider,
  Avatar,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  List,
  ListItem,
  ListItemText,
  CardHeader,
  Drawer,
  TextField,
  Autocomplete
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import InfoIcon from '@mui/icons-material/Info'
import CommonDrawerBox from 'src/components/CommonDrawerBox'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import { Controller, useForm } from 'react-hook-form'
import IconButton from '@mui/material/IconButton'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import ProductsChart from 'src/components/pharmacy/medicine/ProductsChart'
import StyleWithIconCardComponent from 'src/views/utility/style-with-icon-card'

const validationSchema = yup.object().shape({
  alternatives: yup.array().of(
    yup.object().shape({
      productName: yup.string().required('Product Name is required'),
      manufacturerName: yup
        .string()
        .min(3, 'Manufacturer Name must be at least 3 characters')
        .required('Manufacturer Name is required')
    })
  )
})

const Overview = ({ productDetails }) => {
  const medicines = [
    {
      name: 'Genimol 650 Tablet',
      manufacturer: 'Geneda Pharma'
    },
    {
      name: 'Duramol Advanced Tablet',
      manufacturer: 'Makers Laboratories Ltd'
    },
    {
      name: 'Calpol 650 + Tablet',
      manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd'
    },
    {
      name: 'Opara Semi Tablet',
      manufacturer: '10 tablets'
    },
    {
      name: 'Pyregesic 650mg Tablet',
      manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd'
    },
    {
      name: 'Calpol 650 + Tablet',
      manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd'
    },
    {
      name: 'Pyregesic 650mg Tablet',
      manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd'
    },
    {
      name: 'Genimol 650 Tablet',
      manufacturer: 'Geneda Pharma'
    },
    {
      name: 'Pyregesic 650mg Tablet',
      manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd'
    },
    {
      name: 'Calpol 650 + Tablet',
      manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd'
    }
  ]

  const [isAlternativeMedicinesDrawerOpen, setAlternativeMedicinesDrawerOpen] = useState(false)
  const [addMedicinesDrawerOpen, setAddMedicinesDrawerOpen] = useState(false)

  const centralPharmacyContent = (
    <>
      {/* Central Pharmacy Section */}
      <Box
        padding='16px'
        backgroundColor='#FFFFFF'
        borderRadius='8px'
        marginBottom={2}
        boxShadow='0px 4px 8px rgba(0, 0, 0, 0.1)'
      >
        <Typography
          variant='subtitle1'
          sx={{ color: 'customColors.customHeadingTextColor', fontWeight: 600, fontSize: '16px' }}
        >
          Central Pharmacy
        </Typography>
        <Typography variant='body1' component='div'>
          <Typography
            component='span'
            sx={{ color: 'customColors.neutralSecondary', fontSize: '14px', fontWeight: 400 }}
          >
            Total Quantity:
          </Typography>
          <Typography
            component='span'
            sx={{ color: 'customColors.customHeadingTextColor', fontWeight: 600, fontSize: '16px', ml: 1 }}
          >
            2300
          </Typography>
        </Typography>{' '}
      </Box>

      {/* Table Section */}
      <Card sx={{ p: 4 }}>
        <Typography
          variant='subtitle1'
          marginBottom={2}
          sx={{ color: 'customColors.customHeadingTextColor', fontWeight: 500, fontSize: '14px' }}
        >
          Other Pharmacy Quantity Details
        </Typography>
        <Card
          sx={{
            // m: 6,
            border: '1px solid',
            borderColor: 'customColors.customTableBorderBg',
            boxShadow: 'none'
          }}
        >
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ borderColor: 'customColors.customTableBorderBg' }}>
                <TableRow sx={{ backgroundColor: '#AFEFEB99', padding: '4px 8px' }}>
                  <TableCell sx={{ p: '6px' }}>Store Name</TableCell>
                  <TableCell sx={{ p: '6px' }}>Quantity in Store</TableCell>
                </TableRow>
              </TableHead>
              <TableBody sx={{ borderColor: 'customColors.customTableBorderBg' }}>
                {[
                  { storeName: 'ABC Medicals', quantity: 123 },
                  { storeName: 'Lset Pharmacy', quantity: 430 },
                  { storeName: 'Capital Store', quantity: 78 },
                  { storeName: '123 Pharmacy', quantity: 231 }
                ].map(pharmacy => (
                  <TableRow key={pharmacy.storeName}>
                    <TableCell>{pharmacy.storeName}</TableCell>
                    <TableCell>{pharmacy.quantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Card>
    </>
  )

  const expireContent = (
    <>
      <Card
        sx={{
          // m: 6,
          border: '1px solid',
          borderColor: 'customColors.customTableBorderBg',
          boxShadow: 'none'
        }}
      >
        <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
          <Table>
            <TableHead sx={{ borderColor: 'customColors.customTableBorderBg' }}>
              <TableRow sx={{ backgroundColor: '#FFBDA899' }}>
                <TableCell sx={{ p: '6px' }}>BATCH ID</TableCell>
                <TableCell sx={{ p: '6px' }}>EXPIRY DATE</TableCell>
                <TableCell sx={{ p: '6px' }}>QUANTITY</TableCell>
                <TableCell sx={{ p: '6px' }}>UNIT PRICE</TableCell>
                <TableCell sx={{ p: '6px' }}>VALUE</TableCell>
                <TableCell sx={{ p: '6px' }}>DAYS LEFT</TableCell>
              </TableRow>
            </TableHead>
            <TableBody sx={{ borderColor: 'customColors.customTableBorderBg' }}>
              <TableRow>
                <TableCell>BAT-0001</TableCell>
                <TableCell>12 Jan 2024</TableCell>
                <TableCell>10</TableCell>
                <TableCell>₹10</TableCell>
                <TableCell>₹100</TableCell>
                <TableCell sx={{ color: '#FA6140' }}>6 Days</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>BAT-0001</TableCell>
                <TableCell>12 Jan 2024</TableCell>
                <TableCell>10</TableCell>
                <TableCell>₹10</TableCell>
                <TableCell>₹100</TableCell>
                <TableCell sx={{ color: '#FA6140' }}>8 Days</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </>
  )

  const expiredBatchesContent = (
    <>
      <Card
        sx={{
          // m: 6,
          border: '1px solid',
          borderColor: 'customColors.customTableBorderBg',
          boxShadow: 'none'
        }}
      >
        <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
          <Table>
            <TableHead sx={{ borderColor: 'customColors.customTableBorderBg' }}>
              <TableRow sx={{ backgroundColor: '#FFD3D3CC' }}>
                <TableCell sx={{ p: '6px' }}>BATCH ID</TableCell>
                <TableCell sx={{ p: '6px' }}>EXPIRY DATE</TableCell>
                <TableCell sx={{ p: '6px' }}>QUANTITY</TableCell>
                <TableCell sx={{ p: '6px' }}>UNIT PRICE</TableCell>
                <TableCell sx={{ p: '6px' }}>VALUE</TableCell>
                <TableCell sx={{ p: '6px' }}>OVERDUE</TableCell>
              </TableRow>
            </TableHead>
            <TableBody sx={{ borderColor: 'customColors.customTableBorderBg' }}>
              <TableRow>
                <TableCell>BAT-0001</TableCell>
                <TableCell>12 Jan 2024</TableCell>
                <TableCell>10</TableCell>
                <TableCell>₹10</TableCell>
                <TableCell>₹100</TableCell>
                <TableCell sx={{ color: '#E93353' }}>6 Days</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>BAT-0001</TableCell>
                <TableCell>12 Jan 2024</TableCell>
                <TableCell>10</TableCell>
                <TableCell>₹10</TableCell>
                <TableCell>₹100</TableCell>
                <TableCell sx={{ color: '#E93353' }}>8 Days</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </>
  )
  const alternativeMedicines = (
    <>
      <Typography
        variant='h6'
        gutterBottom
        sx={{ color: 'customColors.customHeadingTextColor', fontSize: '16px', fontWeight: 500 }}
      >
        Alternative Medicines (10)
      </Typography>
      <Paper elevation={3}>
        <List>
          {medicines.map((medicine, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={medicine.name}
                secondary={medicine.manufacturer}
                primaryTypographyProps={{
                  sx: { color: 'primary.dark', fontWeight: 500, fontSize: '14px' } // Customize primary text
                }}
                secondaryTypographyProps={{
                  sx: { color: 'customColors.neutralSecondary', fontWeight: 400, fontSize: '12px' }
                }}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </>
  )

  const drawerData = [
    {
      id: 'centralPharmacy',
      title: 'Quantity in Stores',
      totalStores: 23,
      totalQuantity: 4056,
      contentComponent: centralPharmacyContent,
      style: '#F5F9F6',
      bgColor: '#AFEFEB4D',
      icon: '/images/medicare.svg',
      value: 2300,
      description: 'Quantity in Store'
    },
    {
      id: 'aboutToExpire',
      title: 'About to Expire',
      totalStores: 23,
      totalQuantity: 4056,
      contentComponent: expireContent,
      style: '#F5F9F6',
      bgColor: '#FA61401A',
      icon: '/images/calendar.svg',
      value: 56,
      description: 'About to Expire Quantity'
    },
    {
      id: 'expiredBatches',
      title: 'Expired Batches',
      totalStores: 23,
      totalQuantity: 4056,
      contentComponent: expiredBatchesContent,
      style: '#F5F9F6',
      bgColor: '#E933531A',
      icon: '/images/Incubator_ICON.svg',
      value: 300,
      description: 'Expired Quantity'
    }
  ]

  const [activeDrawer, setActiveDrawer] = useState(null)

  const openDrawer = drawerId => setActiveDrawer(drawerId)
  const closeDrawer = () => setActiveDrawer(null)

  const activeDrawerData = drawerData.find(data => data.id === activeDrawer)

  const handleAddAlternativeMedicine = () => {
    setAddMedicinesDrawerOpen(true)
  }

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      alternatives: [{ productName: '', manufacturerName: '' }]
    }
  })
  const productOptions = [
    { label: 'Paracetamol', value: 'paracetamol' },
    { label: 'Ibuprofen', value: 'ibuprofen' },
    { label: 'Aspirin', value: 'aspirin' },
    { label: 'Amoxicillin', value: 'amoxicillin' }
  ]

  // Watch alternatives field
  const alternatives = watch('alternatives', [])
  const handleAddAlternative = () => {
    setValue('alternatives', [...alternatives, { productName: '', manufacturerName: '' }])
  }

  const handleDeleteLastAlternative = () => {
    if (alternatives.length > 1) {
      // Only remove if more than one alternative exists
      setValue('alternatives', alternatives.slice(0, -1))
    }
  }

  const onSubmit = data => {
    console.log('Submitted Alternatives:', data.alternatives)
    reset()
  }

  console.log(productDetails, 'overview')

  const dummyData = {
    dispatch_count: [
      {
        January: 1200,
        February: 1300,
        March: 1100,
        April: 1400,
        May: 1600,
        June: 1700,
        July: 1800,
        August: 2000,
        September: 2100,
        October: 2200,
        November: 2300,
        December: 2400
      }
    ],
    dispatch_value: [
      {
        January: 500000,
        February: 600000,
        March: 450000,
        April: 700000,
        May: 800000,
        June: 750000,
        July: 900000,
        August: 950000,
        September: 1000000,
        October: 1100000,
        November: 1200000,
        December: 1300000
      }
    ]
  }

  return (
    <>
      <Grid container spacing={4} pt={6}>
        {drawerData.map(card => (
          <StyleWithIconCardComponent
            key={card.id}
            value={card.value}
            description={card.description}
            icon={card.icon}
            bgColor={card.bgColor}
            onClick={() => openDrawer(card.id)}
            showIcon={true}
          />
        ))}
      </Grid>

      <Divider sx={{ pt: 6 }} />

      <Box>
        <Grid container spacing={3} marginTop={3} sx={{ display: 'flex', alignItems: 'stretch' }}>
          <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Card sx={{ height: '100%' }}>
              <ProductsChart
                title='Dispatch'
                data={dummyData}
                locations={['Central Pharmacy', 'East Pharmacy']}
                frequencies={['Monthly', 'Weekly']}
                barColor={'#006D35'}
                lineColor={'#37BD69'}
                yAxisTitle='Dispatch Count'
                yAxisOppositeTitle='Dispatch Value (₹)'
                seriesBarName='Dispatch Count'
                seriesLineName='Dispatch Value'
                countLabel='Show Dispatch Count'
                valueLabel='Show Dispatch Value'
              />
            </Card>
          </Grid>

          <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Card sx={{ height: '100%' }}>
              <ProductsChart
                title='Purchases'
                data={dummyData}
                frequencies={['Monthly', 'Weekly']}
                barColor={'#00AFD699'}
                lineColor={'#AFEFEB'}
                yAxisTitle='Purchase count'
                yAxisOppositeTitle='Purchase Value (₹)'
                seriesBarName='Purchase Count'
                seriesLineName='Purchase Value'
                countLabel='Show Purchase Count'
                valueLabel='Show Purchase Value'
              />
              {/* <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 6 }}>
                  <Typography
                    component='div'
                    sx={{ color: 'customColors.customHeadingTextColor', fontSize: '16px', fontWeight: 500 }}
                  >
                    Purchases
                  </Typography>
                  <Grid item>
                    <Button variant='text' sx={{ fontSize: '14px', fontWeight: 500 }}>
                      View More
                    </Button>
                  </Grid>
                </Box>

                <Grid container spacing={2} alignItems='center' mb={6}>
                 <Grid item>
                    <FormControl variant='outlined' size='small'>
                      <InputLabel>Location</InputLabel>
                      <Select label='Location' defaultValue='Central Pharmacy'>
                        <MenuItem value='Central Pharmacy'>Central Pharmacy</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item>
                    <FormControl variant='outlined' size='small'>
                      <InputLabel>Frequency</InputLabel>
                      <Select label='Frequency' defaultValue='Monthly'>
                        <MenuItem value='Monthly'>Monthly</MenuItem>
                        <MenuItem value='Weekly'>Weekly</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

               
                <ResponsiveContainer width='100%' height={300}>
                  <LineChart data={purchaseData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='month' />
                    <YAxis />
                    <Tooltip />
                    <Line type='monotone' dataKey='purchaseCount' stroke='#1976D2' />
                    <Line type='monotone' dataKey='purchaseValue' stroke='#64B5F6' />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent> */}
            </Card>
          </Grid>

          {/* Apply similar structure to the rest of the cards */}
          <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Header Section */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography
                    variant='body1'
                    sx={{
                      color: 'customColors.customHeadingTextColor',
                      fontSize: '16px',
                      fontWeight: 500
                    }}
                  >
                    <Box display='flex' alignItems='center'>
                      <Box
                        display='flex'
                        justifyContent='center'
                        alignItems='center'
                        bgcolor='#F86A4C'
                        borderRadius='4px'
                        width='30px'
                        height='24px'
                        marginRight='8px'
                      >
                        <Icon
                          icon='clarity:child-arrow-line'
                          style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: 'bold' }} // Icon color and size
                        />
                      </Box>
                      Alternative Medicines (10)
                    </Box>
                  </Typography>

                  <CardHeader
                    sx={{ p: 0, m: 0 }}
                    action={
                      <Button
                        variant='text'
                        startIcon={<Icon icon='material-symbols-light:add' />}
                        onClick={handleAddAlternativeMedicine}
                      >
                        Add Alternative
                      </Button>
                    }
                  />
                </Box>

                {/* Divider */}
                <Divider sx={{ my: 2 }} />

                {/* Medicine List */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1 }}>
                  <Typography variant='body2'>
                    <List>
                      {medicines.slice(0, 5).map((medicine, index) => (
                        <ListItem key={index}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Typography sx={{ color: 'primary.dark', fontWeight: 500, fontSize: '14px' }}>
                              {medicine.name}
                            </Typography>
                            <Typography
                              component='span'
                              sx={{ color: 'customColors.neutralSecondary', fontWeight: 400, fontSize: '12px' }}
                            >
                              {medicine.manufacturer}
                            </Typography>
                          </Box>
                        </ListItem>
                      ))}
                    </List>
                  </Typography>
                </Box>

                {/* More Section - Always at the bottom */}
                <Box>
                  <Button
                    variant='text'
                    sx={{ color: 'primary.main', cursor: 'pointer' }}
                    onClick={() => setAlternativeMedicinesDrawerOpen(true)}
                  >
                    +5 More
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <InfoIcon sx={{ mr: 2, color: '#00AFD6', fontWeight: 'bold' }} />
                  <Typography sx={{ color: 'customColors.customHeadingTextColor', fontSize: '16px', fontWeight: 500 }}>
                    Additional Information
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, p: 2 }}>
                    {/* <MedicationIcon color='success' sx={{ mr: 1 }} /> */}
                    <Avatar
                      variant='square'
                      alt=''
                      src={'/images/uses.svg'}
                      sx={{ width: '26px', height: '28px', mr: 1 }}
                    />
                    <Typography
                      variant='subtitle1'
                      sx={{ color: 'custoColors.neutralSecondary', fontSize: '12px', fontWeight: 400 }}
                    >
                      Uses
                    </Typography>
                  </Box>
                  <Typography
                    variant='body2'
                    sx={{ color: 'customColors.customHeadingTextColor', fontSize: '15px', fontWeight: 500, ml: 7 }}
                  >
                    {productDetails?.uses || 'NA'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {/* <WarningIcon color='error' sx={{ mr: 1 }} /> */}
                    <Avatar
                      variant='square'
                      alt=''
                      src={'/images/side_effect.svg'}
                      sx={{ width: '28px', height: '28px', mr: 1 }}
                    />
                    <Typography
                      variant='subtitle1'
                      sx={{ color: 'customColors.neutralSecondary', fontSize: '12px', fontWeight: 400 }}
                    >
                      Side Effects
                    </Typography>
                  </Box>
                  <Typography
                    variant='body2'
                    sx={{ color: 'customColors.customHeadingTextColor', fontSize: '15px', fontWeight: 500, ml: 7 }}
                  >
                    {productDetails?.side_effects || 'NA'}
                  </Typography>
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {/* <ShieldIcon color='info' sx={{ mr: 1 }} /> */}
                    <Avatar
                      variant='square'
                      alt=''
                      src={'/images/safety.svg'}
                      sx={{ width: '24px', height: '28px', mr: 1 }}
                    />
                    <Typography
                      variant='subtitle1'
                      sx={{ color: 'customColors.neutralSecondary', fontSize: '12px', fontWeight: 400 }}
                    >
                      Safety Advice
                    </Typography>
                  </Box>
                  <List dense>
                    {productDetails?.safety_advice ? (
                      productDetails.safety_advice.split(',').map((advice, index) => {
                        const trimmedAdvice = advice.trim()
                        if (!trimmedAdvice) return null

                        return (
                          <ListItem key={index}>
                            <Typography
                              variant='body2'
                              sx={{
                                color: 'customColors.customHeadingTextColor',
                                fontSize: '15px',
                                fontWeight: 500,
                                ml: 3
                              }}
                            >
                              {`${index + 1}. ${trimmedAdvice}`}
                            </Typography>
                          </ListItem>
                        )
                      })
                    ) : (
                      <ListItem>
                        <Typography
                          variant='body2'
                          sx={{
                            color: 'customColors.customHeadingTextColor',
                            fontSize: '15px',
                            fontWeight: 500,
                            ml: 3
                          }}
                        >
                          NA
                        </Typography>
                      </ListItem>
                    )}
                  </List>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {activeDrawerData && (
        <CommonDrawerBox
          title={activeDrawerData.title}
          totalStores={activeDrawerData.totalStores}
          totalQuantity={activeDrawerData.totalQuantity}
          drawerStatus={Boolean(activeDrawer)}
          close={closeDrawer}
          contentComponent={activeDrawerData.contentComponent}
          style={activeDrawerData.style}
          width={700}
        />
      )}

      <CommonDrawerBox
        imageUrl={'https://img.freepik.com/free-photo/colorful-design-with-spiral-design_188544-9588.jpg'}
        title='Dolo 650 Tablet'
        drawerStatus={isAlternativeMedicinesDrawerOpen}
        close={() => setAlternativeMedicinesDrawerOpen(false)}
        contentComponent={alternativeMedicines}
        style='#F5F9F6'
      />

      <Drawer
        anchor='right'
        open={addMedicinesDrawerOpen}
        onClose={() => setAddMedicinesDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 500,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#EFF5F2'
          }
        }}
      >
        {/* Drawer Header */}
        <Box display='flex' justifyContent='space-between' alignItems='center' sx={{ p: 4 }}>
          <Box display='flex' alignItems='center' gap={2}>
            <Typography variant='h6' fontWeight='bold'>
              Add New Alternative Medicine
            </Typography>
          </Box>
          <IconButton onClick={() => setAddMedicinesDrawerOpen(false)}>
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>
        <Divider />

        {/* Drawer Content */}
        <Box
          p={4}
          sx={{
            flex: 1, // Allow content to grow and shrink
            overflowY: 'auto' // Enable scrolling for content if it overflows
          }}
        >
          <Card sx={{ p: 4 }}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Box display='flex' flexDirection='column' gap={2}>
                {/* Map through alternatives */}
                {alternatives.map((alt, index) => (
                  <Box key={index} display='flex' flexDirection='column' gap={2}>
                    {/* Product Name */}
                    <FormControl fullWidth sx={{ mb: 4 }}>
                      <Controller
                        name={`alternatives[${index}].productName`}
                        control={control}
                        render={({ field }) => (
                          <Autocomplete
                            {...field}
                            options={productOptions}
                            getOptionLabel={option => (typeof option === 'string' ? option : option?.label || '')}
                            value={productOptions.find(option => option.value === field.value) || null}
                            onChange={(_, selectedOption) => field.onChange(selectedOption?.value || '')}
                            renderInput={params => (
                              <TextField
                                {...params}
                                label='Product Name'
                                variant='outlined'
                                error={!!errors?.alternatives?.[index]?.productName}
                                helperText={errors?.alternatives?.[index]?.productName?.message}
                                fullWidth
                              />
                            )}
                          />
                        )}
                      />
                    </FormControl>

                    {/* Manufacturer Name */}
                    <FormControl fullWidth sx={{ mb: 4 }}>
                      <Controller
                        name={`alternatives[${index}].manufacturerName`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label='Manufacturer Name'
                            variant='outlined'
                            error={!!errors?.alternatives?.[index]?.manufacturerName}
                            helperText={errors?.alternatives?.[index]?.manufacturerName?.message}
                            fullWidth
                          />
                        )}
                      />
                    </FormControl>
                  </Box>
                ))}

                {/* Common Action Buttons */}
                <Box display='flex' justifyContent='flex-end' gap={2}>
                  {/* Delete Last Alternative */}
                  <Button
                    variant='text'
                    color='error'
                    onClick={handleDeleteLastAlternative}
                    disabled={alternatives.length <= 1}
                    startIcon={<Icon icon='mdi:delete' />}
                  >
                    Delete
                  </Button>

                  {/* Add Alternative */}
                  <Button variant='text' onClick={handleAddAlternative} startIcon={<Icon icon='mdi:plus' />}>
                    Add Alternative
                  </Button>
                </Box>
              </Box>
            </form>
          </Card>
        </Box>

        {/* Drawer Footer */}
        <Box
          sx={{
            p: 4,
            borderTop: '1px solid #ddd'
          }}
        >
          <Button
            type='submit'
            variant='contained'
            fullWidth
            onClick={handleSubmit(onSubmit)} // Ensure form submission is handled
          >
            Save
          </Button>
        </Box>
      </Drawer>
    </>
  )
}

export default Overview
