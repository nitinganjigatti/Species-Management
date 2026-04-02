import { Control, UseFormWatch, UseFormReset } from 'react-hook-form'

export interface ReactionCounts {
  like: number
  heart?: number
  clap?: number
  total_reactions?: number
}

export interface ChildObservationType {
  child_id: number
  type_name: string
}

export interface ChildMasterType {
  observation_id: number
  parent_observation_type_id: number
  parent_observation_type: string
  child_observation_type: ChildObservationType[]
}

export interface AnimalData {
  local_identifier_value: string | null
  local_identifier_name: string | null
  user_section_name: string
  animal_id: number | string
  common_name: string
  default_icon: string | null
  scientific_name: string
  section_name: string
  sex: string
  user_enclosure_name: string
  site_name: string
}

export interface SiteData {
  site_name: string
  image: string
}

export interface SectionData {
  section_name: string
  site_name: string
  image: string
}

export interface EnclosureData {
  site_name: string
  section_name: string
  user_enclosure_name: string
}

export interface RefData {
  observation_id: number
  type?: string
  ref_type?:string
  animalData?: AnimalData
  siteData?: SiteData
  sectionData?: SectionData
  enclosureData?: EnclosureData
}

export interface Attachment {
  id: number
  file: string
  file_orginal_name: string
}

export interface BaseUser {
  user_id: number | string
  full_name: string
  role_id: number | string
  role_name: string
}

export interface AssignedUserListing extends BaseUser {
  observation_id: number
  profile_pic: string | null
  user_email: string
  mobile_number: string
}

export interface AssignedUserDetails extends BaseUser {
  user_profile_pic: string | null
}

export interface NotesAttachment {
  id: number | string
  file_orginal_name: string
  file: string
  created_at:string
  modified_at:string
}

export interface NoteDetails {
  id: number | string
  observation_id: number | string
  modified_at: string | null
  created_at: string
  created_by_name: string
  user_profile_pic: string | null
  observation:string | null
  notes_attachment: NotesAttachment[] 
}

export interface NoteItem {
  observation_id: number
  priority: string
  observation_name: string
  created_at: string
  modified_at: string
  created_by: string
  created_by_phone: string
  reaction_counts: ReactionCounts
  user_reaction: string | null
  child_master_type: ChildMasterType | null
  attachments: Attachment[]
  assign_to: AssignedUserListing[]
  note: {total_comments: number | string} | null
  ref_data: RefData[]
}


export interface ObservationNoteCardProps {
  note: NoteItem
  onClick?: (note: NoteItem) => void
  onLikeClick?: (note: NoteItem) => void
  onCommentClick?: (note: NoteItem) => void
  sx?: any
  isLikeLoading?: boolean
}

export interface PriorityIcons {
  [key: string]: string
  Low: string
  Moderate: string
  High: string
  Critical: string
}

export interface NoteDetailsDrawerProps {
  open: boolean
  onClose: () => void
  noteDetails: NoteItem | null
  openWithComment?: boolean
  onUpdate?: () => void
  refetchNotesList?: () => void
}

export interface AddAttachmentsDrawerProps {
    open: boolean
    onClose: () => void
    control: Control<any>
    watch: UseFormWatch<any>
    reset: UseFormReset<any>
    attachmentsLoading: boolean
    onAttachmentsSubmit: () => void
}

export interface TaggedMembersDrawerProps {
  open: boolean
  onClose: () => void
  setNotifyMembersDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>
  taggedMembers: AssignedUserDetails[]
  updateMembersLoading: boolean
  isCreator: boolean
}

export interface NotesDetailsData {
  observation_id: number | string
  observation_type_id:number | string
  observation_name:string
  create_date:string
  create_time:string
  created_by:string
  created_by_phone: string
  created_by_id:number | string
  priority:string
  reaction_counts: ReactionCounts
  user_reaction: string | null
  created_date:string
  created_time:string
  assign_to: AssignedUserDetails[]
  attachments: Attachment[]
  notes:NoteDetails[] 
  child_master_type:ChildMasterType | null
  ref_data: RefData[]
}
