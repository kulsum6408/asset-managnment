import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from "@mui/material";

import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  ArrowBack,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import API from "../services/api";

const Maintenance = () => {
  const navigate = useNavigate();
  const [maintenance, setMaintenance] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [overdue, setOverdue] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingReminders, setLoadingReminders] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [openView, setOpenView] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  // =====================================================
  // GET MAINTENANCE
  // =====================================================
  const fetchMaintenance = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        setMaintenance([]);
        setErrorMessage("You are not logged in.");
        return;
      }

      const response = await API.get("/maintenance", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("MAINTENANCE RESPONSE:", response.data);

      const data = response.data;

      if (Array.isArray(data)) {
        setMaintenance(data);
      } else if (Array.isArray(data.maintenance)) {
        setMaintenance(data.maintenance);
      } else if (Array.isArray(data.data)) {
        setMaintenance(data.data);
      } else {
        setMaintenance([]);
      }
    } catch (error) {
      console.error("Failed to load maintenance:", error);

      setMaintenance([]);

      setErrorMessage(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to load maintenance records."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // GET UPCOMING + OVERDUE
  // =====================================================
  const fetchReminders = async () => {
    try {
      setLoadingReminders(true);

      const token = localStorage.getItem("token");

      if (!token) {
        return;
      }

      const [upcomingResponse, overdueResponse] =
        await Promise.all([
          API.get("/maintenance/reminders/upcoming", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),

          API.get("/maintenance/reminders/overdue", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

      const upcomingData = upcomingResponse.data;
      const overdueData = overdueResponse.data;

      setUpcoming(
        Array.isArray(upcomingData)
          ? upcomingData
          : []
      );

      setOverdue(
        Array.isArray(overdueData)
          ? overdueData
          : []
      );
    } catch (error) {
      console.error(
        "Failed to load maintenance reminders:",
        error
      );
    } finally {
      setLoadingReminders(false);
    }
  };

  useEffect(() => {
    fetchMaintenance();
    fetchReminders();
  }, []);

  // =====================================================
  // FILTER
  // =====================================================
  const filteredMaintenance = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return maintenance.filter((record) => {
      const assetName = String(
        record.asset_name || ""
      ).toLowerCase();

      const serialNumber = String(
        record.serial_number || ""
      ).toLowerCase();

      const technician = String(
        record.technician_name || ""
      ).toLowerCase();

      const description = String(
        record.description || ""
      ).toLowerCase();

      const type = String(
        record.maintenance_type || ""
      ).toLowerCase();

      const status = String(
        record.status || ""
      );

      const matchesSearch =
        assetName.includes(searchText) ||
        serialNumber.includes(searchText) ||
        technician.includes(searchText) ||
        description.includes(searchText) ||
        type.includes(searchText);

      const matchesStatus =
        statusFilter === "All" ||
        status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [maintenance, search, statusFilter]);

  // =====================================================
  // STATUS COUNTS
  // =====================================================
  const statusCounts = {
    All: maintenance.length,

    Scheduled: maintenance.filter(
      (record) => record.status === "Scheduled"
    ).length,

    "In Progress": maintenance.filter(
      (record) => record.status === "In Progress"
    ).length,

    Completed: maintenance.filter(
      (record) => record.status === "Completed"
    ).length,

    Cancelled: maintenance.filter(
      (record) => record.status === "Cancelled"
    ).length,
  };

  // =====================================================
  // STATUS COLOR
  // =====================================================
  const getStatusColor = (status) => {
    switch (status) {
      case "Scheduled":
        return "info";

      case "In Progress":
        return "warning";

      case "Completed":
        return "success";

      case "Cancelled":
        return "error";

      default:
        return "default";
    }
  };

  // =====================================================
  // VIEW RECORD
  // =====================================================
  const handleView = async (record) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setSelectedRecord(record);
        setOpenView(true);
        return;
      }

      const response = await API.get(
        `/maintenance/${record.maintenance_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSelectedRecord(response.data);
      setOpenView(true);
    } catch (error) {
      console.error(
        "Failed to load maintenance details:",
        error
      );

      setSelectedRecord(record);
      setOpenView(true);
    }
  };

  const handleCloseView = () => {
    setOpenView(false);
    setSelectedRecord(null);
  };

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
        onClick={() => navigate("/admin")}
        sx={{
          mb: 3,
          color: "#07548e",
          fontWeight: 700,
          textTransform: "none",
        }}
      >
        Back to Dashboard
      </Button>

      {/* =================================================
          HEADER
      ================================================= */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            color: "#1f2937",
          }}
        >
          Maintenance
        </Typography>

        <Typography
          sx={{
            color: "#6b7280",
            mt: 0.5,
          }}
        >
          Monitor maintenance activities, technicians,
          schedules, and asset maintenance history.
        </Typography>
      </Box>

      {/* =================================================
          ERROR
      ================================================= */}
      {errorMessage && (
        <Card
          elevation={0}
          sx={{
            mb: 3,
            borderRadius: 2,
            border: "1px solid #fecaca",
            backgroundColor: "#fef2f2",
          }}
        >
          <CardContent>
            <Typography color="error">
              {errorMessage}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* =================================================
          SUMMARY CARDS
      ================================================= */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            sm: "repeat(3, 1fr)",
            lg: "repeat(5, 1fr)",
          },
          gap: 2,
          mb: 3,
        }}
      >
        {[
          "All",
          "Scheduled",
          "In Progress",
          "Completed",
          "Cancelled",
        ].map((status) => (
          <Card
            key={status}
            onClick={() => setStatusFilter(status)}
            elevation={0}
            sx={{
              cursor: "pointer",
              borderRadius: 3,
              border:
                statusFilter === status
                  ? "2px solid #07548e"
                  : "1px solid #e5e7eb",
              backgroundColor: "#ffffff",
            }}
          >
            <CardContent>
              <Typography
                variant="body2"
                sx={{
                  color: "#6b7280",
                  mb: 1,
                }}
              >
                {status}
              </Typography>

              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: "#1f2937",
                }}
              >
                {statusCounts[status]}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* =================================================
          REMINDERS
      ================================================= */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "1fr 1fr",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e5e7eb",
            backgroundColor: "#ffffff",
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: 2,
              }}
            >
              <ScheduleIcon
                sx={{ color: "#07548e" }}
              />

              <Typography
                variant="h6"
                sx={{ fontWeight: 700 }}
              >
                Upcoming Maintenance
              </Typography>
            </Box>

            {loadingReminders ? (
              <CircularProgress
                size={25}
                sx={{ color: "#07548e" }}
              />
            ) : (
              <Typography
                sx={{
                  fontSize: 30,
                  fontWeight: 800,
                  color: "#1f2937",
                }}
              >
                {upcoming.length}
              </Typography>
            )}

            <Typography
              sx={{
                color: "#6b7280",
                mt: 0.5,
              }}
            >
              Maintenance tasks due soon.
            </Typography>
          </CardContent>
        </Card>

        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e5e7eb",
            backgroundColor: "#ffffff",
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: 2,
              }}
            >
              <WarningIcon
                sx={{ color: "#d32f2f" }}
              />

              <Typography
                variant="h6"
                sx={{ fontWeight: 700 }}
              >
                Overdue Maintenance
              </Typography>
            </Box>

            {loadingReminders ? (
              <CircularProgress
                size={25}
                sx={{ color: "#d32f2f" }}
              />
            ) : (
              <Typography
                sx={{
                  fontSize: 30,
                  fontWeight: 800,
                  color: "#d32f2f",
                }}
              >
                {overdue.length}
              </Typography>
            )}

            <Typography
              sx={{
                color: "#6b7280",
                mt: 0.5,
              }}
            >
              Maintenance tasks past their due date.
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* =================================================
          SEARCH + FILTER
      ================================================= */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          mb: 3,
        }}
      >
        <CardContent>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <TextField
              fullWidth
              placeholder="Search asset, technician, description..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              sx={{
                flex: 1,
                minWidth: 280,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      sx={{
                        color: "#6b7280",
                      }}
                    />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl
              sx={{
                minWidth: 210,
              }}
            >
              <InputLabel>Status</InputLabel>

              <Select
                value={statusFilter}
                label="Status"
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                sx={{
                  borderRadius: 2,
                }}
              >
                <MenuItem value="All">
                  All Maintenance
                </MenuItem>

                <MenuItem value="Scheduled">
                  Scheduled
                </MenuItem>

                <MenuItem value="In Progress">
                  In Progress
                </MenuItem>

                <MenuItem value="Completed">
                  Completed
                </MenuItem>

                <MenuItem value="Cancelled">
                  Cancelled
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* =================================================
          MAINTENANCE TABLE
      ================================================= */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                py: 8,
              }}
            >
              <CircularProgress
                sx={{
                  color: "#07548e",
                }}
              />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow
                    sx={{
                      backgroundColor: "#f8fafc",
                    }}
                  >
                    <TableCell sx={{ fontWeight: 700 }}>
                      Asset
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>
                      Technician
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>
                      Type
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>
                      Date
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>
                      Status
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>
                      Cost
                    </TableCell>

                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700 }}
                    >
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredMaintenance.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        align="center"
                        sx={{
                          py: 7,
                          color: "#6b7280",
                        }}
                      >
                        No maintenance records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMaintenance.map(
                      (record) => (
                        <TableRow
                          key={record.maintenance_id}
                          hover
                        >
                          <TableCell>
                            <Typography
                              sx={{
                                fontWeight: 600,
                              }}
                            >
                              {record.asset_name ||
                                "-"}
                            </Typography>

                            <Typography
                              variant="body2"
                              sx={{
                                color: "#6b7280",
                              }}
                            >
                              {record.serial_number ||
                                ""}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            {record.technician_name ||
                              "-"}
                          </TableCell>

                          <TableCell>
                            {record.maintenance_type ||
                              "-"}
                          </TableCell>

                          <TableCell>
                            {record.maintenance_date
                              ? new Date(
                                  record.maintenance_date
                                ).toLocaleDateString()
                              : "-"}
                          </TableCell>

                          <TableCell>
                            <Chip
                              label={
                                record.status ||
                                "Unknown"
                              }
                              color={getStatusColor(
                                record.status
                              )}
                              size="small"
                              sx={{
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>

                          <TableCell>
                            {record.cost !== null &&
                            record.cost !== undefined
                              ? Number(
                                  record.cost
                                ).toLocaleString()
                              : "-"}
                          </TableCell>

                          <TableCell align="center">
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<ViewIcon />}
                              onClick={() =>
                                handleView(record)
                              }
                              sx={{
                                textTransform: "none",
                                color: "#07548e",
                                borderColor:
                                  "#07548e",
                              }}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* =================================================
          VIEW DIALOG
      ================================================= */}
      <Dialog
        open={openView}
        onClose={handleCloseView}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Maintenance Details
        </DialogTitle>

        <DialogContent>
          {selectedRecord && (
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                }}
              >
                {selectedRecord.asset_name ||
                  "Maintenance Record"}
              </Typography>

              <Divider sx={{ mb: 2 }} />

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "1fr 1fr",
                  },
                  gap: 2,
                }}
              >
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Maintenance ID
                  </Typography>

                  <Typography>
                    {selectedRecord.maintenance_id ||
                      "-"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Asset
                  </Typography>

                  <Typography>
                    {selectedRecord.asset_name ||
                      "-"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Serial Number
                  </Typography>

                  <Typography>
                    {selectedRecord.serial_number ||
                      "-"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Technician
                  </Typography>

                  <Typography>
                    {selectedRecord.technician_name ||
                      "-"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Maintenance Type
                  </Typography>

                  <Typography>
                    {selectedRecord.maintenance_type ||
                      "-"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Status
                  </Typography>

                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={
                        selectedRecord.status ||
                        "Unknown"
                      }
                      color={getStatusColor(
                        selectedRecord.status
                      )}
                      size="small"
                    />
                  </Box>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Maintenance Date
                  </Typography>

                  <Typography>
                    {selectedRecord.maintenance_date
                      ? new Date(
                          selectedRecord.maintenance_date
                        ).toLocaleString()
                      : "-"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Next Maintenance
                  </Typography>

                  <Typography>
                    {selectedRecord.next_maintenance_date
                      ? new Date(
                          selectedRecord.next_maintenance_date
                        ).toLocaleDateString()
                      : "-"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Cost
                  </Typography>

                  <Typography>
                    {selectedRecord.cost !== null &&
                    selectedRecord.cost !== undefined
                      ? Number(
                          selectedRecord.cost
                        ).toLocaleString()
                      : "-"}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    gridColumn: {
                      xs: "auto",
                      sm: "1 / -1",
                    },
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Description
                  </Typography>

                  <Typography>
                    {selectedRecord.description ||
                      "-"}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    gridColumn: {
                      xs: "auto",
                      sm: "1 / -1",
                    },
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Location
                  </Typography>

                  <Typography>
                    {selectedRecord.location || "-"}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleCloseView}
            sx={{
              textTransform: "none",
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Maintenance;