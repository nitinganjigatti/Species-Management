// 'use client'

// import { useEffect, useRef } from 'react'
// import 'quill/dist/quill.snow.css'
// import { Box, Typography, useTheme } from '@mui/material'

// const extractDelta = input => {
//   if (!input) return null
//   if (input?.delta?.ops) return input.delta
//   if (input?.ops) return input

//   return null
// }

// const extractHtml = input => {
//   if (!input) return ''
//   if (typeof input === 'string') return input

//   return input?.html || ''
// }

// const extractText = input => {
//   if (!input) return ''
//   if (typeof input === 'string') return input

//   return input?.text || ''
// }

// export default function RichTextEditor({ value, onChange, label, placeholder = 'Start typing...', minHeight = 200 }) {
//   const theme = useTheme()
//   const editorRef = useRef(null)
//   const quillRef = useRef(null)

//   useEffect(() => {
//     if (editorRef.current && !quillRef.current) {
//       import('quill').then(({ default: Quill }) => {
//         const quill = new Quill(editorRef.current, {
//           theme: 'snow',
//           placeholder,
//           modules: {
//             toolbar: [
//               [{ header: [1, 2, 3, 4, 5, 6, false] }],
//               ['blockquote', 'code-block'],
//               ['bold', 'italic', 'underline', 'strike'],
//               [{ script: 'sub' }, { script: 'super' }],
//               [{ indent: '-1' }, { indent: '+1' }],
//               [{ list: 'ordered' }, { list: 'bullet' }],
//               [{ size: ['small', false, 'large', 'huge'] }],
//               [{ align: [] }],
//               ['link', 'image'],
//               ['clean']
//             ]
//           }
//         })

//         const initialDelta = extractDelta(value)
//         const initialHtml = extractHtml(value)
//         const initialText = extractText(value)

//         if (initialDelta) {
//           quill.setContents(initialDelta)
//         } else if (initialHtml) {
//           quill.clipboard.dangerouslyPasteHTML(initialHtml)
//         } else if (initialText) {
//           quill.setText(initialText)
//         } else {
//           quill.setContents([{ insert: '\n' }])
//         }

//         // ✅ Listen for changes
//         quill.on('text-change', () => {
//           const delta = quill.getContents()
//           const html = quill.root.innerHTML
//           const text = quill.getText()

//           onChange?.({
//             delta,
//             html,
//             text,
//             ops: delta?.ops
//           })
//         })

//         quillRef.current = quill
//       })
//     }
//   }, [placeholder]) // only run once on mount

//   // ✅ Sync external value changes → update editor when prop changes
//   useEffect(() => {
//     if (!quillRef.current) return

//     const quill = quillRef.current
//     const delta = extractDelta(value)
//     const html = extractHtml(value)
//     const text = extractText(value)
//     const currentDelta = quill.getContents()

//     if (delta) {
//       if (JSON.stringify(currentDelta) !== JSON.stringify(delta)) {
//         quill.setContents(delta)
//       }
//     } else if (html) {
//       if (quill.root.innerHTML !== html) {
//         const selection = quill.getSelection()
//         quill.clipboard.dangerouslyPasteHTML(html)
//         if (selection) quill.setSelection(selection)
//       }
//     } else if (text) {
//       if (quill.getText() !== text) {
//         quill.setText(text)
//       }
//     } else if (!value) {
//       quill.setContents([{ insert: '\n' }])
//     }
//   }, [value])

//   return (
//     <Box>
//       {label && (
//         <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 600 }}>
//           {label}
//         </Typography>
//       )}
//       <Box
//         sx={{
//           border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
//           borderRadius: 1,
//           '& .ql-container': {
//             border: 'none',
//             fontSize: '0.95rem'
//           },
//           '& .ql-toolbar': {
//             border: 'none',
//             borderBottom: '1px solid',
//             borderColor: 'divider',
//             borderTopLeftRadius: 8,
//             borderTopRightRadius: 8
//           },
//           '& .ql-editor': {
//             minHeight
//           },
//           background: theme.palette.customColors.OnPrimary
//         }}
//       >
//         <div ref={editorRef} />
//       </Box>
//     </Box>
//   )
// }
'use client'

import { useEffect, useRef } from 'react'
import 'quill/dist/quill.snow.css'
import { Box, Typography, useTheme } from '@mui/material'

const extractDelta = input => {
  if (!input) return null
  if (input?.delta?.ops) return input.delta
  if (input?.ops) return input

  return null
}

const extractHtml = input => {
  if (!input) return ''
  if (typeof input === 'string') return input

  return input?.html || ''
}

const extractText = input => {
  if (!input) return ''
  if (typeof input === 'string') return input

  return input?.text || ''
}

export default function RichTextEditor({ value, onChange, label, placeholder = 'Start typing...', minHeight = 200 }) {
  const theme = useTheme()
  const editorRef = useRef(null)
  const quillRef = useRef(null)
  const quillReady = useRef(false)

  // ------------------------------
  // Initialize Quill (only once)
  // ------------------------------
  useEffect(() => {
    if (!editorRef.current) return
    if (quillReady.current) return

    quillReady.current = true

    import('quill').then(({ default: Quill }) => {
      if (!editorRef.current) return

      const quill = new Quill(editorRef.current, {
        theme: 'snow',
        placeholder,
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            ['blockquote', 'code-block'],
            ['bold', 'italic', 'underline', 'strike'],
            [{ script: 'sub' }, { script: 'super' }],
            [{ indent: '-1' }, { indent: '+1' }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ size: ['small', false, 'large', 'huge'] }],
            [{ align: [] }],
            ['link', 'image'],
            ['clean']
          ]
        }
      })

      // INITIAL SET CONTENT
      const delta = extractDelta(value)
      const html = extractHtml(value)
      const text = extractText(value)

      if (delta) {
        quill.setContents(delta)
      } else if (html) {
        quill.clipboard.dangerouslyPasteHTML(html)
      } else if (text) {
        quill.setText(text)
      } else {
        quill.setContents([{ insert: '\n' }])
      }

      // LISTEN FOR CHANGES
      quill.on('text-change', () => {
        const delta = quill.getContents()
        const html = quill.root.innerHTML
        const text = quill.getText()

        onChange?.({
          delta,
          html,
          text,
          ops: delta.ops
        })
      })

      quillRef.current = quill
    })
  }, [placeholder])

  // ------------------------------
  // Sync Prop → Editor (when externally updated)
  // ------------------------------
  useEffect(() => {
    const quill = quillRef.current
    if (!quill) return

    const delta = extractDelta(value)
    const html = extractHtml(value)
    const text = extractText(value)

    const currentDelta = quill.getContents()
    const currentHtml = quill.root.innerHTML
    const currentText = quill.getText()

    if (delta) {
      if (JSON.stringify(currentDelta) !== JSON.stringify(delta)) {
        quill.setContents(delta)
      }
    } else if (html) {
      if (currentHtml !== html) {
        const pos = quill.getSelection()
        quill.clipboard.dangerouslyPasteHTML(html)
        if (pos) quill.setSelection(pos)
      }
    } else if (text) {
      if (currentText.trim() !== text.trim()) {
        quill.setText(text)
      }
    }
  }, [value])

  return (
    <Box>
      {label && (
        <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 600 }}>
          {label}
        </Typography>
      )}

      <Box
        sx={{
          border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
          borderRadius: 1,
          background: theme.palette.customColors.OnPrimary,
          '& .ql-container': {
            border: 'none',
            fontSize: '0.95rem'
          },
          '& .ql-toolbar': {
            border: 'none',
            borderBottom: `1px solid ${theme.palette.divider}`,
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8
          },
          '& .ql-editor': {
            minHeight
          }
        }}
      >
        <div ref={editorRef} style={{ minHeight }} />
      </Box>
    </Box>
  )
}
