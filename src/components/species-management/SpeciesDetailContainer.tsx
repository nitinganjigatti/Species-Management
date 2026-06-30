'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Box, CircularProgress } from '@mui/material'
import { useQuery } from '@tanstack/react-query'

import * as detailApi from 'src/lib/api/species-management/detail'
import { getSpeciesEggs } from 'src/lib/api/species-management/eggs'
import type { SpeciesDetailTab } from 'src/types/species-management/detail'
import SpeciesDetailView from 'src/views/pages/species-management/detail/SpeciesDetailView'
import OverviewTab from 'src/views/pages/species-management/detail/tabs/OverviewTab'
import ProfileTab from 'src/views/pages/species-management/detail/tabs/ProfileTab'
import PairingTab from 'src/views/pages/species-management/detail/tabs/PairingTab'
import HousingTab from 'src/views/pages/species-management/detail/tabs/HousingTab'
import CircleOfLifeTab from 'src/views/pages/species-management/detail/tabs/CircleOfLifeTab'
import EggsTab from 'src/views/pages/species-management/detail/tabs/EggsTab'
import AssessmentsTab from 'src/views/pages/species-management/detail/tabs/AssessmentsTab'
import MedicalTab from 'src/views/pages/species-management/detail/tabs/MedicalTab'
import IdentificationTab from 'src/views/pages/species-management/detail/tabs/IdentificationTab'
import BreedsTab from 'src/views/pages/species-management/detail/tabs/BreedsTab'
import { useSpeciesChrome } from 'src/components/species-management/useSpeciesChrome'

// Backend endpoints don't exist yet — don't hammer with retries; surface empty states instead.
// Called unconditionally in a fixed order every render, so it's hook-safe.
const useTabQuery = <T,>(key: unknown[], fn: () => Promise<T>, enabled: boolean) =>
  useQuery<T>({ queryKey: key, queryFn: fn, enabled, retry: false, staleTime: 60_000 })

const Loading = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
    <CircularProgress />
  </Box>
)

const SpeciesDetailContainer = () => {
  useSpeciesChrome()
  // The side-rail tab layout uses a sticky rail. `.layout-wrapper` has `overflow-y: auto`, which
  // makes it the sticky containing block even though the window is what scrolls — that silently
  // breaks `position: sticky`. Relax it to `visible` while on this page; restored on unmount.
  useEffect(() => {
    const wrapper = document.querySelector('.layout-wrapper') as HTMLElement | null
    const prevOverflow = wrapper?.style.overflow ?? ''
    if (wrapper) wrapper.style.overflow = 'visible'
    return () => {
      if (wrapper) wrapper.style.overflow = prevOverflow
    }
  }, [])
  const params = useParams()
  const router = useRouter()
  const id = String((params as Record<string, string>)?.id || '')

  const [tab, setTab] = useState<SpeciesDetailTab>('overview')

  const header = useQuery({
    queryKey: ['sm-detail-header', id],
    queryFn: () => detailApi.getSpeciesDetailHeader(id),
    enabled: !!id,
    retry: false,
    staleTime: 60_000
  })

  // Shell-level: assessment alerts feed the Notifications & Alerts band (one cached detail-file read).
  const alertsQ = useQuery({
    queryKey: ['sm-alerts', id],
    queryFn: () => detailApi.getSpeciesAssessments(id),
    enabled: !!id,
    retry: false,
    staleTime: 60_000
  })
  const alerts = useMemo(() => {
    const data = alertsQ.data as any
    const a = data?.alerts
    if (!a) return null
    const gained = a.weightIncreasing?.length || 0
    const lost = a.weightDecreasing?.length || 0
    const real = data?.summary?.realAnimals || 0
    const cov = data?.summary?.weightCoverage || 0
    const weighed = Math.round((real * cov) / 100)

    return {
      up: gained,
      down: lost,
      stable: Math.max(0, weighed - gained - lost),
      overdue: a.overdue?.length || 0,
      neverAssessed: a.neverWeighed?.length || 0,
      gained,
      lost,
      underMonitored: a.underMonitored?.length || 0,
      thresholdMonths: Math.round((a.config?.overdueDays || 180) / 30)
    }
  }, [alertsQ.data])

  const profile = useTabQuery(['sm-profile', id], () => detailApi.getSpeciesProfile(id), tab === 'profile')
  const housing = useTabQuery(['sm-housing', id], () => detailApi.getSpeciesHousing(id), tab === 'housing' || tab === 'pairing' || tab === 'overview')
  const animals = useTabQuery(['sm-animals', id], () => detailApi.getSpeciesAnimals(id), tab === 'housing' || tab === 'pairing')
  const births = useTabQuery(['sm-births', id], () => detailApi.getSpeciesBirths(id), tab === 'circle' || tab === 'overview')
  const deaths = useTabQuery(['sm-deaths', id], () => detailApi.getSpeciesDeaths(id), tab === 'circle' || tab === 'overview')
  const lifecycle = useTabQuery(['sm-lifecycle', id], () => detailApi.getSpeciesLifecycle(id), tab === 'circle' || tab === 'overview')
  const eggs = useTabQuery(['sm-eggs', id], () => getSpeciesEggs(id), tab === 'eggs')
  const assessments = useTabQuery(['sm-assessments', id], () => detailApi.getSpeciesAssessments(id), tab === 'assessments')
  const vaccination = useTabQuery(['sm-vaccination', id], () => detailApi.getSpeciesVaccination(id), tab === 'medical')
  const deworming = useTabQuery(['sm-deworming', id], () => detailApi.getSpeciesDeworming(id), tab === 'medical')
  const complaints = useTabQuery(['sm-complaints', id], () => detailApi.getSpeciesComplaints(id), tab === 'medical')
  const diagnosis = useTabQuery(['sm-diagnosis', id], () => detailApi.getSpeciesDiagnosis(id), tab === 'medical')
  const lab = useTabQuery(['sm-lab', id], () => detailApi.getSpeciesLab(id), tab === 'medical')
  const surgery = useTabQuery(['sm-surgery', id], () => detailApi.getSpeciesSurgery(id), tab === 'medical')
  const anaesthesia = useTabQuery(['sm-anaesthesia', id], () => detailApi.getSpeciesAnaesthesia(id), tab === 'medical')
  const pharmacy = useTabQuery(['sm-pharmacy', id], () => detailApi.getSpeciesPharmacy(id), tab === 'medical')
  const identification = useTabQuery(['sm-identification', id], () => detailApi.getSpeciesIdentification(id), tab === 'identification')
  const breeds = useTabQuery(['sm-breeds', id], () => detailApi.getSpeciesBreeds(id), tab === 'breeds')

  const renderTab = () => {
    switch (tab) {
      case 'overview':
        return (
          <OverviewTab
            header={header.data}
            housing={housing.data}
            births={births.data}
            deaths={deaths.data}
            lifecycle={lifecycle.data}
            alerts={alerts}
            onTabChange={setTab}
          />
        )
      case 'profile':
        return profile.isLoading ? <Loading /> : <ProfileTab profile={profile.data} header={header.data} />
      case 'pairing':
        return housing.isLoading ? <Loading /> : <PairingTab housing={housing.data} animals={animals.data?.animals} />
      case 'housing':
        return housing.isLoading ? <Loading /> : <HousingTab housing={housing.data} animals={animals.data?.animals} />
      case 'circle':
        return births.isLoading || deaths.isLoading || lifecycle.isLoading ? (
          <Loading />
        ) : (
          <CircleOfLifeTab births={births.data} deaths={deaths.data} lifecycle={lifecycle.data} />
        )
      case 'eggs':
        return eggs.isLoading ? <Loading /> : <EggsTab eggs={eggs.data} />
      case 'assessments':
        return assessments.isLoading ? <Loading /> : <AssessmentsTab assessments={assessments.data} />
      case 'medical':
        return vaccination.isLoading || deworming.isLoading || complaints.isLoading || diagnosis.isLoading ? (
          <Loading />
        ) : (
          <MedicalTab
            vaccination={vaccination.data}
            deworming={deworming.data}
            complaints={complaints.data}
            diagnosis={diagnosis.data}
            lab={lab.data}
            surgery={surgery.data}
            anaesthesia={anaesthesia.data}
            pharmacy={pharmacy.data}
          />
        )
      case 'identification':
        return identification.isLoading ? <Loading /> : <IdentificationTab ident={identification.data} />
      case 'breeds':
        return breeds.isLoading ? <Loading /> : <BreedsTab breeds={breeds.data} />
      default:
        return null
    }
  }

  // Eggs tab is only relevant for egg-laying classes (mapped by taxonomy for now;
  // backend will drive this later).
  const showEggs = ['Aves', 'Reptilia'].includes(String(header.data?.class))

  return (
    <SpeciesDetailView
      header={header.data}
      speciesId={id}
      activeTab={tab}
      onTabChange={setTab}
      onBack={() => router.push('/species-management/list/')}
      showEggs={showEggs}
      alerts={alerts}
      onAlertClick={() => setTab('assessments')}
    >
      {renderTab()}
    </SpeciesDetailView>
  )
}

export default SpeciesDetailContainer
