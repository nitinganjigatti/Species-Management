// src/components/BatchTable.js

import React, { useState, useContext } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import moment from 'moment'
import { Avatar, Box, Typography, Card, CardHeader, IconButton } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import FallbackSpinner from 'src/@core/components/spinner/index'
import Icon from 'src/@core/components/icon'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import ConfirmationCheckBox from 'src/views/forms/form-elements/confirmationCheckBox'
import { AuthContext } from 'src/context/AuthContext'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import Router from 'next/router'

const CustomTable = ({
  rows,
  columns,
  total,
  loading,
  searchValue,
  paginationModel,
  setPaginationModel,
  handleSearch,
  onCellClick,
  dialog,
  onClose,
  check,
  setCheck,
  headerAction,
  searchParams,
  title
}) => {
  const theme = useTheme()
  const authData = useContext(AuthContext)

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1
  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  //   const headerAction = <>{/* Add any header actions if needed */}</>

  return (
    <>
      {loading ? (
        <FallbackSpinner />
      ) : (
        <Card sx={{ mt: 4 }}>
          <CardHeader title={title} action={headerAction} />
          <ConfirmationDialog
            image={'https://app.antzsystems.com/uploads/6515471031963.jpg'}
            iconColor={'#ff3838'}
            title={'Are you sure you want to delete this ingredient?'}
            formComponent={
              <ConfirmationCheckBox
                title={'This ingredient is part of 15 recipes and 10 diets.'}
                label={'Deactivate this ingredient in all records'}
                description={
                  'Deactivating this ingredient prevents its addition to new recipes or diets, but you can swap it with another ingredient.'
                }
                color={theme.palette.formContent?.tertiary}
                value={check}
                setValue={setCheck}
              />
            }
            dialogBoxStatus={dialog}
            onClose={onClose}
            ConfirmationText={'Delete'}
            confirmAction={onClose}
          />
          <DataGrid
            sx={{
              '.MuiDataGrid-cell:focus': {
                outline: 'none'
              },
              '& .MuiDataGrid-row:hover': {
                cursor: 'pointer'
              }
            }}
            columnVisibilityModel={{
              sl_no: false
            }}
            hideFooterSelectedRowCount
            disableColumnSelector={true}
            autoHeight
            pagination
            rows={indexedRows === undefined ? [] : indexedRows}
            rowCount={total}
            columns={columns}
            sortingMode='server'
            paginationMode='server'
            pageSizeOptions={[7, 10, 25, 50]}
            paginationModel={paginationModel}
            slots={{ toolbar: ServerSideToolbarWithFilter }}
            onPaginationModelChange={setPaginationModel}
            slotProps={{
              baseButton: {
                variant: 'outlined'
              },
              toolbar: {
                value: searchValue,
                clearSearch: () => handleSearch(''),
                onChange: event => handleSearch(event.target.value)
              }
            }}
            onCellClick={onCellClick}
          />
        </Card>
      )}
    </>
  )
}

export default CustomTable
