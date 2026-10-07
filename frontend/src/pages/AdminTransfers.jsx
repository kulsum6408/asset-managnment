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
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";

import BackButton from "../components/BackButton";
import API from "../services/api";

const AdminTransfers = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [openView, setOpenView] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const token = localStorage.getItem("token");
      if (!token) {
        setTransfers([]);
        setErrorMessage("You are not logged in.");
        return;
      }
      const response = await API.get("/transfers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      if (Array.isArray(data)) {
        setTransfers(data);
      } else if (Array.isArray(data.data)) {
        setTransfers(data.data);
      } else {
        setTransfers([]);
      }
    } catch (error) {
      console.error("Failed to load transfers:", error);
      setTransfers([]);
      setErrorMessage(error.response?.data?.error || "Failed to load transfers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase();
    return transfers.filter((t) => {
      const matchesSearch =
        !text ||
        String(t.asset_name || "").toLowerCase().includes(text) ||
        String(t.serial_number || "").toLowerCase().includes(text) ||
        String(t.from_user_name || "").toLowerCase().includes(text) ||
        String(t.to_user_name || "").toLowerCase().includes(text);
      const matchesStatus = !statusFilter || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [transfers, search, statusFilter]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending": return "warning";
      case "Approved": return "info";
      case "Rejected": return "error";
      case "Completed": return "success";
      default: return "default";
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f5f7fb", p: { xs: 2, sm: 3, md: 4 } }}>
      <Box sx={{ mb: 3, display: "flex", alignItems: "flex-start" }}>
        <BackButton to="/admin" />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#1f2937" }}>Asset Transfers</Typography>
          <Typography sx={{ color: "#6b7280", mt: 0.5 }}>Monitor transfer requests and their approval status.</Typography>
        </Box>
      </Box>

      {errorMessage && (
        <Card elevation={0} sx={{ mb: 3, borderRadius: 2, border: "1px solid #fecaca", backgroundColor: "#fef2f2" }}>
          <CardContent><Typography color="error">{errorMessage}</Typography></CardContent>
        </Card>
      )}

      <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e5e7eb", mb: 3 }}>
        <CardContent sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          <TextField
            sx={{ flex: 1, minWidth: 250, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            placeholder="Search by asset, serial number, or employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          />
          <FormControl sx={{ minWidth: 160 }} size="small">
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={statusFilter}
              label="Status Filter"
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Approved">Approved</MenuItem>
              <MenuItem value="Rejected">Rejected</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e5e7eb", backgroundColor: "#ffffff" }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress sx={{ color: "#07548e" }} /></Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f8fafc" }}>
                    <TableCell sx={{ fontWeight: 700 }}>Asset</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Serial Number</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>From Employee</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>To Employee</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>From Location</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>To Location</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Approved By</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 7, color: "#6b7280" }}>No transfers found.</TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((t) => (
                      <TableRow key={t.transfer_id} hover>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600 }}>{t.asset_name || "-"}</Typography>
                        </TableCell>
                        <TableCell>{t.serial_number || "-"}</TableCell>
                        <TableCell>{t.from_user_name || "-"}</TableCell>
                        <TableCell>{t.to_user_name || "-"}</TableCell>
                        <TableCell>{t.from_location || "-"}</TableCell>
                        <TableCell>{t.to_location || "-"}</TableCell>
                        <TableCell>{t.transfer_date ? new Date(t.transfer_date).toLocaleDateString() : "-"}</TableCell>
                        <TableCell>
                          <Chip
                            label={t.status || "Pending"}
                            size="small"
                            color={getStatusColor(t.status)}
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell>{t.approved_by_name || "-"}</TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ViewIcon />}
                            onClick={() => { setSelected(t); setOpenView(true); }}
                            sx={{ textTransform: "none", borderColor: "#07548e", color: "#07548e" }}
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

      <Dialog open={openView} onClose={() => { setOpenView(false); setSelected(null); }} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Transfer Details</DialogTitle>
        <DialogContent>
          {selected && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: "#1f2937" }}>
                Transfer #{selected.transfer_id}
                <Chip
                  label={selected.status}
                  size="small"
                  color={getStatusColor(selected.status)}
                  sx={{ ml: 1, fontWeight: 700 }}
                />
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <Box><Typography variant="caption" color="text.secondary">Asset</Typography><Typography fontWeight={600}>{selected.asset_name || "-"}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Serial Number</Typography><Typography>{selected.serial_number || "-"}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">From Employee</Typography><Typography>{selected.from_user_name || "Unassigned"}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">To Employee</Typography><Typography>{selected.to_user_name || "N/A"}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">From Location</Typography><Typography>{selected.from_location || "-"}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">To Location</Typography><Typography>{selected.to_location || "-"}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Requested By</Typography><Typography>{selected.transferred_by_name || "-"}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Transfer Date</Typography><Typography>{selected.transfer_date ? new Date(selected.transfer_date).toLocaleString() : "-"}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Approved By</Typography><Typography>{selected.approved_by_name || "Pending"}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Approved At</Typography><Typography>{selected.approved_at ? new Date(selected.approved_at).toLocaleString() : "-"}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Completed At</Typography><Typography>{selected.completed_at ? new Date(selected.completed_at).toLocaleString() : "-"}</Typography></Box>
                <Box sx={{ gridColumn: { xs: "auto", sm: "1 / -1" } }}><Typography variant="caption" color="text.secondary">Reason</Typography><Typography>{selected.reason || "-"}</Typography></Box>
                <Box sx={{ gridColumn: { xs: "auto", sm: "1 / -1" } }}><Typography variant="caption" color="text.secondary">Notes</Typography><Typography>{selected.notes || "-"}</Typography></Box>
                {selected.rejection_reason && (
                  <Box sx={{ gridColumn: { xs: "auto", sm: "1 / -1" } }}>
                    <Typography variant="caption" color="error">Rejection Reason</Typography>
                    <Typography color="error">{selected.rejection_reason}</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => { setOpenView(false); setSelected(null); }} sx={{ textTransform: "none" }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminTransfers;
