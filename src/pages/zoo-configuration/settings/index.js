import { useContext } from 'react'
import { AuthContext } from 'src/context/AuthContext'
import Error404 from 'src/pages/401'
import ZooSettingsView from 'src/views/pages/zoo-configuration/ZooSettingsView'

const ZooSettings = () => {
  const authData = useContext(AuthContext)
  const userRole = authData?.userData?.roles?.role_name

  if (userRole !== 'Super Admin') return <Error404 />

  return <ZooSettingsView />
}

export default ZooSettings
