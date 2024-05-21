import { Autocomplete, Avatar, Button, Drawer, FormControl, IconButton, MenuItem, Select, TextField, Typography } from "@mui/material";
import { Box } from "@mui/system";
import React, { useEffect, useMemo, useState, useRef } from "react";
import Icon from 'src/@core/components/icon'
import CloseIcon from "@mui/icons-material/Close";
import { Controller, useForm } from "react-hook-form";
import { LoadingButton } from "@mui/lab";
import { addSpecies, getSearchTaxonomyList, getSpeciesVernacularData } from "src/lib/api/species";
import toast from "react-hot-toast";
import * as yup from 'yup'
// import { yupResolver } from "@hookform/resolvers/yup";




const AddSpeciesSlideBar = ({ handleSidebarClose, setOpenDrawer, fetchTaxonomy, taxonomy, editVernacularNames, editName, speciesImage }) => {

    console.log("editValues >>", editVernacularNames)


    const [displayProfile, setDisplayProfile] = useState('')
    const [searchValue, setSearchValue] = useState('');
    const [open, setOpen] = useState(false);
    const [vernacularData, setVernacularData] = useState([])
    const [selectedImages, setSelectedImages] = useState([]);
    const [defaultTaxonomy, setDefaultTaxonomy] = useState(null)
    const [selectedValues, setSelectedValues] = useState([]);
    const fileInputRef = React.useRef(null);


    console.log("EditName>>", editName, speciesImage);

    console.log("Vernacular Names >>", editVernacularNames)


    const defaultValues = {
        tsn_id: "",
        vernacular_id: "",
        species_image: "",
        scientificName: "",
        banner_images: [],
        vernacular_name: ""
    }

    const {
        control,
        handleSubmit,
        setValue,
        formState: { errors }
    } = useForm({
        defaultValues,
        // resolver: yupResolver(schema),
        mode: 'onBlur',
        reValidateMode: 'onChange'
    })




    const addEventSidebarOpen = () => {
        setOpenDrawer(true)
    }


    const fetchSpeciesVernacularData = async (taxonomy) => {
        try {
            const response = await getSpeciesVernacularData(taxonomy?.taxonomy_id);
            setVernacularData(response?.data); // Set the response data
        } catch (error) {
            console.error("Error fetching species data:", error);
            setVernacularData(null);
        }
    }




    const handleButtonClick = () => {
        fileInputRef.current.click();
    };


    const handleFileChange = (e) => {
        const files = e.target.files;
        const imagesArray = [];
        const filesArray = [];

        let filesRead = 0;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            const reader = new FileReader();
            reader.onload = (event) => {
                imagesArray.push(reader.result);
                filesArray.push(file)


                filesRead++;


                if (filesRead === files.length) {
                    setSelectedImages(imagesArray);
                    setValue('banner_images', filesArray);
                }
            };

            reader.readAsDataURL(file);
        }
    };



    const handleRemoveImage = (indexToRemove) => {

        const updatedImages = selectedImages.filter((image, index) => index !== indexToRemove);
        setValue('banner_images', updatedImages)
        setSelectedImages(updatedImages);
    };



    const handleInputImageChange = file => {
        const reader = new FileReader()
        const { files } = file.target
        if (files && files.length !== 0) {
            if (files[0] !== '') {
                reader.onload = () => {
                    setDisplayProfile(reader?.result)
                }

                reader.readAsDataURL(files[0])
            }

            setValue('species_image', files[0])
        }
    }


    const onSubmit = async (val) => {
        console.log("Submit Value", val);

        val.vernacular_name = val.vernacular_name ? val.vernacular_name : "";

        val.vernacular_id = val.vernacular_id !== undefined && val.vernacular_id !== "" ? val.vernacular_id : null;

        const payload = {
            tsn_id: val.tsn_id,
            vernacular_id: val.vernacular_id?.join(','),
            vernacular_name: val.vernacular_name ? val.vernacular_name :"",
            scientificName: val.scientificName,
            species_image: val.species_image ? val.species_image : "",
            banner_images: val.banner_images ? val.banner_images : [],
            zoo_id: 11
        };
        console.log("Payload >>", payload)


        const response = await addSpecies(payload);

       

        if (response?.success) {
            toast.success("Species Added Successfully");
            setOpenDrawer(false)

        } else {
            toast.error("Unable to add Species");
        }
    };



    return (
        <>
            <Drawer
                anchor='right'
                open={addEventSidebarOpen}
                ModalProps={{ keepMounted: true }}
                sx={{ '& .MuiDrawer-paper': { width: ['100%', 400], transitionDuration: '1s' } }}
            >
                <Box className='sidebar-header' sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    backgroundColor: 'background.default',
                    p: theme => theme.spacing(3, 3.255, 3, 5.255)
                }}
                >
                    {editName ? <Typography> Edit Species </Typography> : <Typography> Add New Species </Typography>}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton size='small' sx={{ color: 'text.primary' }}>
                            <Icon icon='mdi:close' fontSize={20} onClick={handleSidebarClose} />
                        </IconButton>
                    </Box>

                </Box>

                <Box className='sidebar-body' sx={{ p: theme => theme.spacing(5, 6) }}>
                    <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>

                        <FormControl fullWidth>
                            <Controller
                                name='tsn_id'
                                control={control}
                                rules={{ required: true }}
                                render={({ field }) => (
                                    <>
                                        <Autocomplete

                                            id='tsn_id'
                                            value={defaultTaxonomy || editName}
                                            options={taxonomy}
                                            open={open}
                                            onOpen={() => setOpen(true)}
                                            onClose={() => setOpen(false)}
                                            getOptionLabel={(option) => option ? `${option.common_name || ""} ${option.scientific_name || editName}` : editName}
                                            isOptionEqualToValue={(option, value) =>option ? option?.taxonomy_id === value?.taxonomy_id: editName}
                                            onChange={(e, val) => {
                                                setDefaultTaxonomy(val ? val : null);
                                                if (val) {
                                                    fetchSpeciesVernacularData(val);
                                                }
                                                field.onChange(val ? val.taxonomy_id : '');

                                                setValue('scientificName', val ? val.scientific_name : '');
                                            }}
                                            onKeyUp={(e) => {
                                                if (e.target.value.length >= 3) {
                                                    fetchTaxonomy(e.target.value)
                                                }
                                            }}
                                            renderInput={params => (
                                                <TextField
                                                    {...params}
                                                    label='Choose Taxonomy*'
                                                    placeholder='Enter at least 3 characters'
                                                />
                                            )}
                                        />
                                    </>
                                )}
                            />
                        </FormControl>


                        <Box>
                            <Avatar
                                sx={{
                                    mt: 8,
                                    width: "110px",
                                    height: "110px",
                                    position: "relative",
                                    left: "100px",
                                    cursor: "pointer"
                                }}
                                name="species_image"
                            >
                                <input
                                    id="fileInput" // Add an id to the input element
                                    type='file'
                                    accept='image/*'
                                    onChange={e => handleInputImageChange(e)}
                                    name='species_image'
                                    style={{
                                        opacity: 0,
                                        position: 'absolute',
                                        height: '200px',
                                        width: '200px',
                                        cursor: 'pointer',
                                        top: 0,
                                        left: 0,
                                        zIndex: 1
                                    }}
                                />
                                {(displayProfile || speciesImage) && <img src={displayProfile ? displayProfile : speciesImage} width="110" height="110" alt="Profile" style={{
                                    objectFit: "cover",
                                    objectPosition: "center"
                                }} />}
                            </Avatar>
                            <Typography variant="body2" sx={{ mt: 4, ml: 22 }}>{displayProfile ? "Change Display Picture" : "Add Display Picture"}</Typography>
                        </Box>



                        <Box>

                            <FormControl fullWidth sx={{ mt: 6 }}>
                                <Typography sx={{ mt: 1 }}>Scientific Name</Typography>
                                <Controller
                                    name="scientificName"
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field: { value, onChange } }) => (
                                        <TextField
                                            sx={{ mt: 2 }}
                                            value={editName ? editName : value}
                                            onChange={onChange}
                                            placeholder="Scientific Name"
                                            name='scientificName'
                                        />
                                    )}
                                />
                            </FormControl>
                        </Box>

                        <Box>



                            <FormControl fullWidth sx={{ mt: 6 }}>
                                <Typography>Common Names</Typography>


                                <FormControl fullWidth >

                                    {editVernacularNames.length > 0 ? (
                                        <>
                                            <Controller
                                                name="vernacular_id"
                                                control={control}
                                                rules={{ required: true }}
                                                render={({ field: { value, onChange } }) => {
                                                    console.log("Selected IDs:", value); 
                                                    const selectedIds = value || editVernacularNames.map(item => item.vern_id);
                                                    console.log("Prefill IDs:", selectedIds); 
                                                    return (
                                                        <Select
                                                            sx={{ mt: 2 }}
                                                            multiple
                                                            fullWidth
                                                            value={selectedIds}
                                                            onChange={(e) => {
                                                                const selectedIds = e.target.value;
                                                                onChange(selectedIds);
                                                                setSelectedValues(selectedIds.join(','));
                                                            }}
                                                            renderValue={(selected) => {
                                                                if (selected.length === 0) {
                                                                    return <em>Select Vernacular</em>;
                                                                }
                                                                return selected.map((id) => {
                                                                    const selectedVernacular = editVernacularNames.find((item) => item.vern_id === id); // Change to vern_id
                                                                    return selectedVernacular ? selectedVernacular.vernacular_name : '';
                                                                }).join(',');
                                                            }}
                                                        >
                                                            {editVernacularNames.map((item, index) => (
                                                                <MenuItem key={index} value={item.vern_id}> 
                                                                    {item.vernacular_name}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    );
                                                }}
                                            />

                                            <Typography sx={{ ml: "140px", mt: 5 }}>or</Typography>
                                        </>
                                    ) : (
                                        <>
                                            <Controller
                                                name="vernacular_id"
                                                control={control}
                                                rules={{ required: true }}
                                                render={({ field: { value, onChange } }) => (
                                                    <Select
                                                        sx={{ mt: 2 }}
                                                        multiple
                                                        fullWidth
                                                        value={value || []}
                                                        onChange={(e) => {
                                                            const selectedIds = e.target.value;
                                                            onChange(selectedIds);
                                                            setSelectedValues(selectedIds.join(','));
                                                        }}
                                                        renderValue={(selected) => {
                                                            if (selected.length === 0) {
                                                                return <em>Select Vernacular</em>;
                                                            }
                                                            return selected.map((id) => {
                                                                const selectedVernacular = vernacularData.find((item) => item.vern_id === id);
                                                                return selectedVernacular ? selectedVernacular.vernacular_name : '';
                                                            });
                                                        }}
                                                    >
                                                        {vernacularData.map((item, index) => (
                                                            <MenuItem key={index} value={item.vern_id}>
                                                                {item.vernacular_name}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                )}
                                            />
                                            <Typography sx={{ ml: "140px", mt: 5 }}>or</Typography>
                                        </>
                                    )}


                                </FormControl>




                                <Controller
                                    name="vernacular_name"
                                    control={control}

                                    render={({ field: { value, onChange } }) => (
                                        <TextField
                                            sx={{ mt: 2 }}
                                            value={value}
                                            onChange={onChange}
                                            placeholder=" Enter Common Name"
                                            name="vernacular_name"
                                        />
                                    )}
                                />
                                {/* {errors.vernacular_name && <FormHelperText sx={{ color: 'error.main' }}>{errors.vernacular_name.message}</FormHelperText>} */}

                            </FormControl>
                        </Box>

                        <Box>
                            <input
                                type="fi le"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                name="banner_images"
                                multiple
                                onChange={e => handleFileChange(e)}
                            />
                            <Button fullWidth sx={{ mt: 9, height: "50px" }} variant="contained" onClick={handleButtonClick}>Add Gallery Images</Button>
                            {/* Display selected images from the state */}
                            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row' }}>
                                {selectedImages.map((image, index) => (
                                    <Box key={index} sx={{ position: 'relative', marginRight: 2, margin: 4 }}>
                                        <img src={image} alt={`Image ${index}`} style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }} />
                                        <IconButton
                                            sx={{ position: 'absolute', top: 0, right: 0, mb: 5, color: 'white', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                                            onClick={() => handleRemoveImage(index)}
                                        >
                                            <CloseIcon />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Box>

                        </Box>
                        <Typography variant="body" sx={{ fontSize: "13px", mt: 6 }}>Add images in JPG or PNG format only. Preferrable dimension of the image is 2000 width x 1250 height</Typography>
                        <Box>

                            <Button fullWidth sx={{ mt: 8, height: "50px" }} size='medium' type='submit' variant='contained' >
                                Submit
                            </Button>
                        </Box>
                    </form>

                </Box>

            </Drawer>
        </>
    )
}
export default AddSpeciesSlideBar;