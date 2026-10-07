import React, { useEffect, useState } from "react";
import axios from "axios";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Divider,
    Grid,
    MenuItem,
    Paper,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material";

import {
    Search as SearchIcon,
    Inventory2 as InventoryIcon,
    Refresh as RefreshIcon,
} from "@mui/icons-material";

import BackButton from "../components/BackButton";

// ============================================================
// API
// ============================================================

const API_URL = "http://localhost:5000";

// ============================================================
// AUTH HEADER
// ============================================================

const getAuthConfig = () => {
    const token = localStorage.getItem("token");

    return {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    };
};

// ============================================================
// COMPONENT
// ============================================================

const AssetOfficerInventoryCheck = () => {
    // ========================================================
    // ASSETS
    // ========================================================

    const [assets, setAssets] = useState([]);
    const [loadingAssets, setLoadingAssets] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedAsset, setSelectedAsset] = useState(null);

    // ========================================================
    // INVENTORY HISTORY
    // ========================================================

    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [yearFilter, setYearFilter] = useState("All");

    // ========================================================
    // FORM
    // ========================================================

    const [form, setForm] = useState({
        check_year: new Date().getFullYear(),
        physical_status: "",
        physical_condition: "",
        physical_location: "",
        discrepancy: "",
        notes: "",
    });

    // ========================================================
    // SUBMIT STATE
    // ========================================================

    const [submitting, setSubmitting] = useState(false);

    // ========================================================
    // MESSAGE
    // ========================================================

    const [message, setMessage] = useState({
        open: false,
        type: "success",
        text: "",
    });

    // ========================================================
    // MESSAGE FUNCTIONS
    // ========================================================

    const showMessage = (type, text) => {
        setMessage({
            open: true,
            type,
            text,
        });
    };

    const closeMessage = () => {
        setMessage((previous) => ({
            ...previous,
            open: false,
        }));
    };

    // ========================================================
    // LOAD ASSETS
    // ========================================================

    const loadAssets = async () => {
        try {
            setLoadingAssets(true);

            const response = await axios.get(
                `${API_URL}/api/assets`,
                getAuthConfig()
            );

            const data = response.data;

            if (Array.isArray(data)) {
                setAssets(data);
            } else if (Array.isArray(data.data)) {
                setAssets(data.data);
            } else if (Array.isArray(data.assets)) {
                setAssets(data.assets);
            } else {
                setAssets([]);
            }
        } catch (error) {
            console.error("Load assets error:", error);

            showMessage(
                "error",
                error.response?.data?.error ||
                    error.response?.data?.message ||
                    "Failed to load assets."
            );
        } finally {
            setLoadingAssets(false);
        }
    };

    // ========================================================
    // LOAD INVENTORY HISTORY
    // ========================================================

    const loadHistory = async (assetId) => {
        if (!assetId) {
            setHistory([]);
            return;
        }

        try {
            setLoadingHistory(true);

            const response = await axios.get(
                `${API_URL}/api/inventory-checks/asset/${assetId}`,
                getAuthConfig()
            );

            const data = response.data;

            if (Array.isArray(data)) {
                setHistory(data);
            } else if (Array.isArray(data.data)) {
                setHistory(data.data);
            } else if (Array.isArray(data.checks)) {
                setHistory(data.checks);
            } else {
                setHistory([]);
            }
        } catch (error) {
            console.error(
                "Load inventory history error:",
                error
            );

            setHistory([]);

            showMessage(
                "error",
                error.response?.data?.error ||
                    error.response?.data?.message ||
                    "Failed to load inventory history."
            );
        } finally {
            setLoadingHistory(false);
        }
    };

    // ========================================================
    // INITIAL LOAD
    // ========================================================

    useEffect(() => {
        loadAssets();
    }, []);

    // ========================================================
    // SELECT ASSET
    // ========================================================

    const selectAsset = async (asset) => {
        setSelectedAsset(asset);

        setYearFilter("All");

        setForm({
            check_year: new Date().getFullYear(),
            physical_status: "",
            physical_condition: "",
            physical_location: asset.location || "",
            discrepancy: "",
            notes: "",
        });

        await loadHistory(asset.asset_id);
    };

    // ========================================================
    // FORM CHANGE
    // ========================================================

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // ========================================================
    // SUBMIT INVENTORY CHECK
    // ========================================================

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!selectedAsset) {
            showMessage(
                "error",
                "Please select an asset first."
            );
            return;
        }

        if (!form.physical_status) {
            showMessage(
                "error",
                "Please select the physical status."
            );
            return;
        }

        if (!form.check_year) {
            showMessage(
                "error",
                "Please enter the check year."
            );
            return;
        }

        try {
            setSubmitting(true);

            const payload = {
                asset_id: selectedAsset.asset_id,
                check_year: Number(form.check_year),
                physical_status: form.physical_status,
                physical_condition:
                    form.physical_condition || null,
                physical_location:
                    form.physical_location || null,
                discrepancy:
                    form.discrepancy || null,
                notes:
                    form.notes || null,
            };

            const response = await axios.post(
                `${API_URL}/api/inventory-checks`,
                payload,
                getAuthConfig()
            );

            showMessage(
                "success",
                response.data?.message ||
                    "Annual inventory check recorded successfully."
            );

            // Refresh inventory history
            await loadHistory(selectedAsset.asset_id);

            // Clear physical check fields
            setForm((previous) => ({
                ...previous,
                physical_status: "",
                physical_condition: "",
                discrepancy: "",
                notes: "",
            }));
        } catch (error) {
            console.error(
                "Create inventory check error:",
                error
            );

            const errorMessage =
                error.response?.data?.error ||
                error.response?.data?.message ||
                "Failed to record inventory check.";

            showMessage("error", errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    // ========================================================
    // FILTER ASSETS
    // ========================================================

    const filteredAssets = assets.filter((asset) => {
        const value = search.toLowerCase().trim();

        if (!value) {
            return true;
        }

        return (
            String(asset.asset_name || "")
                .toLowerCase()
                .includes(value) ||
            String(asset.serial_number || "")
                .toLowerCase()
                .includes(value) ||
            String(asset.location || "")
                .toLowerCase()
                .includes(value)
        );
    });

    // ========================================================
    // YEAR FILTERED HISTORY
    // ========================================================

    const availableYears = [
        ...new Set(
            history.map(
                (item) => item.check_year
            )
        ),
    ].sort((a, b) => b - a);

    const filteredHistory =
        yearFilter === "All"
            ? history
            : history.filter(
                  (item) =>
                      Number(item.check_year) ===
                      Number(yearFilter)
              );

    // ========================================================
    // RENDER
    // ========================================================

    return (
        <Box sx={{ p: 3 }}>
            {/* =================================================
                HEADER
            ================================================= */}

            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                    flexWrap: "wrap",
                    gap: 2,
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                    }}
                >
                    <BackButton to="/asset-officer" />

                    <Box>
                        <Typography
                            variant="h4"
                            fontWeight="bold"
                        >
                            Annual Inventory Check
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.5 }}
                        >
                            Verify physical assets against the
                            system records.
                        </Typography>
                    </Box>
                </Box>

                <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={loadAssets}
                    disabled={loadingAssets}
                >
                    Refresh Assets
                </Button>
            </Box>

            {/* =================================================
                MAIN GRID
            ================================================= */}

            <Grid container spacing={3}>
                {/* =================================================
                    ASSET LIST
                ================================================= */}

                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography
                                variant="h6"
                                fontWeight="bold"
                                sx={{ mb: 2 }}
                            >
                                <InventoryIcon
                                    sx={{
                                        verticalAlign: "middle",
                                        mr: 1,
                                    }}
                                />
                                Select Asset
                            </Typography>

                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search asset or serial number..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                                InputProps={{
                                    startAdornment: (
                                        <SearchIcon
                                            sx={{
                                                mr: 1,
                                                color:
                                                    "text.secondary",
                                            }}
                                        />
                                    ),
                                }}
                                sx={{ mb: 2 }}
                            />

                            {loadingAssets ? (
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent:
                                            "center",
                                        py: 4,
                                    }}
                                >
                                    <CircularProgress />
                                </Box>
                            ) : filteredAssets.length === 0 ? (
                                <Alert severity="info">
                                    No assets found.
                                </Alert>
                            ) : (
                                <Box
                                    sx={{
                                        maxHeight: 500,
                                        overflowY: "auto",
                                    }}
                                >
                                    {filteredAssets.map(
                                        (asset) => (
                                            <Paper
                                                key={
                                                    asset.asset_id
                                                }
                                                elevation={0}
                                                onClick={() =>
                                                    selectAsset(
                                                        asset
                                                    )
                                                }
                                                sx={{
                                                    p: 2,
                                                    mb: 1,
                                                    cursor: "pointer",
                                                    border:
                                                        selectedAsset?.asset_id ===
                                                        asset.asset_id
                                                            ? "2px solid"
                                                            : "1px solid",
                                                    borderColor:
                                                        selectedAsset?.asset_id ===
                                                        asset.asset_id
                                                            ? "primary.main"
                                                            : "divider",
                                                    borderRadius: 2,
                                                    "&:hover": {
                                                        backgroundColor:
                                                            "action.hover",
                                                    },
                                                }}
                                            >
                                                <Typography
                                                    fontWeight="bold"
                                                >
                                                    {
                                                        asset.asset_name
                                                    }
                                                </Typography>

                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                >
                                                    Serial:{" "}
                                                    {asset.serial_number ||
                                                        "N/A"}
                                                </Typography>

                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                >
                                                    Location:{" "}
                                                    {asset.location ||
                                                        "N/A"}
                                                </Typography>
                                            </Paper>
                                        )
                                    )}
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* =================================================
                    CHECK SECTION
                ================================================= */}

                <Grid item xs={12} md={8}>
                    {!selectedAsset ? (
                        <Card>
                            <CardContent>
                                <Alert severity="info">
                                    Select an asset from the
                                    list to perform an
                                    inventory check.
                                </Alert>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* =====================================
                                SYSTEM INFORMATION
                            ===================================== */}

                            <Card sx={{ mb: 3 }}>
                                <CardContent>
                                    <Typography
                                        variant="h6"
                                        fontWeight="bold"
                                        sx={{ mb: 2 }}
                                    >
                                        System Information
                                    </Typography>

                                    <Grid
                                        container
                                        spacing={2}
                                    >
                                        <Grid
                                            item
                                            xs={12}
                                            sm={6}
                                        >
                                            <TextField
                                                fullWidth
                                                label="Asset Name"
                                                value={
                                                    selectedAsset.asset_name ||
                                                    ""
                                                }
                                                InputProps={{
                                                    readOnly: true,
                                                }}
                                            />
                                        </Grid>

                                        <Grid
                                            item
                                            xs={12}
                                            sm={6}
                                        >
                                            <TextField
                                                fullWidth
                                                label="Serial Number"
                                                value={
                                                    selectedAsset.serial_number ||
                                                    ""
                                                }
                                                InputProps={{
                                                    readOnly: true,
                                                }}
                                            />
                                        </Grid>

                                        <Grid
                                            item
                                            xs={12}
                                            sm={4}
                                        >
                                            <TextField
                                                fullWidth
                                                label="System Status"
                                                value={
                                                    selectedAsset.status ||
                                                    ""
                                                }
                                                InputProps={{
                                                    readOnly: true,
                                                }}
                                            />
                                        </Grid>

                                        <Grid
                                            item
                                            xs={12}
                                            sm={4}
                                        >
                                            <TextField
                                                fullWidth
                                                label="System Condition"
                                                value={
                                                    selectedAsset.asset_condition ||
                                                    ""
                                                }
                                                InputProps={{
                                                    readOnly: true,
                                                }}
                                            />
                                        </Grid>

                                        <Grid
                                            item
                                            xs={12}
                                            sm={4}
                                        >
                                            <TextField
                                                fullWidth
                                                label="System Location"
                                                value={
                                                    selectedAsset.location ||
                                                    ""
                                                }
                                                InputProps={{
                                                    readOnly: true,
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>

                            {/* =====================================
                                PHYSICAL INVENTORY CHECK
                            ===================================== */}

                            <Card>
                                <CardContent>
                                    <Typography
                                        variant="h6"
                                        fontWeight="bold"
                                        sx={{ mb: 2 }}
                                    >
                                        Physical Inventory Check
                                    </Typography>

                                    <Divider
                                        sx={{ mb: 3 }}
                                    />

                                    <Box
                                        component="form"
                                        onSubmit={
                                            handleSubmit
                                        }
                                    >
                                        <Grid
                                            container
                                            spacing={2}
                                        >
                                            {/* CHECK YEAR */}
                                            <Grid
                                                item
                                                xs={12}
                                                sm={6}
                                            >
                                                <TextField
                                                    fullWidth
                                                    type="number"
                                                    label="Check Year"
                                                    name="check_year"
                                                    value={
                                                        form.check_year
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    inputProps={{
                                                        min: 2000,
                                                        max: 2100,
                                                    }}
                                                    required
                                                />
                                            </Grid>

                                            {/* PHYSICAL STATUS */}
                                            <Grid
                                                item
                                                xs={12}
                                                sm={6}
                                            >
                                                <TextField
                                                    fullWidth
                                                    select
                                                    label="Physical Status"
                                                    name="physical_status"
                                                    value={
                                                        form.physical_status
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    required
                                                >
                                                    <MenuItem value="">
                                                        Select status
                                                    </MenuItem>

                                                    <MenuItem value="Found">
                                                        Found
                                                    </MenuItem>

                                                    <MenuItem value="Missing">
                                                        Missing
                                                    </MenuItem>

                                                    <MenuItem value="Damaged">
                                                        Damaged
                                                    </MenuItem>
                                                </TextField>
                                            </Grid>

                                            {/* PHYSICAL CONDITION */}
                                            <Grid
                                                item
                                                xs={12}
                                                sm={6}
                                            >
                                                <TextField
                                                    fullWidth
                                                    label="Physical Condition"
                                                    name="physical_condition"
                                                    value={
                                                        form.physical_condition
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    placeholder="e.g. Good, Fair, Poor"
                                                />
                                            </Grid>

                                            {/* PHYSICAL LOCATION */}
                                            <Grid
                                                item
                                                xs={12}
                                                sm={6}
                                            >
                                                <TextField
                                                    fullWidth
                                                    label="Physical Location"
                                                    name="physical_location"
                                                    value={
                                                        form.physical_location
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    placeholder="Enter actual physical location"
                                                />
                                            </Grid>

                                            {/* DISCREPANCY */}
                                            <Grid
                                                item
                                                xs={12}
                                            >
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    minRows={3}
                                                    label="Discrepancy"
                                                    name="discrepancy"
                                                    value={
                                                        form.discrepancy
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    placeholder="Describe any difference between system records and physical asset."
                                                />
                                            </Grid>

                                            {/* NOTES */}
                                            <Grid
                                                item
                                                xs={12}
                                            >
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    minRows={3}
                                                    label="Notes"
                                                    name="notes"
                                                    value={
                                                        form.notes
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    placeholder="Additional inventory-check notes..."
                                                />
                                            </Grid>

                                            {/* SUBMIT */}
                                            <Grid
                                                item
                                                xs={12}
                                            >
                                                <Button
                                                    type="submit"
                                                    variant="contained"
                                                    size="large"
                                                    disabled={
                                                        submitting
                                                    }
                                                    startIcon={
                                                        submitting ? (
                                                            <CircularProgress
                                                                size={
                                                                    20
                                                                }
                                                                color="inherit"
                                                            />
                                                        ) : (
                                                            <InventoryIcon />
                                                        )
                                                    }
                                                >
                                                    {submitting
                                                        ? "Recording..."
                                                        : "Record Inventory Check"}
                                                </Button>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </CardContent>
                            </Card>

                            {/* =====================================
                                HISTORY
                            ===================================== */}

                            <Card sx={{ mt: 3 }}>
                                <CardContent>
                                    <Typography
                                        variant="h6"
                                        fontWeight="bold"
                                        sx={{ mb: 2 }}
                                    >
                                        Inventory Check History
                                    </Typography>

                                    {availableYears.length >
                                        1 && (
                                        <TextField
                                            fullWidth
                                            size="small"
                                            select
                                            label="Filter by Year"
                                            value={yearFilter}
                                            onChange={(event) =>
                                                setYearFilter(
                                                    event.target
                                                        .value
                                                )
                                            }
                                            sx={{ mb: 2 }}
                                        >
                                            <MenuItem value="All">
                                                All Years
                                            </MenuItem>

                                            {availableYears.map(
                                                (year) => (
                                                    <MenuItem
                                                        key={
                                                            year
                                                        }
                                                        value={
                                                            year
                                                        }
                                                    >
                                                        {
                                                            year
                                                        }
                                                    </MenuItem>
                                                )
                                            )}
                                        </TextField>
                                    )}

                                    {loadingHistory ? (
                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent:
                                                    "center",
                                                py: 3,
                                            }}
                                        >
                                            <CircularProgress />
                                        </Box>
                                    ) : filteredHistory.length ===
                                      0 ? (
                                        <Alert severity="info">
                                            {history.length ===
                                            0
                                                ? "No previous inventory checks found for this asset."
                                                : "No inventory checks found for the selected year."}
                                        </Alert>
                                    ) : (
                                        <Box
                                            sx={{
                                                overflowX:
                                                    "auto",
                                            }}
                                        >
                                            <table
                                                style={{
                                                    width: "100%",
                                                    borderCollapse:
                                                        "collapse",
                                                }}
                                            >
                                                <thead>
                                                    <tr>
                                                        <th
                                                            style={{
                                                                textAlign:
                                                                    "left",
                                                                padding:
                                                                    "10px",
                                                            }}
                                                        >
                                                            Year
                                                        </th>

                                                        <th
                                                            style={{
                                                                textAlign:
                                                                    "left",
                                                                padding:
                                                                    "10px",
                                                            }}
                                                        >
                                                            Date
                                                        </th>

                                                        <th
                                                            style={{
                                                                textAlign:
                                                                    "left",
                                                                padding:
                                                                    "10px",
                                                            }}
                                                        >
                                                            Physical
                                                            Status
                                                        </th>

                                                        <th
                                                            style={{
                                                                textAlign:
                                                                    "left",
                                                                padding:
                                                                    "10px",
                                                            }}
                                                        >
                                                            Condition
                                                        </th>

                                                        <th
                                                            style={{
                                                                textAlign:
                                                                    "left",
                                                                padding:
                                                                    "10px",
                                                            }}
                                                        >
                                                            Location
                                                        </th>

                                                        <th
                                                            style={{
                                                                textAlign:
                                                                    "left",
                                                                padding:
                                                                    "10px",
                                                            }}
                                                        >
                                                            Checked By
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {filteredHistory.map(
                                                        (item) => (
                                                            <tr
                                                                key={
                                                                    item.check_id
                                                                }
                                                            >
                                                                <td
                                                                    style={{
                                                                        padding:
                                                                            "10px",
                                                                        borderTop:
                                                                            "1px solid #ddd",
                                                                    }}
                                                                >
                                                                    {
                                                                        item.check_year
                                                                    }
                                                                </td>

                                                                <td
                                                                    style={{
                                                                        padding:
                                                                            "10px",
                                                                        borderTop:
                                                                            "1px solid #ddd",
                                                                    }}
                                                                >
                                                                    {item.check_date
                                                                        ? new Date(
                                                                              item.check_date
                                                                          ).toLocaleDateString()
                                                                        : "N/A"}
                                                                </td>

                                                                <td
                                                                    style={{
                                                                        padding:
                                                                            "10px",
                                                                        borderTop:
                                                                            "1px solid #ddd",
                                                                    }}
                                                                >
                                                                    {
                                                                        item.physical_status
                                                                    }
                                                                </td>

                                                                <td
                                                                    style={{
                                                                        padding:
                                                                            "10px",
                                                                        borderTop:
                                                                            "1px solid #ddd",
                                                                    }}
                                                                >
                                                                    {item.physical_condition ||
                                                                        "N/A"}
                                                                </td>

                                                                <td
                                                                    style={{
                                                                        padding:
                                                                            "10px",
                                                                        borderTop:
                                                                            "1px solid #ddd",
                                                                    }}
                                                                >
                                                                    {item.physical_location ||
                                                                        "N/A"}
                                                                </td>

                                                                <td
                                                                    style={{
                                                                        padding:
                                                                            "10px",
                                                                        borderTop:
                                                                            "1px solid #ddd",
                                                                    }}
                                                                >
                                                                    {item.checked_by_name ||
                                                                        "N/A"}
                                                                </td>
                                                            </tr>
                                                        )
                                                    )}
                                                </tbody>
                                            </table>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    )}
                </Grid>
            </Grid>

            {/* =================================================
                MESSAGE
            ================================================= */}

            <Snackbar
                open={message.open}
                autoHideDuration={5000}
                onClose={closeMessage}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                }}
            >
                <Alert
                    onClose={closeMessage}
                    severity={message.type}
                    variant="filled"
                    sx={{ width: "100%" }}
                >
                    {message.text}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AssetOfficerInventoryCheck;