'use client'

import React, { useState, useMemo, useCallback, useRef } from 'react'
import { useTheme, Theme } from '@mui/material'
import { useMutation, useQueryClient, useInfiniteQuery, InfiniteData } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import useSafeRouter from 'src/hooks/useSafeRouter'
import { useParams } from 'next/navigation'
import Toaster from 'src/components/Toaster'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import { addClinicalNotes, deleteClinicalNotes, getClinicalNotes } from 'src/lib/api/hospital/clinicalNotesApi'
import InpatientClinicalNotes from 'src/views/pages/hospital/inpatient/InpatientClinicalNotes'
import { useSelector } from 'react-redux'
import { AddClinicalNotesParams, AddClinicalNotesResponse, DeleteClinicalNotesResponse } from 'src/types/hospital/api/ClinicalNotes/clinicalNotes'
import { PatientDetailsData } from 'src/types/hospital/models'
import { ClinicalNotesList } from 'src/types/hospital/models/clinicalNotes'

const STORAGE_KEY = 'medical_record_data'

interface ClinicalNotesProps {
  patientData?: PatientDetailsData
}

interface ClinicalNotesPage {
  total_count: number
  data: ClinicalNotesList[]
}

interface FetchClinicalNotesArgs {
  pageParam?: number
}

const ClinicalNotes = ({ patientData }: ClinicalNotesProps) => {
  const { t } = useTranslation()
  const [isSubmitLoading, setIsSubmitLoading] = useState<boolean>(false)
  const [selectedItemToDelete, setSelectedItemToDelete] = useState<ClinicalNotesList | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false)

  const theme: Theme = useTheme()
  const router: any = useSafeRouter()
  const routerParams: any = useParams()
  const id = routerParams?.id || router.query?.id

  const queryClient = useQueryClient()
  const hospitalData: any = useSelector((state: any) => state.hospital.data)
  const medicalRecordData: any = hospitalData[STORAGE_KEY] || {}
  const animal_id = medicalRecordData?.animal_id

  const queryParams = useMemo(
    () => ({
      type: 'all',
      limit: 10,
      hospital_case_id: id,
      medical_type: 'clinical_notes'
    }),
    []
  )

  const fetchClinicalNotes = async ({ pageParam = 1 }: FetchClinicalNotesArgs) => {
    try {
      const res = await getClinicalNotes({
        animalId: animal_id,
        params: { ...queryParams, page: pageParam }
      } as any)

      if (res?.success === true) {
        return {
          total_count: res.data.total_count,
          data: res.data.result || []
        }
      }
    } catch (error) {
      const err = error as Error
      console.error('Error fetching clinical notes:', err?.message || error)
    }
  }

  const getNextPage = (lastPage: ClinicalNotesPage, pages: ClinicalNotesPage[]) => {
    const totalCount = Number(lastPage?.total_count) || 0
    const fetchedCount = pages?.reduce((sum: number, page: ClinicalNotesPage) => sum + (page?.data?.length || 0), 0)

    return fetchedCount < totalCount ? pages?.length + 1 : undefined
  }

  const {
    data: clinicalNotesData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery<ClinicalNotesPage, Error, InfiniteData<ClinicalNotesPage>>({
    queryKey: ['clinicalNotes', animal_id, queryParams],
    queryFn: fetchClinicalNotes,
    getNextPageParam: getNextPage,
    enabled: !!animal_id,
    refetchOnWindowFocus: false,
    initialPageParam: 1
  } as any)

  const allClinicalEntries: ClinicalNotesList[] = useMemo(() => {
    return clinicalNotesData?.pages?.flatMap((page: ClinicalNotesPage) => page?.data || []) || []
  }, [clinicalNotesData])

  const canFetchNotes = !!animal_id
  const isInitialLoading = !canFetchNotes || (isLoading && !clinicalNotesData?.pages?.length)

  const observer = useRef<IntersectionObserver | undefined>(undefined)

  const lastClinicalNoteRef = useCallback(
    (node: HTMLElement | null) => {
      if (isFetchingNextPage || !hasNextPage) return
      if (observer.current) observer.current.disconnect()

      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage()
        }
      })

      if (node) observer.current.observe(node)
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  )

  const handleSubmitData = async (payload: AddClinicalNotesParams): Promise<boolean> => {
    setIsSubmitLoading(true)
    try {
      const response: AddClinicalNotesResponse = await addClinicalNotes({ payload })

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || t('hospital_module.note_added_successfully') })
        queryClient.invalidateQueries({ queryKey: ['clinicalNotes'] })

        return true
      } else {
        console.error('Submit Error:', response?.message)
        Toaster({ type: 'error', message: response?.message || t('hospital_module.note_failed_to_add') })

        return false
      }
    } catch (error) {
      const err = error as Error
      console.error('Submit Error:', err?.message || err)

      return false
    } finally {
      setIsSubmitLoading(false)
    }
  }

  const deleteClinicalNotesMutation = useMutation<DeleteClinicalNotesResponse, Error, string>({
    mutationFn: (noteId: string) => deleteClinicalNotes(noteId),
    onSuccess: async (response) => {
      Toaster({ type: 'success', message: response?.message || t('hospital_module.note_deleted_successfully') })

      queryClient.invalidateQueries({ queryKey: ['clinicalNotes'] })
      handleDeleteDialogClose()
    },
    onError: (error: Error) => {
      console.error('Delete Error:', error?.message || error)
      Toaster({ type: 'error', message: error?.message || t('hospital_module.error_occurred_while_deleting') })
    }
  })

  const handleDeleteNote = (noteId: string) => {
    const selectedNote = allClinicalEntries?.find((item: ClinicalNotesList) => item?.note_id === noteId)

    if (selectedNote?.note_id) {
      setSelectedItemToDelete(selectedNote)
      setIsDeleteDialogOpen(true)
    }
  }

  const handleDeleteDialogClose = () => {
    setIsDeleteDialogOpen(false)
    setSelectedItemToDelete(null)
  }

  const handleConfirmDeleteNote = () => {
    if (selectedItemToDelete?.note_id) {
      deleteClinicalNotesMutation.mutate(selectedItemToDelete.note_id)
    }
  }

  return (
    <>
      <InpatientClinicalNotes
        clinicalNotesData={allClinicalEntries}
        onSubmitNote={handleSubmitData}
        isSubmitting={isSubmitLoading}
        onDeleteNote={handleDeleteNote}
        isInitialLoading={isInitialLoading}
        lastClinicalNoteRef={lastClinicalNoteRef}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        patientData={patientData}
      />

      {isDeleteDialogOpen && (
        <ConfirmationDialog
          dialogBoxStatus={isDeleteDialogOpen}
          onClose={handleDeleteDialogClose}
          title={(t('hospital_module.delete_clinical_note') as string)}
          cancelText={t('cancel')}
          confirmBtnStyle={{ background: theme.palette.customColors.Error, py: 2 }}
          image={'/images/warning-icon.svg'}
          imgStyle={{ background: theme.palette.customColors.TertiaryLight, p: 4 }}
          confirmAction={handleConfirmDeleteNote}
          loading={deleteClinicalNotesMutation.isPending}
          ConfirmationText={t('delete')}
          description={t('hospital_module.delete_clinical_note_confirm_msg')}
        />
      )}
    </>
  )
}

export default ClinicalNotes
