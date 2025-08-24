import React, { useState, useEffect } from 'react'

// ** View Component
import InpatientClinicalNotes from 'src/views/pages/hospital/inpatient/InpatientClinicalNotes'

const dummyClinicalNotesData = [
  {
    id: 'MED - 12345/25',
    note: 'Behavioral changes likely linked to minor environmental stress. No physical abnormalities observed. Behavioral changes likely linked to minor environmental stress. No physical abnormalities.',
    author: 'Jordan Stevenson',
    date: '02 Jan 2025 • 12 : 35 PM'
  },
  {
    id: 'MED - 67890/26',
    note: 'Patient shows signs of recovery. Monitoring to continue for the next 48 hours.',
    author: 'Emily Clark',
    date: '03 Jan 2025 • 10 : 20 AM'
  },
  {
    id: 'MED - 12345/27',
    note: 'Behavioral changes likely linked to minor environmental stress. No physical abnormalities observed. Behavioral changes likely linked to minor environmental stress. No physical abnormalities. Behavioral changes likely linked to minor environmental stress. No physical abnormalities observed. Behavioral changes likely linked to minor environmental stress. No physical abnormalities.Behavioral changes likely linked to minor environmental stress. No physical abnormalities observed. Behavioral changes likely linked to minor environmental stress. No physical abnormalities.',
    author: 'Jordan Stevenson',
    date: '02 Jan 2025 • 12 : 35 PM'
  }
]

const ClinicalNotes = () => {
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState([])

  const handleSubmitData = async payload => {
    const dummy = {
      id: `MED-${Date.now()}`,
      note: payload,
      author: 'Jordan Stevenson',
      date: '02 Jan 2025 • 12 : 35 PM'
    }
    try {
      setLoading(true)
      setTimeout(() => {
        setNotes(prev => [...prev, dummy])
        setLoading(false)
      }, [1000])
    } catch (e) {
      console.error('Failed to add note:', e)

      setLoading(false)
    } finally {
      // setLoading(false)
    }
  }

  const handleDeleteNote = id => {
    setNotes(prev => prev.filter(note => note.id !== id))
  }

  useEffect(() => {
    const getNotes = async () => {
      try {
        setLoading(true)
        setTimeout(() => {
          setNotes(dummyClinicalNotesData)
          setLoading(false)
        }, 1000)
      } catch (error) {
        console.error('Failed to fetch notes:', error)
        setLoading(false)
      }
    }

    getNotes()
  }, [])

  //  useEffect(() => {
  //   const getNotes = async () => {
  //     try {
  //     } catch (error) {
  //       console.error('Failed to fetch notes:', error)
  //     }
  //   }

  //   getNotes()
  // }, [])

  return (
    <InpatientClinicalNotes
      clinicalNotesData={notes}
      handleSubmitData={handleSubmitData}
      onDeleteNote={handleDeleteNote}
      loading={loading}
    />
  )
}

export default React.memo(ClinicalNotes)
