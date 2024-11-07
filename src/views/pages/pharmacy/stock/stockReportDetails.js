// ** React Imports
import { useState, useEffect } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Button from '@mui/material/Button'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Next.js Imports
import { useRouter } from 'next/router'

const StockReportDetails = props => {
  // ** Props
  const {
    addEventSidebarOpen,
    handleSidebarClose,
    submitLoader,
    purchaseByStockIdList,
    purchaseLoading,
    setPurchaseLoading
  } = props

  const router = useRouter()

  console.log(purchaseByStockIdList, 'purchaseByStockIdList')

  //   const handleNavigate = productId => {
  //     router.push(`pharmacy/purchase/add-purchase/?id=${productId}&action=edit`)
  //   }

  const handleNavigate = productId => {
    router.push(`/pharmacy/purchase/add-purchase/?id=${productId}&action=edit&navigatedFrom=stockReport`)
  }

  return (
    <Drawer
      anchor='right'
      open={addEventSidebarOpen}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', 400] } }}
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
        <Typography variant='h6'>Stock Report Lists</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton size='small' onClick={handleSidebarClose} sx={{ color: 'text.primary' }}>
            <Icon icon='mdi:close' fontSize={20} />
          </IconButton>
        </Box>
      </Box>

      <Box className='sidebar-body' sx={{ p: theme => theme.spacing(5, 6) }}>
        {purchaseLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          purchaseByStockIdList.map((product, idx) => (
            <Card key={idx} sx={{ mb: 4, cursor: 'pointer' }} onClick={() => handleNavigate(product.id)}>
              <CardContent>
                <Typography variant='h6'>{product.stock_name}</Typography>
                {product.product_details.map((detail, index) => (
                  <Box key={index} mt={2}>
                    <Typography variant='body2'>Batch No: {detail.batch_no}</Typography>
                    <Typography variant='body2'>Net Amount: {detail.net_amount}</Typography>
                    <Typography variant='body2'>Unit Price: {detail.unit_price}</Typography>
                    <Typography variant='body2'>Quantity: {detail.qty}</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </Box>
    </Drawer>
  )
}

export default StockReportDetails

// // ** React Imports
// import { useState, useEffect } from 'react'

// // ** MUI Imports
// import Box from '@mui/material/Box'
// import Drawer from '@mui/material/Drawer'
// import IconButton from '@mui/material/IconButton'
// import Typography from '@mui/material/Typography'
// import { CircularProgress, Accordion, AccordionSummary, AccordionDetails, ListItemText, ListItem } from '@mui/material'
// import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
// import Button from '@mui/material/Button'

// // ** Icon Imports
// import Icon from 'src/@core/components/icon'

// // ** Next.js Imports
// import { useRouter } from 'next/router'

// const StockReportDetails = props => {
//   // ** Props
//   const {
//     addEventSidebarOpen,
//     handleSidebarClose,
//     handleSubmitData,
//     resetForm,
//     submitLoader,
//     editParams,
//     purchaseByStockIdList
//   } = props

//   const [loading, setLoading] = useState(true)
//   const [expanded, setExpanded] = useState(false)
//   const router = useRouter()

//   const handleAccordionChange = panel => (event, isExpanded) => {
//     setExpanded(isExpanded ? panel : false)
//   }

//   useEffect(() => {
//     if (purchaseByStockIdList && purchaseByStockIdList.length > 0) {
//       setLoading(false)
//     } else {
//       setLoading(true)
//     }
//   }, [purchaseByStockIdList])

//   const handleNavigate = productId => {
//     router.push(`pharmacy/purchase/add-purchase/?id=${productId}&action=edit`)
//   }

//   return (
//     <Drawer
//       anchor='right'
//       open={addEventSidebarOpen}
//       ModalProps={{ keepMounted: true }}
//       sx={{ '& .MuiDrawer-paper': { width: ['100%', 400] } }}
//     >
//       <Box
//         className='sidebar-header'
//         sx={{
//           display: 'flex',
//           justifyContent: 'space-between',
//           backgroundColor: 'background.default',
//           p: theme => theme.spacing(3, 3.255, 3, 5.255)
//         }}
//       >
//         <Typography variant='h6'>Stock Report Lists</Typography>
//         <Box sx={{ display: 'flex', alignItems: 'center' }}>
//           <IconButton size='small' onClick={handleSidebarClose} sx={{ color: 'text.primary' }}>
//             <Icon icon='mdi:close' fontSize={20} />
//           </IconButton>
//         </Box>
//       </Box>

//       <Box className='sidebar-body' sx={{ p: theme => theme.spacing(5, 6) }}>
//         {loading ? (
//           <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
//             <CircularProgress />
//           </Box>
//         ) : (
//           purchaseByStockIdList.map((product, idx) => (
//             <Box key={idx} mb={6}>
//               <Accordion expanded={expanded === `panel${idx}`} onChange={handleAccordionChange(`panel${idx}`)}>
//                 <AccordionSummary
//                   expandIcon={<ExpandMoreIcon />}
//                   aria-controls={`panel${idx}-content`}
//                   id={`panel${idx}-header`}
//                 >
//                   <Typography>{product.stock_name}</Typography>
//                 </AccordionSummary>
//                 <AccordionDetails>
//                   {product.product_details.map((detail, index) => (
//                     <ListItem key={index}>
//                       <ListItemText
//                         primary={`Batch No: ${detail.batch_no}`}
//                         secondary={
//                           <Box>
//                             <Typography variant='body2'>Net Amount: {detail.net_amount}</Typography>
//                             <Typography variant='body2'>Unit Price: {detail.unit_price}</Typography>
//                             <Typography variant='body2'>Quantity: {detail.qty}</Typography>
//                           </Box>
//                         }
//                       />
//                     </ListItem>
//                   ))}
//                   <Button
//                     variant='contained'
//                     color='primary'
//                     onClick={() => handleNavigate(product.id)}
//                     sx={{ float: 'right', mb: 4 }}
//                   >
//                     update product price
//                   </Button>
//                 </AccordionDetails>
//               </Accordion>
//             </Box>
//           ))
//         )}
//       </Box>
//     </Drawer>
//   )
// }

// export default StockReportDetails

// // ** React Imports
// import { useState, useEffect, useCallback, Fragment } from 'react'

// // ** MUI Imports
// import Box from '@mui/material/Box'
// import Drawer from '@mui/material/Drawer'

// import IconButton from '@mui/material/IconButton'
// import Typography from '@mui/material/Typography'

// import { LoadingButton } from '@mui/lab'

// // ** Third Party Imports

// // ** Icon Imports
// import Icon from 'src/@core/components/icon'
// import { CircularProgress, List, ListItem, ListItemText, ListSubheader } from '@mui/material'

// const StockReportDetails = props => {
//   // ** Props
//   const {
//     addEventSidebarOpen,
//     handleSidebarClose,
//     handleSubmitData,
//     resetForm,
//     submitLoader,
//     editParams,
//     purchaseByStockIdList
//   } = props

//   console.log(purchaseByStockIdList, 'purchaseByStockIdList')
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     if (purchaseByStockIdList && purchaseByStockIdList.length > 0) {
//       setLoading(false) // Data is available, hide the loader
//     } else {
//       setLoading(true) // Show the loader if the list is empty or being fetched
//     }
//   }, [purchaseByStockIdList])

//   return (
//     <Drawer
//       anchor='right'
//       open={addEventSidebarOpen}
//       ModalProps={{ keepMounted: true }}
//       sx={{ '& .MuiDrawer-paper': { width: ['100%', 400] } }}
//     >
//       <Box
//         className='sidebar-header'
//         sx={{
//           display: 'flex',
//           justifyContent: 'space-between',
//           backgroundColor: 'background.default',
//           p: theme => theme.spacing(3, 3.255, 3, 5.255)
//         }}
//       >
//         <Typography variant='h6'> Stock Report Lists</Typography>
//         <Box sx={{ display: 'flex', alignItems: 'center' }}>
//           <IconButton size='small' onClick={handleSidebarClose} sx={{ color: 'text.primary' }}>
//             <Icon icon='mdi:close' fontSize={20} />
//           </IconButton>
//         </Box>
//       </Box>
//       <Box className='sidebar-body' sx={{ p: theme => theme.spacing(5, 6) }}>
//         {loading ? (
//           <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
//             <CircularProgress />
//           </Box>
//         ) : (
//           purchaseByStockIdList.map((product, idx) => (
//             <Box key={idx} mb={3}>
//               <List subheader={<Box>{product.stock_name}</Box>}>
//                 {product.product_details.map((detail, index) => (
//                   <ListItem key={index}>
//                     <ListItemText
//                       primary={`Batch No: ${detail.batch_no}`}
//                       secondary={
//                         <Box>
//                           <Typography variant='body2'>Net Amount: {detail.net_amount}</Typography>
//                           <Typography variant='body2'>Unit Price: {detail.unit_price}</Typography>
//                           <Typography variant='body2'>Quantity: {detail.qty}</Typography>
//                         </Box>
//                       }
//                     />
//                   </ListItem>
//                 ))}
//               </List>
//             </Box>
//           ))
//         )}
//       </Box>
//     </Drawer>
//   )
// }

// export default StockReportDetails
