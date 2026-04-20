const composeNotesNavigation = () => {
  const Title = {
    sectionTitle: 'Notes'
  }

  const notes = {
    title: 'Notes',
    path: '/notes/',
    icon: 'mdi:note-text-outline'
  }
  const masters = {
    title: 'Masters',
    icon: 'tabler:settings',
    children: [
      {
        title: 'Note Types',
        path: '/notes/masters/note-types/'
      }
    ]
  }

  const notesNavigationArray = []

  notesNavigationArray.push(Title)
  notesNavigationArray.push(notes)
  notesNavigationArray.push(masters)

  return notesNavigationArray
}

const notesNavigation = () => composeNotesNavigation()

export default notesNavigation
