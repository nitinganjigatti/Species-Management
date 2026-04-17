'use client'

import React, { useState, useMemo, useCallback, useRef } from 'react'
import { useTheme } from '@emotion/react'
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import useSafeRouter from 'src/hooks/useSafeRouter'
import { useParams } from 'next/navigation'
import Toaster from 'src/components/Toaster'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import { addClinicalNotes, deleteClinicalNotes, getClinicalNotes } from 'src/lib/api/hospital/clinicalNotesApi'
import InpatientClinicalNotes from 'src/views/pages/hospital/inpatient/InpatientClinicalNotes'
import { useSelector } from 'react-redux'

const STORAGE_KEY = 'medical_record_data'

interface ClinicalNotesProps {
  patientData?: any
}

const ClinicalNotes = ({ patientData }: ClinicalNotesProps) => {
  const [isSubmitLoading, setIsSubmitLoading] = useState<boolean>(false)
  const [selectedItemToDelete, setSelectedItemToDelete] = useState<any>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false)

  const theme: any = useTheme()
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

  const fetchClinicalNotes = async ({ pageParam = 1 }: any) => {
    try {
      const res: any = await getClinicalNotes({
        animalId: animal_id,
        params: { ...queryParams, page: pageParam }
      } as any)

      return {
        total_count: res?.data?.total_count,
        data: res?.data?.result || []
      }
    } catch (error: any) {
      console.error('Error fetching clinical notes:', error?.message || error)
    }
  }

  const getNextPage = (lastPage: any, pages: any[]) => {
    const totalCount = Number(lastPage?.total_count) || 0
    const fetchedCount = pages?.reduce((sum: number, page: any) => sum + (page?.data?.length || 0), 0)

    return fetchedCount < totalCount ? pages?.length + 1 : undefined
  }

  const {
    data: clinicalNotesData,
    isFetching,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery<any>({
    queryKey: ['clinicalNotes', animal_id, queryParams],
    queryFn: fetchClinicalNotes,
    getNextPageParam: getNextPage,
    enabled: !!animal_id,
    refetchOnWindowFocus: false,
    initialPageParam: 1
  } as any)

  const allClinicalEntries = useMemo(() => {
    return clinicalNotesData?.pages?.flatMap((page: any) => page?.data || []) || []
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

  const handleSubmitData = async (payload: any) => {
    setIsSubmitLoading(true)
    try {
      const response: any = await addClinicalNotes({ payload } as any)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Note added successfully' })
        queryClient.invalidateQueries({ queryKey: ['clinicalNotes'] })

        return true
      } else {
        console.error('Submit Error:', response?.message)
        Toaster({ type: 'error', message: response?.message || 'Note failed to add' })

        return false
      }
    } catch (error: any) {
      console.error('Submit Error:', error?.message || error)

      return false
    } finally {
      setIsSubmitLoading(false)
    }
  }

  const deleteClinicalNotesMutation: any = useMutation({
    mutationFn: (noteId: any) => deleteClinicalNotes(noteId),
    onSuccess: async (response: any) => {
      Toaster({ type: 'success', message: response?.message || 'Note deleted successfully' })

      queryClient.invalidateQueries({ queryKey: ['clinicalNotes'] })
      handleDeleteDialogClose()
    },
    onError: (error: any) => {
      console.error('Delete Error:', error?.message || error)
      Toaster({ type: 'error', message: error?.message || 'An error occurred while deleting' })
    }
  })

  const handleDeleteNote = (noteId: any) => {
    const selectedNote = allClinicalEntries?.find((item: any) => item?.note_id === noteId)

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
          title={'Delete Clinical Note?'}
          cancelText={'CANCEL'}
          confirmBtnStyle={{ background: theme.palette.customColors.Error, py: 2 }}
          image={'/images/warning-icon.svg'}
          imgStyle={{ background: theme.palette.customColors.TertiaryLight, p: 4 }}
          confirmAction={handleConfirmDeleteNote}
          loading={deleteClinicalNotesMutation.isPending}
          ConfirmationText={'DELETE'}
          description={'Are you sure you want to permanently delete this Clinical Note?'}
        />
      )}
    </>
  )
}

export default ClinicalNotes
