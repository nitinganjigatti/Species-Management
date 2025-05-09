import { useState } from 'react'

// ** MUI Imports

import IconButton from '@mui/material/IconButton'
import { alpha } from '@mui/material'
import { useTheme } from '@emotion/react'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import {
  Drawer,
  CardHeader,
  Grid,
  Card,
  Avatar,
  Box,
  Typography,
  Button,
  Divider,
  CircularProgress
} from '@mui/material'

import RenderUtility from 'src/utility/render'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import Utility from 'src/utility'
import MenuWithDots from 'src/components/MenuWithDots'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import PharmacyProductCard from 'src/views/utility/PharmacyProductCard'

// ** Icon Imports

const RequestedProductDetails = props => {
  // ** Props
  const {
    addEventSidebarOpen,
    handleSidebarClose,
    requestedProducts,
    generateOptions,
    fullFillRequestItem,
    drawerLoader
  } = props
  const theme = useTheme()
  const { selectedPharmacy } = usePharmacyContext()

  // ** State

  const getStatusLabel = item => {
    let backgroundColor, label, color

    switch (item?.request_status) {
      case 'Alternate':
        backgroundColor = theme.palette.customColors.Notes
        label = 'Added Alternative'
        break
      case 'Not Available':
        color = theme.palette.error.main
        backgroundColor = alpha(theme.palette.customColors.ErrorContainer, 0.5)
        label = 'Stock Stopped'
        break
      case 'Rejected':
        color = theme.palette.customColors.Tertiary
        backgroundColor = alpha(theme.palette.customColors.TertiaryContainer, 0.5)
        label = 'Request Declined'
        break
      default:
        return null
    }

    return (
      <Typography
        sx={{
          color: item?.request_status === 'Alternate' ? theme.palette.customColors.OnSurfaceVariant : color,
          fontSize: '12px',
          fontWeight: 400,
          fontFamily: 'Inter',
          padding: '4px',
          borderRadius: '4px',
          backgroundColor: backgroundColor,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        {label}
      </Typography>
    )
  }

  const AlterNativeCard = requestedProducts => {
    return (
      <Box>
        {requestedProducts?.alt_parent?.length > 0 &&
          requestedProducts?.alt_parent?.map((nestedChildElm, index) => (
            <Grid key={index} item xs={12} sm={12} mb={2}>
              <Card
                sx={{
                  border: `0.5px solid${theme.palette.customColors.Notes}`,
                  py: '16px',
                  boxShadow: 'none',
                  mt: '8px',
                  paddingBottom: 0,
                  backgroundColor: theme => alpha(theme.palette.customColors.Notes, 0.2)
                }}
              >
                <CardHeader
                  sx={{
                    pl: 3,
                    py: 0
                  }}
                  title={
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 2
                      }}
                    >
                      <Box
                        sx={{
                          minHeight: '43px',
                          maxHeight: '43px',
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
                      <Box>
                        <Typography
                          sx={{
                            color: theme.palette.customColors.OnPrimaryContainer,
                            fontSize: '16px',
                            fontWeight: 500,
                            fontFamily: 'Inter',
                            display: 'flex',
                            gap: 2
                          }}
                        >
                          {RenderUtility.getPriorityIcons(nestedChildElm?.priority)}{' '}
                          {nestedChildElm?.stock_name ? nestedChildElm?.stock_name : 'NA'}
                        </Typography>

                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            '& svg': { color: 'success.main' }
                          }}
                        >
                          <Typography
                            variant='caption'
                            sx={{
                              color: theme.palette.customColors.neutralSecondary,
                              fontSize: '12px',
                              fontWeight: 400,
                              fontFamily: 'Inter',
                              mr: 2,
                              py: '4px'
                            }}
                          >
                            {`${nestedChildElm?.package} of ${Utility.formatNumber(nestedChildElm?.package_qty)}
        ${nestedChildElm?.package_uom_label} ${nestedChildElm?.product_form_label}`}
                          </Typography>

                          {RenderUtility.attachedFiles({
                            control_substance: nestedChildElm?.control_substance,
                            fontStyle: {
                              color: theme.palette.primary.main,
                              fontSize: '12px',
                              fontWeight: 400
                            },
                            iconStyle: {
                              color: theme.palette.primary.main
                            },
                            prescriptionFile: nestedChildElm?.prescription_required_file
                          })}
                        </Box>
                        <Box
                          sx={{
                            ml: -1
                          }}
                        >
                          {(nestedChildElm?.alternate_comments?.trim() || nestedChildElm?.description?.trim()) && (
                            <TextEllipsisWithModal
                              text={nestedChildElm?.alternate_comments || nestedChildElm?.description}
                              icon='material-symbols:description-outline'
                              style={{
                                color: theme.palette.customColors.OnSurfaceVariant,
                                fontSize: '12px',
                                fontWeight: 400,
                                maxWidth: '70%'
                              }}
                              limit='150'
                              iconColor={theme.palette.customColors.moderateSecondary}
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>
                  }
                  titleTypographyProps={{ variant: 'h6' }}
                  action={
                    parseInt(nestedChildElm?.requested_qty) - parseInt(nestedChildElm?.dispatch_qty) >= 1 &&
                    nestedChildElm?.request_status !== 'Alternate' &&
                    nestedChildElm?.request_status !== 'Not Available' &&
                    nestedChildElm?.request_status !== 'Rejected' &&
                    selectedPharmacy.type !== 'local' && (
                      // eslint-disable-next-line lines-around-comment

                      <MenuWithDots
                        options={generateOptions(nestedChildElm, nestedChildElm?.id)}
                        disabled={selectedPharmacy.type === 'local'}
                      />
                    )
                  }
                />

                <Box>
                  <Grid
                    container
                    sx={{
                      padding: '12px 12px 8px 12px',
                      borderRadius: '8px',
                      display: 'flex',
                      gap: 2,
                      justifyContent: 'space-between'

                      // border: '1px solid red'
                      // backgroundColor: theme => alpha(theme.palette.customColors.neutral05, 0.1)
                    }}
                  >
                    {nestedChildElm?.alternativeQuantityStatus?.map((item, index) => (
                      <Grid
                        key={index}
                        md={2}
                        xs={2}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            alignItems: 'start'
                          }}
                        >
                          <Typography
                            sx={{
                              color: theme.palette.customColors.OnSurfaceVariant,
                              fontSize: '14px',
                              fontWeight: 400,
                              fontFamily: 'Inter'
                            }}
                          >
                            {item.label}
                          </Typography>
                          <Typography
                            sx={{
                              color: theme.palette.customColors.OnPrimaryContainer,
                              fontSize: '20px',
                              fontWeight: 500,
                              fontFamily: 'Inter'
                            }}
                          >
                            {item.value}
                          </Typography>
                        </Box>

                        {index < nestedChildElm?.alternativeQuantityStatus?.length - 1 && (
                          <Divider
                            orientation='vertical'
                            flexItem
                            sx={{
                              ml: 2,
                              height: '100%',
                              alignSelf: 'center',
                              color: 'red !important',
                              backgroundColor: theme => alpha(theme.palette.customColors.neutral05)
                            }}
                          />
                        )}
                      </Grid>
                    ))}

                    <Grid
                      md={3}
                      xs={3}
                      sx={{
                        display: 'flex',
                        justifyContent: 'right'
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          flexDirection: 'column',
                          alignItems: 'end'
                        }}
                      >
                        {parseInt(nestedChildElm?.requested_qty) - parseInt(nestedChildElm?.dispatch_qty) >= 1 &&
                        nestedChildElm?.request_status !== 'Alternate' &&
                        nestedChildElm?.request_status !== 'Not Available' &&
                        nestedChildElm?.request_status !== 'Rejected' &&
                        selectedPharmacy.type !== 'local' ? (
                          <Button
                            onClick={() => {
                              fullFillRequestItem(nestedChildElm)
                            }}
                            variant='contained'
                            size='small'
                            disabled={selectedPharmacy.type === 'local'}
                          >
                            Full fill
                          </Button>
                        ) : null}

                        {parseInt(nestedChildElm?.requested_qty) - parseInt(nestedChildElm?.dispatch_qty) === 0 && (
                          <Grid
                            sx={{
                              color: 'success.main',

                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              textAlign: 'left',
                              alignItems: 'left'
                            }}
                          >
                            <Icon icon='ion:checkmark-circle' style={{ color: theme.palette.primary.main }} />
                          </Grid>
                        )}

                        {getStatusLabel(nestedChildElm)}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Card>
            </Grid>
          ))}
      </Box>
    )
  }

  return (
    <Drawer
      anchor='right'
      open={addEventSidebarOpen}
      ModalProps={{ keepMounted: true }}
      sx={{
        // '& .MuiDrawer-paper': { width: ['100%', 400] }

        '& .MuiDrawer-paper': { maxWidth: '642px' }
      }}
    >
      {drawerLoader ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            minWidth: '642px',
            height: '100%'
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box
            sx={{
              position: 'sticky',
              top: 0,
              left: 0,
              minWidth: { lg: '642px', md: '642px', sm: '642px', xs: 'auto' },
              maxWidth: '642px',
              backgroundColor: 'white',
              p: '24px',
              zIndex: 1
            }}
          >
            <Box
              sx={{
                display: 'flex',
                width: '100%',
                justifyContent: 'space-between'
              }}
            >
              <Grid container>
                <Grid item xs={11} sm={11} sx={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <PharmacyProductCard
                    title={requestedProducts?.stock_name ? requestedProducts?.stock_name : 'NA'}
                    subTitle={
                      requestedProducts?.package ||
                      requestedProducts?.package_qty ||
                      requestedProducts?.package_uom_label ||
                      requestedProducts?.product_form_label
                        ? `${requestedProducts?.package} of ${Utility.formatNumber(requestedProducts?.package_qty)} ${
                            requestedProducts?.package_uom_label
                          } `
                        : 'NA'
                    }
                    secondSubTitle={
                      selectedPharmacy.type === 'central' && (
                        <Typography
                          sx={{
                            color: theme.palette.customColors.OnSurfaceVariant,
                            fontSize: '12px',
                            fontWeight: 400,
                            fontFamily: 'Inter'
                          }}
                        >
                          Available Quantity:
                          <Typography
                            component='span'
                            sx={{
                              color: theme.palette.customColors.neutralPrimary,
                              fontSize: '14px',
                              fontWeight: 400,
                              fontFamily: 'Inter'
                            }}
                          >
                            {requestedProducts?.total_available_quantity
                              ? requestedProducts?.total_available_quantity
                              : '0'}
                          </Typography>
                        </Typography>
                      )
                    }
                    icon={requestedProducts?.image}
                    heoImageDimension='66'
                    controlSubstance={requestedProducts?.controlled_substance === '1' && true}
                    prescriptionRequired={requestedProducts?.prescription_required === '1' && true}
                  />
                  {/* <Box
                    sx={{
                      backgroundColor: theme => alpha(theme.palette.customColors.neutral05, 0.05),
                      width: '66px',
                      height: '66px',
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <Avatar
                      variant='square'
                      src={requestedProducts?.image || 'images/square'}
                      alt={requestedProducts?.stock_name || 'Medicine Image'}
                      sx={{ width: '52px', height: '52px', borderRadius: '2px', p: 0 }}
                    />
                  </Box>
                  <Box>
                  <Typography
                      sx={{
                        color: theme.palette.customColors.OnSurfaceVariant,
                        fontSize: '20px',
                        fontWeight: 500,
                        fontFamily: 'Inter'
                      }}
                    >
                      {requestedProducts?.stock_name ? requestedProducts?.stock_name : 'NA'}
                    </Typography>

                  <Typography
                      sx={{
                        color: theme.palette.customColors.neutralSecondary,
                        fontSize: '14px',
                        fontWeight: 400,
                        fontFamily: 'Inter'
                      }}
                    >
                      {requestedProducts?.package ||
                      requestedProducts?.package_qty ||
                      requestedProducts?.package_uom_label ||
                      requestedProducts?.product_form_label
                        ? `${requestedProducts?.package} of ${Utility.formatNumber(requestedProducts?.package_qty)} ${
                            requestedProducts?.package_uom_label
                          } `
                        : 'NA'}
                    </Typography>
                  {selectedPharmacy.type === 'central' && (
                      <Typography
                        sx={{
                          color: theme.palette.customColors.OnSurfaceVariant,
                          fontSize: '12px',
                          fontWeight: 400,
                          fontFamily: 'Inter'
                        }}
                      >
                        Available Quantity:
                        <Typography
                          component='span'
                          sx={{
                            color: theme.palette.customColors.neutralPrimary,
                            fontSize: '14px',
                            fontWeight: 400,
                            fontFamily: 'Inter'
                          }}
                        >
                          {requestedProducts?.total_available_quantity
                            ? requestedProducts?.total_available_quantity
                            : '0'}
                        </Typography>
                      </Typography>
                    )}
                  </Box> */}
                </Grid>
                <Grid item xs={1} sm={1} sx={{ float: 'right', textAlign: 'right', height: 'auto' }}>
                  <IconButton size='small' onClick={handleSidebarClose} sx={{ color: 'text.primary' }}>
                    <Icon icon='mdi:close' fontSize={20} />
                  </IconButton>
                </Grid>
                <Grid
                  item
                  sm={12}
                  sx={{
                    backgroundColor: theme => alpha(theme.palette.customColors.TertiaryContainer, 0.2),
                    height: '41px',
                    paddingY: '12px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    mt: '12px'
                  }}
                >
                  <Typography
                    sx={{
                      color: theme.palette.customColors.OnSurfaceVariant,
                      fontSize: '14px',
                      fontWeight: 500,
                      fontFamily: 'Inter',
                      padding: '8px'
                    }}
                  >
                    Pending Quantity -
                    <Typography
                      component='span'
                      sx={{
                        color: theme.palette.customColors.Tertiary,
                        fontSize: '14px',
                        fontWeight: 500,
                        fontFamily: 'Inter'
                      }}
                    >
                      {' '}
                      {requestedProducts?.total_pending_items ? requestedProducts?.total_pending_items : '0'}
                    </Typography>
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Box>
          <Box
            sx={{
              backgroundColor: theme.palette.customColors.Background,
              height: '100%'
            }}
          >
            <Grid
              container
              sx={{
                backgroundColor: theme.palette.customColors.Background,

                // height: '100%',
                overflowY: 'auto',

                // mt: '167px',
                padding: '24px',
                minWidth: { lg: '642px', md: '642px', sm: '642px', xs: 'auto' },
                maxWidth: '642px'
              }}
            >
              <Grid item xs={12} sm={12} md={12}>
                <Typography
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontSize: '16px',
                    fontWeight: 500,
                    fontFamily: 'Inter',
                    pb: '8px',
                    height: 'auto'
                  }}
                >
                  Pending Requests - {''}
                  {requestedProducts?.total_pending_requests ? requestedProducts?.total_pending_requests : '0'}
                </Typography>
              </Grid>

              {requestedProducts?.list_items?.length > 0 &&
                requestedProducts?.list_items?.map((parentItems, index) => (
                  <Grid key={index} item xs={12} sm={12} mb={2}>
                    <Card
                      sx={{
                        padding: '16px',
                        boxShadow: 'none',
                        border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                        boxShadow: `0px 4px 12px ${theme => alpha(theme.palette.customColors.neutral05, 0.05)}`
                      }}
                    >
                      <CardHeader
                        sx={{
                          pl: 3,
                          py: 0
                        }}
                        title={
                          <>
                            <Typography
                              sx={{
                                color: theme.palette.customColors.OnPrimaryContainer,
                                fontSize: '16px',
                                fontWeight: 500,
                                fontFamily: 'Inter',
                                display: 'flex',
                                gap: 2
                              }}
                            >
                              {RenderUtility.getPriorityIcons(parentItems?.priority)}{' '}
                              {parentItems?.ro_no ? parentItems?.ro_no : 'NA'}
                            </Typography>
                            <>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  '& svg': { color: 'success.main' }
                                }}
                              >
                                <Typography
                                  variant='caption'
                                  sx={{
                                    color: theme.palette.customColors.neutralSecondary,
                                    fontSize: '12px',
                                    fontWeight: 400,
                                    fontFamily: 'Inter',
                                    mr: 2,
                                    py: '4px'
                                  }}
                                >
                                  {parentItems?.created_by_user_name ? `By ${parentItems?.created_by_user_name}` : 'NA'}{' '}
                                  •{parentItems?.created_at && Utility.formatDisplayDate(parentItems?.created_at)}
                                </Typography>

                                {RenderUtility.attachedFiles({
                                  control_substance: parentItems?.control_substance,
                                  fontStyle: {
                                    color: theme.palette.primary.main,
                                    fontSize: '12px',
                                    fontWeight: 400
                                  },
                                  iconStyle: {
                                    color: theme.palette.primary.main
                                  },
                                  prescriptionFile: parentItems?.prescription_required_file
                                })}
                              </Box>
                              <Box
                                sx={{
                                  ml: -1
                                }}
                              >
                                {(parentItems?.alternate_comments?.trim() || parentItems?.description?.trim()) && (
                                  <TextEllipsisWithModal
                                    text={parentItems?.alternate_comments || parentItems?.description}
                                    icon='material-symbols:description-outline'
                                    style={{
                                      color: theme.palette.customColors.OnSurfaceVariant,
                                      fontSize: '12px',
                                      fontWeight: 400,
                                      maxWidth: '50%'
                                    }}
                                    limit='150'
                                    iconColor={theme.palette.customColors.moderateSecondary}
                                  />
                                )}
                              </Box>
                            </>
                          </>
                        }
                        titleTypographyProps={{ variant: 'h6' }}
                        action={
                          parseInt(parentItems?.requested_qty) - parseInt(parentItems?.dispatch_qty) >= 1 &&
                          parentItems?.request_status !== 'Alternate' &&
                          parentItems?.request_status !== 'Not Available' &&
                          parentItems?.request_status !== 'Rejected' &&
                          selectedPharmacy.type !== 'local' && (
                            // eslint-disable-next-line lines-around-comment
                            // <OptionsMenu
                            //   options={['Add Alternative', 'Decline Request', 'Supply Stopped']}
                            //   iconButtonProps={{ size: 'small', className: 'card-more-options' }}
                            // />
                            <MenuWithDots
                              options={generateOptions(parentItems, parentItems?.id)}
                              disabled={selectedPharmacy.type === 'local'}
                            />
                          )
                        }
                      />
                      <Divider
                        orientation='horizontal'
                        sx={{
                          my: '8px',
                          width: '100%',
                          backgroundColor: theme => alpha(theme.palette.customColors.neutral05, 0.05)
                        }}
                      />
                      <Box>
                        <Grid
                          container
                          sx={{
                            padding: '12px 12px 8px 12px',
                            borderRadius: '8px',
                            display: 'flex',
                            gap: 2,
                            justifyContent: 'space-between',
                            backgroundColor: theme => alpha(theme.palette.customColors.neutral05, 0.05)
                          }}
                        >
                          {parentItems?.parentQuantityStatus?.map((item, index) => (
                            <Grid
                              key={index}
                              md={2}
                              xs={2}
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between'
                              }}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'center',
                                  flexDirection: 'column',
                                  alignItems: 'start'
                                }}
                              >
                                <Typography
                                  sx={{
                                    color: theme.palette.customColors.OnSurfaceVariant,
                                    fontSize: '14px',
                                    fontWeight: 400,
                                    fontFamily: 'Inter'
                                  }}
                                >
                                  {item?.label}
                                </Typography>
                                <Typography
                                  sx={{
                                    color: theme.palette.customColors.OnPrimaryContainer,
                                    fontSize: '20px',
                                    fontWeight: 500,
                                    fontFamily: 'Inter'
                                  }}
                                >
                                  {item.value}
                                </Typography>
                              </Box>

                              {index < parentItems?.parentQuantityStatus?.length - 1 && (
                                <Divider
                                  orientation='vertical'
                                  flexItem
                                  sx={{
                                    ml: 2,
                                    height: '100%',
                                    alignSelf: 'center',
                                    color: 'red !important',
                                    backgroundColor: theme => alpha(theme.palette.customColors.neutral05)
                                  }}
                                />
                              )}
                            </Grid>
                          ))}

                          <Grid
                            md={3}
                            xs={3}
                            sx={{
                              display: 'flex',
                              justifyContent: 'flex-end'
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                flexDirection: 'column',
                                alignItems: 'start'
                              }}
                            >
                              {/* {parentItems?.request_status === 'request' && ( */}
                              {parseInt(parentItems?.requested_qty) - parseInt(parentItems?.dispatch_qty) >= 1 &&
                              parentItems?.request_status !== 'Alternate' &&
                              parentItems?.request_status !== 'Not Available' &&
                              parentItems?.request_status !== 'Rejected' &&
                              selectedPharmacy.type !== 'local' ? (
                                <Button
                                  onClick={() => {
                                    fullFillRequestItem(parentItems)
                                  }}
                                  variant='contained'
                                  size='small'
                                  disabled={selectedPharmacy.type === 'local'}
                                >
                                  Full fill
                                </Button>
                              ) : null}

                              {parentItems?.alt_parent.length === 0 &&
                                parentItems?.dispatch_status === 'Fulfilled' &&
                                parentItems?.request_status !== 'Not Available' &&
                                parentItems?.request_status !== 'Rejected' && (
                                  <Grid
                                    sx={{
                                      color: 'success.main',

                                      display: 'flex',
                                      flexDirection: 'column',
                                      justifyContent: 'center',
                                      textAlign: 'left',
                                      alignItems: 'left'
                                    }}
                                  >
                                    <Icon
                                      icon='ion:checkmark-circle'
                                      style={{
                                        color: theme.palette.primary.main
                                      }}
                                    />
                                  </Grid>
                                )}

                              {getStatusLabel(parentItems)}
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                      {parentItems?.alt_parent.length > 0 && AlterNativeCard(parentItems)}
                    </Card>
                  </Grid>
                ))}
            </Grid>
          </Box>
        </>
      )}
    </Drawer>
  )
}

export default RequestedProductDetails
