// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Checkbox from '@mui/material/Checkbox'
import Typography from '@mui/material/Typography'

const CustomCheckbox = props => {
  // ** Props
  const { data, name, selected, gridProps, handleChange, color = 'primary' } = props
  const { meta, title, value, content } = data

  const renderData = () => {
    if (meta && title && content) {
      return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box
            sx={{
              mb: 1,
              width: '100%',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between'
            }}
          >
            {typeof title === 'string' ? <Box sx={{ mr: 2, fontWeight: 500 }}>{title}</Box> : title}
            {typeof meta === 'string' ? <Box sx={{ color: 'text.secondary' }}>{meta}</Box> : meta}
          </Box>
          {typeof content === 'string' ? (
            <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{content}</Box>
          ) : (
            content
          )}
        </Box>
      )
    } else if (meta && title && !content) {
      return (
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          {typeof title === 'string' ? <Box sx={{ mr: 2, fontWeight: 500 }}>{title}</Box> : title}
          {typeof meta === 'string' ? <Box sx={{ color: 'text.secondary' }}>{meta}</Box> : meta}
        </Box>
      )
    } else if (!meta && title && content) {
      return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {typeof title === 'string' ? <Box sx={{ mb: 1, fontWeight: 500 }}>{title}</Box> : title}
          {typeof content === 'string' ? (
            <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{content}</Box>
          ) : (
            content
          )}
        </Box>
      )
    } else if (!meta && !title && content) {
      return typeof content === 'string' ? (
        <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{content}</Box>
      ) : (
        content
      )
    } else if (!meta && title && !content) {
      return typeof title === 'string' ? <Box sx={{ fontWeight: 500 }}>{title}</Box> : title
    } else {
      return null
    }
  }

  const renderComponent = () => {
    return (
      <Grid item {...gridProps}>
        <Box
          onClick={() => handleChange(value)}
          sx={{
            p: 4,
            height: '100%',
            display: 'flex',
            borderRadius: 1,
            cursor: 'pointer',
            position: 'relative',
            alignItems: 'flex-start',
            border: theme => `1px solid ${theme.palette.divider}`,
            ...(selected.includes(value)
              ? { borderColor: `${color}.main` }
              : { '&:hover': { borderColor: theme => `rgba(${theme.palette.customColors.main}, 0.25)` } })
          }}
        >
          <Checkbox
            size='small'
            color={color}
            name={`${name}-${value}`}
            checked={selected.includes(value)}
            onChange={() => handleChange(value)}
            sx={{ mb: -2, mt: -1.75, ml: -1.75 }}
          />
          {renderData()}
        </Box>
      </Grid>
    )
  }

  return data ? renderComponent() : null
}

export default CustomCheckbox
