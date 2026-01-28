import { Box, Breadcrumbs, useTheme } from '@mui/material'
import { useRouter } from 'next/router'
import React from 'react'

const Necropsy = () => {
  const theme = useTheme()
  const router = useRouter()

  return (
    <>
      <Box>
        <Breadcrumbs></Breadcrumbs>
      </Box>
    </>
  )
}

export default Necropsy
