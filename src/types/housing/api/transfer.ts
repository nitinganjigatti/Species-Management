/**
 * Transfer API types
 * Used by: sites/[id], animals/[id]
 */

// ==================== Animal Transfer List ====================

export interface AnimalTransferItem {
  animal_movement_id?: number
  request_id?: string
  transfer_type?: 'intra' | 'inter' | 'external'
  transfer_status?: string
  activity_status?: string
  source_site_name?: string
  destination_name?: string
  destination_id?: number
  animal_count?: number
  transferred_animal_count?: number
  requested_on?: string
  comments?: string
  comment_string_id?: string
  comments_tag?: string
  string_id?: string
  user_details?: string
}

export interface GetAnimalTransferListParams {
  site_id: number | string
  transfer_type: 'intra' | 'inter' | 'external'
  filter_type?: string
  page_no?: number
  q?: string
}

export interface GetAnimalTransferListResponse {
  success?: boolean
  message?: string
  data?: {
    result?: AnimalTransferItem[]
    total_count?: number
  }
}

// ==================== Transfer Details ====================

export interface TransferAssignTo {
  enclosure_id?: number
  enclosure_name?: string
  section_id?: number
  section_name?: string
}

export interface TransferDetails {
  animal_movement_id?: number
  request_id?: string
  transfer_code?: string
  transfer_type?: 'intra' | 'inter' | 'external'
  transfer_status?: string
  activity_status?: string
  source_site_id?: number
  source_site_name?: string
  destination_id?: number
  destination_name?: string
  destination_site_name?: string
  animal_count?: number
  transferred_animal_count?: number
  requested_on?: string
  created_at?: string
  comments?: string
  reason?: string
  qr_code_full_path?: string
  checked_count?: number
  total_checklist_count?: number
  user_first_name?: string
  user_last_name?: string
  user_profile_pic?: string
  user_mobile_number?: string
  created_by?: number
  created_by_name?: string
  assign_to?: TransferAssignTo
}

export interface TransferEntityDetail {
  animal_id?: number
  animal_name?: string
  local_identifier_value?: string
  local_identifier_name?: string
  sex?: string
  species_name?: string
  common_name?: string
  default_icon?: string
  user_enclosure_name?: string
  transfer_status?: string
  [key: string]: unknown
}

export interface TransferAttachment {
  id?: number
  file?: string
  file_url?: string
  file_original_name?: string
  file_type?: string
  created_at?: string
  thumbnail?: string
}

export interface TransferComment {
  id?: number
  comments?: string
  content?: string
  commented_on?: string
  created_at?: string
  action?: string
  user_id?: number
  user_name?: string
  user_full_name?: string
  user_first_name?: string
  user_last_name?: string
  profile_pic?: string
  user_profile_pic?: string
  status?: string
  is_system_generated?: number | boolean
}

export interface TransferApprovalItem {
  user_id?: number
  user_first_name?: string
  user_last_name?: string
  user_profile_pic?: string
  role_name?: string
  site_name?: string
  status?: string
  source_site?: number
  destination_site?: number
  source_action_date?: string
  destination_action_date?: string
  commented_on?: string
}

export interface TransferSummaryData {
  transfer_details?: TransferDetails
  entity_details?: TransferEntityDetail[]
  animal_details?: TransferEntityDetail[]
  transfer_attachment?: TransferAttachment[]
  comments_details?: TransferComment[]
  approval_list?: TransferApprovalItem[]
  total_animal_count?: number
  transferred_animal_count?: number
  total_members?: number
}

export interface GetTransferSummaryResponse {
  success?: boolean
  message?: string
  data?: TransferSummaryData
}

// ==================== Animal Transfer Details ====================

export interface GetAnimalTransferSummaryParams {
  animal_movement_id: number | string
  type?: string
}

export interface GetAnimalTransferButtonStatusParams {
  animal_movement_id: number | string
  type?: string
}

export interface TransferButtonStatus {
  show_approve_button?: boolean
  show_reject_button?: boolean
  show_cancel_request_button?: boolean
  approve_button?: boolean
  reject_button?: boolean
  already_approved?: boolean
  already_rejected?: boolean
  show_you_approved?: boolean
  show_you_rejected?: boolean
  reset_approval?: boolean
  reinitiate_button?: boolean
  show_edit_checklist_button?: boolean
  show_load_animals_button?: boolean
  show_start_ride_button?: boolean
  show_reach_destination_button?: boolean
  show_reached_destination_button?: boolean
  show_allocate_button?: boolean
  show_complete_button?: boolean
  show_check_temperature_button?: boolean
  show_security_checkout_button?: boolean
  show_security_checkin_button?: boolean
  show_reload_animals_button?: boolean
  show_approve_entry?: boolean
  show_allow_entry?: boolean
  fill_transfer_check_list?: boolean
  show_checklist_button?: boolean
  SECURITY_CHECKOUT_ALLOWED?: boolean
  SECURITY_CHECKIN_ALLOWED?: boolean
  show_accept_button?: number
}

export interface GetTransferButtonStatusResponse {
  success?: boolean
  message?: string
  data?: TransferButtonStatus
}

export interface AnimalTransferLogItem {
  id?: number
  animal_movement_id?: number
  user_id?: number
  user_name?: string
  user_first_name?: string
  user_last_name?: string
  profile_pic?: string
  comments?: string
  content?: string
  status?: string
  activity_status?: string
  created_at?: string
  commented_on?: string
}

export interface GetAnimalTransferLogsResponse {
  success?: boolean
  message?: string
  data?: {
    logs?: AnimalTransferLogItem[]
  } | AnimalTransferLogItem[]
}

export interface AddAnimalTransferCommentPayload {
  animal_movement_id: number | string
  comments: string
}

export interface AddAnimalTransferCommentResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export interface UpdateAnimalTransferStatusPayload {
  animal_movement_id: number | string
  transfer_status?: string
  activity_status?: string
  comments?: string
}

export interface UpdateAnimalTransferStatusResponse {
  success?: boolean
  message?: string
  data?: unknown
}

// ==================== Transfer Button Status ====================

export interface GetTransferButtonStatusParams {
  animal_movement_id: number | string
  site_id?: number | string
  reference?: string
  type?: string
}

export interface UpdateTransferStatusPayload {
  status: string
  movement_id: number | string
  comments?: string
  animal_ids?: string
  temperature_value?: string
  temperature_unit?: string
}

export interface UpdateTransferStatusResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export interface AddTransferCommentPayload {
  animal_movement_id: number | string
  comments: string
  status?: string
}

export interface AddTransferCommentResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export interface TransferActivityItem {
  id?: number
  status?: string
  comments?: string
  content?: string
  action?: string
  commented_on?: string
  created_at?: string
  user_first_name?: string
  user_last_name?: string
  user_profile_pic?: string
  date_changed?: boolean
  dump?: {
    loaded_count?: number
    total_animal_count?: number
  }
}

export interface GetTransferActivityResponse {
  success?: boolean
  message?: string
  data?: {
    logs?: TransferActivityItem[]
    comments?: TransferActivityItem[]
    result?: TransferActivityItem[]
  }
}

// ==================== Transfer Team Members ====================

export interface TransferMemberUser {
  user_id?: number
  user_name?: string
  user_first_name?: string
  user_last_name?: string
  user_profile_pic?: string
  role_name?: string
  user_mobile_number?: string
  can_perform_action?: boolean
  source_site_name?: string
  destination_name?: string
  account_status?: string
}

export interface TransferMembersData {
  source_users?: TransferMemberUser[]
  destination_users?: TransferMemberUser[]
  user_details?: TransferMemberUser[]
}

export interface GetTransferMembersResponse {
  success?: boolean
  message?: string
  data?: TransferMembersData
}

// ==================== Approve/Reject Transfer ====================

export interface ApproveTransferResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export interface RejectTransferPayload {
  animal_movement_id: number | string
  transfer_status?: string
  activity_status: string
  comments?: string
}

export interface RejectTransferResponse {
  success?: boolean
  message?: string
  data?: unknown
}

// ==================== Animal List by Species ====================

export interface AnimalDetailItem {
  animal_id?: number
  animal_name?: string
  local_identifier_value?: string
  local_identifier_name?: string
  sex?: string
  gender?: string
  default_icon?: string
  user_enclosure_name?: string
  transfer_status?: string
  common_name?: string
  default_common_name?: string
  scientific_name?: string
  complete_name?: string
  [key: string]: unknown
}

export interface SpeciesWithAnimalsItem {
  taxonomy_id?: number
  common_name?: string
  scientific_name?: string
  default_icon?: string
  animal_count?: number
  animal_details?: AnimalDetailItem[]
  [key: string]: unknown
}

export interface AnimalBySpeciesItem {
  animal_id?: number
  animal_name?: string
  local_identifier_value?: string
  local_identifier_name?: string
  sex?: string
  species_name?: string
  common_name?: string
  default_icon?: string
  user_enclosure_name?: string
  transfer_status?: string
  [key: string]: unknown
}

export interface GetAnimalListBySpeciesResponse {
  success?: boolean
  message?: string
  data?: {
    result?: SpeciesWithAnimalsItem[]
    total_animal_count?: number
  }
}
