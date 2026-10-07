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
} from "@mui/material";
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";

import BackButton from "../components/BackButton";
import API from "../services/api";

const AdminDisposal = () => {
  const [disposals, setDisposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [openView, setOpenView] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchDisposals = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const token = localStorage.getItem("token");
      if (!token) {
        setDisposals([]);
        setErrorMessage("You are not logged in.");
        return;
      }
      const response = await API.get("/disposals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      if (Array.isArray(data)) {
        setDisposals(data);
      } else if (Array.isArray(data.data)) {
        setDisposals(data.data);
      } else {
        setDisposals([]);
      }
    } catch (error) {
      console.error("Failed to load disposals:", error);
      setDisposals([]);
      setErrorMessage(
        error.response?.data?.error ||
          "Failed to load disposal records."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisposals();
  }, []);

  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase();
    return disposals.filter((d) => {
      const asset = String(d.asset_name || "").toLowerCase();
      const serial = String(d.serial_number || "").toLowerCase();
      const reason = String(d.reason || "").toLowerCase();
      return asset.includes(text) || serial.includes(text) || reason.includes(text);
    });
  }, [disposals, search]);

  const handleView = (item) => {
    setSelected(item);
    setOpenView(true);
  };

  const getStatusColor = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "pending":
        return "warning";
      case "approved":
        return "info";
      case "rejected":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f5f7fb", p: { xs: 2, sm: 3, md: 4 } }}>
      <Box sx={{ mb: 3, display: "flex", alignItems: "flex-start" }}>
        <BackButton to="/admin" />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#1f2937" }}>
            Asset Disposals
          </Typography>
          <Typography sx={{ color: "#6b7280", mt: 0.5 }}>
            Monitor which assets were disposed and the reasons.
          </Typography>
        </Box>
      </Box>

      {errorMessage && (
        <Card elevation={0} sx={{ mb: 3, borderRadius: 2, border: "1px solid #fecaca", backgroundColor: "#fef2f2" }}>
          <CardContent><Typography color="error">{errorMessage}</Typography></CardContent>
        </Card>
      )}

      <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e5e7eb", mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search by asset, serial number, or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
            }}
          />
        </CardContent>
      </Card>

      <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e5e7eb", backgroundColor: "#ffffff" }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress sx={{ color: "#07548e" }} />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f8fafc" }}>
                    <TableCell sx={{ fontWeight: 700 }}>Asset</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Serial No.</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 7, color: "#6b7280" }}>
                        No disposal records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((d) => (
                      <TableRow key={d.disposal_id} hover>
                        <TableCell><Typography sx={{ fontWeight: 600 }}>{d.asset_name || "-"}</Typography></TableCell>
                        <TableCell>{d.serial_number || "-"}</TableCell>
                        <TableCell sx={{ maxWidth: 300 }}>{d.reason || "-"}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={d.status || "Pending"}
                            color={getStatusColor(d.status)}
                          />
                        </TableCell>
                        <TableCell>{d.disposal_date ? new Date(d.disposal_date).toLocaleDateString() : "-"}</TableCell>
                        <TableCell align="center">
                          <Button size="small" variant="outlined" startIcon={<ViewIcon />} onClick={() => handleView(d)}
                            sx={{ textTransform: "none", borderColor: "#07548e", color: "#07548e" }}>
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
        <DialogTitle sx={{ fontWeight: 800 }}>Disposal Details</DialogTitle>
        <DialogContent>
          {selected && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: "#1f2937" }}>
                Disposal #{selected.disposal_id}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Asset</Typography>
                  <Typography>{selected.asset_name || "-"}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Serial Number</Typography>
                  <Typography>{selected.serial_number || "-"}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Disposal Date</Typography>
                  <Typography>{selected.disposal_date ? new Date(selected.disposal_date).toLocaleString() : "-"}</Typography>
                </Box>
                <Box sx={{ gridColumn: { xs: "auto", sm: "1 / -1" } }}>
                  <Typography variant="caption" color="text.secondary">Reason</Typography>
                  <Typography>{selected.reason || "-"}</Typography>
                </Box>
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

export default AdminDisposal;
