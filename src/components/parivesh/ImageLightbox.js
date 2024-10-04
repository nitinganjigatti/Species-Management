import React, { useState, useEffect } from 'react'
import { Avatar, Box, Tooltip } from '@mui/material'
import { SlideshowLightbox } from 'lightbox.js-react'
import 'lightbox.js-react/dist/index.css'

const ImageLightbox = ({ images }) => {
  const [imageStatuses, setImageStatuses] = useState({})

  // Handle both objects and direct URLs
  const imageArray = Array.isArray(images) ? images : [images]

  const formattedImages = imageArray.map(image => {
    if (typeof image === 'string') {
      return { attachment: image, attachment_name: '' }
    } else {
      return {
        attachment: image?.attachment,
        attachment_name: image?.attachment_name
      }
    }
  })

  useEffect(() => {
    formattedImages.forEach((image, index) => {
      if (image.attachment) {
        const img = new Image()
        img.onload = () => setImageStatuses(prev => ({ ...prev, [index]: 'loaded' }))
        img.onerror = () => setImageStatuses(prev => ({ ...prev, [index]: 'error' }))
        img.src = image.attachment
      } else {
        setImageStatuses(prev => ({ ...prev, [index]: 'error' }))
      }
    })
  }, [])

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap'
      }}
    >
      {formattedImages.map((image, index) => (
        <React.Fragment key={index}>
          {imageStatuses[index] === 'loaded' ? (
            <SlideshowLightbox theme='lightbox'>
              <img
                src={image.attachment}
                alt={image.attachment_name || ' '}
                style={{ cursor: 'pointer', width: '34px', height: '26px', objectFit: 'fill' }}
              />
            </SlideshowLightbox>
          ) : (
            // <Tooltip title='Image URL is incorrect or unavailable' arrow>
            <Avatar
              variant='square'
              src={image.attachment}
              alt={image.attachment_name || ''}
              sx={{
                width: '34px',
                height: '26px',
                cursor: 'pointer'
              }}
            />
            // </Tooltip>
          )}
        </React.Fragment>
      ))}
    </Box>
  )
}

export default ImageLightbox

// import React from 'react'
// import { Avatar, Box } from '@mui/material'
// import { SlideshowLightbox } from 'lightbox.js-react'
// import 'lightbox.js-react/dist/index.css'

// const ImageLightbox = ({ images }) => {
//   // Handle both objects and direct URLs
//   const imageArray = Array.isArray(images) ? images : [images]

//   const formattedImages = imageArray.map(image => {
//     if (typeof image === 'string') {
//       // If the image is a direct URL
//       return { attachment: image, attachment_name: '' }
//     } else {
//       // If the image is an object with properties
//       return {
//         attachment: image?.attachment,
//         attachment_name: image?.attachment_name
//       }
//     }
//   })

//   return (
//     <Box
//       sx={{
//         display: 'flex',
//         flexWrap: 'wrap'
//       }}
//     >
//       <SlideshowLightbox theme='lightbox'>
//         {formattedImages.map((image, index) => (
//           <img
//             key={index}
//             src={image.attachment}
//             alt={image.attachment_name || ' '}
//             style={{ cursor: 'pointer', margin: '5px', width: '30px', height: '24px', objectFit: 'fill' }}
//           />
//         ))}
//       </SlideshowLightbox>
//     </Box>
//   )
// }

// export default ImageLightbox

// import React from 'react'
// import { Box } from '@mui/material'
// import { SlideshowLightbox } from 'lightbox.js-react'
// import 'lightbox.js-react/dist/index.css'

// const ImageLightbox = ({ images }) => {
//   console.log(images, '...')
//   const imageArray = Array.isArray(images) ? images : [images]
//   return (
//     <Box
//       sx={{
//         display: 'flex',
//         flexWrap: 'wrap'
//       }}
//     >
//       <SlideshowLightbox theme='lightbox'>
//         {imageArray.map((image, index) => (
//           <img
//             key={index}
//             className='w-full rounded'
//             src={image?.attachment}
//             alt={image?.attachment_name}
//             style={{ cursor: 'pointer', margin: '5px', width: '40px', height: 'auto' }}
//           />
//         ))}
//       </SlideshowLightbox>
//     </Box>
//   )
// }

// export default ImageLightbox

// import React from 'react'
// import { Gallery, Item } from 'react-photoswipe-gallery'
// import 'photoswipe/dist/photoswipe.css'
// import { Box } from '@mui/material'

// const ImgSwipeComponent = ({ images }) => {
//   const imageArray = Array.isArray(images) ? images : [images]

//   const options = {
//     arrowPrev: true,
//     arrowNext: true,
//     zoom: true,
//     close: true,
//     counter: true,
//     fullscreenEl: true,
//     downloadEl: true

//     // maxSpreadZoom: 4, // Maximum zoom level
//     // pinchToClose: false ,// Prevent closing the gallery by pinching
//     // clickToCloseNonZoomable: false // Prevent closing the gallery by clicking on non-zoomed images

//     // bgOpacity: 0.2,
//     // padding: { top: 20, bottom: 40, left: 100, right: 100 }
//   }

//   return (
//     <Gallery options={options}>
//       <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
//         {imageArray.map(image => (
//           <Item key={image.id} original={image.attachment} thumbnail={image.attachment} width='1024' height='768'>
//             {({ ref, open }) => (
//               <img
//                 ref={ref}
//                 onClick={open}
//                 src={image.attachment}
//                 alt={image.attachment_name}
//                 style={{ cursor: 'pointer', margin: '5px', maxWidth: '40px', height: 'auto' }}
//               />
//             )}
//           </Item>
//         ))}
//       </Box>
//     </Gallery>
//   )
// }

// export default ImgSwipeComponent
