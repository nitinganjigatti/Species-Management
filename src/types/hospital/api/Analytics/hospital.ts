import { HospitalAnalyticsDetail } from "../../models"

export type GetHospitalDetailAnalyticsResponse = | {
    status: true
    message: string
    data: HospitalAnalyticsDetail
} | {
    success: false
    status?: false
    message: string
}
