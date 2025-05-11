/* eslint-disable lines-around-comment */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import { Typography, Grid, Box, Button, FormControl, TextField, FormHelperText, Card, Tab, alpha } from '@mui/material'
import IconButton from '@mui/material/IconButton'
import Icon from 'src/@core/components/icon'
import Image from 'next/image'
import Chip from '@mui/material/Chip'
import { LoadingButton } from '@mui/lab'
import { TabContext, TabList, TabPanel } from '@mui/lab'
import { v4 as uuidv4 } from 'uuid'
import { useTheme } from '@emotion/react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import ImagePreview from 'src/views/utility/ImagePreview'
import { variantMappingForProductBatch } from 'src/lib/api/pharmacy/getPurchaseList'

const customScrollbar = {
  overflowX: 'auto',
  '&::-webkit-scrollbar': {
    height: '6px',
    width: '6px'
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent'
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: '#ccc',
    borderRadius: '4px'
  },
  scrollbarWidth: 'thin',
  scrollbarColor: '#ccc transparent'
}

const PurchaseInvoiceUpload = ({
  setPurchaseItems,
  reset,
  closeDialog,
  handleInputImageChange,
  invoiceSubmitLoader,
  setInvoiceSubmitLoader,
  variantLists
}) => {
  const theme = useTheme()
  const [cameras, setCameras] = useState([])
  const [loading, setLoading] = useState(false)

  const [currentCamera, setCurrentCamera] = useState(null)
  const [capturedImage, setCapturedImage] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)
  const [tabStatus, setTabStatus] = useState('by_camera')
  const [file, setFile] = useState([])
  const [error, setError] = useState('')

  const videoRef = useRef(null) // Reference to video element
  const canvasRef = useRef(null) // Reference to canvas element
  const browseButtonRef = useRef(null)

  const fileInputRef = useRef(null)

  const handleClick = () => {
    fileInputRef.current.click()
  }

  const findVariantIdWithUnitMultiplierOne = () => {
    const found = variantLists?.length > 0 && variantLists?.find(item => item?.unit_multiplier === '1')

    return found ? found?.id : ''
  }

  const formatInvoiceDate = dateStr => {
    let normalizedDateStr = dateStr?.replace(/-/g, '/')
    let parts = normalizedDateStr?.split('/').map(part => part?.padStart(2, '0'))

    if (parts?.length === 3) {
      let [day, month, year] = parts

      return `${year}-${month}-${day}` // Convert to YYYY-MM-DD
    }

    return ''
  }

  // Request camera permission
  const requestCameraPermission = async () => {
    console.log('Requesting camera permission...')

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        setHasPermission(true) // Permission granted
        console.log('Camera permission granted.')
      } catch (error) {
        console.error('Camera permission denied:', error)
        setPermissionDenied(true) // Permission denied
      }
    } else {
      console.error('getUserMedia is not supported in this browser.')
      setPermissionDenied(true) // If getUserMedia is not supported
    }
  }

  // Get connected camera devices
  const getCameras = async () => {
    console.log('Fetching connected cameras...')
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const cameraDevices = devices.filter(device => device.kind === 'videoinput')
      setCameras(cameraDevices)
      setLoading(false)
      console.log('Cameras found:', cameraDevices)
    } catch (error) {
      console.error('Error accessing media devices:', error)
      setLoading(false)
    }
  }

  // Start the selected camera
  const startCamera = async deviceId => {
    if (!deviceId) return

    stopCamera() // Stop the previous camera if any

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } }
      })

      // Ensure videoRef is set before attaching the stream
      if (videoRef.current) {
        console.log('Attaching stream to video element', stream)
        videoRef.current.srcObject = stream
        console.log('Stream attached successfully.')
      } else {
        console.error('videoRef.current is null when trying to attach stream')
      }

      setCurrentCamera(stream) // Store the current stream
      setPermissionDenied(false) // Clear any permission denial flag
    } catch (error) {
      console.error('Error starting camera:', error)
      setPermissionDenied(true) // Set permission denied state if error occurs
    }
  }

  // Stop the current camera
  const stopCamera = () => {
    if (currentCamera) {
      // Stop all tracks of the current stream
      currentCamera.getTracks().forEach(track => {
        track.stop()
        console.log(`Track stopped: ${track.kind}`)
      })
      setCurrentCamera(null)
      setCapturedImage(null)
      console.log('Camera stopped.')
    }

    if (videoRef.current) {
      // Clear the srcObject to stop the video from playing
      videoRef.current.srcObject = null
    }

    // Reset camera permission state
    // setHasPermission(false)
  }

  const dataURLtoBlob = dataURL => {
    const byteString = atob(dataURL.split(',')[1])
    const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0]
    const ab = new ArrayBuffer(byteString.length)
    const ia = new Uint8Array(ab)
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i)
    }

    return new Blob([ab], { type: mimeString })
  }

  const takePicture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current

    if (video && canvas) {
      const context = canvas.getContext('2d')
      const width = video.videoWidth
      const height = video.videoHeight

      canvas.width = width
      canvas.height = height

      context.drawImage(video, 0, 0, width, height)
      const imageDataUrl = canvas.toDataURL('image/png')
      const blob = dataURLtoBlob(imageDataUrl)
      const file = new File([blob], 'captured-image.png', { type: 'image/png' })

      // setCapturedImage(imageDataUrl)

      // setFile(file)
      setFile(prev => [...prev, file])

      // stopCamera()
    }
  }

  // Effect to request permission and fetch cameras
  useEffect(() => {
    if (hasPermission) {
      getCameras() // Fetch available cameras once permission is granted
    }
  }, [hasPermission])

  // Make sure the videoRef is available before using it
  useEffect(() => {
    if (videoRef.current && currentCamera) {
      // Attach the stream when videoRef and currentCamera are available
      videoRef.current.srcObject = currentCamera
    }
  }, [videoRef, currentCamera, tabStatus])

  const checkFloatValue = value => {
    if (value >= 0.01) {
      return parseFloat(parseFloat(value).toFixed(2))
    } else if (value > 0 && value < 0.01) {
      return parseFloat(parseFloat(value).toFixed(5))
    } else {
      return 0
    }
  }

  function checkNumber(numberToCheck) {
    return parseFloat(numberToCheck?.toString().length > 0 && !isNaN(numberToCheck) ? numberToCheck : 0)
  }

  function calculateDiscountAmount(originalPrice, discountPercentage) {
    return (originalPrice * discountPercentage) / 100
  }

  function calculateAmountAfterDiscount(originalPrice, discountPercentage) {
    const discountAmount = calculateDiscountAmount(originalPrice, discountPercentage)

    return originalPrice - discountAmount
  }

  function calculateStuff(
    purchase_qty,
    purchase_unit_price,
    purchase_discount,
    purchase_cgst,
    purchase_sgst,
    purchase_igst
  ) {
    // Convert all inputs to numbers and handle null/undefined
    const qty = checkNumber(purchase_qty)
    const unit_price = checkNumber(purchase_unit_price)
    const discount_percentage = checkNumber(purchase_discount)
    const cgst = checkNumber(purchase_cgst)
    const sgst = checkNumber(purchase_sgst)
    const igst = checkNumber(purchase_igst)

    // Calculate gross amount (before discount)
    const grossAmount = qty * unit_price

    // Calculate taxable amount (after discount)
    const taxableAmount = calculateAmountAfterDiscount(grossAmount, discount_percentage)

    // Calculate GST amounts based on taxable amount
    const cgstAmount = (taxableAmount * cgst) / 100
    const sgstAmount = (taxableAmount * sgst) / 100
    const igstAmount = (taxableAmount * igst) / 100

    // Total GST percentage
    const totalGst = cgst + sgst + igst

    // Calculate net amount including GST
    let netAmount
    if (igst > 0) {
      netAmount = taxableAmount + igstAmount
    } else {
      netAmount = taxableAmount + cgstAmount + sgstAmount
    }

    return {
      purchase_gross_amount: checkFloatValue(grossAmount),
      purchase_discount_amount: checkFloatValue(calculateDiscountAmount(grossAmount, discount_percentage)),
      purchase_taxable_amount: checkFloatValue(taxableAmount),
      purchase_net_amount: checkFloatValue(netAmount),
      purchase_cgst_amount: checkFloatValue(cgstAmount),
      purchase_sgst_amount: checkFloatValue(sgstAmount),
      purchase_igst_amount: checkFloatValue(igstAmount),
      purchase_gst: totalGst
    }
  }

  const submitImage = async () => {
    if (!file || file.length === 0) {
      console.error('No files selected')

      return
    }

    // Stop the camera before submitting
    stopCamera()
    setInvoiceSubmitLoader(true)

    const promises = Array.from(file).map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)

        reader.onload = () => {
          const base64String = reader.result.split(',')[1]
          resolve(base64String)
        }

        reader.onerror = error => reject(error)
      })
    })

    try {
      const base64Images = await Promise.all(promises)

      const response = await axios
        .post(
          'https://api.dev.antzsystems.com:8082/inferInvoices',
          {
            dataType: 'bytes',
            data: base64Images,
            save: false
          },
          {
            headers: {
              'X-API-KEY': '4ebaa3c6-9e70-42dd-bc1b-74e948aa468b',
              'Content-Type': 'application/json'
            }
          }
        )
        .then(async data => {
          setInvoiceSubmitLoader(false)

          closeDialog()
          let responseData = data?.data?.data

          const payLoad = responseData?.product_details
            ?.filter(el => el?.purchase_stock_item_id && el?.purchase_batch_no)
            .map(el => ({
              stock_item_id: el?.purchase_stock_item_id,
              batch_no: el?.purchase_batch_no
            }))

          try {
            await variantMappingForProductBatch(payLoad).then(res => {
              if (res?.success && res?.data?.length > 0) {
                responseData.product_details = responseData?.product_details?.map(el => {
                  const matched = res.data.find(
                    src => src?.batch_no === el?.purchase_batch_no && src?.stock_item_id === el?.purchase_stock_item_id
                  )

                  return {
                    ...el,
                    purchase_variant_id: matched?.variant_id || '',
                    purchase_variant_ratio: matched?.unit_multiplier || ''
                  }
                })
              }
            })
          } catch (error) {
            console.error('Error in variant mapping:', error)
          }
          if (responseData) {
            const purchase_details = responseData.product_details.map((el, index) => {
              // Get GST values from invoice data
              const purchase_gst = el.purchase_gst || 0
              const purchase_cgst = purchase_gst / 2 // Split GST into CGST and SGST
              const purchase_sgst = purchase_gst / 2
              const purchase_igst = 0.0 // IGST is 0 for local transactions

              // Calculate amounts using the calculateStuff function
              const calculatedAmounts = calculateStuff(
                el.purchase_qty,
                el.purchase_unit_price,
                el.purchase_discount || 0,
                purchase_cgst,
                purchase_sgst,
                purchase_igst
              )

              return {
                ...el,
                uid: uuidv4(),
                medicine_name: el?.medicine_name,
                purchase_unit_id: el?.purchase_unit_id ? el?.purchase_unit_id : el?.purchase_stock_item_id,
                purchase_stock_item_id: el?.purchase_stock_item_id,
                id: el?.id || '',
                stock_type: el?.stock_type,
                package_details:
                  el?.package && el?.package_qty && el?.package_uom_label && el?.product_form_label
                    ? `${el.package} of ${el.package_qty} ${el.package_uom_label} ${el.product_form_label}`
                    : '',
                manufacture: el?.manufacturer,
                purchase_expiry_date: el?.purchase_expiry_date,

                // variant id hardcodedd for demoprepose
                // purchase_variant_id: findVariantIdWithUnitMultiplierOne(),
                // purchase_variant_ratio: 1,

                // purchase_variant_id: 1,
                // purchase_variant_ratio: 1,
                purchase_unit_qty: el?.purchase_qty * 1,

                ///********** */
                purchase_qty: el?.purchase_qty,
                purchase_unit_price: el?.purchase_unit_price,
                purchase_discount: el?.purchase_discount || 0,
                purchase_cgst: purchase_cgst,
                purchase_sgst: purchase_sgst,
                purchase_igst: purchase_igst,
                ...calculatedAmounts,
                purchase_created_by: 'invoice_upload',
                medicine_name_by_ml: el?.medicine_name
              }
            })

            // Calculate totals from line items
            const totalLineItemsAmount = purchase_details?.reduce(
              (acc, row) => acc + parseFloat(row.purchase_gross_amount || 0),
              0
            )

            const totalLineItemsDiscount = purchase_details?.reduce(
              (acc, row) => acc + parseFloat(row.purchase_discount_amount || 0),
              0
            )

            const totalLineItemsTaxable = purchase_details?.reduce(
              (acc, row) => acc + parseFloat(row.purchase_taxable_amount || 0),
              0
            )

            const totalLineItemsCGST = purchase_details?.reduce(
              (acc, row) => acc + parseFloat(row.purchase_cgst_amount || 0),
              0
            )

            const totalLineItemsSGST = purchase_details?.reduce(
              (acc, row) => acc + parseFloat(row.purchase_sgst_amount || 0),
              0
            )

            const totalLineItemsIGST = purchase_details?.reduce(
              (acc, row) => acc + parseFloat(row.purchase_igst_amount || 0),
              0
            )

            const totalLineItemsNet = purchase_details?.reduce(
              (acc, row) => acc + parseFloat(row.purchase_net_amount || 0),
              0
            )

            setPurchaseItems(prev => ({
              ...prev,
              po_no: responseData?.po_no,
              po_date: formatInvoiceDate(responseData?.po_date),
              store_id: '',
              requested_by: responseData ? responseData?.requested_by : '',
              supplier_id: responseData?.supplier_id,
              description: responseData?.description,
              type_of_store: responseData?.type_of_store,
              purchase_details: purchase_details,
              total_amount: checkFloatValue(totalLineItemsAmount),
              discount_type: '',
              discount_amount: checkFloatValue(totalLineItemsDiscount),
              discount_percentage: 0,
              net_amount: checkFloatValue(totalLineItemsNet),
              tax_amount: checkFloatValue(totalLineItemsCGST + totalLineItemsSGST + totalLineItemsIGST),
              purchase_order_no: '',
              invoice_transcript: [],
              freight_charges: '',
              freight_gst: '',
              freight_total_charges: '',
              additional_charges: '',
              round_off: '',
              purchase_created_by: 'invoice_upload'
            }))

            reset({
              po_no: responseData?.po_no,
              po_date: formatInvoiceDate(responseData?.po_date),
              store_id: '',
              requested_by: responseData ? responseData?.requested_by : '',
              supplier_id: responseData?.supplier_id,
              description: responseData?.description,
              type_of_store: responseData?.type_of_store,
              purchase_details: purchase_details,
              total_amount: checkFloatValue(totalLineItemsAmount),
              discount_type: '',
              discount_amount: checkFloatValue(totalLineItemsDiscount),
              discount_percentage: 0,
              net_amount: checkFloatValue(totalLineItemsNet),
              tax_amount: checkFloatValue(totalLineItemsCGST + totalLineItemsSGST + totalLineItemsIGST),
              purchase_order_no: '',
              invoice_transcript: [],
              freight_charges: '',
              freight_gst: '',
              freight_total_charges: '',
              additional_charges: '',
              round_off: '',
              purchase_created_by: 'invoice_upload'
            })
            handleInputImageChange(file)
            toast.success('Invoice processed successfully')
          }
        })
      console.log('Upload success:', response.data)
    } catch (error) {
      console.error('Error uploading images:', error)

      // toast.error('Invoice processed failed try again')
    } finally {
      setInvoiceSubmitLoader(false)
    }
  }

  const handleChange = (event, newValue) => {
    setTabStatus(newValue)
  }

  const handleDeleteFile = fileIndex => {
    setFile(prev => prev.filter((file, index) => index !== fileIndex))
    if (browseButtonRef.current) browseButtonRef.current.value = ''
  }

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (acceptedFiles) {
      setFile(prev => [...prev, ...acceptedFiles])

      setError('')
    }
  }, [])

  const { getRootProps, getInputProps } = useDropzone({
    multiple: true,
    accept: { 'image/jpeg': [], 'image/png': [] },
    onDrop
  })

  return (
    <Box
      sx={{
        width: { lg: '100%', md: '100%', sm: '100%', xs: '100%' },
        mb: 4
      }}
    >
      <TabContext value={tabStatus}>
        <TabList
          onChange={handleChange}
          aria-label='simple tabs example'
          sx={{
            backgroundColor: 'customColors.OnPrimary',
            color: 'customColors.neutralSecondary',
            '& .MuiTabs-flexContainer': {
              display: 'flex'
            }
          }}
        >
          <Tab
            disabled={file?.length > 0 ? true : false}
            value='by_camera'
            label={
              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: '14px',
                  color: tabStatus === 'by_camera' ? '#37BD69' : 'customColors.onSurfaceVariant',
                  display: { sm: 'inline', md: 'inline', lg: 'inline' },
                  '&::after': {
                    content: {
                      xs: "'Camera'",
                      sm: "'Camera'",
                      md: "'Scan with Camera'",
                      lg: "'Scan with Camera'"
                    }
                  }
                }}
              />
            }
            sx={{ width: 'auto' }}
            iconPosition='start'
            icon={<Icon icon='mdi:camera-outline' />}
          />
          <Tab
            disabled={file?.length > 0 ? true : false}
            value='by_input'
            label={
              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: '14px',
                  color: tabStatus === 'by_input' ? '#37BD69' : 'customColors.onSurfaceVariant',
                  display: { sm: 'inline', md: 'inline', lg: 'inline' },
                  '&::after': {
                    content: {
                      xs: "'Upload'",
                      sm: "'Upload'",
                      md: "'Upload from device'",
                      lg: "'Upload from device'"
                    }
                  }
                }}
              />
            }
            sx={{ width: 'auto' }}
            iconPosition='start'
            icon={<Icon icon='icon-park-outline:download-computer' />}
          />
        </TabList>
      </TabContext>
      <TabContext value={tabStatus}>
        <TabPanel value='by_camera'>
          <Grid container>
            <Grid item xs={12} sm={12}>
              {!hasPermission && !permissionDenied ? (
                <div>
                  <Typography
                    sx={{
                      fontWeight: 400,
                      fontSize: '16px',
                      margin: '0px',
                      mb: 4,
                      padding: '0px',
                      color: 'customColors.neutralSecondary',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    Enable camera access to scan your invoice easily.
                  </Typography>
                  <Button variant='contained' onClick={requestCameraPermission}>
                    Allow camera access
                  </Button>
                </div>
              ) : permissionDenied ? (
                <div>
                  <Typography
                    sx={{
                      fontWeight: 400,
                      fontSize: '16px',
                      margin: '0px',
                      my: 4,
                      padding: '0px',
                      color: 'error,main',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    Permission to access the camera was denied. Please enable it in your browser settings.{' '}
                  </Typography>
                </div>
              ) : (
                <div>
                  {loading ? (
                    <p>Loading cameras...</p>
                  ) : cameras.length === 0 ? (
                    <p>No cameras found.</p>
                  ) : (
                    <Grid container sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Grid item xs={12} sm={3}>
                        <Typography
                          sx={{
                            fontWeight: 400,
                            fontSize: '16px',
                            margin: '0px',
                            my: 4,
                            padding: '0px',
                            color: 'customColors.neutralSecondary',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          Select Camera
                        </Typography>
                        {cameras?.map(camera => (
                          <Grid
                            sx={{
                              border: '1px solid',
                              borderRadius: '8px',
                              padding: 2,
                              width: 'auto',
                              fontWeight: 400,
                              fontSize: '14px',
                              backgroundColor: 'customColors.bodyBg',
                              cursor: 'pointer',
                              my: 1,
                              borderColor: theme => alpha(theme.palette.customColors.neutral05, 0.05)
                            }}
                            onClick={() => startCamera(camera.deviceId)}
                            key={camera.deviceId}
                          >
                            {camera.label || `Camera ${camera.deviceId}`}
                          </Grid>
                        ))}
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={5}
                        sx={{ borderRight: `1px solid ${theme.palette.customColors.neutral05}` }}
                      >
                        {currentCamera && (
                          <Typography
                            sx={{
                              fontWeight: 400,
                              fontSize: '12px',
                              margin: '0px',
                              mb: 4,
                              textAlign: 'center',
                              color: 'customColors.neutralSecondary'
                            }}
                          >
                            *Ensure the entire invoice is visible and well-lit before taking a picture
                          </Typography>
                        )}

                        {currentCamera && (
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 2,
                              p: 2
                            }}
                          >
                            <Box
                              sx={{
                                border: `1px dashed ${theme.palette.customColors.Outline}`,
                                borderRadius: '10px',
                                display: 'block',
                                position: 'relative'
                              }}
                            >
                              <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                width='300'
                                height='300'
                                onCanPlay={() => console.log('Video is playing.')}
                                onError={e => console.error('Video error:', e)}
                                style={{ display: 'block', padding: '2px' }}
                              />
                            </Box>

                            <canvas ref={canvasRef} style={{ display: 'none' }} />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                              <Button
                                variant='contained'
                                size='small'
                                sx={{
                                  pointerEvents: invoiceSubmitLoader ? 'none !important' : 'auto'
                                }}
                                color='error'
                                onClick={stopCamera}
                              >
                                Turn Off Camera
                              </Button>
                              <Button
                                size='small'
                                variant='contained'
                                sx={{
                                  backgroundColor: 'customColors.addPrimary',
                                  '&:hover': {
                                    backgroundColor: 'customColors.addPrimary'
                                  },
                                  pointerEvents: invoiceSubmitLoader ? 'none !important' : 'auto'
                                }}
                                onClick={takePicture}
                              >
                                Capture
                              </Button>
                            </Box>
                          </Box>
                        )}
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={3}
                        sx={{ overflowY: 'auto', overflowX: 'hidden', height: 400, ...customScrollbar }}
                      >
                        {Array.isArray(file) && file?.length > 0 && (
                          <>
                            {file?.map((el, index) => {
                              return (
                                <ImagePreview
                                  // imageDetails={el}
                                  loader={invoiceSubmitLoader}
                                  onClose={() => {
                                    handleDeleteFile(index)
                                  }}
                                  key={index}
                                  imageSrc={URL.createObjectURL(el)}
                                />
                              )
                            })}
                          </>
                        )}
                      </Grid>
                    </Grid>
                  )}
                </div>
              )}
            </Grid>
          </Grid>
        </TabPanel>
        <TabPanel value='by_input' sx={{ px: '24px' }}>
          <Grid
            container
            gap={1}
            sx={{
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Grid item xs={12} md={5} sm={12}>
              <FormControl fullWidth sx={{ my: 4 }}>
                <input
                  type='file'
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=' .jpeg, .jpg, .png'
                  multiple
                  onChange={e => {
                    const files = Array.from(e.target.files)
                    if (files.length === 0) return
                    const allowedTypes = ['image/jpeg', 'image/png']
                    const validFiles = files.filter(file => allowedTypes.includes(file.type))
                    if (validFiles.length !== files.length) {
                      setError('Some files are not allowed. Please upload only JPEG or PNG.')

                      return
                    }

                    setFile(prev => [...prev, ...validFiles])
                    setError('')
                  }}
                />

                <Box
                  disabled={true}
                  {...getRootProps({ className: 'dropzone' })}
                  onClick={handleClick}
                  ref={browseButtonRef}
                  sx={{
                    gap: 2,
                    paddingTop: '24px',
                    paddingRight: '12px',
                    paddingBottom: '24px',
                    paddingLeft: '24px',
                    backgroundColor: 'customColors.Surface',
                    border: Boolean(error) ? '1px dashed red' : 'none',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'customColors.Surface',
                      border: `1px dashed ${theme.palette.customColors.Outline}`
                    },
                    display: 'flex',
                    justifyContent: 'start',
                    alignItems: 'center',
                    minHeight: '115px',
                    maxHeight: '115px',
                    pointerEvents: invoiceSubmitLoader ? 'none !important' : ''
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 48,
                      height: 48,
                      borderRadius: '8px',
                      padding: '8px',
                      backgroundColor: 'white',
                      border: `1px dashed ${theme.palette.customColors.neutralSecondary}`
                    }}
                  >
                    <Icon
                      icon='material-symbols-light:attach-file-add-rounded'
                      color='#006D35'
                      width='24'
                      height='24'
                    />
                  </Box>

                  <Box
                    sx={{
                      mx: 2
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 500,
                        fontSize: '16px',
                        margin: '0px',
                        padding: '0px',
                        color: 'primary.dark'
                      }}
                    >
                      Upload Files
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 400,
                        fontSize: '14px',
                        margin: '0px',
                        padding: '0px',
                        color: 'customColor.neutralSecondary',
                        display: 'flex'
                      }}
                    >
                      Supported formats JPEG, PNG
                    </Typography>
                  </Box>
                </Box>
                {error && (
                  <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                    {error}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid
              item
              xs={12}
              md={6}
              sm={12}
              sx={{
                display: 'flex',
                overflowX: 'auto',
                ...customScrollbar
              }}
            >
              {file &&
                file?.length > 0 &&
                file.map((el, index) => {
                  return (
                    <ImagePreview
                      // imageDetails={el}
                      loader={invoiceSubmitLoader}
                      key={index}
                      onClose={() => {
                        handleDeleteFile(index)
                      }}
                      imageSrc={URL.createObjectURL(el)}
                    />
                  )
                })}
            </Grid>
          </Grid>
        </TabPanel>
      </TabContext>
      <Grid
        item
        sx={{
          mb: 1,
          height: 44,
          bottom: 0,
          right: 30,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center'
        }}
      >
        <LoadingButton
          disabled={file?.length > 0 ? false : true}
          size='large'
          loading={invoiceSubmitLoader}
          variant='outlined'
          onClick={() => {
            closeDialog()
            stopCamera()
          }}
          sx={{ mr: 2 }}
        >
          Cancel
        </LoadingButton>
        <LoadingButton
          loading={invoiceSubmitLoader}
          disabled={file?.length > 0 ? false : true}
          size='large'
          variant='contained'
          onClick={submitImage}
        >
          Submit
        </LoadingButton>
      </Grid>
    </Box>
  )
}

export default React.memo(PurchaseInvoiceUpload)
