'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Box, Typography, Drawer, IconButton, Button, Avatar, Checkbox, Skeleton } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useAuth } from 'src/hooks/useAuth'
import { getAllSites } from 'src/lib/api/housing'
import { getRoleList } from 'src/lib/api/announcement'
import MUISwitch from 'src/views/forms/form-fields/MUISwitch'
import Search from 'src/views/utility/Search'
import NoDataFound from 'src/views/utility/NoDataFound'
import Icon from 'src/@core/components/icon'
import type { Site, Role, SelectSitesRolesDrawerProps } from 'src/types/announcement'

const SelectSitesRolesDrawer: React.FC<SelectSitesRolesDrawerProps> = ({
  open,
  onClose,
  selectedSites,
  selectedRoles,
  onSelectionChange
}) => {
  const theme = useTheme()
  const auth = useAuth() as any
  const zooId = auth?.userData?.user?.zoos?.[0]?.zoo_id || auth?.user?.zoo_id

  const [localSelectedSites, setLocalSelectedSites] = useState<Site[]>([])
  const [localSelectedRoles, setLocalSelectedRoles] = useState<Role[]>([])
  const [isAllSites, setIsAllSites] = useState(true)
  const [isAllRoles, setIsAllRoles] = useState(true)

  const [sitesList, setSitesList] = useState<Site[]>([])
  const [sitesLoading, setSitesLoading] = useState(false)
  const [sitesDrawerOpen, setSitesDrawerOpen] = useState(false)
  const [sitesSearchTerm, setSitesSearchTerm] = useState('')
  const [rolesList, setRolesList] = useState<Role[]>([])
  const [rolesLoading, setRolesLoading] = useState(false)
  const [rolesDrawerOpen, setRolesDrawerOpen] = useState(false)
  const [rolesSearchTerm, setRolesSearchTerm] = useState('')

  useEffect(() => {
    if (open) {
      setLocalSelectedSites([...selectedSites])
      setLocalSelectedRoles([...selectedRoles])
      setIsAllSites(selectedSites.length === 0)
      setIsAllRoles(selectedRoles.length === 0)
      fetchSites()
      fetchRoles()
    }
  }, [open])

  const fetchSites = async () => {
    try {
      setSitesLoading(true)
      const response = await getAllSites({})
      if (response?.data?.result) {
        setSitesList(response.data.result)
      } else if (Array.isArray(response?.data)) {
        setSitesList(response.data)
      } else {
        setSitesList([])
      }
    } catch {
      setSitesList([])
    } finally {
      setSitesLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      setRolesLoading(true)
      const response = await getRoleList()
      if (Array.isArray(response?.data)) {
        setRolesList(response.data)
      } else if (Array.isArray(response)) {
        setRolesList(response)
      } else {
        setRolesList([])
      }
    } catch {
      setRolesList([])
    } finally {
      setRolesLoading(false)
    }
  }

  const handleAllSitesToggle = (checked: boolean) => {
    setIsAllSites(checked)
    if (checked) {
      setLocalSelectedSites([])
      setIsAllRoles(true)
      setLocalSelectedRoles([])
    }
  }

  const handleAllRolesToggle = (checked: boolean) => {
    setIsAllRoles(checked)
    if (checked) {
      setLocalSelectedRoles([])
    }
  }

  const handleSiteToggle = (site: Site) => {
    const isSelected = localSelectedSites.some(s => s.site_id === site.site_id)
    if (isSelected) {
      setLocalSelectedSites(localSelectedSites.filter(s => s.site_id !== site.site_id))
    } else {
      setLocalSelectedSites([...localSelectedSites, site])
    }
  }

  const handleRemoveSite = (siteId: number) => {
    setLocalSelectedSites(localSelectedSites.filter(s => s.site_id !== siteId))
  }

  const handleRoleToggle = (role: Role) => {
    const isSelected = localSelectedRoles.some(r => r.id === role.id)
    if (isSelected) {
      setLocalSelectedRoles(localSelectedRoles.filter(r => r.id !== role.id))
    } else {
      setLocalSelectedRoles([...localSelectedRoles, role])
    }
  }

  const handleRemoveRole = (roleId: number | string) => {
    setLocalSelectedRoles(localSelectedRoles.filter(r => r.id !== roleId))
  }

  const filteredSites = useMemo(() => {
    if (!sitesSearchTerm) return sitesList

    return sitesList.filter(site => site.site_name.toLowerCase().includes(sitesSearchTerm.toLowerCase()))
  }, [sitesList, sitesSearchTerm])

  const filteredRoles = useMemo(() => {
    if (!rolesSearchTerm) return rolesList

    return rolesList.filter(role => role.role_name.toLowerCase().includes(rolesSearchTerm.toLowerCase()))
  }, [rolesList, rolesSearchTerm])

  const handleDone = () => {
    onSelectionChange(isAllSites ? [] : localSelectedSites, isAllRoles ? [] : localSelectedRoles)
    onClose()
  }

  const handleDrawerClose = () => {
    onClose()
  }

  const inputBgColor = theme.palette.customColors?.SurfaceVariant

  const switchRowSx = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.palette.customColors?.OnPrimary,
    borderRadius: '8px',
    border: `1px solid ${theme.palette.customColors?.OutlineVariant}`,
    px: 4,
    py: 3
  }

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        onClose={handleDrawerClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: ['100%', '580px'],
            height: '100%'
          }
        }}
      >
        <Box
          sx={{
            backgroundColor: theme.palette.customColors?.Background,
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: theme.palette.customColors?.OnPrimary,
              px: 5,
              py: 4,
              borderBottom: `1px solid ${theme.palette.divider}`
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton size='small' onClick={handleDrawerClose}>
                <Icon icon='mdi:arrow-left' fontSize={24} />
              </IconButton>
              <Typography
                sx={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: theme.palette.customColors?.OnSurfaceVariant
                }}
              >
                Select Sites & Roles
              </Typography>
            </Box>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto', p: 4 }}>
            <Box
              sx={{
                backgroundColor: theme.palette.customColors?.OnPrimary,
                borderRadius: '12px',
                p: 4,
                mb: 4
              }}
            >
              <Typography
                sx={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: theme.palette.customColors?.OnSurfaceVariant,
                  mb: 3
                }}
              >
                Choose Sites
              </Typography>

              <Box sx={switchRowSx}>
                <Typography
                  sx={{
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                    color: theme.palette.customColors?.OnSurfaceVariant
                  }}
                >
                  All Sites
                </Typography>
                <MUISwitch
                  checked={isAllSites}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAllSitesToggle(e.target.checked)}
                  switchColor={theme.palette.primary.main}
                />
              </Box>

              {!isAllSites && (
                <Box
                  sx={{
                    mt: 3,
                    backgroundColor: inputBgColor,
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}
                >
                  <Box
                    onClick={() => setSitesDrawerOpen(true)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 4,
                      py: 3,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover
                      }
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '0.9375rem',
                        fontWeight: 500,
                        color: theme.palette.customColors?.OnSurfaceVariant
                      }}
                    >
                      Selected sites - {localSelectedSites.length}
                    </Typography>
                    <IconButton size='small' sx={{ color: theme.palette.primary.main }}>
                      <Icon icon='mdi:plus-circle-outline' fontSize={24} />
                    </IconButton>
                  </Box>

                  {localSelectedSites.length > 0 && (
                    <Box sx={{ px: 3, pb: 3 }}>
                      {localSelectedSites.map(site => (
                        <Box
                          key={site.site_id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            py: 2,
                            px: 2,
                            mb: 2,
                            backgroundColor: theme.palette.customColors?.OnPrimary,
                            borderRadius: '8px',
                            border: `1px solid ${theme.palette.customColors?.OutlineVariant}`
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              src={site.site_image}
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                backgroundColor: theme.palette.customColors?.displaybgPrimary
                              }}
                            >
                              {site.site_name?.charAt(0)}
                            </Avatar>
                            <Typography
                              sx={{
                                fontSize: '0.9375rem',
                                fontWeight: 500,
                                color: theme.palette.customColors?.OnSurfaceVariant
                              }}
                            >
                              {site.site_name}
                            </Typography>
                          </Box>
                          <IconButton
                            size='small'
                            onClick={() => handleRemoveSite(site.site_id)}
                            sx={{ color: theme.palette.error.main }}
                          >
                            <Icon icon='mdi:close-circle-outline' fontSize={24} />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </Box>

            <Box
              sx={{
                backgroundColor: theme.palette.customColors?.OnPrimary,
                borderRadius: '12px',
                p: 4
              }}
            >
              <Typography
                sx={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: theme.palette.customColors?.OnSurfaceVariant,
                  mb: 3
                }}
              >
                Choose Roles
              </Typography>

              <Box sx={switchRowSx}>
                <Typography
                  sx={{
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                    color: theme.palette.customColors?.OnSurfaceVariant
                  }}
                >
                  All Roles
                </Typography>
                <MUISwitch
                  checked={isAllRoles}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAllRolesToggle(e.target.checked)}
                  switchColor={theme.palette.primary.main}
                />
              </Box>

              {!isAllRoles && (
                <Box
                  sx={{
                    mt: 3,
                    backgroundColor: inputBgColor,
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}
                >
                  <Box
                    onClick={() => setRolesDrawerOpen(true)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 4,
                      py: 3,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover
                      }
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '0.9375rem',
                        fontWeight: 500,
                        color: theme.palette.primary.main
                      }}
                    >
                      Add Roles
                    </Typography>
                    <IconButton size='small' sx={{ color: theme.palette.primary.main }}>
                      <Icon icon='mdi:plus-circle-outline' fontSize={24} />
                    </IconButton>
                  </Box>

                  {localSelectedRoles.length > 0 && (
                    <Box sx={{ px: 3, pb: 3 }}>
                      {localSelectedRoles.map(role => (
                        <Box
                          key={role.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            py: 2,
                            px: 2,
                            mb: 2,
                            backgroundColor: theme.palette.customColors?.OnPrimary,
                            borderRadius: '8px',
                            border: `1px solid ${theme.palette.customColors?.OutlineVariant}`
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              sx={{
                                width: 40,
                                height: 40,
                                backgroundColor: theme.palette.grey[300]
                              }}
                            >
                              <Icon icon='mdi:account' fontSize={24} color={theme.palette.grey[600]} />
                            </Avatar>
                            <Typography
                              sx={{
                                fontSize: '0.9375rem',
                                fontWeight: 500,
                                color: theme.palette.customColors?.OnSurfaceVariant
                              }}
                            >
                              {role.role_name}
                            </Typography>
                          </Box>
                          <IconButton
                            size='small'
                            onClick={() => handleRemoveRole(role.id)}
                            sx={{ color: theme.palette.error.main }}
                          >
                            <Icon icon='mdi:close-circle-outline' fontSize={24} />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Box>

          <Box
            sx={{
              p: 4,
              borderTop: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.customColors?.OnPrimary,
              boxShadow: '0px -1px 10px 0px rgba(0, 0, 0, 0.05)'
            }}
          >
            <Button
              variant='contained'
              fullWidth
              onClick={handleDone}
              sx={{
                height: '48px',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Done
            </Button>
          </Box>
        </Box>
      </Drawer>

      <Drawer
        anchor='bottom'
        open={sitesDrawerOpen}
        onClose={() => setSitesDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: ['100%', '580px'],
            height: '75vh',
            marginLeft: 'auto',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 0
          }
        }}
      >
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: theme.palette.customColors?.Background
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: theme.palette.customColors?.OnPrimary,
              px: 4,
              py: 3,
              borderBottom: `1px solid ${theme.palette.divider}`
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: theme.palette.customColors?.OnSurfaceVariant
                }}
              >
                Choose site
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  color: theme.palette.customColors?.neutralSecondary
                }}
              >
                Select a site from the list below
              </Typography>
            </Box>
            <IconButton size='small' onClick={() => setSitesDrawerOpen(false)}>
              <Icon icon='mdi:close' fontSize={24} />
            </IconButton>
          </Box>

          <Box sx={{ px: 4, py: 3, backgroundColor: theme.palette.customColors?.OnPrimary }}>
            <Search
              placeholder='Search'
              value={sitesSearchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSitesSearchTerm(e.target.value)}
              onClear={() => setSitesSearchTerm('')}
              width='100%'
            />
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
            {sitesLoading ? (
              <>
                {[1, 2, 3, 4].map(item => (
                  <Skeleton key={item} variant='rectangular' height={72} sx={{ borderRadius: '8px', mb: 2 }} />
                ))}
              </>
            ) : filteredSites.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <NoDataFound variant='Meerkat' height={150} width={150} />
              </Box>
            ) : (
              filteredSites.map(site => {
                const isSelected = localSelectedSites.some(s => s.site_id === site.site_id)

                return (
                  <Box
                    key={site.site_id}
                    onClick={() => handleSiteToggle(site)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 3,
                      mb: 2,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: `1px solid ${
                        isSelected ? theme.palette.primary.main : theme.palette.customColors?.OutlineVariant
                      }`,
                      backgroundColor: isSelected
                        ? theme.palette.primary.light + '15'
                        : theme.palette.customColors?.OnPrimary,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        src={site.site_image}
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%'
                        }}
                      >
                        {site.site_name?.charAt(0)}
                      </Avatar>
                      <Typography sx={{ fontWeight: 500 }}>{site.site_name}</Typography>
                    </Box>
                    <Checkbox checked={isSelected} />
                  </Box>
                )
              })
            )}
          </Box>

          <Box
            sx={{
              p: 4,
              borderTop: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.customColors?.OnPrimary
            }}
          >
            <Button
              variant='contained'
              fullWidth
              onClick={() => setSitesDrawerOpen(false)}
              sx={{
                height: '48px',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                backgroundColor: '#28A745',
                '&:hover': { backgroundColor: '#218838' }
              }}
            >
              Continue
            </Button>
          </Box>
        </Box>
      </Drawer>

      <Drawer
        anchor='bottom'
        open={rolesDrawerOpen}
        onClose={() => setRolesDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: ['100%', '580px'],
            height: '75vh',
            marginLeft: 'auto',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 0
          }
        }}
      >
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: theme.palette.customColors?.Background
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: theme.palette.customColors?.OnPrimary,
              px: 4,
              py: 3,
              borderBottom: `1px solid ${theme.palette.divider}`
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: theme.palette.customColors?.OnSurfaceVariant
                }}
              >
                Choose role
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  color: theme.palette.customColors?.neutralSecondary
                }}
              >
                Select a role from the list below
              </Typography>
            </Box>
            <IconButton size='small' onClick={() => setRolesDrawerOpen(false)}>
              <Icon icon='mdi:close' fontSize={24} />
            </IconButton>
          </Box>

          <Box sx={{ px: 4, py: 3, backgroundColor: theme.palette.customColors?.OnPrimary }}>
            <Search
              placeholder='Search'
              value={rolesSearchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRolesSearchTerm(e.target.value)}
              onClear={() => setRolesSearchTerm('')}
              width='100%'
            />
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
            {rolesLoading ? (
              <>
                {[1, 2, 3, 4].map(item => (
                  <Skeleton key={item} variant='rectangular' height={72} sx={{ borderRadius: '8px', mb: 2 }} />
                ))}
              </>
            ) : filteredRoles.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <NoDataFound variant='Meerkat' height={150} width={150} />
              </Box>
            ) : (
              filteredRoles.map(role => {
                const isSelected = localSelectedRoles.some(r => r.id === role.id)

                return (
                  <Box
                    key={role.id}
                    onClick={() => handleRoleToggle(role)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 3,
                      mb: 2,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: `1px solid ${
                        isSelected ? theme.palette.primary.main : theme.palette.customColors?.OutlineVariant
                      }`,
                      backgroundColor: isSelected
                        ? theme.palette.primary.light + '15'
                        : theme.palette.customColors?.OnPrimary,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          width: 44,
                          height: 44,
                          backgroundColor: theme.palette.grey[300]
                        }}
                      >
                        <Icon icon='mdi:account' fontSize={24} color={theme.palette.grey[600]} />
                      </Avatar>
                      <Typography sx={{ fontWeight: 500 }}>{role.role_name}</Typography>
                    </Box>
                    <Checkbox checked={isSelected} />
                  </Box>
                )
              })
            )}
          </Box>

          <Box
            sx={{
              p: 4,
              borderTop: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.customColors?.OnPrimary
            }}
          >
            <Button
              variant='contained'
              fullWidth
              onClick={() => setRolesDrawerOpen(false)}
              sx={{
                height: '48px',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                backgroundColor: '#28A745',
                '&:hover': { backgroundColor: '#218838' }
              }}
            >
              Continue
            </Button>
          </Box>
        </Box>
      </Drawer>
    </>
  )
}

export default SelectSitesRolesDrawer
