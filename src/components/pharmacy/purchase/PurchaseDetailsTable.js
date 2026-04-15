import {
  Table,
  TableRow,
  TableHead,
  TableBody,
  Typography,
  Box,
  TableContainer,
  TableCell,
  IconButton
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import Utility from 'src/utility'

const PurchaseDetailsTable = ({ purchaseDetails, onEdit, onDelete, isEditMode }) => {
  const theme = useTheme()

  return (
    <TableContainer sx={{ borderRadius: '8px' }}>
      <Table
        stickyHeader
        sx={{
          minWidth: 650,
          overflowX: 'scroll',
          '& .MuiTableHead-root': {
            '& th:first-of-type': {
              borderTopLeftRadius: '8px' // Top-left corner for the first column
            },
            '& th:last-of-type': {
              borderTopRightRadius: '8px' // Top-right corner for the last column
            }
          },
          '& .MuiTableCell-root': {
            borderBottom: 'none' // Remove cell borders for a clean look
          }
        }}
        aria-label='simple table'
      >
        <TableHead sx={{ backgroundColor: theme?.palette?.customColors?.tableHeaderBg }}>
          <TableRow>
            <TableCell rowSpan={2} sx={{ minWidth: 20 }}>
              SL.No
            </TableCell>
            <TableCell rowSpan={2} sx={{ minWidth: 300 }}>
              Product Name
            </TableCell>
            <TableCell rowSpan={2} sx={{ textAlign: 'center' }}>
              Batch
            </TableCell>
            <TableCell rowSpan={2} sx={{ minWidth: 130, textAlign: 'center' }}>
              Expiry Date
            </TableCell>
            <TableCell rowSpan={2} align='right'>
              Quantity
            </TableCell>
            <TableCell rowSpan={2} align='right'>
              Rate
            </TableCell>
            <TableCell rowSpan={2} align='right' sx={{ minWidth: 130 }}>
              Discount in %
            </TableCell>
            <TableCell rowSpan={2} align='right' sx={{ minWidth: 130 }}>
              Net Amount
            </TableCell>
            <TableCell rowSpan={2} align='right' sx={{ minWidth: 130, whiteSpace: 'nowrap' }}>
              Gross Amount
            </TableCell>

            <TableCell colSpan={2} align='center'>
              CGST
            </TableCell>
            <TableCell colSpan={2} align='center'>
              SGST
            </TableCell>
            <TableCell colSpan={2} align='center'>
              IGST
            </TableCell>
            <TableCell rowSpan={2} align='right'>
              Action
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell
              sx={{
                borderTopLeftRadius: '0px !important'
              }}
              align='center'
            >
              Rate
            </TableCell>
            <TableCell align='center'>Amount</TableCell>
            <TableCell align='center'>Rate</TableCell>
            <TableCell align='center'>Amount</TableCell>
            <TableCell align='center'>Rate</TableCell>
            <TableCell
              sx={{
                borderTopRightRadius: '0px !important'
              }}
              align='center'
            >
              Amount
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {purchaseDetails
            ? purchaseDetails.map((el, index) => {
                return (
                  <TableRow key={`${index}${el?.medicine_name}`} sx={{ overflowX: 'scroll' }}>
                    <TableCell>
                      <Typography variant='body2'>{index + 1}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ color: (!el?.purchase_stock_item_id || !el?.medicine_name) && 'error.main' }}>
                        {el?.medicine_name}
                      </Typography>
                      <Typography variant='body2'>{el?.package_details}</Typography>
                      <Typography variant='body2'>{el?.manufacture}</Typography>
                    </TableCell>
                    <TableCell>{el?.purchase_batch_no}</TableCell>
                    <TableCell>
                      {el?.stock_type === 'non_medical' ? 'NA' : Utility.formatDisplayDate(el?.purchase_expiry_date)}
                    </TableCell>
                    <TableCell align='right'>{el?.purchase_qty}</TableCell>
                    <TableCell align='right'>{Utility.formatAmountToReadableDigit(el?.purchase_unit_price)}</TableCell>
                    <TableCell align='right'>{el?.purchase_discount}%</TableCell>
                    <TableCell align='right'>{Utility.formatAmountToReadableDigit(el?.purchase_net_amount)}</TableCell>
                    <TableCell align='right'>
                      {Utility.formatAmountToReadableDigit(el?.purchase_gross_amount)}
                    </TableCell>

                    <TableCell align='center'>{el?.purchase_cgst}%</TableCell>
                    <TableCell align='center'>
                      {Utility.formatAmountToReadableDigit(el?.purchase_cgst_amount)}
                    </TableCell>

                    <TableCell align='center'>{el?.purchase_sgst}%</TableCell>
                    <TableCell align='center'>
                      {Utility.formatAmountToReadableDigit(el?.purchase_sgst_amount)}
                    </TableCell>

                    <TableCell align='center'>{el?.purchase_igst}%</TableCell>
                    <TableCell align='center'>
                      {Utility.formatAmountToReadableDigit(el?.purchase_igst_amount)}
                    </TableCell>
                    <TableCell align='center'>
                      <Box sx={{ display: 'flex' }}>
                        <IconButton size='small' sx={{ mr: 0.5 }} aria-label='Edit' onClick={() => onEdit(el, index)}>
                          <Icon icon='mdi:pencil-outline' />
                        </IconButton>

                        {isEditMode && el.id ? null : (
                          <IconButton onClick={() => onDelete(el?.uid)} size='small' sx={{ mr: 0.5 }}>
                            <Icon icon='mdi:delete-outline' />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                )
              })
            : null}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default PurchaseDetailsTable
