import React, { useRef, useEffect } from 'react'
import { Avatar, Box, Button, Card, Typography, IconButton, useTheme } from '@mui/material'
import { useForm } from 'react-hook-form'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import {
  AddPhotoAlternate,
  AddPhotoAlternateOutlined,
  AssignmentRounded,
  AttachFile,
  Close as CloseIcon,
  Pets
} from '@mui/icons-material'
import MUIAutocomplete from 'src/views/forms/form-fields/MUIAutocomplete'

interface BannerImage {
  id?: string
  image_url?: string
  file?: File
  preview?: string
}

//ProfileImageUpload Component
interface ProfileImageUploadProps {
  profileImagePreview: string
  onProfileImageChange: (file: File) => void
}

export const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  profileImagePreview,
  onProfileImageChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const theme = useTheme()

  const handleProfileImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleProfileImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onProfileImageChange(file)
    }
  }

  return (
    <Card sx={{ mb: 4, p: 4 }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 4 }}>
        <Box
          sx={{
            borderRadius: 2,

            height: 30,
            width: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: `${theme?.palette?.customColors?.OnSurface}24`
          }}
        >
          {' '}
          <Pets sx={{ color: theme?.palette?.customColors?.Outline, fontSize: 20 }} />
        </Box>
        <Typography
          sx={{ color: theme?.palette?.customColors?.customHeadingTextColor, fontSize: '16px', fontWeight: 500 }}
        >
          {profileImagePreview ? 'Edit' : 'Add'} Display
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
        <Avatar
          sx={{
            width: 161,
            height: 161,
            cursor: 'pointer',
            backgroundColor: theme.palette.customColors.antzInfoLight
          }}
          onClick={handleProfileImageClick}
        >
          {profileImagePreview ? (
            <img src={profileImagePreview} alt='Profile' style={{ width: '100%', height: '100%', objectFit: 'fill' }} />
          ) : (
            <Pets sx={{ width: 60, height: 60, color: theme?.palette?.customColors.addPrimary }} />
          )}
        </Avatar>
        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          style={{ display: 'none' }}
          onChange={handleProfileImageFileChange}
        />
        <Button
          size='small'
          onClick={handleProfileImageClick}
          sx={{ mt: 1, color: theme?.palette?.customColors.addPrimary, fontWeight: 600, fontSize: '14px' }}
        >
          {profileImagePreview ? 'Change Display Picture' : 'Add Display Picture'}
        </Button>
      </Box>
    </Card>
  )
}

//  BannerImagesUpload Component
interface BannerImagesUploadProps {
  bannerImages: BannerImage[]
  onBannerImagesChange: (files: File[]) => void
  onRemoveBannerImage: (image: BannerImage) => void
  theme?: any
}

export const BannerImagesUpload: React.FC<BannerImagesUploadProps> = ({
  bannerImages,
  onBannerImagesChange,
  onRemoveBannerImage
}) => {
  const theme = useTheme()
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const handleBannerImagesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      onBannerImagesChange(Array.from(files))
      if (bannerInputRef.current) {
        bannerInputRef.current.value = ''
      }
    }
  }

  return (
    <Card sx={{ mb: 4, p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 4 }}>
          <Box
            sx={{
              borderRadius: 2,

              height: 30,
              width: 30,
              display: 'flex',
              p: 4,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: `${theme?.palette?.customColors?.OnSurface}24`
            }}
          >
            {' '}
            <AttachFile sx={{ color: theme?.palette?.customColors?.Outline, fontSize: 20 }} />
          </Box>
          <Typography
            sx={{ color: theme?.palette?.customColors?.customHeadingTextColor, fontSize: '16px', fontWeight: 500 }}
          >
            Attachments
          </Typography>
        </Box>
        {bannerImages.length > 0 && (
          <IconButton onClick={() => bannerInputRef.current?.click()} size='small' sx={{ width: 48, height: 48 }}>
            <AddPhotoAlternateOutlined sx={{ color: theme?.palette?.primary.main }} />
          </IconButton>
        )}
      </Box>

      <input
        ref={bannerInputRef}
        type='file'
        accept='image/*'
        multiple
        style={{ display: 'none' }}
        onChange={handleBannerImagesChange}
      />

      {bannerImages.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {bannerImages?.map((image, index) => (
            <Box key={index} sx={{ position: 'relative', width: 100, height: 100 }}>
              <img
                src={image.image_url || (image.file ? URL.createObjectURL(image.file) : '')}
                alt={`Banner ${index}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }}
              />
              <IconButton
                size='small'
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bgcolor: theme?.palette?.customColors?.deepDark || 'rgba(0,0,0,0.5)',
                  p: 0.5
                }}
                onClick={() => onRemoveBannerImage(image)}
              >
                <CloseIcon sx={{ fontSize: 16, color: theme?.palette?.customColors.OnPrimary }} />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}

      {bannerImages.length === 0 && (
        <Box
          onClick={() => bannerInputRef.current?.click()}
          sx={{
            backgroundColor: `${theme?.palette?.customColors.addPrimary}24`,
            p: 6,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1,
            cursor: 'pointer'
          }}
        >
          <Avatar
            variant='rounded'
            sx={{
              width: 80,
              height: 80,
              bgcolor: theme?.palette?.customColors.OnPrimary,
              border: `1px dashed ${theme?.palette?.customColors.OnSurfaceVariant}`,
              mb: 1
            }}
          >
            <AddPhotoAlternate sx={{ fontSize: 48, color: theme?.palette?.customColors.OnSurfaceVariant }} />
          </Avatar>
          <Typography
            sx={{ color: theme?.palette?.customColors.OnSurface, fontSize: '20px', fontWeight: '600', my: 2 }}
          >
            Upload Files
          </Typography>
          <Typography sx={{ color: theme?.palette?.customColors.neutralSecondary }}>
            Supported: JPEG, PNG (Max 28 MB)
          </Typography>
        </Box>
      )}
    </Card>
  )
}

//  CommonNamesSection Component
interface CommonNamesSectionProps {
  vernacularOptions: any[]
  selectedVernacularId: string
  manualVernacularName: string
  commonNameError: string
  isEditMode: boolean
  isHybrid: boolean
  onVernacularSelect: (value: string) => void
  onVernacularNameChange: (value: string) => void
}
// const MUIAutoComplete = MUIAutocomplete as React.FC<any>
export const CommonNamesSection: React.FC<CommonNamesSectionProps> = ({
  vernacularOptions,
  selectedVernacularId,
  manualVernacularName,
  commonNameError,
  isEditMode,
  isHybrid,
  onVernacularSelect,
  onVernacularNameChange
}) => {
  const theme = useTheme()
  const { control, setValue, setError, clearErrors } = useForm({
    defaultValues: { common_name: '' }
  })
  const MUIAutoComplete = MUIAutocomplete as React.FC<any>

  useEffect(() => {
    setValue('common_name', manualVernacularName)
  }, [manualVernacularName, setValue])

  useEffect(() => {
    if (commonNameError) {
      setError('common_name', { message: commonNameError })
    } else {
      clearErrors('common_name')
    }
  }, [commonNameError, setError, clearErrors])

  return (
    <Card sx={{ mb: 4, p: 4 }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 4 }}>
        <Box
          sx={{
            borderRadius: 2,

            height: 30,
            width: 30,
            display: 'flex',
            p: 4,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: `${theme?.palette?.customColors?.OnSurface}24`
          }}
        >
          {' '}
          <AssignmentRounded sx={{ color: theme?.palette?.customColors?.Outline, fontSize: 20 }} />
        </Box>
        <Typography
          sx={{ color: theme?.palette?.customColors?.customHeadingTextColor, fontSize: '16px', fontWeight: 500 }}
        >
          Common Names
        </Typography>
      </Box>

      {(isEditMode || !isHybrid) && (
        <>
          <MUIAutoComplete
            value={selectedVernacularId}
            label='Search Vernacular Name'
            valueType='id'
            size='medium'
            onChange={(newValue: string) => {
              onVernacularSelect(newValue)
            }}
            getOptionLabel={(option: any) => option.vernacular_name}
            options={vernacularOptions}
            textFieldProps={{
              placeholder: 'Search vernacular name...'
            }}
            renderOption={(props: any, option: any) => (
              <li
                {...props}
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block',
                  width: '100%'
                }}
              >
                {option.vernacular_name}
              </li>
            )}
          />
          <Typography sx={{ textAlign: 'center', my: 2 }}>or</Typography>
        </>
      )}

      <ControlledTextField
        name='common_name'
        control={control}
        label='Common Name'
        fullWidth
        placeholder='Enter Common Name'
        onChangeOverride={(e: any) => onVernacularNameChange(e?.target ? e.target.value : e)}
      />
    </Card>
  )
}
