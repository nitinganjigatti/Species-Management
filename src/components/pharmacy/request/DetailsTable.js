import React, { useState } from 'react'
import MenuWithDots from 'src/components/MenuWithDots'
import {
  Grid,
  Card,
  TableContainer,
  TableCell,
  TableBody,
  TableRow,
  Table,
  TableHead,
  Box,
  Tooltip,
  Typography,
  Button,
  TablePagination,
  Select,
  MenuItem
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import Utility from 'src/utility'
import RenderUtility from 'src/utility/render'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'

export default function DetailsTable({ ...props }) {
  const theme = useTheme()

  // const [page, setPage] = useState(0)
  // const [rowsPerPage, setRowsPerPage] = useState(5)

  // const handleChangePage = (event, newPage) => {
  //   setPage(newPage)
  // }

  // const handleChangeRowsPerPage = event => {
  //   setRowsPerPage(parseInt(event.target.value, 10))
  //   setPage(0)
  // }

  // const paginatedItems = props?.items.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const renderTableCellContent = (el, props) => (
    <>
      <Typography variant='body1' sx={{ fontWeight: 600 }}>
        <Tooltip title={el.stock_name} placement='top'>
          <Typography
            variant='body1'
            sx={{
              fontWeight: 600,
              color: 'customColors.OnSecondaryContainer',
              display: 'flex',
              alignItems: 'center',
              fontWeight: 600,
              ...RenderUtility?.getEllipsisStyleForText(),
              ...props?.strikeOutTextStyle(el.request_status)
            }}
          >
            {RenderUtility?.renderControlLabel(
              !isNaN(el?.control_substance) && parseInt(el?.control_substance) === 1,
              'CS'
            )}
            {RenderUtility?.renderPrescriptionLabel(
              !isNaN(el?.prescription_required) && parseInt(el?.prescription_required) === 1,
              'PR'
            )}
            {el.stock_name}
          </Typography>
        </Tooltip>
      </Typography>

      <Tooltip
        title={`${el?.package} of ${el?.package_qty} ${el?.package_uom_label} ${el?.product_form_label}`}
        placement='top'
      >
        <Typography
          variant='body1'
          sx={{
            color: 'text.primary',
            fontSize: '14px !important',
            fontWeight: 400,
            ...RenderUtility?.getEllipsisStyleForText(),
            ...props?.strikeOutTextStyle(el.request_status)
          }}
        >
          {`${el?.package} of ${el?.package_qty} ${el?.package_uom_label} ${el?.product_form_label}`}
        </Typography>
      </Tooltip>

      {el?.description || el.alternate_comments ? (
        <TextEllipsisWithModal
          text={el?.description || el.alternate_comments}
          icon={'material-symbols:description-outline'}
          style={{ opacity: 0.5 }}
        />
      ) : null}

      {parseInt(el?.prescription_required) === 1 || parseInt(el?.control_substance) === 1 ? (
        <Grid
          sx={{
            display: 'flex',
            width: '100%',
            cursor: 'pointer'
          }}
        >
          <Box>{props?.renderAttachmentIcons(el)}</Box>
        </Grid>
      ) : null}
    </>
  )

  return (
    <Card
      sx={{
        minWidth: '100% !important',
        boxShadow: 'none !important',
        border: 'none !important',
        borderRadius: 'none !important',
        overflow: 'hidden'
      }}
    >
      <TableContainer
        sx={{
          border: `0.5px solid ${theme?.palette?.customColors?.OutlineVariant} !important`,

          // border: `0.5px solid ${theme.palette.customColors.OnSurfaceVariant}`,
          borderRadius: '10px !important'
        }}
      >
        <Table
          stickyHeader
          sx={{
            minWidth: 650,
            maxWidth: '100%',
            overflowX: 'scroll'
          }}
          aria-label='simple table'
        >
          <TableHead sx={{ backgroundColor: 'customColors.customTableHeaderBg !important' }}>
            <TableRow sx={{ width: '100%' }}>
              <TableCell
                sx={{
                  color: 'customColors.customTextColorGray2',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                SL.NO
              </TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>PRODUCT NAME</TableCell>

              <TableCell>QUANTITY</TableCell>
              <TableCell
                sx={{
                  textAlign: 'left'
                }}
              >
                FULFILL
              </TableCell>
              <TableCell>ACTION</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {props?.items?.length > 0
              ? props?.items?.map((el, index) => {
                  return (
                    <TableRow key={index} sx={{ overflowX: 'scroll' }}>
                      <TableCell
                        sx={{
                          backgroundColor: props?.getCellBgColor(el),
                          verticalAlign: 'top'
                        }}
                      >
                        <Typography
                          variant='subtitle2'
                          sx={{
                            color: 'text.primary',
                            minHeight: 104,
                            maxHeight: 104,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignContent: 'top',
                            alignItems: 'start'
                          }}
                        >
                          {/* {el.sl_no}. */}
                          {index + 1}.
                        </Typography>
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: props?.getCellBgColor(el),
                          verticalAlign: 'top'
                        }}
                      >
                        {/* {console.log('items', paginatedItems)} */}
                        {el.priority == 'high' || el.priority == 'emergency' ? (
                          <Box
                            sx={{
                              color: 'error.main',

                              minHeight: 104,
                              maxHeight: 104,
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignContent: 'top',
                              alignItems: 'center'
                            }}
                          >
                            {/* <Icon
                              icon='material-symbols-light:circle'
                              style={{
                                color: 'primary.error',
                                minHeight: '8px',
                                maxHeight: '8px'
                              }}
                            ></Icon> */}
                            {RenderUtility.getPriorityIcons(el?.priority)}
                          </Box>
                        ) : null}
                        {el?.priority !== 'high' && el?.priority !== 'emergency' && el?.alt_parent?.length > 0 && (
                          <Grid
                            key={index}
                            sx={{
                              minHeight: 104,
                              maxHeight: 104,
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignContent: 'top',
                              alignItems: 'center'
                            }}
                          ></Grid>
                        )}

                        {el?.alt_parent?.length > 0
                          ? el.alt_parent.map((el, index) => {
                              return (
                                <Grid
                                  key={index}
                                  sx={{
                                    minHeight: 104,
                                    maxHeight: 104,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignContent: 'top',
                                    alignItems: 'center'
                                  }}
                                >
                                  <Box
                                    sx={{
                                      minHeight: '43px',
                                      width: '30px',
                                      border: '1px solid ',
                                      color: 'white',
                                      padding: '4px',
                                      fontSize: '12px',
                                      borderRadius: '4px',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignContent: 'center',
                                      backgroundColor: 'customColors.neutralSecondary'
                                    }}
                                  >
                                    Alt
                                    <Box
                                      sx={{
                                        color: 'white',
                                        height: '16px',
                                        width: '16px',
                                        mx: 'auto'
                                      }}
                                    >
                                      <Icon
                                        icon='ic:outline-subdirectory-arrow-right'
                                        style={{
                                          color: 'white',
                                          height: '16px',
                                          width: '16px',
                                          mx: 'auto'
                                        }}
                                      />
                                    </Box>
                                  </Box>
                                </Grid>
                              )
                            })
                          : null}
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: props?.getCellBgColor(el),
                          verticalAlign: 'top',
                          height: 'auto'
                        }}
                      >
                        <Grid
                          sx={{
                            minHeight: 104,
                            maxHeight: 104,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            verticalAlign: 'top'
                          }}
                        >
                          <Box>{renderTableCellContent(el, props)}</Box>
                        </Grid>

                        {el?.alt_parent?.length > 0 &&
                          el.alt_parent.map((altEl, index) => (
                            <Grid
                              key={index}
                              container
                              direction='column'
                              sx={{
                                minHeight: 104,
                                maxHeight: 104,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                flexWrap: 'nowrap'
                              }}
                            >
                              <Box>{renderTableCellContent(altEl, props, Utility)}</Box>
                            </Grid>
                          ))}
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: props?.getCellBgColor(el),
                          verticalAlign: 'top'
                        }}
                      >
                        <Box
                          sx={{
                            minHeight: 104,
                            maxHeight: 104,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}
                        >
                          <Typography
                            variant='body1'
                            sx={{
                              color: 'text.primary',
                              fontSize: '14px !important',
                              fontWeight: 400,
                              ...props?.strikeOutTextStyle(el.request_status)
                            }}
                          >
                            Requested:{el?.requested_qty}
                          </Typography>
                          <Typography
                            variant='body1'
                            sx={{
                              color: 'text.primary',
                              fontSize: '14px !important',
                              fontWeight: 400,
                              ...props?.strikeOutTextStyle(el.request_status)
                            }}
                          >
                            Fulfilled:{el?.dispatch_qty}
                          </Typography>{' '}
                          <Typography
                            variant='body1'
                            sx={{
                              color: 'text.primary',
                              fontSize: '14px !important',
                              fontWeight: 400,
                              ...props?.strikeOutTextStyle(el.request_status)
                            }}
                          >
                            Shipped:{el?.shipped_qty}
                          </Typography>
                        </Box>
                        {el.alt_parent.length > 0
                          ? el.alt_parent.map((el, index) => {
                              return (
                                <Box
                                  key={index}
                                  container
                                  direction='column'
                                  sx={{
                                    minHeight: 104,
                                    maxHeight: 104,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <Typography
                                    variant='body1'
                                    sx={{
                                      color: 'text.primary',
                                      fontSize: '14px !important',
                                      fontWeight: 400,
                                      ...props?.strikeOutTextStyle(el.request_status)
                                    }}
                                  >
                                    Requested:{el?.requested_qty}
                                  </Typography>
                                  <Typography
                                    variant='body1'
                                    sx={{
                                      color: 'text.primary',
                                      fontSize: '14px !important',
                                      fontWeight: 400,
                                      ...props?.strikeOutTextStyle(el.request_status)
                                    }}
                                  >
                                    Fulfilled:{el?.dispatch_qty}
                                  </Typography>{' '}
                                  <Typography
                                    variant='body1'
                                    sx={{
                                      color: 'text.primary',
                                      fontSize: '14px !important',
                                      fontWeight: 400,
                                      ...props?.strikeOutTextStyle(el.request_status)
                                    }}
                                  >
                                    Shipped:{el?.shipped_qty}
                                  </Typography>
                                </Box>
                              )
                            })
                          : null}
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: props?.getCellBgColor(el),
                          verticalAlign: 'top'
                        }}
                      >
                        <>
                          {props?.selectedPharmacy.type === 'central' &&
                          parseInt(el.requested_qty) - parseInt(el.dispatch_qty) >= 1 &&
                          props?.requestItems.status !== 'Cancelled' &&
                          el.request_status !== 'Alternate' &&
                          el.request_status !== 'Not Available' &&
                          el.request_status !== 'Rejected' ? (
                            <Grid
                              sx={{
                                verticalAlign: 'top',
                                minHeight: 104,
                                maxHeight: 104,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                textAlign: 'left'
                              }}
                            >
                              <Button
                                size='small'
                                sx={{
                                  width: 100,
                                  ...props?.strikeOutTextStyle(el.request_status)
                                }}
                                disabled={
                                  props?.selectedPharmacy?.permission?.key === 'VIEW' ||
                                  (parseInt(el.requested_qty) - parseInt(el.dispatch_qty) >= 1 &&
                                  props?.requestItems.status !== 'Cancelled' &&
                                  el.request_status !== 'Alternate' &&
                                  el.request_status !== 'Not Available' &&
                                  el.request_status !== 'Rejected'
                                    ? false
                                    : true)
                                }
                                variant='contained'
                                onClick={() => {
                                  props?.setFulfillMedicine({
                                    ...el
                                  })

                                  props?.showDialog()
                                }}
                              >
                                Fulfill
                              </Button>
                            </Grid>
                          ) : (
                            <Grid
                              sx={{
                                verticalAlign: 'top',
                                minHeight: 104,
                                maxHeight: 104,
                                display: 'flex',
                                flexDirection: 'column',
                                textAlign: 'center',
                                justifyContent: 'center',
                                justifyItems: 'center',
                                textAlign: 'left'
                              }}
                            >
                              {(el.request_status === 'Not Available' || el.request_status === 'Rejected') && (
                                <Grid
                                  sx={{
                                    verticalAlign: 'top',
                                    minHeight: 104,
                                    maxHeight: 104,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    textAlign: 'left'
                                  }}
                                >
                                  <Button
                                    size='small'
                                    sx={{
                                      width: 100
                                    }}
                                    disabled={
                                      props?.selectedPharmacy?.permission?.key === 'VIEW' ||
                                      el.request_status === 'Not Available' ||
                                      el.request_status === 'Rejected'
                                        ? true
                                        : false
                                    }
                                    variant='contained'
                                    onClick={() => {
                                      props?.setFulfillMedicine({
                                        ...el
                                      })

                                      props?.showDialog()
                                    }}
                                  >
                                    Fulfill
                                  </Button>
                                </Grid>
                              )}

                              {el.alt_parent.length === 0 &&
                                el?.dispatch_status === 'Fulfilled' &&
                                el?.request_status !== 'Not Available' &&
                                el?.request_status !== 'Rejected' && (
                                  <Grid
                                    sx={{
                                      color: 'success.main',
                                      minHeight: 104,
                                      maxHeight: 104,
                                      display: 'flex',
                                      flexDirection: 'column',
                                      justifyContent: 'center',
                                      textAlign: 'left',
                                      alignItems: 'left'
                                    }}
                                  >
                                    <Icon icon='ion:checkmark-circle' style={{ color: 'primary.success' }} />
                                  </Grid>
                                )}
                            </Grid>
                          )}

                          {el.alt_parent.length > 0
                            ? el.alt_parent.map((nestElm, index) => {
                                return (
                                  <Grid
                                    key={index}
                                    direction='column'
                                    sx={{
                                      minHeight: 104,
                                      maxHeight: 104,
                                      display: 'flex',
                                      flexDirection: 'column',
                                      justifyContent: 'center',
                                      textAlign: 'left'
                                    }}
                                  >
                                    <Box>
                                      {props?.selectedPharmacy.type === 'central' &&
                                      parseInt(nestElm.requested_qty) - parseInt(nestElm.dispatch_qty) >= 1 &&
                                      props?.requestItems.status !== 'Cancelled' &&
                                      nestElm.request_status !== 'Alternate' &&
                                      nestElm.request_status !== 'Not Available' &&
                                      nestElm.request_status !== 'Rejected' ? (
                                        <Button
                                          size='small'
                                          sx={{
                                            width: 100,
                                            mx: 'auto',
                                            ...props?.strikeOutTextStyle(nestElm.request_status)
                                          }}
                                          disabled={props?.selectedPharmacy?.permission?.key === 'VIEW'}
                                          variant='contained'
                                          onClick={() => {
                                            props?.setFulfillMedicine({
                                              ...nestElm
                                            })

                                            props?.showDialog()
                                          }}
                                        >
                                          Fulfill
                                        </Button>
                                      ) : (
                                        <Grid>
                                          {(nestElm.request_status === 'Not Available' ||
                                            nestElm.request_status === 'Rejected') && (
                                            <Grid
                                              sx={{
                                                verticalAlign: 'top',
                                                minHeight: 104,
                                                maxHeight: 104,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center',
                                                textAlign: 'left'
                                              }}
                                            >
                                              <Button
                                                size='small'
                                                sx={{
                                                  width: 100
                                                }}
                                                disabled={
                                                  props?.selectedPharmacy?.permission?.key === 'VIEW' ||
                                                  nestElm.request_status === 'Not Available' ||
                                                  nestElm.request_status === 'Rejected'
                                                    ? true
                                                    : false
                                                }
                                                variant='contained'
                                                onClick={() => {
                                                  props?.setFulfillMedicine({
                                                    ...nestElm
                                                  })

                                                  props?.showDialog()
                                                }}
                                              >
                                                Fulfill
                                              </Button>
                                            </Grid>
                                          )}

                                          {el.alt_parent.length > 0 &&
                                            nestElm?.dispatch_status === 'Fulfilled' &&
                                            nestElm?.request_status !== 'Not Available' &&
                                            nestElm?.request_status !== 'Rejected' && (
                                              <Grid
                                                sx={{
                                                  color: 'success.main',
                                                  minHeight: 104,
                                                  maxHeight: 104,
                                                  display: 'flex',
                                                  flexDirection: 'column',
                                                  justifyContent: 'center',
                                                  textAlign: 'left',
                                                  alignItems: 'left',
                                                  border: '1px solid red'
                                                }}
                                              >
                                                <Icon
                                                  icon='ion:checkmark-circle'
                                                  style={{ color: 'primary.success' }}
                                                />
                                              </Grid>
                                            )}
                                        </Grid>
                                      )}
                                    </Box>

                                    {nestElm?.dispatch_qty === nestElm?.requested_qty && (
                                      <Box
                                        sx={{
                                          minHeight: 104,
                                          maxHeight: 104,
                                          display: 'flex',
                                          flexDirection: 'column',
                                          justifyContent: 'center',
                                          verticalAlign: 'top',
                                          color: 'success.main',
                                          textAlign: 'left',
                                          alignItems: 'left'
                                        }}
                                      >
                                        <Icon icon='ion:checkmark-circle' style={{ color: 'primary.success' }} />
                                      </Box>
                                    )}
                                  </Grid>
                                )
                              })
                            : null}
                        </>
                      </TableCell>

                      <TableCell
                        sx={{
                          backgroundColor: props?.getCellBgColor(el),
                          verticalAlign: 'top'
                        }}
                        align='right'
                      >
                        <>
                          {el?.alt_parent?.length > 0
                            ? el.alt_parent?.map((el, index) => {
                                return (
                                  <Grid
                                    key={index}
                                    container
                                    direction='column'
                                    sx={{
                                      minHeight: 104,
                                      maxHeight: 104,
                                      display: 'flex',
                                      flexDirection: 'column',
                                      justifyContent: 'center',

                                      // mb: 4,
                                      verticalAlign: 'top'
                                    }}
                                  >
                                    <Typography
                                      variant='body1'
                                      sx={{
                                        color: 'text.primary',
                                        textAlign: 'left',
                                        fontSize: '14px !important',
                                        fontWeight: 400,
                                        color: 'customColors.moderateSecondary'
                                      }}
                                    >
                                      Added Alternative
                                    </Typography>

                                    {el?.alternate_comments !== '' && (
                                      <TextEllipsisWithModal
                                        text={el?.alternate_comments}
                                        icon={'material-symbols:sticky-note-2-outline-sharp'}
                                        style={{ opacity: 0.5 }}
                                      />
                                    )}
                                  </Grid>
                                )
                              })
                            : null}
                          {props?.selectedPharmacy.type === 'central' && (
                            <>
                              {parseInt(el?.requested_qty) - parseInt(el?.dispatch_qty) >= 1 &&
                                el?.request_status !== 'Alternate' &&
                                el?.request_status !== 'Not Available' &&
                                el?.request_status !== 'Rejected' && (
                                  <Grid
                                    sx={{
                                      textAlign: 'left',
                                      minHeight: 104,
                                      maxHeight: 104,
                                      display: 'flex',
                                      flexDirection: 'column',
                                      justifyContent: 'center',
                                      alignContent: 'top',
                                      alignItems: 'start'
                                    }}
                                  >
                                    <MenuWithDots
                                      options={props?.generateOptions(el, props?.requestItems?.id)}
                                      disabled={props?.selectedPharmacy?.permission?.key === 'VIEW'}
                                    />
                                  </Grid>
                                )}
                            </>
                          )}
                          {el?.alt_parent?.length > 0
                            ? el.alt_parent
                                .filter(item => item.request_status === 'request')
                                .map((nesEl, index) => {
                                  return (
                                    <Grid
                                      key={index}
                                      container
                                      direction='column'
                                      sx={{
                                        minHeight: 104,
                                        maxHeight: 104,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignContent: 'top',
                                        alignItems: 'start'
                                      }}
                                    >
                                      {props?.selectedPharmacy.type === 'central' && (
                                        <Box
                                          sx={{
                                            ...props?.strikeOutTextStyle(nesEl?.request_status)
                                          }}
                                        >
                                          {parseInt(nesEl?.requested_qty) - parseInt(nesEl?.dispatch_qty) >= 1 &&
                                            nesEl?.request_status !== 'Alternate' &&
                                            nesEl?.request_status !== 'Not Available' &&
                                            nesEl?.request_status !== 'Rejected' && (
                                              <MenuWithDots
                                                options={props?.generateOptions(nesEl, nesEl?.id)}
                                                disabled={props?.selectedPharmacy?.permission?.key === 'VIEW'}
                                              />
                                            )}
                                        </Box>
                                      )}
                                    </Grid>
                                  )
                                })
                            : null}
                          {el?.alt_parent?.length > 0 &&
                            el?.alt_parent?.map(nestElt => {
                              return (
                                <>
                                  {nestElt?.request_status === 'Not Available' && (
                                    <Grid
                                      sx={{
                                        minHeight: 104,
                                        maxHeight: 104,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center'
                                      }}
                                    >
                                      <Typography
                                        variant='body1'
                                        sx={{
                                          color: 'error.main',
                                          textAlign: 'left',
                                          fontSize: '14px !important',
                                          fontWeight: 400
                                        }}
                                      >
                                        Stock Stopped
                                      </Typography>
                                      {nestElt?.alternate_comments && (
                                        <TextEllipsisWithModal
                                          text={nestElt?.alternate_comments}
                                          icon={'material-symbols:sticky-note-2-outline-sharp'}
                                          style={{ opacity: 0.5 }}
                                        />
                                      )}
                                    </Grid>
                                  )}
                                  {nestElt?.request_status === 'Rejected' && (
                                    <Grid
                                      sx={{
                                        minHeight: 104,
                                        maxHeight: 104,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center'
                                      }}
                                    >
                                      <Typography
                                        variant='body1'
                                        sx={{
                                          color: 'customColors.Tertiary',
                                          textAlign: 'left',
                                          fontSize: '14px !important',
                                          fontWeight: 400
                                        }}
                                      >
                                        Request Declined
                                      </Typography>
                                      {nestElt?.alternate_comments && (
                                        <TextEllipsisWithModal
                                          text={nestElt?.alternate_comments}
                                          icon={'material-symbols:sticky-note-2-outline-sharp'}
                                          style={{ opacity: 0.5 }}
                                        />
                                      )}
                                    </Grid>
                                  )}
                                </>
                              )
                            })}
                          {el?.request_status === 'Not Available' && (
                            <Grid
                              sx={{
                                minHeight: 104,
                                maxHeight: 104,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                              }}
                            >
                              <Typography
                                variant='body1'
                                sx={{
                                  color: 'error.main',
                                  textAlign: 'left',
                                  fontSize: '14px !important',
                                  fontWeight: 400
                                }}
                              >
                                Stock Stopped
                              </Typography>
                              {el?.alternate_comments && (
                                <TextEllipsisWithModal
                                  text={el?.alternate_comments}
                                  icon={'material-symbols:sticky-note-2-outline-sharp'}
                                  style={{ opacity: 0.5 }}
                                />
                              )}
                            </Grid>
                          )}
                          {el?.request_status === 'Rejected' && (
                            <Grid
                              sx={{
                                minHeight: 104,
                                maxHeight: 104,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                              }}
                            >
                              <Typography
                                variant='body1'
                                sx={{
                                  color: 'customColors.Tertiary',
                                  textAlign: 'left',
                                  fontSize: '14px !important',
                                  fontWeight: 400
                                }}
                              >
                                Request Declined
                              </Typography>
                              {el?.alternate_comments && (
                                <TextEllipsisWithModal
                                  text={el?.alternate_comments}
                                  icon={'material-symbols:sticky-note-2-outline-sharp'}
                                  style={{ opacity: 0.5 }}
                                />
                              )}
                            </Grid>
                          )}
                        </>
                      </TableCell>
                    </TableRow>
                  )
                })
              : null}
          </TableBody>
        </Table>
      </TableContainer>
      {/* <TablePagination
        component='div'
        count={props.items.length}
        page={page}
        rowsPerPageOptions={[5, 10, 25]}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      /> */}
    </Card>
  )
}
