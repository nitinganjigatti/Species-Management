import { createContext, useContext, useState } from 'react'

const AnimalContext = createContext()

export const AnimalProvider = ({ children }) => {
  const [selectedAnimal, setSelectedAnimal] = useState(null)
  const [apiFilterParams, setApiFilterParams] = useState({
    include_housing: 0,
    include_enclosure: 0,
    include_section: 0,
    include_cluster: 0,
    include_class: 0,
    include_organization: 0,
    include_order: 0,
    include_family: 0,
    include_genus: 0,
    include_site: 0,
    include_genus: 0
  })
  const [selectedSites, setSelectedSites] = useState([])

  const [selectedOptions, setSelectedOptions] = useState([])

  return (
    <AnimalContext.Provider
      value={{
        selectedAnimal,
        setSelectedAnimal,
        apiFilterParams,
        setApiFilterParams,
        selectedSites,
        setSelectedSites,
        selectedOptions,
        setSelectedOptions
      }}
    >
      {children}
    </AnimalContext.Provider>
  )
}

export const useAnimalContext = () => useContext(AnimalContext)
