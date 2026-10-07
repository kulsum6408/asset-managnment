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

const AdminInventoryCheck = () => {
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [openView, setOpenView] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchChecks = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const token = localStorage.getItem("token");
      if (!token) {
        setChecks([]);
        setErrorMessage("You are not logged in.");
        return;
      }
      const response = await API.get("/inventory-checks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      if (Array.isArray(data)) {
        setChecks(data);
      } else if (Array.isArray(data.data)) {
        setChecks(data.data);
      } else {
        setChecks([]);
      }
    } catch (error) {
      console.error("Failed to load inventory checks:", error);
      setChecks([]);
      setErrorMessage(error.response?.data?.error || "Failed to load inventory checks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChecks();
  }, []);

  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase();
    return checks.filter((c) => {
      const asset = String(c.asset_name || "").toLowerCase();
      const serial = String(c.serial_number || "").toLowerCase();
      const checkedBy = String(c.checked_by_name || "").toLowerCase();
      return asset.includes(text) || serial.includes(text) || checkedBy.includes(text);
    });
  }, [checks, search]);

  const discrepancyCount = filtered.filter((c) => c.discrepancy === true || String(c.discrepancy) === "true" || c.status === "Mismatch").length;

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f5f7fb", p: { xs: 2, sm: 3, md: 4 } }}>
      <Box sx={{ mb: 3, display: "flex", alignItems: "flex-start" }}>
        <BackButton to="/admin" />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#1f2937" }}>Inventory Checks</Typography>
          <Typography sx={{ color: "#6b7280", mt: 0.5 }}>Monitor inventory audit records and discrepancies.</Typography>
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
            <Typography variant="body2" sx={{ color: "#6b7280", mb: 1 }}>Total Checks</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#1f2937" }}>{checks.length}</Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e5e7eb" }}>
          <CardContent>
            <Typography variant="body2" sx={{ color: "#6b7280", mb: 1 }}>Matched</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#16a34a" }}>{checks.length - discrepancyCount}</Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e5e7eb" }}>
          <CardContent>
            <Typography variant="body2" sx={{ color: "#6b7280", mb: 1 }}>Discrepancies</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#dc2626" }}>{discrepancyCount}</Typography>
          </CardContent>
        </Card>
      </Box>

      <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e5e7eb", mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search by asset, serial number, or checker..."
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
                    <TableCell sx={{ fontWeight: 700 }}>System Qty</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Physical Qty</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Checked By</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 7, color: "#6b7280" }}>No inventory check records found.</TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((c) => (
                      <TableRow key={c.check_id || c.id} hover>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600 }}>{c.asset_name || "-"}</Typography>
                          <Typography variant="body2" sx={{ color: "#6b7280" }}>{c.serial_number || ""}</Typography>
                        </TableCell>
                        <TableCell>{c.system_quantity ?? c.expected_quantity ?? "-"}</TableCell>
                        <TableCell>{c.physical_quantity ?? c.actual_quantity ?? "-"}</TableCell>
                        <TableCell>
                          <Chip
                            label={c.discrepancy === true || String(c.discrepancy) === "true" || c.status === "Mismatch" ? "Discrepancy" : "Matched"}
                            size="small"
                            color={c.discrepancy === true || String(c.discrepancy) === "true" || c.status === "Mismatch" ? "error" : "success"}
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell>{c.checked_by_name || "-"}</TableCell>
                        <TableCell>{c.check_date ? new Date(c.check_date).toLocaleDateString() : c.created_at ? new Date(c.created_at).toLocaleDateString() : "-"}</TableCell>
                        <TableCell align="center">
                          <Button size="small" variant="outlined" startIcon={<ViewIcon />}
                            onClick={() => { setSelected(c); setOpenView(true); }}
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
        <DialogTitle sx={{ fontWeight: 800 }}>Inventory Check Details</DialogTitle>
        <DialogContent>
          {selected && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: "#1f2937" }}>Check #{selected.check_id || selected.id}</Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <Box><Typography variant="caption" color="text.secondary">Asset</Typography><Typography>{selected.asset_name || "-"}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Serial Number</Typography><Typography>{selected.serial_number || "-"}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">System Quantity</Typography><Typography>{selected.system_quantity ?? selected.expected_quantity ?? "-"}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Physical Quantity</Typography><Typography>{selected.physical_quantity ?? selected.actual_quantity ?? "-"}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Status</Typography><Typography>{selected.discrepancy === true || String(selected.discrepancy) === "true" ? "Discrepancy" : "Matched"}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Checked By</Typography><Typography>{selected.checked_by_name || "-"}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Date</Typography><Typography>{selected.check_date ? new Date(selected.check_date).toLocaleString() : selected.created_at ? new Date(selected.created_at).toLocaleString() : "-"}</Typography></Box>
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

export default AdminInventoryCheck;
