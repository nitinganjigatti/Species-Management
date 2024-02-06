/**
 *  Set Home URL based on User Roles
 */
const getHomeRoute = role => {
  if (role === 'client') return '/pharmacy/request/request-list/'
  else return '/pharmacy/medicine/product-list'
}

// {else return '/home'}
export default getHomeRoute
