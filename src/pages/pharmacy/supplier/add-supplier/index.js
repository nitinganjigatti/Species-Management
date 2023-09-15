// ** Next Import
import Link from 'next/link'
import PageHeader from 'src/@core/components/page-header'

// ** MUI Imports
import Grid from '@mui/material/Grid'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import FormValidationBasic from 'src/views/forms/form-validation/FormValidationBasic'
import AddSupplierForm from 'src/components/supplier/AddSupplierForm'
import Button from '@mui/material/Button'

const LinkStyled = styled(Link)(({ theme }) => ({
  textDecoration: 'none',
  color: theme.palette.primary.main
}))

const AddSupplier = () => {
  return (
    <>
      <Grid container spacing={6} className='match-height'>
        <PageHeader
          title={
            <Typography variant='h5'>
              <LinkStyled href='https://github.com/react-hook-form/react-hook-form' target='_blank'>
                Add Supplier
              </LinkStyled>
            </Typography>
          }
        />
        <Grid item xs={12}>
          <AddSupplierForm
            action={
              <>
                <div>
                  <Button size='big' variant='contained' href=''>
                    Suppliers List
                  </Button>
                  <Button size='big' variant='contained' href=''>
                    Upload CSV
                  </Button>
                </div>
              </>
            }
          />
        </Grid>
      </Grid>
    </>
  )
}

export default AddSupplier
