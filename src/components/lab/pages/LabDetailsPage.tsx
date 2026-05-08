import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { TabContext, TabList, TabPanel } from '@mui/lab'
import { Breadcrumbs, Grid, Tab, Typography } from '@mui/material'
import ShowLabCard from 'src/components/lab/lab-details/ShowLabCard'
import Site from 'src/components/lab/lab-details/Site'
import Tests from 'src/components/lab/lab-details/Tests'
import Users from 'src/components/lab/lab-details/Users'
import { getLabDeatilsById } from 'src/lib/api/lab/addLab'
import { useTheme } from '@mui/material/styles'
import FallbackSpinner from 'src/@core/components/spinner/index'
import type { Lab, LabSampleWithTests } from 'src/types/lab'

const LabDetailsPage = () => {
  const theme = useTheme()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation()

  const id = searchParams?.get('id')
  const page = searchParams?.get('page')
  const q = searchParams?.get('q')
  const pageSize = searchParams?.get('pageSize')

  const [loader, setLoader] = useState(false)
  const [status, setStatus] = useState('site')
  const [showLabDetails, setShowLabDetails] = useState<Lab | undefined>()
  const [labTests, setLabTests] = useState<LabSampleWithTests[] | undefined>()

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    setStatus(newValue)
  }

  const labDetailsById = async (labId: string) => {
    try {
      const res = await getLabDeatilsById(labId)
      if (res) {
        setShowLabDetails((res?.data as Lab[])?.[0])
        setLabTests((res?.data as Lab[])?.[0]?.lab_details)
        setLoader(false)
      }
    } catch (error) {}
  }

  useEffect(() => {
    if (id) {
      setLoader(true)
      labDetailsById(id)
    }
  }, [id])

  const handleBackToList = () => {
    const sp = new URLSearchParams()
    if (page) sp.set('page', page)
    if (q) sp.set('q', q)
    if (pageSize) sp.set('pageSize', pageSize)
    const qs = sp.toString()
    router.push(`/lab/lab-list${qs ? `?${qs}` : ''}`)
  }

  return (
    <>
      {loader ? (
        <FallbackSpinner sx={{}} />
      ) : (
        <>
          <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
            <Typography sx={{ cursor: 'pointer' }} color='inherit'>
              {t('lab_module.labs')}
            </Typography>
            <Typography sx={{ cursor: 'pointer' }} color='inherit' onClick={handleBackToList}>
              {t('lab_module.labs_list')}
            </Typography>
            <Typography sx={{ color: 'text.primary', cursor: 'pointer' }}>{t('lab_module.lab_details')}</Typography>
          </Breadcrumbs>

          <Grid container spacing={2}>
            <Grid size={{ md: 3 }}>
              <ShowLabCard data={showLabDetails} />
            </Grid>
            <Grid size={{ md: 9 }}>
              <TabContext value={status}>
                <TabList onChange={handleChange}>
                  <Tab value='site' label={t('lab_module.sites')} sx={{ ml: 5 }} />
                  <Tab value='tests' label={t('lab_module.tests')} />
                  <Tab value='users' label={t('lab_module.users')} />
                </TabList>
                <TabPanel value='site'>
                  <Site labId={id ?? undefined} />
                </TabPanel>
                <TabPanel value='tests'>
                  <Tests labTest={labTests} />
                </TabPanel>
                <TabPanel value='users'>
                  <Users labId={id ?? undefined} />
                </TabPanel>
              </TabContext>
            </Grid>
          </Grid>
        </>
      )}
    </>
  )
}

export default LabDetailsPage
