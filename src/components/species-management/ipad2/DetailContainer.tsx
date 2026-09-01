'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Box, CircularProgress } from '@mui/material'
import { useQuery } from '@tanstack/react-query'

import * as detailApi from 'src/lib/api/species-management/detail'
import { getSpeciesEggs } from 'src/lib/api/species-management/eggs'
import { getSpeciesBreeding } from 'src/lib/api/species-management/breeding-eggs'
import type { SpeciesDetailTab } from 'src/types/species-management/detail'
import SpeciesDetailView from 'src/views/pages/species-management/ipad2/detail/SpeciesDetailView'
import OverviewTab from 'src/views/pages/species-management/ipad2/detail/tabs/OverviewTab'
import ProfileTab from 'src/views/pages/species-management/ipad2/detail/tabs/ProfileTab'
import PopulationTab from 'src/views/pages/species-management/ipad2/detail/tabs/PopulationTab'
import PairingTab from 'src/views/pages/species-management/ipad2/detail/tabs/PairingTab'
import HousingTab from 'src/views/pages/species-management/ipad2/detail/tabs/HousingTab'
import CircleOfLifeTab from 'src/views/pages/species-management/ipad2/detail/tabs/CircleOfLifeTab'
import EggsTab from 'src/views/pages/species-management/ipad2/detail/tabs/EggsTab'
import AssessmentsTab from 'src/views/pages/species-management/ipad2/detail/tabs/AssessmentsTab'
import MedicalTab from 'src/views/pages/species-management/ipad2/detail/tabs/MedicalTab'
import HospitalTab from 'src/views/pages/species-management/ipad2/detail/tabs/HospitalTab'
import LabTab from 'src/views/pages/species-management/ipad2/detail/tabs/LabTab'
import MortalityTab from 'src/views/pages/species-management/ipad2/detail/tabs/MortalityTab'
import NecropsyTab from 'src/views/pages/species-management/ipad2/detail/tabs/NecropsyTab'
import IdentificationTab from 'src/views/pages/species-management/ipad2/detail/tabs/IdentificationTab'
import BreedsTab from 'src/views/pages/species-management/ipad2/detail/tabs/BreedsTab'
import { V2TypeScale } from 'src/views/pages/species-management/ipad2/detail/detailUi'

// Backend endpoints don't exist yet — don't hammer with retries; surface empty states instead.
// Called unconditionally in a fixed order every render, so it's hook-safe.
const useTabQuery = <T,>(key: unknown[], fn: () => Promise<T>, enabled: boolean) =>
  useQuery<T>({ queryKey: key, queryFn: fn, enabled, retry: false, staleTime: 60_000 })

const Loading = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
    <CircularProgress />
  </Box>
)

const IpadDetailContainer = () => {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = String((params as Record<string, string>)?.id || '')

  // Deep-links (e.g. from the dashboard's single-species mode) land on a specific tab via ?tab=.
  const VALID_TABS: SpeciesDetailTab[] = [
    'overview',
    'profile',
    'population',
    'pairing',
    'housing',
    'circle',
    'eggs',
    'assessments',
    'medical',
    'hospital',
    'lab',
    'mortality',
    'necropsy',
    'identification',
    'breeds'
  ]
  const initialTab = ((): SpeciesDetailTab => {
    const q = searchParams?.get('tab') as SpeciesDetailTab | null

    return q && VALID_TABS.includes(q) ? q : 'overview'
  })()
  const [tab, setTab] = useState<SpeciesDetailTab>(initialTab)

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
  const animals = useTabQuery(
    ['sm-animals', id],
    () => detailApi.getSpeciesAnimals(id),
    tab === 'housing' || tab === 'pairing' || tab === 'population'
  )
  const births = useTabQuery(['sm-births', id], () => detailApi.getSpeciesBirths(id), tab === 'circle' || tab === 'overview' || tab === 'eggs')
  const deaths = useTabQuery(['sm-deaths', id], () => detailApi.getSpeciesDeaths(id), tab === 'circle' || tab === 'overview')
  const lifecycle = useTabQuery(
    ['sm-lifecycle', id],
    () => detailApi.getSpeciesLifecycle(id),
    tab === 'circle' || tab === 'overview' || tab === 'mortality' || tab === 'necropsy'
  )
  const eggs = useTabQuery(['sm-eggs', id], () => getSpeciesEggs(id), tab === 'eggs')
  const breeding = useTabQuery(
    ['sm-breeding', id, header.data?.class, births.data?.total],
    () =>
      getSpeciesBreeding(id, {
        className: header.data?.class,
        commonName: header.data?.commonName,
        birthsRecorded: births.data?.total
      }),
    tab === 'eggs' && !!header.data
  )
  const assessments = useTabQuery(['sm-assessments', id], () => detailApi.getSpeciesAssessments(id), tab === 'assessments')
  const preventive = useTabQuery(['sm-preventive', id], () => detailApi.getSpeciesPreventive(id), tab === 'medical')
  const clinical = useTabQuery(['sm-clinical', id], () => detailApi.getSpeciesClinical(id), tab === 'medical' || tab === 'hospital' || tab === 'lab')
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
      case 'population':
        return animals.isLoading ? (
          <Loading />
        ) : (
          <PopulationTab animals={animals.data?.animals} totalAnimals={animals.data?.totalAnimals} />
        )
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
        return eggs.isLoading || breeding.isLoading ? <Loading /> : <EggsTab eggs={eggs.data} breeding={breeding.data} />
      case 'assessments':
        return assessments.isLoading ? <Loading /> : <AssessmentsTab assessments={assessments.data} />
      case 'medical':
        return preventive.isLoading || clinical.isLoading ? <Loading /> : <MedicalTab preventive={preventive.data} clinical={clinical.data} />
      case 'hospital':
        return clinical.isLoading ? <Loading /> : <HospitalTab clinical={clinical.data} />
      case 'lab':
        return clinical.isLoading ? <Loading /> : <LabTab clinical={clinical.data} />
      case 'mortality':
        return lifecycle.isLoading ? <Loading /> : <MortalityTab lifecycle={lifecycle.data} />
      case 'necropsy':
        return lifecycle.isLoading ? <Loading /> : <NecropsyTab lifecycle={lifecycle.data} />
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
    <V2TypeScale>
      <SpeciesDetailView
        header={header.data}
        speciesId={id}
        activeTab={tab}
        onTabChange={setTab}
        onBack={() => router.push('/species-management/ipad-2/list/')}
        showEggs={showEggs}
        alerts={alerts}
        onAlertClick={() => setTab('assessments')}
      >
        {renderTab()}
      </SpeciesDetailView>
    </V2TypeScale>
  )
}

export default IpadDetailContainer
