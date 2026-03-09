import { useTheme } from '@emotion/react'
import { Button, Card, CircularProgress, Drawer, IconButton, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import Icon from 'src/@core/components/icon'
import Toaster from 'src/components/Toaster'
import { revokeAnimalMortality } from 'src/lib/api/housing'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'

interface AnimalRevokeDrawerProps {
    open: boolean
    setDrawerOpen: (open: boolean) => void
    mortalityId: string
}

interface FormValues {
    reason: string
}

const AnimalRevokeDrawer: React.FC<AnimalRevokeDrawerProps> = ({ open, setDrawerOpen, mortalityId }) => {
    const theme = useTheme() as any

    const {
        control,
        handleSubmit,
        formState: { errors }
    } = useForm<FormValues>({
        defaultValues: {
            reason: ''
        }
    })

    const [loading, setLoading] = useState<boolean>(false)

    const handleDrawerClose = (): void => {
        setDrawerOpen(false)
    }

    const onSubmit = async (data: FormValues): Promise<void> => {
        const params = {
            mortality_id: mortalityId,
            reason: data?.reason
        }

        try {
            setLoading(true)
            await revokeAnimalMortality(params).then((res: any) => {
                if (res?.success === true) {
                    setDrawerOpen(false)
                    Toaster({ type: 'success', message: res?.message })
                    setLoading(false)
                    setTimeout(() => {
                        window.location.reload()
                    }, 1000) // Small delay to allow toast to show
                }
            })
        } catch (error) {
            console.error(error, "Cannot Revoke the mortality")
            setLoading(false)
        }
    }

    return (
        <>
            <Drawer
                anchor='right'
                sx={{
                    '& .MuiDrawer-paper': {
                        width: ['100%', '562px'],
                        height: '100vh',
                        display: 'flex',
                        flexDirection: 'column'
                    }
                }}
                open={open}
                onClose={handleDrawerClose}
            >
                <Box
                    className='sidebar-header'
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#FFFFFF',
                        px: '1.2rem',
                        py: '1rem'
                    }}
                >
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2 }}>
                        <img src='/icons/activity_icon.png' alt='Cluster Icon' width='30px' />
                        <Typography variant='h6'> Revoke Mortality</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleDrawerClose}>
                            <Icon icon='mdi:close' fontSize={20} />
                        </IconButton>
                    </Box>
                </Box>
                <Box sx={{ flex: 1, overflow: 'auto', background: '#EFF5F2' }}>
                    <Box sx={{ px: 6, py: 4 }}>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <Card
                                sx={{
                                    p: 6,
                                    boxShadow: 'none',
                                    border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 3
                                }}
                            >
                                <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#44544A' }}>
                                    Reason
                                </Typography>
                                <ControlledTextArea control={control} name={'reason'} label={'Enter Reason'} />
                            </Card>
                        </form>
                    </Box>
                </Box>
                <Box
                    sx={{
                        py: 8,
                        px: 6,
                        borderTop: `1px solid ${theme.palette.divider}`,
                        backgroundColor: 'background.paper',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 5
                    }}
                >
                    <Button
                        variant='contained'
                        fullWidth
                        size='large'
                        sx={{
                            py: 2,
                            background: '#37BD69'
                        }}
                        onClick={handleSubmit(onSubmit)}
                    >
                        {loading ? <CircularProgress size={24} color='inherit' /> : 'REVOKE MORTALITY'}
                    </Button>
                </Box>
            </Drawer>
        </>
    )
}

export default AnimalRevokeDrawer
