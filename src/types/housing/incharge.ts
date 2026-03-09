
export interface Incharge {
  user_id: number;
  user_first_name: string;
  user_last_name: string;
  user_profile_pic: string;
  role_name: string;
  user_mobile_number: string;
}

export interface UserWithAccess {
  user_id: string | number
  user_name?: string
  full_name?: string
  user_first_name?: string
  user_last_name?: string
  user_profile_pic?: string
  profile_pic?: string
  mobile_number?: string
  user_mobile_number?: string
  role_name?: string
  can_perform_action?: number | boolean
  account_status?: string
  string_id?: string
}

// Params for getUsersList API (get-userswith-access endpoint)
export interface GetUsersWithAccessParams {
  id: string | string[] | undefined
  type: 'site' | 'section' | 'enclosure' | 'animal'
  page_no?: number
  search?: string
  limit?: number
}

// Response for getUsersList API
export interface GetUsersWithAccessResponse {
  success?: boolean
  message?: string
  data?: {
    result?: UserWithAccess[]
    total_count?: number
  }
}

export interface InchargeRole {
  id?: string | number;
  role_name?: string;
  label: string;
  value: string | number;
}

export interface User {
  user_id: number;
  user_name?: string;
  user_profile_pic?: string;
  role_name?: string;
}

export interface ApiResponse<T> {
  success?: boolean;
  status?: boolean;
  message?: string;
  data?: T;
  total_count?: number;
}

export interface InchargeListParams {
  ref_id: string | string[] | undefined;
  ref_type: string;
}

export interface InchargeListResponse extends ApiResponse<{
  incharges: Incharge[];
  total_count: number;
}> {}

export interface AddInchargePayload {
  ref_id: string | string[] | undefined;
  ref_type: string;
  user_id: string; 
}

export interface UserListParams {
  zoo_id?: number;
  page_no?: number;
  q?: string;
  isActive?: boolean;
  type?: string;
  length?: number;
  role_id?: string | number;
  site_id?: string | string[] | undefined;
}

export interface UserListResponse extends ApiResponse<User[]> {}

export interface RoleListResponse extends ApiResponse<InchargeRole[]> {}

export interface InchargeFilters {
  page: number;
  limit: number;
  search: string;
}

export interface InchargeRoleFilters {
  Role: string | number;
}

export interface InchargeDrawerProps {
  openDrawer: boolean;
  closeDrawer: () => void;
  selectedUsers?: Incharge[];
  onSelect: (selectedUsers: Incharge[]) => void;
  title?: string;
  confirmLabel?: string;
  showFilter?: boolean;
  onSubmit?: (selectedUsers: Incharge[]) => Promise<{ success?: boolean; message?: string }>;
  refType?: 'site' | 'section' | 'enclosure' | 'cluster';
}

export interface InchargeRoleFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmitLoading?: boolean;
  onApplyFilters: (filters: InchargeRoleFilters) => void;
  setFilterCount: (count: number) => void;
  initialSelectedOptions: InchargeRoleFilters;
}

