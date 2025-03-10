
import { DIAGNOSIS_URL } from "src/constants/notes/constants";
import { axiosGet, axiosPost } from "../utility";


export async function getDiagnosisList(){

    const response = await axiosPost({ url: `${DIAGNOSIS_URL}` , pharmacy:true })

    return response.data;
}

