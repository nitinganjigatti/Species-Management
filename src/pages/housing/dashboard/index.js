import enforceModuleAccess from 'src/components/ProtectedRoute'

const Dashboard = () => {
  return <>dashboard page</>
}

export default enforceModuleAccess(Dashboard, 'enable_housing_in_web')
