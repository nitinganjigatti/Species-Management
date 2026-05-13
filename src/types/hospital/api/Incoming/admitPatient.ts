import { PatientAdmitAction, TreatmentType, HealthStatus } from "../Incoming/incoming"
import { Id, Incoming } from "../../models"
import { DateType } from "../../api"


export interface AdmitPatientPayload {
  action?: PatientAdmitAction
  transfer_id?: Id
  treatment_type?: TreatmentType
  attend_by?: Id
  holding_enclosure?: Id
  admit_date?: DateType
  admit_time?: string
  room_id?: Id
  health_status?: HealthStatus
  co_attend_doctor?: string
  reject_reason?: string
}

export interface AdmitPatientResponse {
  success?: boolean
  data?: Incoming[]
  message?: string
}