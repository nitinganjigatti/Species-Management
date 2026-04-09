import { useQuery } from '@tanstack/react-query'
import { VMS_QUERY_KEYS } from 'src/constants/vms'
import * as vmsApi from 'src/lib/api/vms'
import type { VmsReportFilters } from 'src/types/vms'

export const useReportSummary = (filters: VmsReportFilters) => {
  return useQuery({
    queryKey: [VMS_QUERY_KEYS.REPORT_SUMMARY, filters],
    queryFn: () => vmsApi.getReportSummary(filters),
  })
}

export const useReportVisitors = (filters: VmsReportFilters) => {
  return useQuery({
    queryKey: [VMS_QUERY_KEYS.REPORT_VISITORS, filters],
    queryFn: () => vmsApi.getReportVisitors(filters),
  })
}
