import { useContext } from 'react'
import { AuthContext } from 'src/context/AuthContext'
import Error404 from 'src/pages/401'
import ZooSettings from 'src/components/zoo-configuration/ZooSettings'

const ZooSettingsPage = () => {
  const authData = useContext(AuthContext)
  const userRole = authData?.userData?.roles?.role_name

  if (userRole !== 'Super Admin') return <Error404 />

  return <ZooSettings />
}

export default ZooSettingsPage
