export interface StyledTypographyProps {
  fontWeight?: number | string
  fontSize?: string
  color?: string
  sx?: any
}
export interface QRDialogData {
  requestId?: string
  qrCodeUrl?: string
  title?: string
  subtitle?: string
}
export interface TransferFilters {
  page_no: number
  limit: number
  search: string
  start_date?: string
  end_date?: string
  hospital_id?: string
}

export interface HospitalTransferRow {
  transfer_id?: string | number
  transfer_code?: string
  transfer_status?: string
  activity_status?: string
  is_checkout_required?: number
  is_checkin_required?: number
  total_animals?: number | string
  source_name?: string
  destination_name?: string
  reason_for_transfer?: string
  user_first_name?: string
  user_last_name?: string
  user_profile_pic?: string
  created_at?: string
  transfer_type?: string
}

export interface IndexedHospitalTransferRow extends HospitalTransferRow {
  id: number | string
  sl_no: number
}

export interface HospitalTransferStats {
  pending_count?: string | number
  intransit_count?: string | number
  completed_count?: string | number
  canceled_count?: string | number
  rejected_count?: string | number
  [key: string]: string | number | undefined
}

export interface TransferStatusInfo {
  label: string
}

// Drawer Types
export interface HospitalTransferDrawerProps {
  open: boolean
  onClose: () => void
  transferId?: number | string
  onAcceptSuccess?: () => void
  hideAcceptButton?: boolean
  showQRCode?: boolean
}

export interface TransferDetails {
  transfer_id?: number
  transfer_code?: string
  transfer_status?: string
  activity_status?: string
  transfer_type?: string
  source_type?: string
  source_name?: string
  destination_name?: string
  user_first_name?: string
  user_last_name?: string
  user_profile_image?: string
  user_mobile_number?: string
  created_at?: string
  reason_for_transfer?: string
  transfer_reference_code?: string
  visit_type?: string
  checked_count?: number
  total_checklist_count?: number
  qr_code_full_path?: string
}

export interface EntityDetail {
  animal_id?: number
  [key: string]: unknown
}

export interface TransferAttachment {
  id?: number
  file?: string
  url?: string
  file_url?: string
  file_original_name?: string
  name?: string
  created_at?: string
  type?: string
  file_type?: string
  user_first_name?: string
  user_last_name?: string
  user_full_name?: string
  user_name?: string
  user_profile_pic?: string
  profile_image?: string
}

export interface CommentDetail {
  id?: number
  comments?: string
  commented_on?: string
  user_first_name?: string
  user_last_name?: string
  user_profile_pic?: string
}

export interface HospitalTransferData {
  total_animal_count?: number
  entity_details?: EntityDetail[]
  transfer_details?: TransferDetails
  transfer_attachment?: TransferAttachment[]
  comments_details?: CommentDetail[]
}

export interface ChecklistCommentDump {
  loaded_count?: number
  total_animal_count?: number
}

export interface ChecklistComment {
  id?: number
  comments?: string
  commented_on?: string
  dump?: ChecklistCommentDump
  pending_count?: number
}

export interface GroupedChecklistSection {
  date?: string
  entries: ChecklistComment[]
}

export interface AnimalItem {
  animal_id?: number
  transfer_status?: string
  [key: string]: unknown
}

export interface HospitalTransferCommentPayload {
  entity_id: number
  entity_type: string
  content: string
  action: string
}

