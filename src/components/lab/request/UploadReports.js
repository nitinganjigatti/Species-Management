/* eslint-disable lines-around-comment */
import { Button, Card, CardContent, CardHeader, Grid, Input, Typography } from '@mui/material'
import React, { useState } from 'react'
import FileUploaderSingle from 'src/views/forms/form-elements/file-uploader/FileUploaderSingle'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, Controller } from 'react-hook-form'
import { LoadingButton } from '@mui/lab'
import { UploadLabReports } from 'src/lib/api/lab/getLabRequest'

const UploadReports = ({ animalID, labTestId, medicalRecordId }) => {
  const [uploadedImage, setUploadedImage] = useState()
  const [files, setFiles] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const onImageUpload = async imageData => {
    setFiles(imageData)
  }

  const defaultValues = {}

  const schema = yup.object().shape({
    // document: yup.mixed().required('Please upload a document')
  })

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors },
    trigger,
    setValue,
    getValues
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const handleSubmitData = async () => {
    try {
      const errors = await trigger()
      if (errors) {
        handleSubmit(onSubmit)()
      } else {
        scrollToTop()
      }
    } catch (error) {
      console.error(error)
    }

    // handleSubmit(onSubmit)()
  }

  const onSubmit = async params => {
    setSubmitting(true)

    const lab_test_files = []

    if (files.length > 0) {
      lab_test_files.push({
        type: 'image',
        file: files[0]
      })
    }

    // Add document to lab_test_files array
    if (selectedFile) {
      lab_test_files.push({
        type: 'document',
        file: selectedFile
      })
    }

    const payload = {
      medical_record_id: medicalRecordId,
      animal_id: animalID,
      lab_test_id: labTestId,
      lab_test_files
    }

    try {
      const res = await UploadLabReports(payload)

      // Reset the form after successful submission
      reset()
    } catch (error) {
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  //document uploder
  const handleFileChange = event => {
    const file = event.target.files[0]
    setSelectedFile(file)
  }

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container>
          <Grid item md={12} xs={12} sm={12} sx={{ m: 5 }}>
            <Card>
              <CardHeader title='Upload Image' />
              <CardContent>
                <FileUploaderSingle onImageUpload={onImageUpload} image={uploadedImage} />
              </CardContent>
            </Card>
          </Grid>

          {/* <Grid item md={4} xs={12} sm={12}>
            <Card>
              <CardHeader title='Document Upload' />
              <CardContent>
                <Typography variant='h5' gutterBottom>
                  Drop file here or click to upload
                </Typography>
                <Controller
                  name='document'
                  control={control}
                  defaultValue={null}
                  render={({ field }) => (
                    <>
                      <Input
                        type='file'
                        onChange={e => {
                          handleFileChange(e)
                          field.onChange(e)
                        }}
                      />
                      {errors.document && <Typography color='error'>{errors.document.message}</Typography>}
                    </>
                  )}
                />
                {selectedFile && (
                  <div>
                    <Typography variant='h6' gutterBottom>
                      Uploaded Document
                    </Typography>
                    <Typography>{selectedFile.name}</Typography>
                  </div>
                )}
              </CardContent>
            </Card>
          </Grid> */}
        </Grid>
        <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '10px', gap: 10, marginRight: 15 }}>
          <LoadingButton loading={submitting} onClick={handleSubmitData} type='submit' variant='contained'>
            Upload
          </LoadingButton>
          <LoadingButton onClick={() => setFiles([])} type='submit' variant='outlined'>
            Reset
          </LoadingButton>
        </div>
      </form>
    </div>
  )
}

export default UploadReports
