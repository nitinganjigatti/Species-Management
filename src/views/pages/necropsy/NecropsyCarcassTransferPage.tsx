'use client'

import React, { useContext, useState } from 'react'
import { Box, Breadcrumbs, Typography, Link as MuiLink } from '@mui/material'
import NextLink from 'next/link'
import NecropsyAnalytics from 'src/views/pages/necropsy/NecropsyAnalytics'
import CarcassTransferCard from 'src/components/necropsy/CarcassTransferCard'
import { NecropsyProvider } from 'src/context/NecropsyContext'
import { AuthContext } from 'src/context/AuthContext'
import { DateFilter } from 'src/types/necropsy'
import { useTranslation } from 'react-i18next'

interface AuthContextValue {
  userData?: {
    roles?: {
      settings?: {
        allow_carcass_collection?: boolean
      }
    }
  }
}

const NecropsyCarcassTransferPage = () => {
  const { t } = useTranslation()
  const authData = useContext(AuthContext) as unknown as AuthContextValue | null
  const allowCarcassCollection: boolean | undefined = authData?.userData?.roles?.settings?.allow_carcass_collection

  const [filterDate, setFilterDate] = useState<DateFilter>({
    startDate: null,
    endDate: null
  })

  const handleDateFilterChange = (dateFilter: DateFilter): void => {
    setFilterDate(dateFilter)
  }

  return (
    <NecropsyProvider>
      <Box sx={{ p: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Breadcrumbs>
            <MuiLink component={NextLink} href='/necropsy/necropsy' underline='hover' color='inherit'>
              {t('necropsy_module.necropsy')}
            </MuiLink>
            <Typography color='text.primary' sx={{ fontWeight: 500 }}>
              {t('necropsy_module.carcass_transfer')}
            </Typography>
          </Breadcrumbs>
        </Box>

        <NecropsyAnalytics
          filterDate={filterDate}
          setFilterDate={handleDateFilterChange}
          badgeCount={0}
          allowCarcassCollection={allowCarcassCollection}
          showCarcassTransferButton={false}
        />

        <Box sx={{ mt: 6 }}>
          <CarcassTransferCard filterDate={filterDate} />
        </Box>
      </Box>
    </NecropsyProvider>
  )
}

export default NecropsyCarcassTransferPage
