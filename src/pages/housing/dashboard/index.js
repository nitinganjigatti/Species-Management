import withModuleAccess from 'src/components/ProtectedRoute'

const Dashboard = () => {
  return <>dashboard page</>
}

export default withModuleAccess(Dashboard, 'enable_housing_in_web')
