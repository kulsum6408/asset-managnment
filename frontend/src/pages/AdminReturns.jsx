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

const AdminReturns = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [openView, setOpenView] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchReturns = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const token = localStorage.getItem("token");
      if (!token) {
        setReturns([]);
        setErrorMessage("You are not logged in.");
        return;
      }
      const response = await API.get("/returns", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      if (Array.isArray(data)) {
        setReturns(data);
      } else if (Array.isArray(data.data)) {
        setReturns(data.data);
      } else {
        setReturns([]);
      }
    } catch (error) {
      console.error("Failed to load returns:", error);
      setReturns([]);
      setErrorMessage(error.response?.data?.error || "Failed to load returns.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase();
    return returns.filter((r) => {
      const asset = String(r.asset_name || "").toLowerCase();
      const serial = String(r.serial_number || "").toLowerCase();
      const employee = String(r.employee_name || "").toLowerCase();
      return asset.includes(text) || serial.includes(text) || employee.includes(text);
    });
  }, [returns, search]);

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f5f7fb", p: { xs: 2, sm: 3, md: 4 } }}>
      <Box sx={{ mb: 3, display: "flex", alignItems: "flex-start" }}>
        <BackButton to="/admin" />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#1f2937" }}>Asset Returns</Typography>
          <Typography sx={{ color: "#6b7280", mt: 0.5 }}>Monitor which assets were returned and by whom.</Typography>
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
            placeholder="Search by asset, serial number, or employee..."
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
                    <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Condition</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Received By</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 7, color: "#6b7280" }}>No return records found.</TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((r) => (
                      <TableRow key={r.return_id} hover>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600 }}>{r.asset_name || "-"}</Typography>
                          <Typography variant="body2" sx={{ color: "#6b7280" }}>{r.serial_number || ""}</Typography>
                        </TableCell>
                        <TableCell>{r.employee_name || "-"}</TableCell>
                        <TableCell>
                          <Chip label={r.asset_condition || "-"} size="small"
                            color={r.asset_condition === "New" || r.asset_condition === "Good" ? "success" : "warning"} sx={{ fontWeight: 600 }} />
                        </TableCell>
                        <TableCell>{r.return_date ? new Date(r.return_date).toLocaleDateString() : "-"}</TableCell>
                        <TableCell>{r.received_by_name || "-"}</TableCell>
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
        <DialogTitle sx={{ fontWeight: 800 }}>Return Details</DialogTitle>
        <DialogContent>
          {selected && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: "#1f2937" }}>Return #{selected.return_id}</Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <Box><Typography variant="caption" color="text.secondary">Asset</Typography><Typography>{selected.asset_name || "-"}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Serial Number</Typography><Typography>{selected.serial_number || "-"}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Employee</Typography><Typography>{selected.employee_name || "-"}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Received By</Typography><Typography>{selected.received_by_name || "-"}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Return Date</Typography><Typography>{selected.return_date ? new Date(selected.return_date).toLocaleString() : "-"}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Asset Condition</Typography><Typography>{selected.asset_condition || "-"}</Typography></Box>
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

export default AdminReturns;
