import { Id, VisitHistory } from "../../models"
export interface TotalVisitsResponse {
    success: boolean
    data: {
        data: VisitHistory[]
    }
}

export interface TotalVisitParams {
    page_no: string | number
    limit: string | number
    animal_id: Id
    hospital_id: Id
    hospital_case_id: Id
}

export interface VisitHistoryFilters {
    page: number | string
    limit: number | string
}

