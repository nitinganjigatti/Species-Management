import { GridSortModel } from "@mui/x-data-grid"
import { Id, MedicineList, MedicineBatchList } from "../../models"
export type GetMedicineListResponse =
  | {
      success: true
      data: {
        brand_name: {
            count: string
            result: MedicineList[]
        }
        generic_name: {
            count: string
            result: MedicineList[]
        }
      }
      message: string
    }
  | {
      success: false
      message?: string
    }

export interface GetMedicineListParams {
    product_search?: string
    page_no: string | number
    screen: string
    sort?: string
    q?: string
    limit?: string | number
}

export type GetMedicineBatchListResponse =
  | {
      data: {
        count: string
        result: MedicineBatchList[]
      }
      success: true
    }
  | {
      success: false
      message: string
    }

export interface GetMedicineBatchListParams {
  medicine_id: Id
  q: string
}