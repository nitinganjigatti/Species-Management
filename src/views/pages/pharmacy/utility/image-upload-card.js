import React, { Fragment } from 'react'
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

const ImageUploadComponent = ({ fields, setValue }) => {
  const removeselectedImage = selectedindex => {
    const list = [...fields]
    const filterList = list.filter((item, index) => selectedindex !== index)
    setValue('prescription_images', filterList)
  }

  const renderFilePreview = file => {
    if (typeof file === 'string') {
      return <img width={38} height={38} alt={file.name} src={`${base_url}${props.imgBaseUrl}${file}`} />
    }
    if (file instanceof Blob || file instanceof File) {
      return <img width={38} height={38} alt={file.name} src={URL.createObjectURL(file)} />
    } else {
      return <Icon icon='mdi:file-document-outline' />
    }
  }

  return (
    <Box>
      <CardContent>
        {/* <DropzoneWrapper className='dropzone'></DropzoneWrapper> */}
        <Fragment>
          <List>
            {fields?.map((image, index) => (
              // console.log('image results??????', image)
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <ListItem
                  sx={{
                    border: '1px solid grey',
                    padding: '5px',
                    borderRadius: '10px',
                    width: '300px',
                    margin: '10px'
                  }}
                  key={image?.file?.name}
                >
                  <div className='file-details'>
                    <div className='file-preview'>{renderFilePreview(image?.file)}</div>
                    <div>
                      <Typography className='file-name'>
                        {typeof file === 'string' ? image.file : image.file.name}
                      </Typography>
                    </div>
                  </div>{' '}
                  <IconButton onClick={() => removeselectedImage(index)}>
                    <Icon icon='mdi:close' fontSize={20} />
                  </IconButton>
                </ListItem>
              </Box>
            ))}
          </List>
        </Fragment>
        {/* <ImageUploadComponent fields={fields} /> */}
      </CardContent>
    </Box>
  )
}

export default ImageUploadComponent
