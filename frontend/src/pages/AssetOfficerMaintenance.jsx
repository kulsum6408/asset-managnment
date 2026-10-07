import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Stack,
} from "@mui/material";

import {
  Build as MaintenanceIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Inventory2 as AssetIcon,
  ArrowBack,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import API from "../services/api";

const AssetOfficerMaintenance = () => {
  const navigate = useNavigate();
  const [maintenance, setMaintenance] = useState([]);
  const [assets, setAssets] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const getList = (data, key) => {
    if (Array.isArray(data)) return data;

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    if (Array.isArray(data?.[key])) {
      return data[key];
    }

    if (Array.isArray(data?.records)) {
      return data.records;
    }

    return [];
  };

  // =====================================================
  // LOAD DATA
  // =====================================================

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("You are not logged in.");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [
        maintenanceResponse,
        assetsResponse,
      ] = await Promise.allSettled([
        API.get("/maintenance", { headers }),
        API.get("/assets", { headers }),
      ]);

      if (maintenanceResponse.status === "fulfilled") {
        setMaintenance(
          getList(
            maintenanceResponse.value.data,
            "maintenance"
          )
        );
      } else {
        setError(
          maintenanceResponse.reason?.response?.data
            ?.error ||
            "Unable to load maintenance records."
        );
      }

      if (assetsResponse.status === "fulfilled") {
        setAssets(
          getList(
            assetsResponse.value.data,
            "assets"
          )
        );
      }
    } catch (err) {
      console.error(
        "Failed to load maintenance data:",
        err
      );

      setError(
        err.response?.data?.error ||
          "Unable to load maintenance information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // =====================================================
  // FILTER
  // =====================================================

  const filteredMaintenance = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    return maintenance.filter((item) => {
      const assetName = String(
        item.asset_name || ""
      ).toLowerCase();

      const serialNumber = String(
        item.serial_number || ""
      ).toLowerCase();

      const issue = String(
        item.issue_type ||
          item.problem_type ||
          item.description ||
          ""
      ).toLowerCase();

      const status = String(
        item.status || ""
      ).toLowerCase();

      const matchesSearch =
        !searchValue ||
        assetName.includes(searchValue) ||
        serialNumber.includes(searchValue) ||
        issue.includes(searchValue);

      const matchesStatus =
        statusFilter === "All" ||
        status === statusFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    maintenance,
    search,
    statusFilter,
  ]);

  // =====================================================
  // STATISTICS
  // =====================================================

  const openCount = maintenance.filter(
    (item) =>
      ![
        "completed",
        "closed",
        "resolved",
      ].includes(
        String(
          item.status || ""
        ).toLowerCase()
      )
  ).length;

  const completedCount = maintenance.filter(
    (item) =>
      [
        "completed",
        "closed",
        "resolved",
      ].includes(
        String(
          item.status || ""
        ).toLowerCase()
      )
  ).length;

  const assetsUnderMaintenance = assets.filter(
    (asset) =>
      [
        "maintenance",
        "under maintenance",
      ].includes(
        String(
          asset.status || ""
        ).toLowerCase()
      )
  ).length;

  // =====================================================
  // STATUS COLOR
  // =====================================================

  const getStatusColor = (status) => {
    const value = String(
      status || ""
    ).toLowerCase();

    if (
      value === "completed" ||
      value === "resolved" ||
      value === "closed"
    ) {
      return "success";
    }

    if (
      value === "in progress" ||
      value === "ongoing"
    ) {
      return "warning";
    }

    if (
      value === "pending" ||
      value === "open"
    ) {
      return "error";
    }

    return "default";
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress
          sx={{
            color: "#07548e",
          }}
        />
      </Box>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f5f7fb",
        p: {
          xs: 2,
          sm: 3,
          md: 4,
        },
      }}
    >
      {/* BACK */}
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate("/asset-officer")}
        sx={{
          mb: 3,
          color: "#07548e",
          fontWeight: 700,
          textTransform: "none",
        }}
      >
        Back to Dashboard
      </Button>

      {/* HEADER */}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: {
            xs: "flex-start",
            md: "center",
          },
          flexDirection: {
            xs: "column",
            md: "row",
          },
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: "#1f2937",
              mb: 1,
            }}
          >
            Maintenance
          </Typography>

          <Typography color="text.secondary">
            Monitor asset maintenance and repair records.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchData}
          sx={{
            borderColor: "#07548e",
            color: "#07548e",
            textTransform: "none",
            fontWeight: 700,
          }}
        >
          Refresh
        </Button>
      </Box>

      {/* ERROR */}

      {error && (
        <Alert
          severity="warning"
          onClose={() => setError("")}
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      {/* SUMMARY */}

      <Grid
        container
        spacing={3}
        sx={{ mb: 4 }}
      >
        {[
          {
            title: "Open Maintenance",
            value: openCount,
            icon: <MaintenanceIcon fontSize="large" />,
          },
          {
            title: "Completed",
            value: completedCount,
            icon: <MaintenanceIcon fontSize="large" />,
          },
          {
            title: "Assets Under Maintenance",
            value: assetsUnderMaintenance,
            icon: <AssetIcon fontSize="large" />,
          },
        ].map((stat) => (
          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
            key={stat.title}
          >
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border:
                  "1px solid #e5e7eb",
                backgroundColor: "#ffffff",
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {stat.title}
                    </Typography>

                    <Typography
                      variant="h4"
                      fontWeight={800}
                    >
                      {stat.value}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#e8f2fa",
                      color: "#07548e",
                    }}
                  >
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* SEARCH / FILTER */}

      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          border:
            "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
        }}
      >
        <CardContent>
          <Grid container spacing={2}>
            <Grid
              size={{
                xs: 12,
                md: 8,
              }}
            >
              <TextField
                fullWidth
                label="Search maintenance"
                placeholder="Asset, serial number or problem..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                InputProps={{
                  startAdornment: (
                    <SearchIcon
                      sx={{
                        mr: 1,
                        color: "text.secondary",
                      }}
                    />
                  ),
                }}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4,
              }}
            >
              <TextField
                fullWidth
                select
                label="Status"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value
                  )
                }
              >
                <MenuItem value="All">
                  All Statuses
                </MenuItem>

                <MenuItem value="Pending">
                  Pending
                </MenuItem>

                <MenuItem value="Open">
                  Open
                </MenuItem>

                <MenuItem value="In Progress">
                  In Progress
                </MenuItem>

                <MenuItem value="Completed">
                  Completed
                </MenuItem>

                <MenuItem value="Resolved">
                  Resolved
                </MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* RECORDS */}

      {filteredMaintenance.length === 0 ? (
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border:
              "1px solid #e5e7eb",
            backgroundColor: "#ffffff",
          }}
        >
          <CardContent
            sx={{
              textAlign: "center",
              py: 7,
            }}
          >
            <MaintenanceIcon
              sx={{
                fontSize: 60,
                color: "#07548e",
                mb: 2,
              }}
            />

            <Typography
              variant="h6"
              fontWeight={700}
              sx={{ mb: 1 }}
            >
              No Maintenance Records
            </Typography>

            <Typography color="text.secondary">
              No maintenance records match your current
              filters.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {filteredMaintenance.map(
            (item, index) => {
              const status =
                item.status || "Pending";

              return (
                <Card
                  key={
                    item.maintenance_id ||
                    item.id ||
                    index
                  }
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border:
                      "1px solid #e5e7eb",
                    backgroundColor:
                      "#ffffff",
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems: {
                          xs: "flex-start",
                          md: "center",
                        },
                        flexDirection: {
                          xs: "column",
                          md: "row",
                        },
                        gap: 2,
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          sx={{ mb: 0.5 }}
                        >
                          {item.asset_name ||
                            "Asset"}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          Serial:{" "}
                          {item.serial_number ||
                            "N/A"}
                        </Typography>

                        <Typography
                          sx={{
                            mt: 2,
                            color: "#374151",
                          }}
                        >
                          <strong>
                            Problem:
                          </strong>{" "}
                          {item.issue_type ||
                            item.problem_type ||
                            item.description ||
                            "No description"}
                        </Typography>

                        {item.priority && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 1 }}
                          >
                            Priority:{" "}
                            {item.priority}
                          </Typography>
                        )}

                        {item.created_at && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 1 }}
                          >
                            Reported:{" "}
                            {new Date(
                              item.created_at
                            ).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>

                      <Box
                        sx={{
                          minWidth: {
                            xs: "100%",
                            md: 160,
                          },
                        }}
                      >
                        <Chip
                          label={status}
                          color={getStatusColor(
                            status
                          )}
                          sx={{
                            fontWeight: 700,
                          }}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            }
          )}
        </Stack>
      )}
    </Box>
  );
};

export default AssetOfficerMaintenance;