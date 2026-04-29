import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { VMS_QUERY_KEYS } from 'src/constants/vms'
import * as vmsApi from 'src/lib/api/vms'
import type { VmsPassListParams, CreatePassPayload } from 'src/types/vms'
import toast from 'react-hot-toast'

export const usePassesList = (params: VmsPassListParams) => {
  return useQuery({
    queryKey: [VMS_QUERY_KEYS.PASSES, params],
    queryFn: () => vmsApi.getPassesList(params),
  })
}

export const usePassDetail = (id: string | undefined) => {
  return useQuery({
    queryKey: [VMS_QUERY_KEYS.PASS_DETAIL, id],
    queryFn: () => vmsApi.getPassDetail(id!),
    enabled: !!id,
  })
}

export const usePassSearch = (q: string) => {
  return useQuery({
    queryKey: [VMS_QUERY_KEYS.PASS_SEARCH, q],
    queryFn: () => vmsApi.searchPasses(q),
    enabled: q.length > 0,
  })
}

export const usePassQr = (id: string | undefined) => {
  return useQuery({
    queryKey: [VMS_QUERY_KEYS.PASS_QR, id],
    queryFn: () => vmsApi.getPassQr(id!),
    enabled: !!id,
  })
}

export const useCreatePass = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreatePassPayload) => vmsApi.createPass(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VMS_QUERY_KEYS.PASSES] })
      toast.success('Pass created successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create pass')
    },
  })
}

export const useUpdatePass = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreatePassPayload> }) =>
      vmsApi.updatePass(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [VMS_QUERY_KEYS.PASSES] })
      queryClient.invalidateQueries({ queryKey: [VMS_QUERY_KEYS.PASS_DETAIL, variables.id] })
      toast.success('Pass updated successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update pass')
    },
  })
}

export const useCancelPass = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => vmsApi.cancelPass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VMS_QUERY_KEYS.PASSES] })
      toast.success('Pass cancelled successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to cancel pass')
    },
  })
}
