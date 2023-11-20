/**
 *  Set Home URL based on User Roles
 */
const getHomeRoute = role => {
  if (role === 'client') return '/acl'
  else return '/pharmacy/medicine/medicine-list'
}

// {else return '/home'}
export default getHomeRoute
