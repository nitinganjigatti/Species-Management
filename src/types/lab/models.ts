// ==================== Core Lab Entity ====================

export interface Lab {
  id: number
  lab_name: string
  type?: 'internal' | 'external'
  incharge_name?: string
  address?: string
  lab_contact_number?: string
  latitudes?: string | number
  longitudes?: string | number
  is_default?: string | number
  image?: string | null
  lab_details?: LabSampleWithTests[]
}

// ==================== Lab Tests Tree Structure ====================

export interface LabSampleWithTests {
  sample_id: number
  sample_name: string
  value?: boolean
  tests: LabParentTest[]
}

export interface LabParentTest {
  test_id: number
  test_name: string
  full_test?: boolean
  value?: boolean
  child_tests: LabChildTest[]
}

export interface LabChildTest {
  test_id: number
  test_name: string
  value?: boolean
  input_type?: string
}

// ==================== Master - Lab Sample ====================

export interface LabSampleMaster {
  id: number
  label?: string
  lab_test_count?: number
  sample_type_count?: number
  created_at?: string
  zoo_id?: string
  created_by_user?: CreatedByUser
}

// ==================== Master - Lab Test ====================

export interface LabTestMaster {
  id: number
  test_name?: string
  label?: string
  sample_type_count?: number
  sub_test_count?: number
  created_at?: string
  zoo_id?: string
  created_by_user?: CreatedByUser
}

export interface CreatedByUser {
  user_name?: string
  profile_pic?: string
}

// ==================== Master - Mortality Reason ====================

export interface MortalityReason {
  id: number
  name: string
  description?: string
  active?: boolean | string | number
}

// ==================== Lab Site & User ====================

export interface LabSite {
  site_id: number
  site_name?: string
}

export interface LabUser {
  user_full_name?: string
}

// ==================== Permissions ====================

export interface LabPermissions {
  allow_full_access?: boolean
  allow_upload_reports?: boolean
  transfer_tests?: boolean
  perform_tests?: boolean
}

// ==================== File Attachments ====================

export interface FileAttachment {
  id?: number
  file: string
  file_original_name?: string
  file_type?: string
  user_profile?: FileUserProfile
}

export interface FileUserProfile {
  user_profile_pic?: string
  name?: string
  first_name?: string
  last_name?: string
  created_at?: string
}

// ==================== Medical Notes ====================

export interface MedicalNote {
  id: number
  note?: string
  modified_at?: string
  created_at?: string
  user_profile?: FileUserProfile
}

// ==================== File Views Configuration ====================

export interface FileViewConfig {
  bg_color?: string
  image_path?: string
}

export interface FileViews {
  image?: FileViewConfig
  pdf?: FileViewConfig
  xls?: FileViewConfig
  document?: FileViewConfig
  audio?: FileViewConfig
}

// ==================== Animal Detail ====================

export interface AnimalDetail {
  animal_id?: number
  default_icon?: string
  sex?: 'male' | 'female' | 'undetermined' | 'indeterminate'
  local_id_type?: string
  local_identifier_value?: string
  default_common_name?: string
  scientific_name?: string
  breed_name?: string
  morph_name?: string
  user_enclosure_name?: string
  section_name?: string
  site_name?: string
}

// ==================== Test Report ====================

export interface TestReport {
  id: number
  test_name?: string
  sample_name?: string
  lab_name?: string
  status?: string
  status_label?: string
  key?: string
  is_special_sample?: string
  attachments?: {
    images?: FileAttachment[]
    docs?: FileAttachment[]
  }
  notes?: string
  notes_modified_by_profile_pic?: string
  notes_added_by_profile_pic?: string
  notes_modified_by?: string
  notes_added_by?: string
  notes_modified_at?: string
  notes_added_at?: string
}

// ==================== Request Item ====================

export interface RequestItem {
  request_id?: string
  id?: number
  medical_record_code?: string
  medical_record_id?: number
  created_by?: string
  created_at?: string
  site_name?: string
  site_id?: number
  lab_id?: number
  lab_name?: string
  total_no_test?: number
  animal_details?: AnimalDetail[]
  test_reports?: TestReport[]
  files?: {
    images?: FileAttachment[]
    files?: FileAttachment[]
  }
  medical_attachements?: {
    images?: FileAttachment[]
    files?: FileAttachment[]
    notes?: MedicalNote[]
  }
}

// ==================== Lab Request Row (listing) ====================

export interface LabRequestRow {
  id?: number
  lab_test_id?: string | number
  site_name?: string
  created_at?: string
  total_lab_tests?: number
  total_test?: number
  total_attachments?: number
  total_tests_pending?: number
  total_tests_inprogress?: number
  total_tests_completed?: number
  lab_id?: string | number
  sl_no?: number
}

// ==================== Request Stats ====================

export interface RequestStats {
  total_requests?: number
  total_tests_pending?: number
  total_tests_inprogress?: number
  total_tests_completed?: number
}

// ==================== Transfer Options ====================

export interface LabTransferOption {
  lab_id: number | string
  lab_name?: string
}

// ==================== Sample Detail (detail view) ====================

export interface SampleDetail {
  id?: number
  label?: string
  lab_test_count?: number
  sample_type_count?: number
  child_samples?: ChildSample[]
}

export interface ChildSample {
  id: number
  label?: string
}

// ==================== Test Detail (detail view) ====================

export interface TestDetail {
  id?: number
  test_name?: string
  sample_ids?: SampleType[]
  sub_tests?: SubTest[]
}

export interface SampleType {
  id: number
  label?: string
}

export interface SubTest {
  id: number
  test_name?: string
}

// ==================== Edit Params ====================

export interface EditParams {
  id: number | null
  label?: string | null
  sample_type_count?: number | null
  sub_test_count?: number | null
  zoo_id?: string | number | null
}

// ==================== Status Option ====================

export interface StatusOption {
  id: string
  name: string
}

export interface LabTestStatusOption {
  key: string
  value: string
  status?: string
}
