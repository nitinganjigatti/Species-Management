import { Id } from "src/types/compliance"
import { Carcass, GetNecropsyCenter } from "../../models/discharge"

export interface GetNecropsyCenterResponse {
    status: boolean
    message: string
    data: {
        total_records: string | number
        list: GetNecropsyCenter[]
    }
}

export interface GetNecropsyCenterParams {
    q: string
    limit: string | number
    page: string | number
}

export interface GetCarcassResponse {
    is_success: boolean
    data: Carcass[]
}

export interface MannerOfDeathResponse {
    is_success: boolean
    success: boolean
    message: string | null
    data: Carcass[]
    page: string | number
    limit: string | number
    total: string | number
    total_pages: string | number
}

export interface CarcassParams {
    q: string
    limit: string | number
    page: string | number
}