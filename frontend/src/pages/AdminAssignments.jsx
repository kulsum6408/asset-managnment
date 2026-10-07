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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
} from "@mui/material";

import {
  Search as SearchIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";

import BackButton from "../components/BackButton";
import API from "../services/api";

const AdminAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [selected, setSelected] = useState(null);
  const [openView, setOpenView] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  // =====================================================
  // GET ASSIGNMENTS
  // =====================================================
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        setAssignments([]);
        setErrorMessage("You are not logged in.");
        return;
      }

      const response = await API.get("/assignments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      if (Array.isArray(data)) {
        setAssignments(data);
      } else if (Array.isArray(data.assignments)) {
        setAssignments(data.assignments);
      } else if (Array.isArray(data.data)) {
        setAssignments(data.data);
      } else {
        setAssignments([]);
      }
    } catch (error) {
      console.error("Failed to load assignments:", error);
      setAssignments([]);
      setErrorMessage(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to load assignments."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // =====================================================
  // FILTER
  // =====================================================
  const filtered = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return assignments.filter((a) => {
      const employee = String(a.employee_name || "").toLowerCase();
      const asset = String(a.asset_name || "").toLowerCase();
      const serial = String(a.serial_number || "").toLowerCase();
      const assignedBy = String(a.assigned_by_name || "").toLowerCase();

      const matchesSearch =
        employee.includes(searchText) ||
        asset.includes(searchText) ||
        serial.includes(searchText) ||
        assignedBy.includes(searchText);

      const matchesStatus =
        statusFilter === "All" ||
        String(a.status || "") === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [assignments, search, statusFilter]);

  // =====================================================
  // STATUS COLOR
  // =====================================================
  const getStatusColor = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "active":
      case "assigned":
      case "issued":
        return "primary";
      case "returned":
        return "success";
      case "overdue":
        return "error";
      default:
        return "default";
    }
  };

  // =====================================================
  // VIEW
  // =====================================================
  const handleView = (item) => {
    setSelected(item);
    setOpenView(true);
  };

  const handleCloseView = () => {
    setOpenView(false);
    setSelected(null);
  };

  const statusCounts = {
    All: assignments.length,
    Active: assignments.filter(
      (a) => String(a.status || "").toLowerCase() === "active"
    ).length,
    Returned: assignments.filter(
      (a) => String(a.status || "").toLowerCase() === "returned"
    ).length,
    Overdue: assignments.filter(
      (a) => String(a.status || "").toLowerCase() === "overdue"
    ).length,
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
      {/* =================================================
          HEADER
      ================================================= */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          alignItems: "flex-start",
        }}
      >
        <BackButton to="/admin" />

        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: "#1f2937",
            }}
          >
            Asset Assignments
          </Typography>

          <Typography
            sx={{
              color: "#6b7280",
              mt: 0.5,
            }}
          >
            Monitor which asset was assigned to whom and by whom.
          </Typography>
        </Box>
      </Box>

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
            <Typography color="error">{errorMessage}</Typography>
          </CardContent>
        </Card>
      )}

      {/* =================================================
          STATUS SUMMARY
      ================================================= */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            sm: "repeat(4, 1fr)",
          },
          gap: 2,
          mb: 3,
        }}
      >
        {["All", "Active", "Returned", "Overdue"].map((status) => (
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
                {statusCounts[status] ?? 0}
              </Typography>
            </CardContent>
          </Card>
        ))}
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
              placeholder="Search by employee, asset, or assigned by..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{
                flex: 1,
                minWidth: 240,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Status</InputLabel>

              <Select
                value={statusFilter}
                label="Status"
                onChange={(event) => setStatusFilter(event.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="All">All Statuses</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Returned">Returned</MenuItem>
                <MenuItem value="Overdue">Overdue</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* =================================================
          ASSIGNMENTS TABLE
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
              <CircularProgress sx={{ color: "#07548e" }} />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f8fafc" }}>
                    <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Asset</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Assigned By</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        align="center"
                        sx={{ py: 7, color: "#6b7280" }}
                      >
                        No assignments found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((a) => (
                      <TableRow key={a.assignment_id} hover>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600 }}>
                            {a.employee_name || "-"}
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#6b7280" }}>
                            {a.employee_email || ""}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography sx={{ fontWeight: 600 }}>
                            {a.asset_name || "-"}
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#6b7280" }}>
                            {a.serial_number || ""}
                          </Typography>
                        </TableCell>

                        <TableCell>{a.assigned_by_name || "-"}</TableCell>

                        <TableCell>
                          {a.assignment_date
                            ? new Date(a.assignment_date).toLocaleDateString()
                            : "-"}
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={a.status || "Unknown"}
                            color={getStatusColor(a.status)}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>

                        <TableCell align="center">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ViewIcon />}
                            onClick={() => handleView(a)}
                            sx={{
                              textTransform: "none",
                              borderColor: "#07548e",
                              color: "#07548e",
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
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
          Assignment Details
        </DialogTitle>

        <DialogContent>
          {selected && (
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, mb: 2, color: "#1f2937" }}
              >
                Assignment #{selected.assignment_id}
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
                  <Typography variant="caption" color="text.secondary">
                    Employee
                  </Typography>
                  <Typography>{selected.employee_name || "-"}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Asset
                  </Typography>
                  <Typography>{selected.asset_name || "-"}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Serial Number
                  </Typography>
                  <Typography>{selected.serial_number || "-"}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Assigned By
                  </Typography>
                  <Typography>{selected.assigned_by_name || "-"}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Assignment Date
                  </Typography>
                  <Typography>
                    {selected.assignment_date
                      ? new Date(selected.assignment_date).toLocaleString()
                      : "-"}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Expected Return
                  </Typography>
                  <Typography>
                    {selected.expected_return_date
                      ? new Date(
                          selected.expected_return_date
                        ).toLocaleDateString()
                      : "-"}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={selected.status || "Unknown"}
                      color={getStatusColor(selected.status)}
                      size="small"
                    />
                  </Box>
                </Box>

                <Box
                  sx={{
                    gridColumn: { xs: "auto", sm: "1 / -1" },
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Notes
                  </Typography>
                  <Typography>{selected.notes || "-"}</Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleCloseView}
            sx={{ textTransform: "none" }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminAssignments;
