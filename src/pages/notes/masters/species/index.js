import { Autocomplete, Avatar, Badge, Button, Card, CardActions, CardContent, CardHeader, Drawer, FormControl, Grid, IconButton, InputLabel, TextField, Typography, debounce } from "@mui/material"
import Icon from 'src/@core/components/icon'

import { Box } from "@mui/system"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { LoadingButton } from "@mui/lab"
import TableBasic from "src/views/table/data-grid/TableBasic"
import { getSearchTaxonomyList, getSpeciesList } from "src/lib/api/species"
import AddSpeciesSlideBar from "src/views/pages/species/SpeciesSlider"

const AddSpecies = () => {
    const [openDrawer, setOpenDrawer] = useState(false)
    const [displayProfile, setDisplayProfile] = useState('')
    const [rows, setRows] = useState([])
    const [open, setOpen] = useState(false);
    const [filteredRows, setFilteredRows] = useState([])
    const [taxonomy, setTaxonomy] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
   


    useEffect(() => {
        const fetchData = async () => {
            try {
                const payload = {
                    zoo_id: 11
                };
                const listResponse = await getSpeciesList(payload);
                console.log("response>", listResponse);
                if (listResponse) {
                    // Add unique id to each row
                    const rowsWithIds = listResponse.data.taxonomy_list.map((row, index) => ({
                        ...row,
                        id: row.tsn // Assuming 'tsn' is unique for each species
                    }));
                    setRows(rowsWithIds);
                    setFilteredRows(rowsWithIds)
                }
            } catch (error) {
                console.error("Error fetching species list:", error);
            }
        };

        fetchData();
    }, []);




    console.log("Rows Data ??", rows);
    // console.log("Displpay ??", displayProfile);


  

    const addEventSidebarOpen = () => {
        setOpenDrawer(true)
    }

    const handleSidebarClose = () => {
        setOpenDrawer(false)
    }

    const columns = [

        {
            flex: 0.4,
            minWidth: 20,
            field: 'default_icon',
            headerName: 'Species Image',
            renderCell: params => (
                <Badge
                    sx={{ ml: 2, cursor: 'pointer' }}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right'
                    }}
                >
                    <Avatar
                        variant='square'
                        alt='Species Image'
                        sx={{ width: 40, height: 40 }}
                        src={params.row.default_icon ? `${params.row.default_icon}` : '/images/tablet.png'}
                    />
                </Badge>
            )
        },

        {
            flex: 0.4,
            minWidth: 20,
            field: 'default_common_name',
            headerName: 'Common Name',
            renderCell: params => (
                <Typography variant='body2' sx={{ color: 'text.primary' }}>
                    {params.row.default_common_name}
                </Typography>
            )
        },


        {
            flex: 0.4,
            minWidth: 20,
            field: 'complete_name',
            headerName: 'Scientific Name',
            renderCell: params => (
                <Typography variant='body2' sx={{ color: 'text.primary' }}>
                    {params.row.complete_name}
                </Typography>
            )
        },


    ]

    const handleSearchName = (e) => {
        const searchTerm = e.target.value.toLowerCase();
        setSearchTerm(searchTerm);
        if (searchTerm !== "") {
            const filteredRows = rows?.filter(row => {
                return row.default_common_name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
                    row.complete_name?.toLowerCase()?.includes(searchTerm?.toLowerCase());
            });
            setFilteredRows(filteredRows);
        } else {
            setFilteredRows(rows)
        }
    }

    const fetchTaxonomy = async (searchValue) => {
        try {
            const response = await getSearchTaxonomyList(searchValue);
            setTaxonomy(response?.data || []);
            setOpen(true); 
        } catch (error) {
            console.error("Error fetching taxonomy list:", error);
        }
    };


    return (
        <>
            <Card>
                <Grid sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Grid>
                        <CardHeader title="Species Master" />
                        <Grid sx={{ ml: 5, width: "300px" }}><TextField fullWidth placeholder="Search Added Species" onChange={(e) => handleSearchName(e)} /></Grid>
                    </Grid>


                    <Grid>
                        <CardActions>
                            <Button sx={{ mt: 2 }} onClick={() => addEventSidebarOpen()} variant="contained" size="small" color="primary">Add Species</Button>
                        </CardActions>
                    </Grid>
                </Grid>
                <CardContent>

                    <Box>
                        <TableBasic columns={columns} rows={filteredRows} ></TableBasic>
                    </Box>
                </CardContent>
            </Card>

            {openDrawer &&
                <AddSpeciesSlideBar
                    drawerWidth={400}
                    addEventSidebarOpen={openDrawer}
                    setOpenDrawer={setOpenDrawer}
                    handleSidebarClose={handleSidebarClose}
                    fetchTaxonomy={fetchTaxonomy}
                    taxonomy={taxonomy}

                />
            }
        </>

    )
}
export default AddSpecies