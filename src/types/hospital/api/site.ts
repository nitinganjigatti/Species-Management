import { ZooWiseSiteList } from "../models"

export interface GetZooWiseSiteListsResponse {
    data: {
        total_count: string | number
        result: ZooWiseSiteList[]
    }
    success: true
    message: string
}

export interface GetZooWiseSiteListsParams {
    q: string
    limit: string | number
    page_no: string | number
}