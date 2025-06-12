// ** MUI Imports
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import RenderUtility from 'src/utility/render'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Next.js Imports
import { useRouter } from 'next/router'
import { Divider, InputAdornment, TextField, Tooltip } from '@mui/material'
import Utility from 'src/utility'
import { ClearIcon } from '@mui/x-date-pickers'

const StockReportDetails = props => {
  // ** Props same as before
  const {
    addEventSidebarOpen,
    handleSidebarClose,
    submitLoader,
    purchaseByStockIdList,
    purchaseLoading,
    setPurchaseLoading,
    handleInputChange,
    searchPurchase,
    setSearchPurchase,
    handleClearSearch
  } = props

  const router = useRouter()

  const handleNavigate = productId => {
    const url = `/pharmacy/purchase/add-purchase/?id=${productId}&action=edit&navigatedFrom=stockReport`
    window.open(url, '_blank')
  }

  return (
    <Drawer
      anchor='right'
      open={addEventSidebarOpen}
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': {
          width: {
            xs: '100%',
            sm: 400
          },
          height: '100%',
          overflow: 'hidden'
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}
      >
        {/* Header */}
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1,
            backgroundColor: 'background.default'

            // borderBottom: '1px solid',
            // borderColor: 'divider'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              width: '100%',
              justifyContent: 'space-between',
              p: theme => theme.spacing(3, 3.255, 3, 5.255)
            }}
          >
            <Tooltip title={purchaseByStockIdList[0]?.stock_name} placement='top'>
              <Typography
                sx={{
                  mx: 'auto',
                  py: 2,
                  fontSize: 16,
                  fontWeight: 'bold',
                  ...RenderUtility?.getEllipsisStyleForText(400)
                }}
              >
                {purchaseByStockIdList[0]?.stock_name}
              </Typography>
            </Tooltip>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size='small' onClick={handleSidebarClose} sx={{ color: 'text.primary' }}>
                <Icon icon='mdi:close' fontSize={20} />
              </IconButton>
            </Box>
          </Box>
        </Box>

        <TextField
          fullWidth
          size='small'
          placeholder='Search...'
          value={searchPurchase}
          onChange={handleInputChange}
          sx={{ px: 4, mt: 4, mb: 1 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position='start'>
                  <Icon icon='mdi:magnify' />
                </InputAdornment>
              ),
              endAdornment: searchPurchase && (
                <InputAdornment position='end'>
                  <IconButton size='small' onClick={handleClearSearch}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }
          }}
        />

        {/* Scrollable Content */}
        <Box
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            p: theme => theme.spacing(4, 4),
            height: 'calc(100% - 140px)'
          }}
        >
          {purchaseLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : (
            purchaseByStockIdList.map((product, idx) => (
              <Card key={idx} sx={{ mb: 4, cursor: 'pointer' }} onClick={() => handleNavigate(product.id)}>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      backgroundColor: 'grey.100',
                      p: 2,
                      borderRadius: 0.5
                    }}
                  >
                    <Typography sx={{ fontSize: '14px', fontWeight: '400' }}>
                      Purchase No
                      <br /> <strong>{product.po_no}</strong>
                    </Typography>
                    <Typography sx={{ fontSize: '14px', fontWeight: 400 }}>
                      Date <br />
                      <strong>{Utility.formatDisplayDate(product.po_date)}</strong>
                    </Typography>
                  </Box>
                  {product.product_details.map((detail, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        py: '6px',
                        borderTop: index == 0 ? '0px solid' : '1px solid rgb(245, 245, 245)'
                      }}
                    >
                      <div>
                        <Typography sx={{ fontSize: '14px', fontWeight: 400 }}>
                          Net Unit Price: {detail.unit_price}
                        </Typography>
                        <Typography sx={{ fontSize: '14px', fontWeight: 400 }}>Quantity: {detail.qty}</Typography>
                      </div>
                      <div>
                        <Typography sx={{ fontSize: '14px', fontWeight: 400 }}>
                          Net Amount: {detail.net_amount}
                        </Typography>
                        <Typography sx={{ fontSize: '14px', fontWeight: '400' }}>
                          Batch No: {detail.batch_no}
                        </Typography>
                      </div>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      </Box>
    </Drawer>
  );
}

export default StockReportDetails

// // ** MUI Imports
// import Box from '@mui/material/Box'
// import Drawer from '@mui/material/Drawer'
// import IconButton from '@mui/material/IconButton'
// import Typography from '@mui/material/Typography'
// import CircularProgress from '@mui/material/CircularProgress'
// import Card from '@mui/material/Card'
// import CardContent from '@mui/material/CardContent'
// import RenderUtility from 'src/utility/render'

// // ** Icon Imports
// import Icon from 'src/@core/components/icon'

// // ** Next.js Imports
// import { useRouter } from 'next/router'
// import { Divider, InputAdornment, TextField, Tooltip } from '@mui/material'
// import Utility from 'src/utility'
// import { ClearIcon } from '@mui/x-date-pickers'

// const StockReportDetails = props => {
//   // ** Props
//   const {
//     addEventSidebarOpen,
//     handleSidebarClose,
//     submitLoader,
//     purchaseByStockIdList,
//     purchaseLoading,
//     setPurchaseLoading,
//     handleInputChange,
//     searchPurchase,
//     setSearchPurchase,
//     handleClearSearch
//   } = props

//   const router = useRouter()

//   const handleNavigate = productId => {
//     // router.push(`/pharmacy/purchase/add-purchase/?id=${productId}&action=edit&navigatedFrom=stockReport`)
//     const url = `/pharmacy/purchase/add-purchase/?id=${productId}&action=edit&navigatedFrom=stockReport`
//     window.open(url, '_blank')
//   }

//   console.log(purchaseByStockIdList, 'purchaseByStockIdList')

//   return (
//     <Drawer
//       anchor='right'
//       open={addEventSidebarOpen}
//       ModalProps={{ keepMounted: true }}
//       sx={{ '& .MuiDrawer-paper': { width: ['100%', 400] } }}
//     >
//       <Box
//         sx={{
//           position: 'fixed',
//           top: 0,

//           // width: 'auto',
//           width: '-webkit-fill-available',
//           backgroundColor: 'white',
//           maxWidth: 400
//         }}
//       >
//         <Box
//           className='sidebar-header'
//           sx={{
//             display: 'flex',
//             width: '100%',
//             justifyContent: 'space-between',
//             backgroundColor: 'background.default',
//             p: theme => theme.spacing(3, 3.255, 3, 5.255)
//           }}
//         >
//           <Tooltip title={purchaseByStockIdList[0]?.stock_name} placement='top'>
//             <Typography
//               sx={{
//                 mx: 'auto',
//                 py: 2,
//                 fontSize: 16,
//                 fontWeight: 'bold',
//                 ...RenderUtility?.getEllipsisStyleForText(400)
//               }}
//             >
//               {purchaseByStockIdList[0]?.stock_name ? purchaseByStockIdList[0]?.stock_name : null}
//             </Typography>
//           </Tooltip>
//           <Box sx={{ display: 'flex', alignItems: 'center' }}>
//             <IconButton size='small' onClick={handleSidebarClose} sx={{ color: 'text.primary' }}>
//               <Icon icon='mdi:close' fontSize={20} />
//             </IconButton>
//           </Box>
//         </Box>

//         <TextField
//           fullWidth
//           size='small'
//           placeholder='Search...'
//           variant='outlined'
//           value={searchPurchase}
//           onChange={handleInputChange}
//           sx={{ my: 4, px: 4, width: ['100%', 400] }}
//           InputProps={{
//             startAdornment: (
//               <InputAdornment position='start'>
//                 <Icon icon='mdi:magnify' />
//               </InputAdornment>
//             ),
//             endAdornment: searchPurchase && (
//               <InputAdornment position='end'>
//                 <IconButton size='small' onClick={handleClearSearch}>
//                   <ClearIcon />
//                 </IconButton>
//               </InputAdornment>
//             )
//           }}
//         />
//       </Box>

//       <Box className='sidebar-body' sx={{ p: theme => theme.spacing(5, 6), mt: '120px' }}>
//         {purchaseLoading ? (
//           <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
//             <CircularProgress />
//           </Box>
//         ) : (
//           purchaseByStockIdList.map((product, idx) => (
//             <Card key={idx} sx={{ mb: 4, cursor: 'pointer' }} onClick={() => handleNavigate(product.id)}>
//               <CardContent>
//                 <Box
//                   sx={{
//                     display: 'flex',
//                     justifyContent: 'space-between',
//                     backgroundColor: 'grey.100',
//                     p: 2,
//                     borderRadius: 0.5,
//                     mt: 1
//                   }}
//                 >
//                   <Typography sx={{ fontSize: '14px', fontWeight: '400' }}>
//                     Purchase No
//                     <br /> <strong>{product.po_no}</strong>
//                   </Typography>
//                   <Typography sx={{ fontSize: '14px', fontWeight: 400 }}>
//                     Date <br />
//                     <strong>{Utility.formatDisplayDate(product.po_date)}</strong>
//                   </Typography>
//                 </Box>
//                 {product.product_details.map((detail, index) => (
//                   <Box key={index}>
//                     <Box
//                       sx={{
//                         display: 'flex',
//                         justifyContent: 'space-between',
//                         py: '6px',
//                         borderTop: index == 0 ? '0px solid' : '1px solid rgb(245, 245, 245)'
//                       }}
//                     >
//                       <div>
//                         <Typography sx={{ fontSize: '14px', fontWeight: 400 }}>
//                           Unit Price: {detail.unit_price}
//                         </Typography>
//                         <Typography sx={{ fontSize: '14px', fontWeight: 400 }}>Quantity: {detail.qty}</Typography>
//                       </div>
//                       <div>
//                         <Typography sx={{ fontSize: '14px', fontWeight: 400 }}>
//                           Net Amount: {detail.net_amount}
//                         </Typography>
//                         <Typography sx={{ fontSize: '14px', fontWeight: '400' }}>
//                           Batch No: {detail.batch_no}
//                         </Typography>
//                       </div>
//                     </Box>
//                   </Box>
//                 ))}
//               </CardContent>
//             </Card>
//           ))
//         )}
//       </Box>
//     </Drawer>
//   )
// }

// export default StockReportDetails
