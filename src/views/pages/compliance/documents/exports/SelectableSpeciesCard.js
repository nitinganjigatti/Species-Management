import React from 'react';
import {
  Box,
  Checkbox,
  IconButton,
  ListItemButton,
  Radio
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SpeciesCard from 'src/views/utility/SpeciesCard';
import { useTheme } from '@mui/material/styles';

const SelectableSpeciesCard = ({
  species,
  selected,
  onClick,
  selectionType = 'checkbox' // 'checkbox' | 'radio' | 'cross'
}) => {
  const theme = useTheme();

  return (
    <ListItemButton
      onClick={onClick}
      sx={{
        p: 0,
        borderRadius: '8px',
        border: selected ? '1px solid #2E7D32' : '2px solid transparent',
        backgroundColor: selected ? '#E8F5E9' : 'white',
        '&:hover': {
          backgroundColor: selected ? '#E8F5E9' : theme.palette.action.hover
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          alignItems: 'stretch', // make children fill vertically
        }}
      >
        {/* Species Card */}
        <Box sx={{ flex: 1, px: 2, py: 1.5 }}>
          <SpeciesCard
            species={{
              common_name: species.common_name,
              scientific_name: species.scientific_name,
              default_icon: species.default_icon
            }}
          />
        </Box>

        {/* Selection Icon with full height and background */}
        <Box
          sx={{
            px: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.palette.customColors.Surface,
            height: '100%',
            borderTopRightRadius: '8px',
            borderBottomRightRadius: '8px',
          }}
        >
          {selectionType === 'checkbox' && (
            <Checkbox edge="end" checked={selected} tabIndex={-1} disableRipple />
          )}
          {selectionType === 'radio' && (
            <Radio edge="end" checked={selected} tabIndex={-1} disableRipple />
          )}
          {selectionType === 'cross' && (
            <IconButton edge="end" onClick={onClick}>
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </Box>
    </ListItemButton>
  );
};

export default SelectableSpeciesCard;
