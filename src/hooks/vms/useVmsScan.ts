import { useMutation } from '@tanstack/react-query'
import * as vmsApi from 'src/lib/api/vms'
import type { ScanPayload } from 'src/types/vms'

export const useScanQr = () => {
  return useMutation({
    mutationFn: (payload: ScanPayload) => vmsApi.scanQr(payload),
  })
}
