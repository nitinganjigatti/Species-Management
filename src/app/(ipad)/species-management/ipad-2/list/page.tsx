'use client'

import IpadShell from 'src/views/pages/species-management/ipad2/shell/IpadShell'
import IpadListingContainer from 'src/components/species-management/ipad2/ListingContainer'

const IpadSpeciesListPage = () => (
  <IpadShell active='species'>
    <IpadListingContainer />
  </IpadShell>
)

export default IpadSpeciesListPage
