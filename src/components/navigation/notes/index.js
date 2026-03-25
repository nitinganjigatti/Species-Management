const composeNotesNavigation = () => {
  const Title = {
    sectionTitle: 'Notes'
  }

  const notes = {
    title: 'Notes',
    path: '/notes/',
    icon: 'mdi:note-text-outline'
  }

  const notesNavigationArray = []

  notesNavigationArray.push(Title)
  notesNavigationArray.push(notes)

  return notesNavigationArray
}

const notesNavigation = () => composeNotesNavigation()

export default notesNavigation
