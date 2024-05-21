import { Card, CardContent, CardHeader } from "@mui/material"
import { useEffect } from "react"
import { getDiagnosisList } from "src/lib/api/diagnosis"


const DiagnosisList = () => {
     

    useEffect(()=>{
        const fetchData = async()=>{
           const response = await getDiagnosisList().then((res)=>{console.log("res >>" , res)})
           return response;
        }
        fetchData()
    } ,[])

    const columns = [

        {
          flex: 0.4,
          minWidth: 20,
          field: 'Id',
          headerName: 'Id',
          renderCell: params => (
            <Typography variant='body2' sx={{ color: 'text.primary' }}>
              {params.row.id}
            </Typography>
          )
        },
    
    
    
        {
          flex: 0.4,
          minWidth: 20,
          field: 'label',
          headerName: 'Name',
          renderCell: params => (
            <Typography variant='body2' sx={{ color: 'text.primary' }}>
              {params.row.label}
            </Typography>
          )
        },

        {
            flex: 0.4,
            minWidth: 20,
            field: 'description',
            headerName: 'Description',
            renderCell: params => (
              <Typography variant='body2' sx={{ color: 'text.primary' }}>
                {params.row.description}
              </Typography>
            )
          },
    
      ]

    return(
        <>
        <Card>
         <CardHeader  title="Diagnosis"/>
         <CardContent>
            
         </CardContent>

        </Card>
        
        </>
    )
}
export default DiagnosisList