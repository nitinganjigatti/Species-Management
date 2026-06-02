import { Id } from "../models"

export interface AddPatient {
    transfer_id: Id
    ref_id: Id[]
}

export interface RefIds {
  ref_id: Id
  entity_ids: Id[]
}