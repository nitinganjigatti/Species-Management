import React, { Fragment, useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import CardContent from '@mui/material/CardContent'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import { Icon } from '@iconify/react'
import DropzoneWrapper from 'src/@core/styles/libs/react-dropzone'
import styled from '@emotion/styled'

// const styleComponent = styled(Box) => {{
//   minHeight: 100,
//     display: 'none',
//     flexWrap: 'wrap',
//     cursor: 'pointer',
//     position: 'relative',
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: theme.spacing(4),
//     borderRadius: theme.shape.borderRadius,
//     border: `2px dashed ${theme.palette.mode === 'light' ? 'rgba(93, 89, 98, 0.22)' : 'rgba(247, 244, 254, 0.14)'}`,
// }}

const ImageUploadComponent = ({ fields, setValue, prescriptionField, imgBaseUrl }) => {
  const base_url = `${process.env.NEXT_PUBLIC_BASE_URL}`

  const [prescriptionImage, setPrescriptionImage] = useState()
  debugger
  const removeselectedImage = selectedindex => {
    const list = [...fields]
    const filterList = list.filter((item, index) => selectedindex !== index)
    setValue('prescription_images', filterList)
  }

  useEffect(() => {
    // If prescriptionField
    debugger
    if (prescriptionField) {
      setPrescriptionImage(prescriptionField)
    }
    if (fields) {
      setPrescriptionImage(fields)
    }
  }, [fields, prescriptionField])

  const renderFilePreview = file => {
    debugger
    console.log('file???', file)
    if (typeof file === 'string') {
      return (
        <img
          style={{
            width: '38px',
            height: '38px',
            padding: '0.1875rem',
            borderRadius: '10px',
            border: '1px solid rgba(93, 89, 98, 0.14)'
          }}
          alt={file.name}
          src={`${base_url}${imgBaseUrl}${file}`}
        />
      )
    }
    if (file instanceof Blob || file instanceof File) {
      return (
        <img
          style={{
            width: '38px',
            height: '38px',
            padding: '0.1875rem',
            borderRadius: '10px',
            border: '1px solid rgba(93, 89, 98, 0.14)'
          }}
          alt={file.file.name}
          src={URL.createObjectURL(file.File)}
        />
      )
    } else {
      return <Icon icon='mdi:file-document-outline' />
    }
  }

  console.log('prescriptionImage????', prescriptionImage)

  return (
    <Box>
      {/* <CardContent> */}
      {/* <DropzoneWrapper className='dropzone'></DropzoneWrapper> */}

      <List>
        {prescriptionImage?.map((image, index) => (
          <ListItem
            sx={{
              borderRadius: '10px',
              width: '300px',
              marginBottom: '6px'
            }}
            key={image?.file?.name}
          >
            <div style={{ display: 'flex', justifyContent: 'space-around', margin: '10px' }}>
              <div className='file-preview'>{renderFilePreview(image)}</div>
              <div style={{ margin: '3px' }}>
                <Typography className='file-name'>{typeof file === 'string' ? image : image?.file?.name}</Typography>
              </div>
            </div>{' '}
            <IconButton onClick={() => removeselectedImage(index)}>
              <Icon icon='mdi:close' fontSize={20} />
            </IconButton>
          </ListItem>
        ))}
      </List>
      {/* <ImageUploadComponent fields={fields} /> */}
      {/* </CardContent> */}
    </Box>
  )
}

export default ImageUploadComponent
