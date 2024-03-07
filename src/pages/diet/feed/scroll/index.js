import * as React from 'react'
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'

function random(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''

  for (let i = 0; i < length; i += 1) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }

  return result
}

export default function Scroll() {
  const [options, setOptions] = React.useState(() => Array.from(new Array(10)).map(() => random(10)))

  const [isLoading, setIsLoading] = React.useState(false)

  const handleOnScrollToBottom = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setOptions(previousOptions => [...previousOptions, ...Array.from(new Array(10)).map(() => random(10))])
    }, 2000)
  }

  const handleLoadMoreClick = () => {
    alert('Load More clicked!')
  }

  const renderOption = option => {
    return <li>{option}</li>
  }

  const optionsWithLoadMore = [...options, 'Load More']

  return (
    <Autocomplete
      id='infinite-scrolling-demo'
      options={optionsWithLoadMore}
      disablePortal
      sx={{ width: 300 }}
      loading={isLoading}
      renderInput={params => <TextField {...params} label='Movie' />}
      onScrollCapture={handleOnScrollToBottom}
      onChange={(event, value) => {
        if (value === 'Load More') {
          handleLoadMoreClick()
        }
      }}
      // renderOption={option => renderOption(option)}
    />
  )
}
