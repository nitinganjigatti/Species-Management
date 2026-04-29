'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import Button from '@mui/material/Button'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { useTheme } from '@emotion/react'

import BlankLayout from 'src/@core/layouts/BlankLayout'

const BoxWrapper = styled(Box)(({ theme }) => ({
  [theme.breakpoints.down('md')]: {
    width: '90vw'
  }
}))

const Img = styled('img')(({ theme }) => ({
  marginTop: theme.spacing(15),
  marginBottom: theme.spacing(15),
  [theme.breakpoints.down('lg')]: {
    height: 450,
    marginTop: theme.spacing(10),
    marginBottom: theme.spacing(10)
  },
  [theme.breakpoints.down('md')]: {
    height: 400
  }
}))

const NotFound = () => {
  const theme: any = useTheme()
  const router = useRouter()

  return (
    <BlankLayout>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <Img alt='error-illustration' src='/images/pages/cat-with-404-flag.png' sx={{ mb: 5 }} />

        <Typography
          variant='h5'
          sx={{
            mb: 2.5,
            fontSize: '24px',
            fontFamily: 'Inter',
            fontWeight: 600,
            color: theme?.palette?.customColors?.OnSurfaceVariant
          }}
        >
          Page Not Found !
        </Typography>
        <Typography variant='body2' sx={{ fontSize: '16px', fontFamily: 'Inter', fontWeight: 400, mb: 2 }}>
          Oops! The page you're seeking cannot be found
        </Typography>
        <Button onClick={() => router.back()} variant='contained' sx={{ px: 5.5, mt: 2 }}>
          Go Back
        </Button>
      </Box>
    </BlankLayout>
  )
}

export default NotFound
