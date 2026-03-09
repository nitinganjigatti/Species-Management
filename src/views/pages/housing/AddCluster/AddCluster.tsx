import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from '@emotion/react'
import { Drawer, IconButton, TextField, Typography, Button, Chip, Checkbox, CircularProgress } from '@mui/material'
import { Box } from '@mui/system'
import Icon from 'src/@core/components/icon'
import { useForm, Controller, FieldValues } from 'react-hook-form'
import SiteListingCard from 'src/views/pages/housing/utils/SiteListingCard'
import Search from 'src/views/utility/Search'
import { useInfiniteQuery, useQueryClient, InfiniteData } from '@tanstack/react-query'
import { debounce, DebouncedFunc } from 'lodash'
import { addCluster, getAllSites } from 'src/lib/api/housing'
import { useInView } from 'react-intersection-observer'
import toast from 'react-hot-toast'
import SelectedSites from './SelectedSites'
import Toaster from 'src/components/Toaster'
import type { Site } from 'src/types/housing'

interface AddClusterProps {
  open: boolean
  setShowDrawer: (open: boolean) => void
  refetchCluster: () => void
}

interface FormData {
  clusterName: string
  images: File[]
  selectedSites: number[]
}

interface PageData {
  result: Site[]
  nextPage: number | undefined
  total: number
}

const AddCluster: React.FC<AddClusterProps> = ({ open, setShowDrawer, refetchCluster }) => {
  const theme = useTheme() as any
  const queryClient = useQueryClient()

  const PAGE_SIZE = 10

  const { ref: loaderRef, inView } = useInView({ threshold: 0 })

  const [selectedSites, setSelectedSites] = useState<number[]>([]) // Site IDs only
  const [selectedSiteObjects, setSelectedSiteObjects] = useState<Site[]>([]) // Complete site objects cache
  const [localSearch, setLocalSearch] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [showSelectedSitesDrawer, setShowSelectedSitesDrawer] = useState<boolean>(false)

  const {
    control,
    setValue,
    watch,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      clusterName: '',
      images: [],
      selectedSites: []
    }
  })

  const images = watch('images')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // const handleFilesChange = files => {
  //   if (!files || files.length === 0) return

  //   const newImages = Array.from(files)
  //     .map(file => {
  //       if (!file.type.startsWith('image/')) {
  //         alert('Please select only image files')

  //         return null
  //       }
  //       if (file.size > 5 * 1024 * 1024) {
  //         alert('File size should be less than 5MB')

  //         return null
  //       }

  //       return URL.createObjectURL(file)
  //     })
  //     .filter(Boolean)

  //   if (newImages.length > 0) {
  //     setValue('images', [...images, ...newImages], { shouldValidate: true })
  //   }
  // }

  const handleFilesChange = (files: FileList | null): void => {
    if (!files || files.length === 0) return

    const validFiles = Array.from(files).filter((file: File) => {
      if (!file.type.startsWith('image/')) {
        alert('Please select only image files')

        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB')

        return false
      }

      return true
    })

    if (validFiles.length > 0) {
      // Store File objects, not URLs
      setValue('images', [...images, ...validFiles], { shouldValidate: true })
    }
  }

  const handleRemoveImage = (index: number): void => {
    const updatedImages = images.filter((_: File, i: number) => i !== index)
    setValue('images', updatedImages, { shouldValidate: true })
  }

  const handleSiteSelect = (siteId: number): void => {
    // Find the complete site object from current list
    const site = list.find((s: Site) => s.site_id === siteId)
    if (!site) return

    const isCurrentlySelected = selectedSites.includes(siteId)

    let updatedSiteIds: number[]
    let updatedSiteObjects: Site[]

    if (isCurrentlySelected) {
      // Remove site
      updatedSiteIds = selectedSites.filter((id: number) => id !== siteId)
      updatedSiteObjects = selectedSiteObjects.filter((s: Site) => s.site_id !== siteId)
    } else {
      // Add site
      updatedSiteIds = [...selectedSites, siteId]
      updatedSiteObjects = [...selectedSiteObjects, site]
    }

    setSelectedSites(updatedSiteIds)
    setSelectedSiteObjects(updatedSiteObjects)
    setValue('selectedSites', updatedSiteIds, { shouldValidate: true })
  }

  const handleDrawerClose = (): void => {
    setSelectedSites([])
    setSelectedSiteObjects([])
    setValue('clusterName', '')
    setValue('images', [])
    setValue('selectedSites', [])
    setShowDrawer(false)
  }

  const debouncedSearch: DebouncedFunc<(value: string) => void> = useMemo(() => debounce(setSearch, 500), [])

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  const {
    data: queryData,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage
  } = useInfiniteQuery<PageData, Error, InfiniteData<PageData>>({
    queryKey: ['sites-for-cluster-adding', search, open],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }): Promise<PageData> => {
      const res = await getAllSites({
        page_no: pageParam as number,
        limit: PAGE_SIZE,
        q: search
      })

      return {
        result: res?.data?.result || [],
        nextPage: res?.data?.result?.length === PAGE_SIZE ? (pageParam as number) + 1 : undefined,
        total: res?.data?.total_count || 0
      }
    },
    getNextPageParam: (lastPage: PageData) => lastPage.nextPage,
    enabled: Boolean(open)
  })

  useEffect(() => {
    if (open) {
      setLocalSearch('')
      setSearch('')
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      queryClient.cancelQueries({ queryKey: ['sites-for-cluster-adding', search] })
      queryClient.removeQueries({ queryKey: ['sites-for-cluster-adding', search] })
      cooldownRef.current = false
    }
  }, [open, search, queryClient])

  const list: Site[] = useMemo(() => queryData?.pages?.flatMap((page: PageData) => page?.result) || [], [queryData])
  const total: number = useMemo(() => queryData?.pages?.[0]?.total || 0, [queryData])

  const cooldownRef = useRef<boolean>(false)

  const loadMore = useCallback((): void => {
    if (cooldownRef.current) return
    if (!isFetchingNextPage && hasNextPage) {
      cooldownRef.current = true
      fetchNextPage().finally(() => {
        setTimeout(() => {
          cooldownRef.current = false
        }, 300)
      })
    }
  }, [isFetchingNextPage, hasNextPage, fetchNextPage])

  useEffect(() => {
    if (inView) {
      loadMore()
    }
  }, [inView, loadMore])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value
    setLocalSearch(value)
    debouncedSearch(value)
  }

  const handleSearchClear = (): void => {
    setLocalSearch('')
    debouncedSearch('')
  }

  const onSubmit = async (data: FormData): Promise<void> => {
    console.log('Form Data:', data)
    setLoading(true)

    const payload = {
      cluster_name: data?.clusterName,
      cluster_sites: JSON.stringify(data?.selectedSites),
      cluster_desc: '',
      cluster_image: data?.images
    }
    console.log('Payload:', payload)
    try {
      const response = await addCluster(payload)
      console.log('Cluster added successfully:', response)
      if (response?.success) {
        handleDrawerClose()
        refetchCluster()
        queryClient.invalidateQueries({ queryKey: ['sites-for-cluster-adding', search] })
        Toaster({ type: 'success', message: response?.message })
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (e) {
      console.error('Error adding cluster:', e)
      toast.error('Failed to add cluster')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveSite = (siteId: number): void => {
    const updatedSiteIds = selectedSites.filter((id: number) => id !== siteId)
    const updatedSiteObjects = selectedSiteObjects.filter((s: Site) => s.site_id !== siteId)

    setSelectedSites(updatedSiteIds)
    setSelectedSiteObjects(updatedSiteObjects)
    setValue('selectedSites', updatedSiteIds, { shouldValidate: true })
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
          sx={{
            backgroundColor: 'background.default',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box
            className='sidebar-header'
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'background.default',
              px: '1.2rem',
              py: '1rem',
              borderBottom: `1px solid ${theme.palette.divider}`
            }}
          >
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2 }}>
              <img src='/icons/activity_icon.png' alt='Cluster Icon' width='30px' />
              <Typography variant='h6'>Add New Cluster</Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleDrawerClose}>
                <Icon icon='mdi:close' fontSize={20} />
              </IconButton>
            </Box>
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <Box sx={{ px: 5, py: 4 }}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <Typography variant='h6' sx={{ mb: 4, color: 'text.secondary' }}>
                  Cluster Name & Image
                </Typography>

                <Box
                  sx={{
                    p: 4,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    bgcolor: theme.palette.common.white,
                    mb: 6
                  }}
                >
                  <Controller
                    name='clusterName'
                    control={control}
                    rules={{
                      required: 'Cluster Name is required'
                    }}
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        label='Enter Cluster Name'
                        variant='outlined'
                        fullWidth
                        sx={{ mb: 4 }}
                        placeholder='Enter Cluster Name'
                        error={!!error}
                        helperText={error ? error.message : null}
                      />
                    )}
                  />
                  {images.length > 0 && (
                    <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      {images.map((img: File, index: number) => {
                        const previewUrl = typeof img === 'string' ? img : URL.createObjectURL(img)

                        return (
                          <Box
                            key={index}
                            sx={{
                              position: 'relative',
                              width: 100,
                              height: 100,
                              borderRadius: 1,
                              bgcolor: '#eaf6f6',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <img
                              src={previewUrl}
                              alt={`Cluster ${index}`}
                              style={{
                                width: 80,
                                height: 80,
                                objectFit: 'cover',
                                borderRadius: '50%',
                                display: 'block'
                              }}
                            />
                            <IconButton
                              size='small'
                              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                e.stopPropagation()
                                handleRemoveImage(index)
                              }}
                              sx={{
                                position: 'absolute',
                                top: 6,
                                right: 6,
                                background: '#979797',
                                color: '#fff',
                                width: 24,
                                height: 24,
                                zIndex: 1,
                                '&:hover': {
                                  background: '#757575'
                                }
                              }}
                            >
                              <Icon icon='mdi:close' fontSize={18} />
                            </IconButton>
                          </Box>
                        )
                      })}
                    </Box>
                  )}
                  <Controller
                    name='images'
                    control={control}
                    render={({ fieldState: { error } }) => (
                      <Box>
                        <Box
                          sx={{
                            border: `2px dashed ${error ? theme.palette.error.main : '#E0E0E0'}`,
                            borderRadius: 1.2,
                            p: 2,
                            textAlign: 'center',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 2,
                            '&:hover': {
                              bgcolor: '#F5F5F5',
                              borderColor: error ? theme.palette.error.main : '#BDBDBD'
                            }
                          }}
                          onClick={() => fileInputRef.current?.click()}
                          onDrop={(e: React.DragEvent<HTMLDivElement>) => {
                            e.preventDefault()
                            handleFilesChange(e.dataTransfer.files)
                          }}
                          onDragOver={(e: React.DragEvent<HTMLDivElement>) => e.preventDefault()}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: 0.6,
                              gap: 2
                            }}
                          >
                            <img src='/images/housing/gallery-add.svg' alt='Add Image Icon' width='30px' />
                            <Typography variant='body2' color='textSecondary' sx={{ fontWeight: 400 }}>
                              Drop your images here
                            </Typography>
                          </Box>

                          <input
                            type='file'
                            accept='image/*'
                            multiple
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilesChange(e.target.files)}
                          />
                        </Box>
                        {error && (
                          <Typography variant='caption' color='error' sx={{ mt: 1, display: 'block' }}>
                            {error.message}
                          </Typography>
                        )}
                      </Box>
                    )}
                  />
                </Box>
                <Box sx={{ mb: 4 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 3
                    }}
                  >
                    <Typography variant='h6' sx={{ color: 'text.secondary' }}>
                      All Sites ({total})
                    </Typography>
                    <Search
                      placeholder='Search for sites'
                      value={localSearch}
                      onChange={handleSearchChange}
                      onClear={handleSearchClear}
                      backgroundColor={theme.palette.common.white}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 2 }}>
                    {list.map((site: Site) => (
                      <SiteListingCard
                        key={site?.site_id}
                        site={site}
                        isSelected={selectedSites.includes(site?.site_id)}
                        onAction={handleSiteSelect}
                        isDisabled={(site as any)?.cluster_present === '1'}
                        mode='select'
                      />
                    ))}

                    {isFetching && list.length === 0 && (
                      <Box display='flex' justifyContent='center' p={2} mt={2}>
                        <CircularProgress />
                      </Box>
                    )}

                    {(isFetchingNextPage || hasNextPage) && list.length > 0 && (
                      <Box ref={loaderRef} display='flex' justifyContent='center' p={2} mt={2}>
                        <CircularProgress />
                      </Box>
                    )}

                    {!isFetching && list.length === 0 && (
                      <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.secondary }}>
                        No Site found
                      </Typography>
                    )}

                    {!hasNextPage && list.length > 0 && (
                      <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.disabled }}>
                        No more sites to load
                      </Typography>
                    )}
                  </Box>
                </Box>
              </form>
            </Box>
          </Box>
          <Box
            sx={{
              p: 5,
              borderTop: `1px solid ${theme.palette.divider}`,
              backgroundColor: 'background.paper',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10
            }}
          >
            <Button
              endIcon={<Icon icon='mdi:chevron-down' size={20} />}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textTransform: 'none',
                color: '#37BD69',
                px: 10
              }}
              onClick={() => setShowSelectedSitesDrawer(true)}
              disabled={selectedSites.length === 0}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ color: '#37BD69', fontSize: '16px' }} fontWeight={600}>
                  {selectedSites.length}
                </Typography>
                <Typography sx={{ color: '#37BD69', fontWeight: 600, fontSize: '16px' }}>Selected</Typography>
              </Box>
            </Button>
            <Button
              variant='contained'
              fullWidth
              size='large'
              sx={{
                py: 1.8,
                bgcolor: '#37BD69'
              }}
              onClick={handleSubmit(onSubmit)}
              disabled={selectedSites.length === 0 || loading}
            >
              {loading ? <CircularProgress size={24} color='inherit' /> : 'ADD'}
            </Button>
          </Box>
        </Box>
      </Drawer>
      {showSelectedSitesDrawer && (
        <SelectedSites
          open={showSelectedSitesDrawer}
          setShowSelectedSitesDrawer={setShowSelectedSitesDrawer}
          clusterName={watch('clusterName')}
          selectedSites={selectedSiteObjects}
          onRemoveSite={handleRemoveSite}
        />
      )}
    </>
  )
}

export default AddCluster
