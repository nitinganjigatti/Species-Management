import { useState, useEffect, useRef, useCallback } from 'react'
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

const PurchaseInvoiceUpload = ({ setPurchaseItems, reset, closeDialog, handleInputImageChange }) => {
  const theme = useTheme()
  const [cameras, setCameras] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
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

  const formatInvoiceDate = dateStr => {
    let normalizedDateStr = dateStr.replace(/-/g, '/')
    let parts = normalizedDateStr.split('/').map(part => part.padStart(2, '0')) // Ensure 2-digit day/month

    if (parts.length === 3) {
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
      console.log(`Starting camera with deviceId: ${deviceId}`)

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
      console.log('Picture captured.', imageDataUrl)
      const blob = dataURLtoBlob(imageDataUrl)
      const file = new File([blob], 'captured-image.png', { type: 'image/png' })
      console.log('Picture saved as file.', file)

      // setCapturedImage(imageDataUrl)

      // setFile(file)
      setFile(prev => [...prev, file])

      // stopCamera()
      console.log('Picture captured.')
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

  // const submitImage = async () => {
  //   // const file = browseButtonRef.current.files[0]
  //   // const file = file
  //   const convert_image = ''
  //   let base64String = ''

  //   if (file) {
  //     setSubmitLoader(true)
  //     const reader = new FileReader()
  //     reader.readAsDataURL(file[0])

  //     reader.onload = () => {
  //       base64String = reader.result.split(',')[1].toString('utf-8')
  //       console.log(base64String)
  //       const utf8Base64 = decodeURIComponent(base64String)

  //       axios
  //         .post(
  //           'https://api.dev.antzsystems.com:8082/inferInvoices',
  //           {
  //             dataType: 'bytes',
  //             data: utf8Base64,
  //             save: false
  //           },
  //           {
  //             headers: {
  //               'X-API-KEY': '4ebaa3c6-9e70-42dd-bc1b-74e948aa468b',
  //               'Content-Type': 'application/json'
  //             }
  //           }
  //         )
  //         .then(data => {
  //           setSubmitLoader(false)
  //           closeDialog()
  //           console.log(data.data.data)
  //           const responseData = data.data.data
  //           if (responseData) {
  //             const purchase_details = responseData.product_details.map((el, index) => {
  //               return {
  //                 ...el,

  //                 uid: uuidv4(),
  //                 medicine_name: el?.medicine_name,
  //                 purchase_stock_item_id: el?.purchase_stock_item_id,
  //                 id: el?.id || '',
  //                 stock_type: el?.stock_type,
  //                 package_details:
  //                   el?.package && el?.package_qty && el?.package_uom_label && el?.product_form_label
  //                     ? `${el.package} of ${el.package_qty} ${el.package_uom_label} ${el.product_form_label}`
  //                     : '',
  //                 manufacture: el?.manufacturer,
  //                 purchase_expiry_date: el?.purchase_expiry_date,
  //                 purchase_variant_id: el?.purchase_variant_id,
  //                 purchase_variant_ratio: el?.unit_multiplier ? el?.unit_multiplier : 1,

  //                 // purchase_unit_qty: el?.purchase_qty,
  //                 purchase_qty: el?.purchase_qty,
  //                 purchase_unit_price: el?.purchase_unit_price,
  //                 purchase_gross_amount:
  //                   el?.purchase_qty && el?.purchase_unit_price ? el?.purchase_unit_price * el?.purchase_qty : 0,
  //                 purchase_taxable_amount: el?.purchase_taxable_amount,
  //                 purchase_discount: el?.purchase_discount ? el?.purchase_discount : 0,
  //                 purchase_taxable_amount: el?.purchase_taxable_amount ? el?.purchase_taxable_amount : 0,
  //                 purchase_net_amount: el?.purchase_net_amount,
  //                 purchase_purchase_price: el?.purchase_purchase_price,
  //                 purchase_free_quantity: el?.purchase_free_quantity,
  //                 purchase_gst: el?.purchase_gst,
  //                 purchase_cgst: el?.purchase_gst ? el?.purchase_gst / 2 : 0,
  //                 purchase_sgst: el?.purchase_gst ? el?.purchase_gst / 2 : 0,
  //                 purchase_cgst_amount: el?.gst_amount ? el?.gst_amount / 2 : 0,
  //                 purchase_sgst_amount: el?.gst_amount ? el?.gst_amount / 2 : 0,
  //                 purchase_igst: el?.purchase_igst ? el?.purchase_igst : 0,
  //                 purchase_igst_amount: el?.purchase_igst_amount ? el?.purchase_igst_amount : 0,
  //                 purchase_created_by: 'invoice_upload',
  //                 medicine_name_by_ml: el?.medicine_name
  //               }
  //             })
  //             setPurchaseItems(prev => ({
  //               ...prev,
  //               po_no: responseData?.po_no,
  //               po_date: formatInvoiceDate(responseData?.po_date),
  //               store_id: '',
  //               requested_by: responseData ? responseData['requested by'] : '',
  //               supplier_id: responseData?.supplier_id,
  //               description: responseData?.description,
  //               type_of_store: responseData?.type_of_store,
  //               purchase_details: purchase_details,
  //               total_amount: 0,
  //               discount_type: '',
  //               discount_amount: 0,
  //               discount_percentage: 0,
  //               net_amount: 0,
  //               tax_amount: 0,
  //               purchase_order_no: '',
  //               invoice_transcript: [],
  //               freight_charges: '',
  //               freight_gst: '',
  //               freight_total_charges: '',
  //               additional_charges: '',
  //               round_off: '',
  //               purchase_created_by: 'invoice_upload'
  //             }))

  //             // setPurchaseItems({
  //             //   po_no: responseData?.po_no,
  //             //   po_date: formatInvoiceDate(responseData?.po_date),
  //             //   store_id: '',
  //             //   supplier_id: responseData?.supplier_id,
  //             //   description: responseData?.description,
  //             //   type_of_store: responseData?.type_of_store,
  //             //   purchase_details: purchase_details,
  //             //   total_amount: 0,
  //             //   discount_type: '',
  //             //   discount_amount: 0,
  //             //   discount_percentage: 0,
  //             //   net_amount: 0,
  //             //   tax_amount: 0,
  //             //   purchase_order_no: '',
  //             //   requested_by: '',
  //             //   invoice_transcript: [],
  //             //   freight_charges: '',
  //             //   freight_gst: '',
  //             //   freight_total_charges: '',
  //             //   additional_charges: '',
  //             //   round_off: ''
  //             // })
  //             // debugger
  //             reset({
  //               po_no: responseData?.po_no,
  //               po_date: formatInvoiceDate(responseData?.po_date),
  //               store_id: '',
  //               requested_by: responseData ? responseData['requested by'] : '',
  //               supplier_id: responseData?.supplier_id,
  //               description: responseData?.description,
  //               type_of_store: responseData?.type_of_store,
  //               purchase_details: purchase_details,
  //               total_amount: 0,
  //               discount_type: '',
  //               discount_amount: 0,
  //               discount_percentage: 0,
  //               net_amount: 0,
  //               tax_amount: 0,
  //               purchase_order_no: '',
  //               invoice_transcript: [],
  //               freight_charges: '',
  //               freight_gst: '',
  //               freight_total_charges: '',
  //               additional_charges: '',
  //               round_off: '',
  //               purchase_created_by: 'invoice_upload'
  //             })
  //             handleInputImageChange(file)
  //           }
  //         })
  //         .catch(error => {
  //           setSubmitLoader(false)
  //           console.error('Error fetching image data:', error)
  //         })
  //     }
  //     reader.onerror = error => {
  //       setSubmitLoader(false)

  //       console.error('Error converting image to Base64:', error)
  //     }
  //   }
  // }
  const submitImage = async () => {
    if (!file || file.length === 0) {
      console.error('No files selected')

      return
    }

    setSubmitLoader(true)

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
        .then(data => {
          setSubmitLoader(false)
          closeDialog()
          console.log(data.data.data)
          const responseData = data.data.data
          if (responseData) {
            const purchase_details = responseData.product_details.map((el, index) => {
              return {
                ...el,

                uid: uuidv4(),
                medicine_name: el?.medicine_name,
                purchase_stock_item_id: el?.purchase_stock_item_id,
                id: el?.id || '',
                stock_type: el?.stock_type,
                package_details:
                  el?.package && el?.package_qty && el?.package_uom_label && el?.product_form_label
                    ? `${el.package} of ${el.package_qty} ${el.package_uom_label} ${el.product_form_label}`
                    : '',
                manufacture: el?.manufacturer,
                purchase_expiry_date: el?.purchase_expiry_date,
                purchase_variant_id: el?.purchase_variant_id,
                purchase_variant_ratio: el?.unit_multiplier ? el?.unit_multiplier : 1,

                // purchase_unit_qty: el?.purchase_qty,
                purchase_qty: el?.purchase_qty,
                purchase_unit_price: el?.purchase_unit_price,

                // purchase_gross_amount:
                // el?.purchase_qty && el?.purchase_unit_price ? el?.purchase_unit_price * el?.purchase_qty : 0,
                purchase_taxable_amount: el?.purchase_taxable_amount,
                purchase_discount: el?.purchase_discount ? el?.purchase_discount : 0,
                purchase_taxable_amount: el?.purchase_taxable_amount ? el?.purchase_taxable_amount : 0,
                purchase_net_amount: el?.purchase_net_amount,
                purchase_purchase_price: el?.purchase_purchase_price,
                purchase_free_quantity: el?.purchase_free_quantity,
                purchase_gst: el?.purchase_gst,
                purchase_cgst: el?.purchase_gst ? el?.purchase_gst / 2 : 0,
                purchase_sgst: el?.purchase_gst ? el?.purchase_gst / 2 : 0,
                purchase_cgst_amount: el?.gst_amount ? el?.gst_amount / 2 : 0,
                purchase_sgst_amount: el?.gst_amount ? el?.gst_amount / 2 : 0,
                purchase_igst: el?.purchase_igst ? el?.purchase_igst : 0,
                purchase_igst_amount: el?.purchase_igst_amount ? el?.purchase_igst_amount : 0,
                purchase_created_by: 'invoice_upload',
                medicine_name_by_ml: el?.medicine_name,
                purchase_gross_amount: el?.purchase_unit_price * el?.purchase_qty
              }
            })
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

              total_amount: responseData?.total_amount,

              discount_type: '',
              discount_amount: 0,
              discount_percentage: 0,

              net_amount: responseData?.net_amount,

              tax_amount: 0,
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

              total_amount: responseData?.total_amount,

              discount_type: '',
              discount_amount: 0,
              discount_percentage: 0,

              net_amount: responseData?.net_amount,
              tax_amount: 0,
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
          }
        })
      debugger
      console.log('Upload success:', response.data)
    } catch (error) {
      console.error('Error uploading images:', error)
    } finally {
      setSubmitLoader(false)
    }
  }

  const handleChange = (event, newValue) => {
    setTabStatus(newValue)
  }

  const handleDeleteFile = fileIndex => {
    setFile(prev => prev.filter((file, index) => index !== fileIndex))
  }

  const imagePreview = (file, index) => {
    return (
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: 'customColors.displaybgPrimary',
          padding: '16px',
          boxShadow: 1,
          height: 'auto',
          my: 1
        }}
      >
        <>
          <img
            alt='Preview'
            src={URL.createObjectURL(file)}
            style={{ display: 'block', width: '100%', height: '100%' }}
          />

          <Icon
            disabled={submitLoader}
            onClick={() => {
              handleDeleteFile(index)
              if (browseButtonRef.current) browseButtonRef.current.value = ''
            }}
            icon='solar:close-square-bold'
            style={{
              position: 'absolute',
              top: '0px',
              right: '0px',
              cursor: 'pointer',
              pointerEvents: submitLoader ? 'none' : 'auto'
            }}
            width='24'
            height='24'
          />
        </>
      </Box>
    )
  }

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    debugger

    // if (rejectedFiles.length > 0) {
    //   setError('File type not allowed. Please upload a JPEG or PNG.')

    //   return
    // }

    // const selectedFile = acceptedFiles[0]
    if (acceptedFiles) {
      // setFile(acceptedFiles)
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

        // minWidth: { lg: 1000, md: 1000, sm: '100%', xs: '100%' },
        // minHeight: { lg: 400, md: 400 },
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
              // borderBottom: `1px solid ${theme.palette.customColors.neutralSecondary}`,
              display: 'flex'

              // justifyContent: 'space-between'
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

                              // backgroundColor: camera.deviceId === currentCamera ? 'customColors.bodyBg' : 'red',
                              cursor: 'pointer',

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

                              // Outline
                            }}
                          >
                            {/* Video Container */}
                            <Box
                              sx={{
                                border: `1px dashed ${theme.palette.customColors.Outline}`,
                                borderRadius: '10px',
                                display: 'block',

                                // mb: 2,
                                // width: '400px',
                                // height: '400px',
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

                            {/* Hidden Canvas */}
                            <canvas ref={canvasRef} style={{ display: 'none' }} />

                            {/* Captured Image Preview */}

                            {/* Action Buttons */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                              <Button
                                variant='contained'
                                size='small'
                                sx={{
                                  pointerEvents: submitLoader ? 'none !important' : 'auto'
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
                                  pointerEvents: submitLoader ? 'none !important' : 'auto'
                                }}
                                onClick={takePicture}
                              >
                                Capture
                              </Button>
                            </Box>
                          </Box>
                        )}
                      </Grid>
                      <Grid item xs={12} sm={3} sx={{ overflowY: 'auto', height: 400 }}>
                        {console.log('file', file)}
                        {/* {file && file.size > 0 && <>{imagePreview(file)}</>} */}
                        {Array.isArray(file) && file.length > 0 && (
                          <>{file.map((el, index) => imagePreview(el, index))}</>
                        )}
                      </Grid>
                    </Grid>
                  )}

                  {/* Video preview */}
                </div>
              )}
            </Grid>
            {/* <Box sx={{ my: 4, ml: 'auto' }}>
              <LoadingButton
                loading={submitLoader}
                disabled={file && file?.size > 0 ? false : true}
                variant='contained'
                onClick={submitImage}
              >
                Submit Image
              </LoadingButton>
            </Box> */}
          </Grid>
        </TabPanel>
        <TabPanel value='by_input' sx={{ px: '24px' }}>
          {console.log('file', file)}
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
                  // onChange={e => {
                  //   const file = e.target.files[0]
                  //   if (!file) return
                  //   const allowedTypes = ['image/jpeg', 'image/png']
                  //   if (allowedTypes.includes(file.type)) {
                  //     setFile(file)
                  //     setError('')
                  //   } else {
                  //     setError('File type not allowed. Please upload a JPEG, or PNG.')
                  //     e.target.value = ''
                  //   }
                  // }}
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

                    // setFile(validFiles)
                    setFile(prev => [...prev, ...validFiles])
                    setError('')
                  }}
                />

                {/* <TextField
                  onClick={handleClick}
                  ref={browseButtonRef}
                  sx={{ border: '2px dashed green' }}
                  placeholder={
                    <Box display='flex' alignItems='center' gap={1}>
                      <Typography variant='body2' color='textSecondary'>
                        Add Invoice Copy*
                      </Typography>
                    </Box>
                  }
                  InputProps={{
                    readOnly: true,
                    startAdornment: (
                      <IconButton component='label' htmlFor='file-upload'>
                        <Icon icon='material-symbols-light:attach-file-add-rounded' width='24' height='24' />
                      </IconButton>
                    )
                  }}
                  error={Boolean(error)}
                  readOnly
                /> */}
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
                    pointerEvents: submitLoader ? 'none !important' : ''
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

                  {/* Upload Texts */}
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

                        // mb: 4,
                        padding: '0px',
                        color: 'customColor.neutralSecondary',
                        display: 'flex'
                      }}
                    >
                      Supported formats JPEG, PNG, PDF
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

                overflowX: 'auto'
              }}
            >
              {file &&
                file?.length > 0 &&
                file.map((el, index) => {
                  return (
                    <Box
                      key={index}
                      sx={{
                        position: 'relative',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        backgroundColor: 'customColors.displaybgPrimary',
                        padding: '8px',
                        boxShadow: 1,
                        height: 'auto',
                        mx: 2,
                        minWidth: '124px'
                      }}
                    >
                      <>
                        <img
                          alt='Preview'
                          src={URL.createObjectURL(el) || ''}
                          style={{ display: 'block', width: '116px', height: '96px' }}
                        />

                        <Icon
                          onClick={() => {
                            handleDeleteFile(index)

                            // setFile(null)
                            // if (browseButtonRef.current) browseButtonRef.current.value = ''
                          }}
                          icon='solar:close-square-bold'
                          style={{
                            position: 'absolute',
                            top: '0px',
                            right: '0px',
                            cursor: 'pointer',

                            pointerEvents: submitLoader ? 'none' : 'auto'
                          }}
                          width='24'
                          height='24'
                        />
                      </>
                    </Box>
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

          // position: 'absolute',
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
          loading={submitLoader}
          variant='outlined'
          onClick={() => {
            closeDialog()
          }}
          sx={{ mr: 2 }}
        >
          Cancel
        </LoadingButton>
        <LoadingButton
          loading={submitLoader}
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

export default PurchaseInvoiceUpload

//   {
//     "medicine_name": "ATARAX 25 TAB.",
//     "purchase_unit_price": 103.25,
//     "purchase_hsn_no": "30049088",
//     "purchase_batch_no": "E2402151",
//     "purchase_expiry_date": "2026-07-31",
//     "purchase_qty": 50.0,
//     "purchase_free_quantity": 0.0,
//     "purchase_purchase_price": 103.25,
//     "purchase_discount": 30.0,
//     "purchase_taxable_amount": 3613.73,
//     "purchase_gst": 12.0,
//     "gst_amount": 433.66,
//     "purchase_net_amount": 5162.5,
//     "purchase_variant_id": "15TAB",
//     "purchase_stock_item_id": null
// }
