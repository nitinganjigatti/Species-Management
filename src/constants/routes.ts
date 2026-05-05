// Collection module URLs — single source of truth.
// Import from here in nav metadata, router.push calls, and breadcrumb hrefs
// so the strings stay in sync with the file-system routes under src/app/(module)/collection/.
// Other modules can be added later in the same shape.

export const ROUTES = {
  collection: {
    species: '/collection/species',
    speciesDetail: (id: string | number) => `/collection/species/${id}`,
    animal: (speciesId: string | number, animalId: string | number) =>
      `/collection/species/${speciesId}/animal/${animalId}`,
    necropsy: (
      speciesId: string | number,
      necropsyId: string | number,
      mortalityId?: string | number | null
    ) =>
      `/collection/species/${speciesId}/necropsy/${necropsyId}${
        mortalityId ? `?mortality_id=${mortalityId}` : ''
      }`
  }
} as const
