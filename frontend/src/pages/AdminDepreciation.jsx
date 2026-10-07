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
} from "@mui/icons-material";

import BackButton from "../components/BackButton";
import API from "../services/api";

const AdminDepreciation = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [openView, setOpenView] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchDepreciation = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const token = localStorage.getItem("token");
      if (!token) {
        setRecords([]);
        setErrorMessage("You are not logged in.");
        return;
      }
      const response = await API.get("/depreciation", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      if (Array.isArray(data)) {
        setRecords(data);
      } else if (Array.isArray(data.data)) {
        setRecords(data.data);
      } else {
        setRecords([]);
      }
    } catch (error) {
      console.error("Failed to load depreciation records:", error);
      setRecords([]);
      setErrorMessage(error.response?.data?.error || "Failed to load depreciation records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepreciation();
  }, []);

  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase();
    return records.filter((r) => {
      const asset = String(r.asset_name || "").toLowerCase();
      const serial = String(r.serial_number || "").toLowerCase();
      const method = String(r.method || "").toLowerCase();
      const category = String(r.category_name || "").toLowerCase();
      return asset.includes(text) || serial.includes(text) || method.includes(text) || category.includes(text);
    });
  }, [records, search]);

  const totalDepreciated = records.reduce((sum, r) => sum + (Number(r.total_depreciated) || 0), 0);
  const totalCurrentValue = records.reduce((sum, r) => sum + (Number(r.current_value) || 0), 0);

  const getMethodColor = (method) => {
    if (method === "Straight Line") return "primary";
    return "secondary";
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f5f7fb", p: { xs: 2, sm: 3, md: 4 } }}>
      <Box sx={{ mb: 3, display: "flex", alignItems: "flex-start" }}>
        <BackButton to="/admin" />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#1f2937" }}>Depreciation Records</Typography>
          <Typography sx={{ color: "#6b7280", mt: 0.5 }}>Monitor asset depreciation history and current values.</Typography>
        </Box>
      </Box>

      {errorMessage && (
        <Card elevation={0} sx={{ mb: 3, borderRadius: 2, border: "1px solid #fecaca", backgroundColor: "#fef2f2" }}>
          <CardContent><Typography color="error">{errorMessage}</Typography></CardContent>
        </Card>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)" }, gap: 2, mb: 3 }}>
        <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e5e7eb" }}>
          <CardContent>
            <Typography variant="body2" sx={{ color: "#6b7280", mb: 1 }}>Total Records</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#1f2937" }}>{records.length}</Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e5e7eb" }}>
          <CardContent>
            <Typography variant="body2" sx={{ color: "#6b7280", mb: 1 }}>Total Depreciated</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#dc2626" }}>${totalDepreciated.toLocaleString()}</Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e5e7eb" }}>
          <CardContent>
            <Typography variant="body2" sx={{ color: "#6b7280", mb: 1 }}>Total Current Value</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#16a34a" }}>${totalCurrentValue.toLocaleString()}</Typography>
          </CardContent>
        </Card>
      </Box>

      <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e5e7eb", mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search by asset, serial number, method, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          />
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
                    <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Rate %</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Purchase Cost</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Current Value</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 7, color: "#6b7280" }}>No depreciation records found.</TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((r) => (
                      <TableRow key={r.depreciation_id} hover>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600 }}>{r.asset_name || "-"}</Typography>
                          <Typography variant="body2" sx={{ color: "#6b7280" }}>{r.serial_number || ""}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={r.method || "-"} size="small" color={getMethodColor(r.method)} sx={{ fontWeight: 600 }} />
                        </TableCell>
                        <TableCell>{r.rate_percent || "-"}%</TableCell>
                        <TableCell>${Number(r.purchase_cost || 0).toLocaleString()}</TableCell>
                        <TableCell>${Number(r.current_value || 0).toLocaleString()}</TableCell>
                        <TableCell>{r.calculated_at ? new Date(r.calculated_at).toLocaleDateString() : "-"}</TableCell>
                        <TableCell align="center">
                          <Button size="small" variant="outlined" startIcon={<ViewIcon />}
                            onClick={() => { setSelected(r); setOpenView(true); }}
                            sx={{ textTransform: "none", borderColor: "#07548e", color: "#07548e" }}>View</Button>
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
        <DialogTitle sx={{ fontWeight: 800 }}>Depreciation Details</DialogTitle>
        <DialogContent>
          {selected && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: "#1f2937" }}>Record #{selected.depreciation_id}</Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <Box><Typography variant="caption" color="text.secondary">Asset</Typography><Typography>{selected.asset_name || "-"}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Serial Number</Typography><Typography>{selected.serial_number || "-"}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Method</Typography><Typography>{selected.method || "-"}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Useful Life (Years)</Typography><Typography>{selected.useful_life_years || "-"}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Rate (%)</Typography><Typography>{selected.rate_percent || "-"}%</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Purchase Cost</Typography><Typography>${Number(selected.purchase_cost || 0).toLocaleString()}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Current Value</Typography><Typography>${Number(selected.current_value || 0).toLocaleString()}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Total Depreciated</Typography><Typography>${Number(selected.total_depreciated || 0).toLocaleString()}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Date</Typography><Typography>{selected.calculated_at ? new Date(selected.calculated_at).toLocaleString() : "-"}</Typography></Box>
                <Box sx={{ gridColumn: { xs: "auto", sm: "1 / -1" } }}><Typography variant="caption" color="text.secondary">Notes</Typography><Typography>{selected.notes || "-"}</Typography></Box>
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

export default AdminDepreciation;
