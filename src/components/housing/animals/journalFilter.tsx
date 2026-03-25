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

interface UserOption {
    userId: string | number
    userName: string
}

interface CategoryOption {
    categoryId: number
    categoryName: string
}

interface DateRange {
    from: Date | null
    to: Date | null
}

interface SelectedOptions {
    Users: (string | number)[]
    Categories: number[]
    'Date Range': DateRange
}

interface JournalFilterSheetProps {
    openFilterDrawer: boolean
    setOpenFilterDrawer: (open: boolean) => void
    categories: string[]
    options: Record<string, UserOption[] | CategoryOption[] | null>
    animalId: number | string
    selectedOptions: SelectedOptions
    setSelectedOptions: React.Dispatch<React.SetStateAction<SelectedOptions>>
    setSelectedUsers: React.Dispatch<React.SetStateAction<(string | number)[]>>
    selectedUsers: (string | number)[]
    handleSelection: (selectedIDs: (string | number)[] | DateRange, category: string) => void
    isLoader?: boolean
    dateRange: DateRange
    setDateRange: React.Dispatch<React.SetStateAction<DateRange>>
    getTotalSelectedFilters?: () => number
}

const JournalFilterSheet: React.FC<JournalFilterSheetProps> = ({
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
    getTotalSelectedFilters = () => 0
}) => {
    const theme = useTheme() as any
    const [activeCategory, setActiveCategory] = useState<string>(categories[0])
    const [searchValue, setSearchValue] = useState<string>('')


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

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>): void => {
        if (event.target.checked) {
            const currentOptions = filteredOptions.map(option =>
                activeCategory === 'Users' ? (option as UserOption).userId : (option as CategoryOption).categoryId
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

    const handleToggleOption = (optionId: string | number, category: string): void => {

        setSelectedOptions(prevSelectedOptions => {
            const updatedOptions = { ...prevSelectedOptions }

            if (!updatedOptions[category as keyof SelectedOptions]) {
                (updatedOptions as any)[category] = []
            }

            const categoryOptions = updatedOptions[category as keyof SelectedOptions] as (string | number)[]
            if (categoryOptions.includes(optionId)) {
                (updatedOptions as any)[category] = categoryOptions.filter(id => id !== optionId)
            } else {
                (updatedOptions as any)[category] = [...categoryOptions, optionId]
            }

            return updatedOptions
        })
    }

    //     handleSelection(dateRange, 'Date Range')
    //     setOpenFilterDrawer(false)
    // }

    const handleConfirmSelection = (): void => {
        handleSelection(selectedOptions.Users, 'Users')
        handleSelection(selectedOptions.Categories, 'Categories')
        handleSelection(selectedOptions['Date Range'], 'Date Range')
        setOpenFilterDrawer(false)
    }


    // const handleClearFilter = () => {
    //     setSelectedOptions([])
    //     setDateRange({ from: null, to: null })
    // }

    const handleClearFilter = (): void => {
        setSelectedOptions({
            Users: [],
            Categories: [],
            'Date Range': { from: null, to: null }
        })
        setSelectedUsers([])
        setDateRange({ from: null, to: null })
    }

    const filteredOptions: (UserOption | CategoryOption)[] =
        (options[activeCategory] as (UserOption | CategoryOption)[] | null)?.filter(option => {
            if (activeCategory === 'Users') {
                return (option as UserOption)?.userName?.toLowerCase().includes(searchValue.toLowerCase())
            }
            if (activeCategory === 'Categories') {
                return (option as CategoryOption)?.categoryName?.toLowerCase().includes(searchValue.toLowerCase())
            }

return true
        }) || []


    const handleCategoryClick = (category: string): void => {
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
                    p: (theme: any) => theme.spacing(3, 3.255, 3, 5.255)
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
                    <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                        {categories.map(menu => (
                            <Box
                                key={menu}
                                sx={{
                                    width: '190px',
                                    bgcolor: activeCategory === menu ? theme.palette.customColors?.OnPrimary : 'transparent',
                                    cursor: 'pointer',
                                    p: 4,
                                    borderTopLeftRadius: '8px',
                                    borderBottomLeftRadius: '8px',
                                    '&:hover': {
                                        backgroundColor: activeCategory === menu ? theme.palette.customColors?.OnPrimary : theme.palette.grey[100]
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
                    <Grid size={{ xs: 8, sm: 8, md: 8 }}>
                        <Box
                            sx={{
                                bgcolor: theme.palette.customColors?.OnPrimary,
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
                                bgColor: theme.palette.customColors?.OnPrimary
                            }}
                        >
                            {(activeCategory === 'Users' || activeCategory === 'Categories') && (
                                <Box
                                    sx={{
                                        p: '16px',
                                        bgColor: theme.palette.customColors?.OnPrimary,
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
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchValue(e.target.value)}
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
                                                filteredOptions.length > 0 && Array.isArray(selectedOptions[activeCategory as keyof SelectedOptions]) && (selectedOptions[activeCategory as keyof SelectedOptions] as any[])?.length === filteredOptions.length
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
                                                        checked={(selectedOptions[activeCategory] || []).includes((option as UserOption).userId)}
                                                        onChange={() => handleToggleOption((option as UserOption).userId, activeCategory)}
                                                    />
                                                    <FallbackAvatar sx={{ height: 34, width: 34 }} onLoad={() => {}} onError={() => {}} />
                                                    <Typography sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant }}>
                                                        {(option as UserOption).userName}
                                                    </Typography>
                                                </Box>
                                            ))
                                        ) : activeCategory === 'Categories' ? (
                                            filteredOptions.map((option, index) => (
                                                <Box onClick={() => handleToggleOption((option as CategoryOption).categoryId, activeCategory)} key={index} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', mb: 2 }}>
                                                    <Checkbox
                                                        checked={(selectedOptions[activeCategory] || []).includes((option as CategoryOption).categoryId)}

                                                    // onChange={() => handleToggleOption(option.categoryId, activeCategory)}
                                                    />
                                                    <Typography sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant }}>
                                                        {(option as CategoryOption).categoryName}
                                                    </Typography>
                                                </Box>
                                            ))
                                        ) : activeCategory === 'Date Range' && (
                                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                                <Box sx={{ p: 4 }}>
                                                    <DatePicker
                                                        label="From Date"
                                                        value={dateRange.from}
                                                        onChange={(newValue: any) => setDateRange(prev => ({ ...prev, from: newValue }))}
                                                        sx={{ mb: 2, width: '100%' }}
                                                    />
                                                    <DatePicker
                                                        label="To Date"
                                                        value={dateRange.to}
                                                        onChange={(newValue: any) => setDateRange(prev => ({ ...prev, to: newValue }))}
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
                    bgcolor: theme.palette.customColors?.OnPrimary,
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
