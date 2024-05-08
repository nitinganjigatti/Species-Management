import { NOTE_BASE_URL } from 'src/constants/notes/constants'
import { axiosFormPost, axiosGet } from '../utility'


export async function getNotesList(params) {
    console.log("pARAMS >>" , params)
    const response = await axiosGet({ url: `${NOTE_BASE_URL}/list` , params: params,pharmacy:true })

    return response.data
}

export async function AddNote(payload) {
    const response = await axiosFormPost({ url: `${NOTE_BASE_URL}/add`, body: payload, pharmacy: true })

    return response.data

}

export async function getSubTypeList(id){
   const response = await axiosGet({url : `${NOTE_BASE_URL}/list?parent_id=${id}`, pharmacy:true})

   return response.data
}
