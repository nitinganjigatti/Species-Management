import { Id, TemplateAction, TemplateList } from "../../models"

export interface GetTemplatesResponse {
    success: boolean
    data: {
        templates: TemplateList[]
        total_count: number | string
        current_page: number | string
        per_page: number | string
        total_pages: number | string
    }
    message: string
}

export interface GetTemplatesParams {
    page_no: string | number
    limit: string | number
    hospital_id: Id
    type: string
}

export interface TemplateActionResponse {
    success: boolean
    data: TemplateAction
    message: string
}

export interface CreateTemplateParams {
    template_name: string
    hospital_id: Id
    type: string
    description: string
}

export interface UpdateTemplateParams {
    id: Id
    template_name: string
    description: string
}

export interface DeleteTemplateParams {
    id: Id
}