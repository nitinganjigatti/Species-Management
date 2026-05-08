import React, { useEffect, useState } from 'react'
import { TabContext, TabList, TabPanel } from '@mui/lab'
import { Breadcrumbs, Grid, Tab, Typography } from '@mui/material'
import ShowLabCard from 'src/components/lab/lab-details/ShowLabCard'
import Site from 'src/components/lab/lab-details/Site'
import Tests from 'src/components/lab/lab-details/Tests'
import Users from 'src/components/lab/lab-details/Users'
import { getLabDeatilsById } from 'src/lib/api/lab/addLab'
import { useRouter } from 'next/router'
import { useTheme } from '@mui/material/styles'
import FallbackSpinner from 'src/@core/components/spinner/index'
import type { Lab, LabSampleWithTests } from 'src/types/lab'

const LabDetails = () => {
  const theme = useTheme()
  const router = useRouter()
  const { id, page, q, pageSize } = router.query

  const [loader, setLoader] = useState(false)
  const [status, setStatus] = useState('site')
  const [showLabDetails, setShowLabDetails] = useState<Lab | undefined>()
  const [labTests, setLabTests] = useState<LabSampleWithTests[] | undefined>()

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    setStatus(newValue)
  }

  const labDetailsById = async (labId: string | string[]) => {
    try {
      const res = await getLabDeatilsById(String(labId))
      if (res) {
        setShowLabDetails((res?.data as Lab[])?.[0])
        setLabTests((res?.data as Lab[])?.[0]?.lab_details)
        setLoader(false)
      }
    } catch (error) {}
  }

  useEffect(() => {
    if (id != undefined) {
      setLoader(true)
      labDetailsById(id)
    }
  }, [id])

  return (
    <>
      {loader ? (
        <FallbackSpinner sx={{}} />
      ) : (
        <>
          <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
            <Typography sx={{ cursor: 'pointer' }} color='inherit'>
              Labs
            </Typography>
            <Typography
              sx={{ cursor: 'pointer' }}
              color='inherit'
              onClick={() =>
                router.push({
                  pathname: '/lab/lab-list',
                  query: { page, q, pageSize }
                })
              }
            >
              Labs list
            </Typography>
            <Typography
              sx={{
                color: 'text.primary',
                cursor: 'pointer'
              }}
            >
              Lab details
            </Typography>
          </Breadcrumbs>

          <Grid container spacing={2}>
            <Grid size={{ md: 3 }}>
              <ShowLabCard data={showLabDetails} />
            </Grid>
            <Grid size={{ md: 9 }}>
              <TabContext value={status}>
                <TabList onChange={handleChange}>
                  <Tab value='site' label='SITES' sx={{ ml: 5 }} />
                  <Tab value='tests' label='TESTS' />
                  <Tab value='users' label='USERS' />
                </TabList>

                <TabPanel value='site'>
                  <Site labId={id} />
                </TabPanel>
                <TabPanel value='tests'>
                  <Tests labTest={labTests} />
                </TabPanel>
                <TabPanel value='users'>
                  <Users labId={id} />
                </TabPanel>
              </TabContext>
            </Grid>
          </Grid>
        </>
      )}
    </>
  )
}

export default LabDetails
