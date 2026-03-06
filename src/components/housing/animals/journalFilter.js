import React, { useEffect, useState } from 'react'
import {
    Box,
    Drawer,
    Checkbox,
    Typography,
    TextField,
    IconButton,
    Grid,
    Divider,
    CircularProgress,
    Avatar
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@emotion/react'
import { LoadingButton } from '@mui/lab'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import FallbackAvatar from 'src/views/utility/FallbackAvatar'

const JournalFilterSheet = ({
    openFilterDrawer,
    setOpenFilterDrawer,
    categories,
    options,
    animalId,
    selectedOptions,
    setSelectedOptions,
    setSelectedUsers,
    selectedUsers,
    handleSelection,
    isLoader = false,
    dateRange,
    setDateRange,
    getTotalSelectedFilters = () => { }
}) => {
    const theme = useTheme()
    const [activeCategory, setActiveCategory] = useState(categories[0])
    const [searchValue, setSearchValue] = useState('')


    // useEffect(() => {
    //     if (openFilterDrawer && animalId) {
    //         setSelectedOptions(prev => ({
    //             ...prev,
    //             Users: selectedUsers.length ? selectedUsers : []
    //         }))
    //     }
    // }, [openFilterDrawer])


    useEffect(() => {
        if (openFilterDrawer) {
            setSelectedOptions(prev => ({
                ...prev,
                Users: selectedUsers,
                'Date Range': dateRange
            }))
        }
    }, [openFilterDrawer])

    const handleSelectAll = event => {
        if (event.target.checked) {
            const currentOptions = filteredOptions.map(option =>
                activeCategory === 'Users' ? option.userId : option.id
            )
            setSelectedOptions(prev => ({
                ...prev,
                [activeCategory]: currentOptions
            }))
        } else {
            setSelectedOptions(prev => ({
                ...prev,
                [activeCategory]: []
            }))
        }
    }

    const handleToggleOption = (optionId, category) => {

        setSelectedOptions(prevSelectedOptions => {
            const updatedOptions = { ...prevSelectedOptions }

            if (!updatedOptions[category]) {
                updatedOptions[category] = []
            }

            if (updatedOptions[category].includes(optionId)) {
                updatedOptions[category] = updatedOptions[category].filter(id => id !== optionId)
            } else {
                updatedOptions[category] = [...updatedOptions[category], optionId]
            }

            return updatedOptions
        })
    }

    //     handleSelection(dateRange, 'Date Range')
    //     setOpenFilterDrawer(false)
    // }

    const handleConfirmSelection = () => {
        handleSelection(selectedOptions.Users, 'Users')
        handleSelection(selectedOptions.Categories, 'Categories')
        handleSelection(selectedOptions['Date Range'], 'Date Range')
        setOpenFilterDrawer(false)
    }


    // const handleClearFilter = () => {
    //     setSelectedOptions([])
    //     setDateRange({ from: null, to: null })
    // }

    const handleClearFilter = () => {
        setSelectedOptions({
            Users: [],
            Categories: [],
            'Date Range': { from: null, to: null }
        })
        setSelectedUsers([])
        setDateRange({ from: null, to: null })
    }

    const filteredOptions =
        options[activeCategory]?.filter(option => {
            if (activeCategory === 'Users') {
                return option?.userName?.toLowerCase().includes(searchValue.toLowerCase())
            }
            if (activeCategory === 'Categories') {
                return option?.categoryName?.toLowerCase().includes(searchValue.toLowerCase())
            }
            
return true
        }) || []


    const handleCategoryClick = category => {
        setActiveCategory(category)
        setSearchValue('')
    }

    return (
        <Drawer
            anchor='right'
            open={openFilterDrawer}
            sx={{
                '& .MuiDrawer-paper': { width: ['100%', '562px'], height: '100vh' },
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                backgroundColor: 'background.default'
            }}
        >
            <Box
                className='sidebar-header'
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'background.default',
                    p: theme => theme.spacing(3, 3.255, 3, 5.255)
                }}
            >
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
                    <Icon icon='mage:filter' fontSize={30} />
                    <Typography sx={{ fontSize: '24px', fontWeight: 500, fontFamily: 'Inter' }}>
                        {/* Filter - {getTotalSelectedFilters(selectedOptions)} */}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <IconButton
                        size='small'
                        sx={{ color: 'text.primary' }}
                        onClick={() => {
                            setOpenFilterDrawer(false)
                            handleClearFilter()
                        }}
                    >
                        <Icon icon='mdi:close' fontSize={24} />
                    </IconButton>
                </Box>
            </Box>
            {/* Drawer Content */}
            <Box
                sx={{
                    '& .MuiDrawer-paper': { width: ['100%', '562px'] },
                    backgroundColor: 'background.default',
                    height: '100%'
                }}
            >
                <Grid container sx={{ px: 5 }}>
                    <Grid item size={{ xs: 4, sm: 4, md: 4 }}>
                        {categories.map(menu => (
                            <Box
                                key={menu}
                                sx={{
                                    width: '190px',
                                    bgcolor: activeCategory === menu ? 'white' : 'transparent',
                                    cursor: 'pointer',
                                    p: 4,
                                    borderTopLeftRadius: '8px',
                                    borderBottomLeftRadius: '8px',
                                    '&:hover': {
                                        backgroundColor: activeCategory === menu ? 'white' : '#f5f5f5'
                                    }
                                }}
                                onClick={() => {
                                    handleCategoryClick(menu)
                                }}
                            >
                                <Typography sx={{ color: theme.palette.primary.dark, fontSize: '16px', fontWeight: 400 }}>
                                    {menu}
                                </Typography>
                            </Box>
                        ))}
                    </Grid>
                    <Grid item size={{ xs: 8, sm: 8, md: 8 }}>
                        <Box
                            sx={{
                                bgcolor: '#fff',
                                borderRadius: '8px',
                                width: '345px',
                                height: 'calc(100vh - 190px)',
                                overflowY: 'auto',
                                '&::-webkit-scrollbar': {
                                    width: 0,
                                    height: 0
                                },
                                '-ms-overflow-style': 'none',
                                scrollbarWidth: 'none',
                                bgColor: '#fff'
                            }}
                        >
                            {(activeCategory === 'Users' || activeCategory === 'Categories') && (
                                <Box
                                    sx={{
                                        p: '16px',
                                        bgColor: '#fff',
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 1,
                                        bgcolor: theme.palette.primary.contrastText
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                                            borderRadius: '4px',
                                            padding: '0 8px',
                                            height: '40px'
                                        }}
                                    >
                                        <Icon icon='mi:search' color={theme.palette.customColors.OnSurfaceVariant} />
                                        <TextField
                                            variant='outlined'
                                            placeholder='Search'
                                            value={searchValue}
                                            onChange={e => setSearchValue(e.target.value)}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    border: 'none',
                                                    padding: '0',
                                                    '& fieldset': {
                                                        border: 'none'
                                                    }
                                                },
                                                '& .MuiInputBase-input': {
                                                    '&::before': {
                                                        borderBottom: 'none !important'
                                                    },
                                                    '&:hover::before': {
                                                        borderBottom: 'none !important'
                                                    }
                                                }
                                            }}
                                        />
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                        <Checkbox
                                            checked={
                                                filteredOptions.length > 0 && selectedOptions[activeCategory]?.length === filteredOptions.length
                                            }
                                            onChange={handleSelectAll}
                                            slotProps={{
                                                input: {
                                                    'aria-label': 'controlled'
                                                }
                                            }}
                                        />
                                        <Typography sx={{ fontSize: '16px', fontWeight: 400, color: theme.palette.customColors.Outline }}>
                                            Select All
                                        </Typography>
                                    </Box>
                                    <Divider sx={{ mt: 1.4 }} />
                                </Box>)}
                            <Box sx={{ ml: 2, overflowY: 'auto' }}>
                                <Box sx={{ ml: 2 }}>
                                    {isLoader ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
                                            <CircularProgress />
                                        </Box>)
                                        : activeCategory === 'Users' ? (
                                            filteredOptions.map((option, index) => (
                                                <Box key={index} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', mb: 2 }}>
                                                    <Checkbox
                                                        checked={(selectedOptions[activeCategory] || []).includes(option.userId)}
                                                        onChange={() => handleToggleOption(option.userId, activeCategory)}
                                                    />
                                                    <FallbackAvatar sx={{ height: 34, width: 34 }} />
                                                    <Typography sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant }}>
                                                        {option.userName}
                                                    </Typography>
                                                </Box>
                                            ))
                                        ) : activeCategory === 'Categories' ? (
                                            filteredOptions.map((option, index) => (
                                                <Box onClick={() => handleToggleOption(option.categoryId, activeCategory)} key={index} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', mb: 2 }}>
                                                    <Checkbox
                                                        checked={(selectedOptions[activeCategory] || []).includes(option.categoryId)}

                                                    // onChange={() => handleToggleOption(option.categoryId, activeCategory)}
                                                    />
                                                    <Typography sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant }}>
                                                        {option.categoryName}
                                                    </Typography>
                                                </Box>
                                            ))
                                        ) : activeCategory === 'Date Range' && (
                                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                                <Box sx={{ p: 4 }}>
                                                    <DatePicker
                                                        label="From Date"
                                                        value={dateRange.from}
                                                        onChange={newValue => setDateRange(prev => ({ ...prev, from: newValue }))}
                                                        sx={{ mb: 2, width: '100%' }}
                                                    />
                                                    <DatePicker
                                                        label="To Date"
                                                        value={dateRange.to}
                                                        onChange={newValue => setDateRange(prev => ({ ...prev, to: newValue }))}
                                                        sx={{ width: '100%' }}
                                                    />
                                                </Box>
                                            </LocalizationProvider>
                                        )}
                                </Box>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </Box>
            {/* bottom buttons */}
            <Box
                sx={{
                    height: '122px',
                    width: '100%',
                    maxWidth: '562px',
                    position: 'fixed',
                    bottom: 0,
                    px: 4,
                    bgcolor: 'white',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    display: 'flex',
                    boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.2)',
                    zIndex: 123
                }}
            >
                <LoadingButton fullWidth variant='outlined' size='large' onClick={handleClearFilter}>
                    CLEAR ALL
                </LoadingButton>
                <LoadingButton fullWidth variant='contained' size='large' onClick={handleConfirmSelection}>
                    APPLY FILTER
                </LoadingButton>
            </Box>
        </Drawer>
    );
}

export default JournalFilterSheet
