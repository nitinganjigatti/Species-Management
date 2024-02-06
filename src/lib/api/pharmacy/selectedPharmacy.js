import { readAsync } from 'src/lib/windows/utils'

export const getSelectedPharmacyId = async () => {
  const selectedPharmacy = await readAsync('selectedStore')

  if (selectedPharmacy !== undefined && selectedPharmacy !== '') {
    return selectedPharmacy.id
  }

  return ''
}

export const getSelectedPharmacy = async () => {
  const selectedPharmacy = await readAsync('selectedStore')

  if (selectedPharmacy !== undefined && selectedPharmacy !== '') {
    return selectedPharmacy
  }

  return undefined
}
