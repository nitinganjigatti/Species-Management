import { Box, CircularProgress, Drawer, IconButton, Typography, useTheme } from '@mui/material'
import { useInfiniteQuery, type InfiniteData, type QueryKey } from '@tanstack/react-query'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import Icon from 'src/@core/components/icon'
import { getDocumentTypeList } from 'src/lib/api/compliance/exports'
import Utility from 'src/utility'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import SupportingDocuments from '../SupportingDocuments'
import type { SpeciesExportDocumentDrawerProps } from 'src/types/compliance'

const SpeciesExportDocumentDrawer = ({ open, onClose, shipmentId, shipmentNumber }: SpeciesExportDocumentDrawerProps) => {
  const theme = useTheme()
  const PAGE_SIZE = 10

  const { ref: loaderRef, inView } = useInView({ threshold: 0 })

  type PageType = { result: any[]; nextPage: number | undefined; total: number }

  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } = useInfiniteQuery<PageType, Error, InfiniteData<PageType>, QueryKey, number>({
    queryKey: ['species-export-linked-documents', shipmentId, open],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await getDocumentTypeList({
        id: shipmentId,
        type: 'shipment',
        status: 'completed'
      }) as any

      return {
        result: res?.data?.items || [],
        nextPage: res?.data?.items?.length === PAGE_SIZE ? (pageParam as number) + 1 : undefined,
        total: res?.data?.total || 0
      }
    },
    getNextPageParam: (lastPage: PageType) => lastPage.nextPage,
    initialPageParam: 1,
    enabled: !!shipmentId
  })

  const list = useMemo(() => data?.pages?.flatMap(page => page?.result) || [], [data])
  const total = data?.pages?.[0]?.total ?? 0

  const cooldownRef = useRef<boolean>(false)

  const loadMore = useCallback(() => {
    if (cooldownRef.current || !hasNextPage || isFetchingNextPage) return
    cooldownRef.current = true
    fetchNextPage().finally(() => {
      setTimeout(() => {
        cooldownRef.current = false
      }, 300)
    })
  }, [fetchNextPage, isFetchingNextPage, hasNextPage])

  useEffect(() => {
    if (inView) loadMore()
  }, [inView, loadMore])

  const handleImagePreview = (doc: unknown) => {
    console.log(doc, 'image')
  }

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        onClose={onClose}
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '562px'], height: '100vh' },
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          backgroundColor: theme.palette.customColors.OnPrimary
        }}
      >
        <Box
          className='sidebar-header'
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: theme.palette.customColors.OnPrimary,
            p: theme => theme.spacing(3, 3.255, 3, 5.255),
            borderBottom: `0.5px solid ${theme.palette.divider}`
          }}
        >
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
            <Typography sx={{ fontSize: '24px', fontWeight: 500 }}>{`Documents List - ${shipmentNumber}`}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <IconButton size='small' sx={{ color: 'text.primary' }} onClick={onClose}>
              <Icon icon='mdi:close' fontSize={24} />
            </IconButton>
          </Box>
        </Box>
        <Box
          sx={{
            '& .MuiDrawer-paper': { width: ['100%', '562px'] },
            backgroundColor: theme.palette.customColors.OnPrimary,
            height: '100%',
            p: theme => theme.spacing(3, 5.255, 3, 5.255),
            mt: 2
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pb: 4 }}>
            {list.map(doc => (
              <SupportingDocuments key={doc?.id} isFetching={isFetching} documentList={list} totalCount={total} />
            ))}

            {isFetching && list.length === 0 && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  p: 2,
                  mt: 2
                }}
              >
                <CircularProgress />
              </Box>
            )}

            {(isFetchingNextPage || hasNextPage) && list.length > 0 && (
              <Box
                ref={loaderRef}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  p: 2,
                  mt: 2
                }}
              >
                <CircularProgress />
              </Box>
            )}

            {!isFetching && list.length === 0 && (
              <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.secondary }}>
                No document found
              </Typography>
            )}

            {!hasNextPage && list.length > 0 && (
              <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.disabled }}>
                No more documents to load
              </Typography>
            )}
          </Box>
        </Box>
      </Drawer>
    </>
  )
}

export default SpeciesExportDocumentDrawer
