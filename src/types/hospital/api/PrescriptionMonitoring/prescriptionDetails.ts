import { Id, PrescriptionDetails, PrescriptionFrequency } from '../../models'

export interface GetPrescriptionDetailsParams {
  prescription_id: Id
  date: string
  group_prescription_id: Id
  hospital_id: Id
  administrative_ids?: Id | Id[] | string
}

export type GetPrescriptionDetailsResponse =
  | {
      success: true
      data: PrescriptionDetails
      message?: string
    }
  | {
      success: false
      message: string
    }

export type { PrescriptionFrequency }
