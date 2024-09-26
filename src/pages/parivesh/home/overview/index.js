import React, { useCallback, useContext, useEffect, useState } from 'react'
import { Box } from '@mui/system'
import { Card, CardContent } from '@mui/material'
import CustomAccordion from 'src/components/parivesh/CustomAccordion'
import Organization from './organization'
import { usePariveshContext } from 'src/context/PariveshContext'
import { getOrgCountList } from 'src/lib/api/parivesh/organizationCount'
import { AuthContext } from 'src/context/AuthContext'
import Error404 from 'src/pages/404'

const data = [
  {
    value: 0,
    label: 'ANIMAL RECORDS ',
    color: '#FFFFFF',
    borderColor: '#FFFFFF'
  },
  {
    value: 0,
    label: 'NET ANIMALS ',
    color: '#FFFFFF',
    borderColor: '#FFFFFF'
  },
  {
    value: 0,
    label: 'MALE',
    color: '#00AFD6',
    borderColor: '#00AFD6'
  },
  {
    value: 0,
    label: 'FEMALE',
    color: '#FFD3D3',
    borderColor: '#FFD3D3'
  },
  {
    value: 0,
    label: 'OTHERS',
    color: '#FFFFFF',
    borderColor: '#FFFFFF'
  },
  {
    value: 0,
    label: 'TOTAL SPECIES',
    color: '#E4B819',
    borderColor: '#E4B819'
  }
]
const cards = [
  {
    value: 0,
    content: 'Births',
    bgColor: '#37BD69',
    items: [
      { value: 0, bgColor: '#00AFD6' },
      { value: 0, bgColor: '#FFD3D3' },
      { value: 0, bgColor: '#FFFFFF' }
    ]
  },
  {
    value: 0,
    content: 'Deaths',
    bgColor: '#E93353',
    items: [
      { value: 0, bgColor: '#00AFD6' },
      { value: 0, bgColor: '#FFD3D3' },
      { value: 0, bgColor: '#FFFFFF' }
    ]
  },
  {
    value: 0,
    content: 'Acquisition',
    bgColor: '#37BD69',
    items: [
      { value: 0, bgColor: '#00AFD6' },
      { value: 0, bgColor: '#FFD3D3' },
      { value: 0, bgColor: '#FFFFFF' }
    ]
  },
  {
    value: 0,
    content: 'Transfers',
    bgColor: '#FA6140',
    items: [
      { value: 0, bgColor: '#00AFD6' },
      { value: 0, bgColor: '#FFD3D3' },
      { value: 0, bgColor: '#FFFFFF' }
    ]
  }
]

const Overview = () => {
  const { selectedParivesh, setSelectedParivesh, organizationList } = usePariveshContext()
  const [organizationDetails, setOrganizationDetails] = useState([])
  const [organizationCountList, setOrganizationCountList] = useState([])
  const authData = useContext(AuthContext)
  const pariveshAccess = authData?.userData?.roles?.settings?.enable_parivesh

  useEffect(() => {
    if (selectedParivesh?.id) {
      const selected = organizationList.find(el => el.id === selectedParivesh.id)
      setOrganizationDetails(selected ? [selected] : [])
    }
  }, [selectedParivesh, organizationList])

  const handleBoxClick = organization => {
    setSelectedParivesh(organization)
  }

  const fetchOrgCountData = useCallback(
    async (q, id) => {
      try {
        const params = {
          q,
          id
        }

        await getOrgCountList({ params: params }).then(res => {
          const transformedData = res.data.map(org => ({
            organization_name: org.organization_name,
            org_id: org.org_id,
            species_image: org?.species_image,
            cover_image: org?.cover_image,
            approvedAccordionData: {
              title: 'Approved by Parivesh',
              data: [
                {
                  value: org.approved_count_data.total_animal,
                  label: 'ANIMAL RECORDS ',
                  color: '#FFFFFF',
                  borderColor: '#FFFFFF'
                },
                {
                  value: org?.approved_count_data?.net_animal,
                  label: 'NET ANIMALS ',
                  color: '#FFFFFF',
                  borderColor: '#FFFFFF'
                },

                { value: org.approved_count_data.male_count, label: 'MALE', color: '#00AFD6', borderColor: '#00AFD6' },
                {
                  value: org.approved_count_data.female_count,
                  label: 'FEMALE',
                  color: '#FFD3D3',
                  borderColor: '#FFD3D3'
                },
                {
                  value: org.approved_count_data.other_count,
                  label: 'OTHERS',
                  color: '#FFFFFF',
                  borderColor: '#FFFFFF'
                },
                {
                  value: org.approved_count_data.species_count,
                  label: 'TOTAL SPECIES',
                  color: '#E4B819',
                  borderColor: '#E4B819'
                }
              ],
              cards: [
                {
                  value: org.approved_count_data.possession_counts.births.total,
                  content: 'Births',
                  bgColor: '#37BD69',
                  items: [
                    { value: org.approved_count_data.possession_counts.births.male, bgColor: '#00AFD6' },
                    { value: org.approved_count_data.possession_counts.births.female, bgColor: '#FFD3D3' },
                    { value: org.approved_count_data.possession_counts.births.other, bgColor: '#FFFFFF' }
                  ]
                },
                {
                  value: org.approved_count_data.possession_counts.deaths.total,
                  content: 'Deaths',
                  bgColor: '#E93353',
                  items: [
                    { value: org.approved_count_data.possession_counts.deaths.male, bgColor: '#00AFD6' },
                    { value: org.approved_count_data.possession_counts.deaths.female, bgColor: '#FFD3D3' },
                    { value: org.approved_count_data.possession_counts.deaths.other, bgColor: '#FFFFFF' }
                  ]
                },
                {
                  value: org.approved_count_data.possession_counts.acquisitions.total,
                  content: 'Acquisition',
                  bgColor: '#37BD69',
                  items: [
                    { value: org.approved_count_data.possession_counts.acquisitions.male, bgColor: '#00AFD6' },
                    { value: org.approved_count_data.possession_counts.acquisitions.female, bgColor: '#FFD3D3' },
                    { value: org.approved_count_data.possession_counts.acquisitions.other, bgColor: '#FFFFFF' }
                  ]
                },
                {
                  value: org.approved_count_data.possession_counts.transfers.total,
                  content: 'Transfers',
                  bgColor: '#FA6140',
                  items: [
                    { value: org.approved_count_data.possession_counts.transfers.male, bgColor: '#00AFD6' },
                    {
                      value: org.approved_count_data.possession_counts.transfers.female,
                      bgColor: '#FFD3D3'
                    },
                    { value: org.approved_count_data.possession_counts.transfers.other, bgColor: '#FFFFFF' }
                  ]
                }
              ]
            },
            yetToSubmitAccordionData: {
              title: 'To be submitted',
              data: [
                {
                  value: org.yet_to_submitted_count.total_animal,
                  label: 'ANIMAL RECORDS ',
                  color: '#FFFFFF',
                  borderColor: '#FFFFFF'
                },
                {
                  value: org.yet_to_submitted_count.net_animal,
                  label: 'NET ANIMALS ',
                  color: '#FFFFFF',
                  borderColor: '#FFFFFF'
                },
                {
                  value: org.yet_to_submitted_count.male_count,
                  label: 'MALE',
                  color: '#00AFD6',
                  borderColor: '#00AFD6'
                },
                {
                  value: org.yet_to_submitted_count.female_count,
                  label: 'FEMALE',
                  color: '#FFD3D3',
                  borderColor: '#FFD3D3'
                },
                {
                  value: org.yet_to_submitted_count.other_count,
                  label: 'OTHERS',
                  color: '#FFFFFF',
                  borderColor: '#FFFFFF'
                },
                {
                  value: org.yet_to_submitted_count.species_count,
                  label: 'TOTAL SPECIES',
                  color: '#E4B819',
                  borderColor: '#E4B819'
                }
              ],
              cards: [
                {
                  value: org.yet_to_submitted_count.possession_counts.births.total,
                  content: 'Births',
                  bgColor: '#37BD69',
                  items: [
                    { value: org.yet_to_submitted_count.possession_counts.births.male, bgColor: '#00AFD6' },
                    { value: org.yet_to_submitted_count.possession_counts.births.female, bgColor: '#FFD3D3' },
                    { value: org.yet_to_submitted_count.possession_counts.births.other, bgColor: '#FFFFFF' }
                  ]
                },
                {
                  value: org.yet_to_submitted_count.possession_counts.deaths.total,
                  content: 'Deaths',
                  bgColor: '#E93353',
                  items: [
                    { value: org.yet_to_submitted_count.possession_counts.deaths.male, bgColor: '#00AFD6' },
                    { value: org.yet_to_submitted_count.possession_counts.deaths.female, bgColor: '#FFD3D3' },
                    { value: org.yet_to_submitted_count.possession_counts.deaths.other, bgColor: '#FFFFFF' }
                  ]
                },
                {
                  value: org.yet_to_submitted_count.possession_counts.acquisitions.total,
                  content: 'Acquisition',
                  bgColor: '#37BD69',
                  items: [
                    { value: org.yet_to_submitted_count.possession_counts.acquisitions.male, bgColor: '#00AFD6' },
                    { value: org.yet_to_submitted_count.possession_counts.acquisitions.female, bgColor: '#FFD3D3' },
                    { value: org.yet_to_submitted_count.possession_counts.acquisitions.other, bgColor: '#FFFFFF' }
                  ]
                },
                {
                  value: org.yet_to_submitted_count.possession_counts.transfers.total,
                  content: 'Transfers',
                  bgColor: '#FA6140',
                  items: [
                    { value: org.yet_to_submitted_count.possession_counts.transfers.male, bgColor: '#00AFD6' },
                    {
                      value: org.yet_to_submitted_count.possession_counts.transfers.female,
                      bgColor: '#FFD3D3'
                    },
                    { value: org.yet_to_submitted_count.possession_counts.transfers.other, bgColor: '#FFFFFF' }
                  ]
                }
              ]
            },
            submittedAccordionData: {
              title: 'Submitted Data',
              data: [
                {
                  value: org.submitted_count_data.total_animal,
                  label: 'ANIMAL RECORDS ',
                  color: '#FFFFFF',
                  borderColor: '#FFFFFF'
                },
                {
                  value: org.submitted_count_data.net_animal,
                  label: 'NET ANIMALS ',
                  color: '#FFFFFF',
                  borderColor: '#FFFFFF'
                },
                {
                  value: org.submitted_count_data.male_count,
                  label: 'MALE',
                  color: '#00AFD6',
                  borderColor: '#00AFD6'
                },
                {
                  value: org.submitted_count_data.female_count,
                  label: 'FEMALE',
                  color: '#FFD3D3',
                  borderColor: '#FFD3D3'
                },
                {
                  value: org.submitted_count_data.other_count,
                  label: 'OTHERS',
                  color: '#FFFFFF',
                  borderColor: '#FFFFFF'
                },
                {
                  value: org.submitted_count_data.species_count,
                  label: 'TOTAL SPECIES',
                  color: '#E4B819',
                  borderColor: '#E4B819'
                }
              ],
              cards: [
                {
                  value: org.submitted_count_data.possession_counts.births.total,
                  content: 'Births',
                  bgColor: '#37BD69',
                  items: [
                    { value: org.submitted_count_data.possession_counts.births.male, bgColor: '#00AFD6' },
                    { value: org.submitted_count_data.possession_counts.births.female, bgColor: '#FFD3D3' },
                    { value: org.submitted_count_data.possession_counts.births.other, bgColor: '#FFFFFF' }
                  ]
                },
                {
                  value: org.submitted_count_data.possession_counts.deaths.total,
                  content: 'Deaths',
                  bgColor: '#E93353',
                  items: [
                    { value: org.submitted_count_data.possession_counts.deaths.male, bgColor: '#00AFD6' },
                    { value: org.submitted_count_data.possession_counts.deaths.female, bgColor: '#FFD3D3' },
                    { value: org.submitted_count_data.possession_counts.deaths.other, bgColor: '#FFFFFF' }
                  ]
                },
                {
                  value: org.submitted_count_data.possession_counts.acquisitions.total,
                  content: 'Acquisition',
                  bgColor: '#37BD69',
                  items: [
                    { value: org.submitted_count_data.possession_counts.acquisitions.male, bgColor: '#00AFD6' },
                    { value: org.submitted_count_data.possession_counts.acquisitions.female, bgColor: '#FFD3D3' },
                    { value: org.submitted_count_data.possession_counts.acquisitions.other, bgColor: '#FFFFFF' }
                  ]
                },
                {
                  value: org.submitted_count_data.possession_counts.transfers.total,
                  content: 'Transfers',
                  bgColor: '#FA6140',
                  items: [
                    { value: org.submitted_count_data.possession_counts.transfers.male, bgColor: '#00AFD6' },
                    {
                      value: org.submitted_count_data.possession_counts.transfers.female,
                      bgColor: '#FFD3D3'
                    },
                    { value: org.submitted_count_data.possession_counts.transfers.other, bgColor: '#FFFFFF' }
                  ]
                }
              ]
            }
          }))
          setOrganizationCountList(transformedData)
        })
      } catch (e) {
        console.log(e)
      }
    },
    [selectedParivesh?.id]
  )

  useEffect(() => {
    fetchOrgCountData(selectedParivesh?.id)
  }, [fetchOrgCountData])

  console.log(organizationCountList, 'organizationCountList')

  return (
    <>
      {pariveshAccess ? (
        <>
          <Box>
            {organizationDetails.map((organization, index) => {
              // Find orgData that matches the current organization id
              const orgData = organizationCountList.find(org => org.org_id === organization.id)
              // If orgData is found, render CustomAccordion with fetched data
              if (orgData) {
                return (
                  <Card key={index} sx={{ mb: 6 }}>
                    <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
                      <CustomAccordion
                        title={orgData.approvedAccordionData.title}
                        data={orgData.approvedAccordionData.data}
                        cards={orgData.approvedAccordionData.cards}
                        backgroundImage={orgData?.cover_image !== '' && orgData?.cover_image}
                        // backgroundImage={
                        //   orgData?.species_image !== ''
                        //     ? orgData?.species_image
                        //     : 'https://images.pexels.com/photos/1599452/pexels-photo-1599452.jpeg'
                        // }
                        isOrganization
                        organizationName={orgData.organization_name}
                        showDetails
                        summaryIcon='ion:checkmark'
                        handleBoxClick={() => handleBoxClick(organization)}
                      />
                      <Box sx={{ mt: 3 }}>
                        <CustomAccordion
                          title={orgData.yetToSubmitAccordionData.title}
                          data={orgData.yetToSubmitAccordionData.data}
                          cards={orgData.yetToSubmitAccordionData.cards}
                          backgroundImage={orgData?.cover_image !== '' && orgData?.cover_image}
                          summaryIcon='mdi:arrow-top-right'
                        />
                      </Box>
                      {selectedParivesh?.id && (
                        <Box sx={{ mt: 3 }}>
                          <CustomAccordion
                            title={orgData.submittedAccordionData.title}
                            data={orgData.submittedAccordionData.data}
                            cards={orgData.submittedAccordionData.cards}
                            backgroundImage={orgData?.cover_image !== '' && orgData?.cover_image}
                            summaryIcon='mdi:checkbox-marked'
                          />
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                )
              } else {
                // If orgData is not found, render default or empty data
                return (
                  <Card key={index} sx={{ mb: 6 }}>
                    <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
                      <CustomAccordion
                        title='Approved by Parivesh'
                        data={data}
                        cards={cards}
                        backgroundImage=''
                        isOrganization
                        organizationName={organization.organization_name}
                        showDetails
                        handleBoxClick={() => handleBoxClick(organization)}
                        summaryIcon='ion:checkmark'
                      />
                      <Box sx={{ mt: 3 }}>
                        <CustomAccordion
                          title='To be submitted'
                          data={data}
                          cards={cards}
                          backgroundImage=''
                          summaryIcon='mdi:arrow-top-right'
                        />
                      </Box>
                    </CardContent>
                  </Card>
                )
              }
            })}
          </Box>
          {selectedParivesh?.zoo_id && <Organization />}
        </>
      ) : (
        <Error404></Error404>
      )}
    </>
  )
}

export default Overview

// import React, { useEffect, useState } from 'react'
// import { useTheme } from '@mui/material/styles'
// import CustomAccordion from 'src/components/parivesh/CustomAccordion'
// import { Card, CardContent } from '@mui/material'
// import { Box } from '@mui/system'
// import Organization from './organization'
// import { usePariveshContext } from 'src/context/PariveshContext'

// const data = [
//   { value: 200, label: 'ANIMAL RECORDS ', color: '#FFFFFF', borderColor: '#FFFFFF' },
//   { value: 103, label: 'MALE', color: '#00AFD6', borderColor: '#00AFD6' },
//   { value: 74, label: 'FEMALE', color: '#FFD3D3', borderColor: '#FFD3D3' },
//   { value: 23, label: 'OTHERS', color: '#FFFFFF', borderColor: '#FFFFFF' },
//   { value: 156, label: 'TOTAL SPECIES', color: '#E4B819', borderColor: '#E4B819' }
// ]

// const cards = [
//   {
//     value: 60,
//     content: 'Parent Stock',
//     bgColor: '#37BD69',
//     items: [
//       { value: 6, bgColor: '#00AFD6' },
//       { value: 5, bgColor: '#FFD3D3' },
//       { value: 10, bgColor: '#FFFFFF' }
//     ]
//   },
//   {
//     value: 25,
//     content: 'Acquisition',
//     bgColor: '#37BD69',
//     items: [
//       { value: 11, bgColor: '#00AFD6' },
//       { value: 7, bgColor: '#FFD3D3' },
//       { value: 6, bgColor: '#FFFFFF' }
//     ]
//   },
//   {
//     value: 5,
//     content: 'Births',
//     bgColor: '#37BD69',
//     items: [
//       { value: 21, bgColor: '#00AFD6' },
//       { value: 2, bgColor: '#FFD3D3' },
//       { value: 7, bgColor: '#FFFFFF' }
//     ]
//   },
//   {
//     value: 5,
//     content: 'Deaths',
//     bgColor: '#E93353',
//     items: [
//       { value: 2, bgColor: '#00AFD6' },
//       { value: 6, bgColor: '#FFD3D3' },
//       { value: 6, bgColor: '#FFFFFF' }
//     ]
//   },
//   {
//     value: 5,
//     content: 'Transfers',
//     bgColor: '#FA6140',
//     items: [
//       { value: 6, bgColor: '#00AFD6' },
//       { value: 11, bgColor: '#FFD3D3' },
//       { value: 3, bgColor: '#FFFFFF' }
//     ]
//   }
// ]

// const Overview = () => {
//   const theme = useTheme()
//   const { selectedParivesh, setSelectedParivesh, organizationList } = usePariveshContext()
//   const [organizationDetails, setOrganizationDetails] = useState([])

//   useEffect(() => {
//     if (selectedParivesh?.id === 'all') {
//       setOrganizationDetails(organizationList.filter(el => el.id !== 'all'))
//     } else {
//       const selected = organizationList.filter(el => el.id === selectedParivesh.id)
//       setOrganizationDetails(selected)
//     }
//   }, [selectedParivesh, organizationList])

//   const handleBoxClick = organization => {
//     setSelectedParivesh(organization)
//     if (organization?.id === 'all') {
//       setOrganizationDetails(organizationList.filter(el => el.id !== 'all'))
//     } else {
//       const selected = organizationList.filter(el => el.id === organization.id)
//       setOrganizationDetails(selected)
//     }
//   }

//   return (
//     <>
//       <Box>
//         {organizationDetails.map((organization, index) => (
//           <Card sx={{ mb: 6 }} key={index}>
//             <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
//               <CustomAccordion
//                 title='Approved by Parivesh'
//                 summaryIcon='ion:checkmark'
//                 data={data}
//                 backgroundImage='https://images.pexels.com/photos/1599452/pexels-photo-1599452.jpeg'
//                 cards={cards}
//                 isOrganization
//                 organizationName={organization.organization_name}
//                 showDetails
//                 handleBoxClick={() => handleBoxClick(organization)}
//               />
//               <Box sx={{ mt: 3 }}>
//                 <CustomAccordion
//                   title='To be submitted'
//                   summaryIcon='ion:checkmark'
//                   data={data}
//                   backgroundImage='https://images.pexels.com/photos/1599452/pexels-photo-1599452.jpeg'
//                   cards={cards}
//                 />
//               </Box>
//             </CardContent>
//           </Card>
//         ))}
//       </Box>
//       {selectedParivesh?.zoo_id && <Organization />}
//     </>
//   )
// }

// export default Overview

// import React, { useCallback, useEffect, useState } from 'react'
// import { useTheme } from '@mui/material/styles'
// import CustomAccordion from 'src/components/parivesh/CustomAccordion'
// import { Card, CardContent } from '@mui/material'
// import { Box } from '@mui/system'
// import { getOrganizationList } from 'src/lib/api/parivesh/addSpecies'
// import { readAsync } from 'src/lib/windows/utils'
// import Organization from './organization'
// import { usePariveshContext } from 'src/context/PariveshContext'

// const data = [
//   { value: 200, label: 'ANIMAL RECORDS ', color: '#FFFFFF', borderColor: '#FFFFFF' },
//   { value: 103, label: 'MALE', color: '#00AFD6', borderColor: '#00AFD6' },
//   { value: 74, label: 'FEMALE', color: '#FFD3D3', borderColor: '#FFD3D3' },
//   { value: 23, label: 'OTHERS', color: '#FFFFFF', borderColor: '#FFFFFF' },
//   { value: 156, label: 'TOTAL SPECIES', color: '#E4B819', borderColor: '#E4B819' }
// ]

// const cards = [
//   {
//     value: 60,
//     content: 'Parent Stock',
//     bgColor: '#37BD69',
//     items: [
//       { value: 6, bgColor: '#00AFD6' },
//       { value: 5, bgColor: '#FFD3D3' },
//       { value: 10, bgColor: '#FFFFFF' }
//     ]
//   },
//   {
//     value: 25,
//     content: 'Acquisition',
//     bgColor: '#37BD69',
//     items: [
//       { value: 11, bgColor: '#00AFD6' },
//       { value: 7, bgColor: '#FFD3D3' },
//       { value: 6, bgColor: '#FFFFFF' }
//     ]
//   },
//   {
//     value: 5,
//     content: 'Births',
//     bgColor: '#37BD69',
//     items: [
//       { value: 21, bgColor: '#00AFD6' },
//       { value: 2, bgColor: '#FFD3D3' },
//       { value: 7, bgColor: '#FFFFFF' }
//     ]
//   },
//   {
//     value: 5,
//     content: 'Deaths',
//     bgColor: '#E93353',
//     items: [
//       { value: 2, bgColor: '#00AFD6' },
//       { value: 6, bgColor: '#FFD3D3' },
//       { value: 6, bgColor: '#FFFFFF' }
//     ]
//   },
//   {
//     value: 5,
//     content: 'Transfers',
//     bgColor: '#FA6140',
//     items: [
//       { value: 6, bgColor: '#00AFD6' },
//       { value: 11, bgColor: '#FFD3D3' },
//       { value: 3, bgColor: '#FFFFFF' }
//     ]
//   }
// ]

// const Overview = () => {
//   const theme = useTheme()
//   const [loading, setLoading] = useState(false)
//   const [selectedOrganization, setSelectedOrganization] = useState()
//   const [organizationDetails, setOrganizationDetails] = useState([])
//   const { selectedParivesh, setSelectedParivesh, organizationList } = usePariveshContext()

//   console.log(selectedParivesh, 'selectedParivesh')

//   useEffect(() => {
//     const fetchStoredParivesh = async () => {
//       const storedParivesh = await readAsync('storeParivesh')
//       console.log(storedParivesh, 'storedParivesh')
//       setSelectedOrganization(() => storedParivesh)

//       if (storedParivesh?.id === 'all') {
//         setOrganizationDetails(organizationList.filter(el => el.id !== 'all'))
//       } else {
//         const selected = organizationList.filter(el => el.id === storedParivesh.id)
//         setOrganizationDetails(selected)
//       }
//     }

//     fetchStoredParivesh()
//   }, [selectedParivesh, organizationList])

//   const handleBoxClick = organization => {
//     setSelectedParivesh(() => organization)

//     setSelectedOrganization(() => organization)
//     if (organization?.id === 'all') {
//       setOrganizationDetails(organizationList.filter(el => el.id !== 'all'))
//     } else {
//       const selected = organizationList.filter(el => el.id === organization.id)
//       setOrganizationDetails(selected)
//     }
//   }

//   return (
//     <>
//       <Box>
//         {organizationDetails.map((organization, index) => (
//           <>
//             {console.log(organization, 'organization')}
//             <Card sx={{ mb: 6 }} key={index}>
//               <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
//                 <CustomAccordion
//                   title='Approved by Parivesh'
//                   summaryIcon='ion:checkmark'
//                   data={data}
//                   backgroundImage='https://images.pexels.com/photos/1599452/pexels-photo-1599452.jpeg'
//                   cards={cards}
//                   isOrganization
//                   organizationName={organization.organization_name}
//                   showDetails
//                   handleBoxClick={() => handleBoxClick(organization)}
//                 />
//                 <Box sx={{ mt: 3 }}>
//                   <CustomAccordion
//                     title='To be submitted'
//                     summaryIcon='ion:checkmark'
//                     data={data}
//                     backgroundImage='https://images.pexels.com/photos/1599452/pexels-photo-1599452.jpeg'
//                     cards={cards}
//                   />
//                 </Box>
//               </CardContent>
//             </Card>
//           </>
//         ))}
//       </Box>
//       {selectedOrganization?.zoo_id && <Organization />}
//     </>
//   )
// }

// export default Overview

// import React, { useState, useEffect, useCallback, useContext } from 'react'

// import { getIngredientList } from 'src/lib/api/diet/getIngredients'

// import FallbackSpinner from 'src/@core/components/spinner/index'
// import CardHeader from '@mui/material/CardHeader'
// import { DataGrid } from '@mui/x-data-grid'
// import { debounce } from 'lodash'
// import Tab from '@mui/material/Tab'
// import TabPanel from '@mui/lab/TabPanel'
// import TabContext from '@mui/lab/TabContext'
// import { styled } from '@mui/material/styles'
// import MuiTabList from '@mui/lab/TabList'
// import TabList from '@mui/lab/TabList'
// import moment from 'moment'
// import { Avatar, Button, Tooltip, Box, Switch, Divider, CardContent } from '@mui/material'

// // ** MUI Imports
// import Card from '@mui/material/Card'
// import Typography from '@mui/material/Typography'
// import Chip from '@mui/material/Chip'
// import Grid from '@mui/material/Grid'

// // ** Icon Imports
// import Icon from 'src/@core/components/icon'
// import Router from 'next/router'
// import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
// import ConfirmationDialog from 'src/components/confirmation-dialog'
// import ConfirmationCheckBox from 'src/views/forms/form-elements/confirmationCheckBox'
// import { useTheme } from '@mui/material/styles'

// import { AuthContext } from 'src/context/AuthContext'
// import Toaster from 'src/components/Toaster'
// import CustomAccordion from 'src/components/parivesh/CustomAccordion'
// import { getOrganizationList } from 'src/lib/api/parivesh/addSpecies'

// const data = [
//   { value: 200, label: 'ANIMAL RECORDS ', color: '#FFFFFF', borderColor: '#FFFFFF' },
//   { value: 103, label: 'MALE', color: '#00AFD6', borderColor: '#00AFD6' },
//   { value: 74, label: 'FEMALE', color: '#FFD3D3', borderColor: '#FFD3D3' },
//   { value: 23, label: 'OTHERS', color: '#FFFFFF', borderColor: '#FFFFFF' },
//   { value: 156, label: 'TOTAL SPECIES', color: '#E4B819', borderColor: '#E4B819' }
// ]

// const cards = [
//   {
//     value: 60,
//     content: 'Parent Stock',
//     bgColor: '#37BD69',
//     items: [
//       { value: 6, bgColor: '#00AFD6' },
//       { value: 5, bgColor: '#FFD3D3' },
//       { value: 10, bgColor: '#FFFFFF' }
//     ]
//   },
//   {
//     value: 25,
//     content: 'Acquisition',
//     bgColor: '#37BD69',
//     items: [
//       { value: 11, bgColor: '#00AFD6' },
//       { value: 7, bgColor: '#FFD3D3' },
//       { value: 6, bgColor: '#FFFFFF' }
//     ]
//   },
//   {
//     value: 5,
//     content: 'Births',
//     bgColor: '#37BD69',
//     items: [
//       { value: 21, bgColor: '#00AFD6' },
//       { value: 2, bgColor: '#FFD3D3' },
//       { value: 7, bgColor: '#FFFFFF' }
//     ]
//   },
//   {
//     value: 5,
//     content: 'Deaths',
//     bgColor: '#E93353',
//     items: [
//       { value: 2, bgColor: '#00AFD6' },
//       { value: 6, bgColor: '#FFD3D3' },
//       { value: 6, bgColor: '#FFFFFF' }
//     ]
//   },
//   {
//     value: 5,
//     content: 'Transfers',
//     bgColor: '#FA6140',
//     items: [
//       { value: 6, bgColor: '#00AFD6' },
//       { value: 11, bgColor: '#FFD3D3' },
//       { value: 3, bgColor: '#FFFFFF' }
//     ]
//   }
// ]

// const Overview = () => {
//   const theme = useTheme()
//   const [loader, setLoader] = useState(false)
//   const [total, setTotal] = useState(0)
//   const [sort, setSort] = useState('desc')
//   const [rows, setRows] = useState([
//     {
//       uid: '01',
//       id: '1',
//       registration_id: 'WL/GJ/132549',
//       of_species: '555',
//       of_animals: '2501',
//       created_at: '2024-06-03 16:07:17',
//       approved_date: '2024-06-06 16:07:17',
//       created_by_user: {
//         user_name: 'sr',
//         email: 'sr@mailinator.com',
//         profile_pic: 'https://api.dev.antzsystems.com/uploads/11/diet/ingredients/665d9cdd975011717411037.jpg'
//       }
//     }
//   ])
//   const [searchValue, setSearchValue] = useState('')
//   const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
//   const [loading, setLoading] = useState(false)
//   const [dialog, setDialog] = useState(false)
//   const [check, setCheck] = useState(false)

//   const authData = useContext(AuthContext)

//   const [organizationList, setOrganizationList] = useState([])
//   const [selectedOrganization, setSelectedOrganization] = useState(null)
//   function loadServerRows(currentPage, data) {
//     return data
//   }

//   const handleChange = (event, newValue) => {
//     setTotal(0)
//     setValue(newValue)
//   }

//   const onClose = () => {
//     setDialog(false)
//   }

//   const fetchTableData = useCallback(async (sortBy, q, sortColumn) => {
//     try {
//       setLoading(true)

//       const params = {}

//       await getOrganizationList(params).then(res => {
//         console.log('response', res)
//         setOrganizationList(() => res)
//         // Generate uid field based on the index
//       })
//       setLoading(false)
//     } catch (e) {
//       console.log(e)
//       setLoading(false)
//     }
//   }, [])

//   useEffect(() => {
//     fetchTableData()
//   }, [fetchTableData])

//   const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

//   const indexedRows = rows?.map((row, index) => ({
//     ...row,
//     sl_no: getSlNo(index)
//   }))

//   //   const handleSortModel = newModel => {
//   //     if (newModel.length) {
//   //       setSort(newModel[0].sort)
//   //       setsortColumning(newModel[0].field)
//   //       fetchTableData(newModel[0].sort, searchValue, newModel[0].field, status)
//   //     } else {
//   //     }
//   //   }

//   //   const searchTableData = useCallback(
//   //     debounce(async (sort, q, sortColumn, status) => {
//   //       setSearchValue(q)
//   //       try {
//   //         await fetchTableData(sort, q, sortColumn, status)
//   //       } catch (error) {
//   //         console.error(error)
//   //       }
//   //     }, 1000),
//   //     []
//   //   )

//   //   const handleSearch = value => {
//   //     setSearchValue(value)
//   //     searchTableData(sort, value, sortColumning, status)
//   //   }

//   const columns = [
//     {
//       flex: 0.2,
//       Width: 40,
//       field: 'uid',
//       headerName: 'S.NO',
//       renderCell: params => (
//         <Typography variant='body2' sx={{ color: 'text.primary' }}>
//           {params.row.uid}
//         </Typography>
//       )
//     },
//     {
//       flex: 0.5,
//       minWidth: 30,
//       field: 'registration_id',
//       headerName: 'REGISTRATION ID',
//       renderCell: params => (
//         <Box sx={{ display: 'flex', alignItems: 'center' }}>
//           <Box sx={{ display: 'flex', flexDirection: 'column' }}>
//             <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: '14px', fontWeight: '500' }}>
//               {params.row.registration_id ? params.row.registration_id : '-'}
//             </Typography>
//           </Box>
//         </Box>
//       )
//     },
//     {
//       flex: 0.3,
//       minWidth: 10,
//       field: 'of_species',
//       headerName: '# OF SPECIES',
//       renderCell: params => (
//         <Typography variant='body2' sx={{ color: 'text.primary' }}>
//           {params.row.of_species ? params.row.of_species : '-'}
//         </Typography>
//       )
//     },
//     {
//       flex: 0.3,
//       minWidth: 10,
//       field: 'of_animals',
//       headerName: '# OF ANIMALS',
//       renderCell: params => (
//         <Typography variant='body2' sx={{ color: 'text.primary' }}>
//           {params.row.of_animals ? params.row.of_animals : '-'}
//         </Typography>
//       )
//     },
//     {
//       flex: 0.4,
//       minWidth: 20,
//       field: 'approved_date',
//       headerName: 'Approved DATE',
//       renderCell: params => (
//         <Typography variant='body2' sx={{ color: 'text.primary' }}>
//           {params.row.approved_date ? moment(params.row.approved_date).format('DD/MM/YYYY') : '-'}
//         </Typography>
//       )
//     },
//     {
//       flex: 0.6,
//       minWidth: 60,
//       field: 'user_name',
//       headerName: 'CREATED BY',
//       renderCell: params => (
//         <Box sx={{ display: 'flex', alignItems: 'center' }}>
//           <Avatar
//             variant='square'
//             alt='Medicine Image'
//             sx={{
//               width: 30,
//               height: 30,
//               mr: 4,
//               borderRadius: '50%',
//               background: '#E8F4F2',
//               overflow: 'hidden'
//             }}
//           >
//             {params.row.created_by_user?.profile_pic ? (
//               <img
//                 style={{ width: '100%', height: '100%', objectFit: 'cover' }}
//                 src={params.row.created_by_user?.profile_pic}
//                 alt='Profile'
//               />
//             ) : (
//               <Icon icon='mdi:user' />
//             )}
//           </Avatar>
//           <Box sx={{ display: 'flex', flexDirection: 'column' }}>
//             <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: 14 }}>
//               {params.row.created_by_user?.user_name ? params.row.created_by_user?.user_name : '-'}
//             </Typography>
//             <Typography noWrap variant='body2' sx={{ color: '#44544a9c', fontSize: 12 }}>
//               {params.row.created_at ? moment(params.row.created_at).format('DD/MM/YYYY') : '-'}
//             </Typography>
//           </Box>
//         </Box>
//       )
//     }
//   ]

//   const onCellClick = params => {
//     // console.log(params, 'params')
//     // const clickedColumn = params.field !== 'switch'
//     // if (clickedColumn) {
//     //   const data = params.row
//     //   Router.push({
//     //     pathname: `/diet/ingredient/${data?.id}`
//     //   })
//     // } else {
//     //   return
//     // }
//   }
//   const tableData = () => {
//     return (
//       <>
//         {loader ? (
//           <FallbackSpinner />
//         ) : (
//           <Card sx={{ mt: 4 }}>
//             <CardHeader title={'Reported Batches'} action={headerAction} />
//             <ConfirmationDialog
//               // icon={'mdi:delete'}
//               image={'https://app.antzsystems.com/uploads/6515471031963.jpg'}
//               iconColor={'#ff3838'}
//               title={'Are you sure you want to delete this ingredient?'}
//               // description={`Since ingredient IND000123 isn't included in any recipe or diet, you can delete it.`}
//               formComponent={
//                 <ConfirmationCheckBox
//                   title={'This ingredient is part of 15 recipes and 10 diets.'}
//                   label={'Deactivate this ingredient in all records'}
//                   description={
//                     'Deactivating this ingredient prevents its addition to new recipes or diets, but you can swap it with another ingredient.'
//                   }
//                   color={theme.palette.formContent?.tertiary}
//                   value={check}
//                   setValue={setCheck}
//                 />
//               }
//               dialogBoxStatus={dialog}
//               onClose={onClose}
//               ConfirmationText={'Delete'}
//               confirmAction={onClose}
//             />
//             <DataGrid
//               sx={{
//                 '.MuiDataGrid-cell:focus': {
//                   outline: 'none'
//                 },

//                 '& .MuiDataGrid-row:hover': {
//                   cursor: 'pointer'
//                 }
//               }}
//               columnVisibilityModel={{
//                 sl_no: false
//               }}
//               hideFooterSelectedRowCount
//               disableColumnSelector={true}
//               autoHeight
//               pagination
//               rows={indexedRows === undefined ? [] : indexedRows}
//               rowCount={total}
//               columns={columns}
//               sortingMode='server'
//               paginationMode='server'
//               pageSizeOptions={[7, 10, 25, 50]}
//               paginationModel={paginationModel}
//               //   onSortModelChange={handleSortModel}
//               slots={{ toolbar: ServerSideToolbarWithFilter }}
//               onPaginationModelChange={setPaginationModel}
//               loading={loading}
//               slotProps={{
//                 baseButton: {
//                   variant: 'outlined'
//                 },
//                 toolbar: {
//                   value: searchValue,
//                   clearSearch: () => handleSearch(''),
//                   onChange: event => handleSearch(event.target.value)
//                 }
//               }}
//               onCellClick={onCellClick}
//             />
//           </Card>
//         )}
//       </>
//     )
//   }

//   const headerAction = (
//     <>
//       {/* <div>
//         <Button size='medium' variant='contained' onClick={() => Router.push('/parivesh/home/add-newentry')}>
//           <Icon icon='mdi:add' fontSize={20} />
//           &nbsp; ADD ENTRY
//         </Button>

//         <Button size='medium' variant='contained' sx={{ m: 2, backgroundColor: '#1F415B' }}>
//           &nbsp; CREATE BATCH
//         </Button>
//       </div> */}
//     </>
//   )

//   return (
//     <>
//       <Box>
//         <Card>
//           <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
//             <CustomAccordion
//               title='Approved by Parivesh'
//               summaryIcon='ion:checkmark'
//               data={data}
//               backgroundImage='https://images.pexels.com/photos/1599452/pexels-photo-1599452.jpeg'
//               cards={cards}
//               isOrganization
//               organizationName={'a'}
//               showDetails
//               handleBoxClick={() => handleBoxClick(organization)}
//             />
//             <Box
//               sx={{
//                 mt: 3
//               }}
//             >
//               <CustomAccordion
//                 title='To be submitted'
//                 summaryIcon='ion:checkmark'
//                 data={data}
//                 backgroundImage='https://images.pexels.com/photos/1599452/pexels-photo-1599452.jpeg'
//                 cards={cards}
//               />
//             </Box>
//             <Grid>{tableData()}</Grid>
//           </CardContent>
//         </Card>
//       </Box>
//     </>
//   )
// }

// export default Overview

// import React, { useCallback, useEffect, useState } from 'react'
// import { useTheme } from '@mui/material/styles'
// import CustomAccordion from 'src/components/parivesh/CustomAccordion'
// import { Card, CardContent } from '@mui/material'
// import { Box } from '@mui/system'
// import { getOrganizationList } from 'src/lib/api/parivesh/addSpecies'
// import Router from 'next/router'
// import Organization from './organization'
// import { usePariveshContext } from 'src/context/PariveshContext'
// import { readAsync } from 'src/lib/windows/utils'

// const data = [
//   { value: 200, label: 'ANIMAL RECORDS ', color: '#FFFFFF', borderColor: '#FFFFFF' },
//   { value: 103, label: 'MALE', color: '#00AFD6', borderColor: '#00AFD6' },
//   { value: 74, label: 'FEMALE', color: '#FFD3D3', borderColor: '#FFD3D3' },
//   { value: 23, label: 'OTHERS', color: '#FFFFFF', borderColor: '#FFFFFF' },
//   { value: 156, label: 'TOTAL SPECIES', color: '#E4B819', borderColor: '#E4B819' }
// ]

// const cards = [
//   {
//     value: 60,
//     content: 'Parent Stock',
//     bgColor: '#37BD69',
//     items: [
//       { value: 6, bgColor: '#00AFD6' },
//       { value: 5, bgColor: '#FFD3D3' },
//       { value: 10, bgColor: '#FFFFFF' }
//     ]
//   },
//   {
//     value: 25,
//     content: 'Acquisition',
//     bgColor: '#37BD69',
//     items: [
//       { value: 11, bgColor: '#00AFD6' },
//       { value: 7, bgColor: '#FFD3D3' },
//       { value: 6, bgColor: '#FFFFFF' }
//     ]
//   },
//   {
//     value: 5,
//     content: 'Births',
//     bgColor: '#37BD69',
//     items: [
//       { value: 21, bgColor: '#00AFD6' },
//       { value: 2, bgColor: '#FFD3D3' },
//       { value: 7, bgColor: '#FFFFFF' }
//     ]
//   },
//   {
//     value: 5,
//     content: 'Deaths',
//     bgColor: '#E93353',
//     items: [
//       { value: 2, bgColor: '#00AFD6' },
//       { value: 6, bgColor: '#FFD3D3' },
//       { value: 6, bgColor: '#FFFFFF' }
//     ]
//   },
//   {
//     value: 5,
//     content: 'Transfers',
//     bgColor: '#FA6140',
//     items: [
//       { value: 6, bgColor: '#00AFD6' },
//       { value: 11, bgColor: '#FFD3D3' },
//       { value: 3, bgColor: '#FFFFFF' }
//     ]
//   }
// ]

// const Overview = () => {
//   const theme = useTheme()
//   const [loading, setLoading] = useState(false)
//   const [organizationDetails, setOrganizationDetails] = useState([])
//   const [selectedOrganization, setSelectedOrganization] = useState(null)
//   const { selectedParivesh, setSelectedParivesh, organizationList } = usePariveshContext()

//   console.log(selectedParivesh, organizationDetails, 'orfff')

//   const fetchTableData = useCallback(async (sortBy, q, sortColumn) => {
//     const storedParivesh = await readAsync('storeParivesh')

//     console.log(storedParivesh, 'storedParivesh')
//     try {
//       setLoading(true)
//       await getOrganizationList({}).then(res => {
//         console.log('response', res)
//         setOrganizationDetails(() => res)
//         // Generate uid field based on the index
//       })
//       setLoading(false)
//     } catch (e) {
//       console.log(e)
//       setLoading(false)
//     }
//   }, [])

//   useEffect(() => {
//     fetchTableData()
//   }, [fetchTableData])

//   const handleBoxClick = organization => {
//     console.log('Box clicked for organization:', organization)
//     setSelectedOrganization(organization)
//   }

//   return (
//     <>
//       {/* {organizationList.map((organization, index) => ( */}

//       {!selectedOrganization ? (
//         <Box>
//           {organizationDetails.map((organization, index) => (
//             <Card sx={{ mb: 6 }} key={index}>
//               <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
//                 <CustomAccordion
//                   title='Approved by Parivesh'
//                   summaryIcon='ion:checkmark'
//                   data={data}
//                   backgroundImage='https://images.pexels.com/photos/1599452/pexels-photo-1599452.jpeg'
//                   cards={cards}
//                   isOrganization
//                   organizationName={organization.organization_name}
//                   showDetails
//                   handleBoxClick={() => handleBoxClick(organization)}
//                 />
//                 <Box
//                   sx={{
//                     mt: 3
//                   }}
//                 >
//                   <CustomAccordion
//                     title='To be submitted'
//                     summaryIcon='ion:checkmark'
//                     data={data}
//                     backgroundImage='https://images.pexels.com/photos/1599452/pexels-photo-1599452.jpeg'
//                     cards={cards}
//                   />
//                 </Box>
//               </CardContent>
//             </Card>
//           ))}
//         </Box>
//       ) : (
//         <Organization />
//       )}
//     </>
//   )
// }

// export default Overview
