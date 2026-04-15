import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { VMS_QUERY_KEYS } from 'src/constants/vms'
import * as vmsApi from 'src/lib/api/vms'
import type { CreateGadgetPayload } from 'src/types/vms'
import toast from 'react-hot-toast'

export const useGadgetsList = () => {
  return useQuery({
    queryKey: [VMS_QUERY_KEYS.GADGETS],
    queryFn: () => vmsApi.getGadgetsList(),
  })
}

export const useCreateGadget = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateGadgetPayload) => vmsApi.createGadget(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VMS_QUERY_KEYS.GADGETS] })
      toast.success('Gadget type created')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create gadget')
    },
  })
}

export const useUpdateGadget = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CreateGadgetPayload> }) =>
      vmsApi.updateGadget(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VMS_QUERY_KEYS.GADGETS] })
      toast.success('Gadget type updated')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update gadget')
    },
  })
}

export const useDeleteGadget = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => vmsApi.deleteGadget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VMS_QUERY_KEYS.GADGETS] })
      toast.success('Gadget type deleted')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete gadget')
    },
  })
}
