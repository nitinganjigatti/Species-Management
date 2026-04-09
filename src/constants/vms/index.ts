// API Endpoints
export const VMS_ENDPOINTS = {
  // Passes
  PASSES_LIST: 'v1/vms/passes',
  PASSES_SEARCH: 'v1/vms/passes/search',
  PASS_DETAIL: (id: string) => `v1/vms/passes/${id}`,
  PASS_QR: (id: string) => `v1/vms/passes/${id}/qr`,
  CREATE_PASS: 'v1/vms/passes',
  UPDATE_PASS: (id: string) => `v1/vms/passes/${id}`,
  CANCEL_PASS: (id: string) => `v1/vms/passes/${id}`,

  // Scan
  SCAN: 'v1/vms/scan',

  // Gadgets
  GADGETS_LIST: 'v1/vms/gadgets',
  CREATE_GADGET: 'v1/vms/gadgets',
  UPDATE_GADGET: (id: number) => `v1/vms/gadgets/${id}`,
  DELETE_GADGET: (id: number) => `v1/vms/gadgets/${id}`,

  // Reports
  REPORT_SUMMARY: 'v1/vms/reports/summary',
  REPORT_VISITORS: 'v1/vms/reports/visitors',
  REPORT_EXPORT: 'v1/vms/reports/export',
} as const

// React Query keys
export const VMS_QUERY_KEYS = {
  PASSES: 'vms-passes',
  PASS_DETAIL: 'vms-pass-detail',
  PASS_SEARCH: 'vms-pass-search',
  PASS_QR: 'vms-pass-qr',
  GADGETS: 'vms-gadgets',
  REPORT_SUMMARY: 'vms-report-summary',
  REPORT_VISITORS: 'vms-report-visitors',
} as const

// Pagination
export const VMS_PAGE_SIZE = 10

// Permission keys (checked in userData.roles.settings)
export const VMS_PERMISSIONS = {
  PASS_VIEW: 'vms_pass_view',
  PASS_ADD: 'vms_pass_add',
  PASS_EDIT: 'vms_pass_edit',
  SCAN: 'vms_scan',
  REPORTS: 'vms_reports',
  GADGETS_MANAGE: 'vms_gadgets_manage',
} as const

// Status badge config
export const VMS_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  active: { label: 'Active', color: '#1976D2', bgColor: '#E3F2FD' },
  checked_in: { label: 'Checked In', color: '#006D35', bgColor: '#E1F9ED' },
  checked_out: { label: 'Checked Out', color: '#616161', bgColor: '#F0F0F0' },
  cancelled: { label: 'Cancelled', color: '#D32F2F', bgColor: '#ffebe5' },
  expired: { label: 'Expired', color: '#E65100', bgColor: '#FFF3E0' },
}

// Standard gadget field labels (frontend knows these)
export const GADGET_STANDARD_FIELDS: Record<string, string> = {
  serial_key: 'Serial Number',
  imei: 'IMEI',
  make: 'Make / Brand',
  model: 'Model',
  color: 'Color',
}

// Status options for filter dropdowns
export const VMS_STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'checked_in', label: 'Checked In' },
  { value: 'checked_out', label: 'Checked Out' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
]
