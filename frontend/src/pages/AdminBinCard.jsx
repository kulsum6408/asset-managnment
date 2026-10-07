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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";

import BackButton from "../components/BackButton";
import API from "../services/api";

const AdminBinCard = () => {
  const [transactions, setTransactions] = useState([]);
  const [stockSummary, setStockSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [openView, setOpenView] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const token = localStorage.getItem("token");
      if (!token) {
        setTransactions([]);
        setErrorMessage("You are not logged in.");
        return;
      }
      const response = await API.get("/bin-card", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      if (Array.isArray(data)) {
        setTransactions(data);
      } else if (Array.isArray(data.data)) {
        setTransactions(data.data);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error("Failed to load bin card:", error);
      setTransactions([]);
      setErrorMessage(error.response?.data?.error || "Failed to load bin card records.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStockSummary = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await API.get("/inventory/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStockSummary(response.data);
    } catch (error) {
      console.error("Failed to load stock summary:", error);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchStockSummary();
  }, []);

  const normType = (type) => String(type || "").trim().toUpperCase();

  const typeMatches = (transaction, label) => {
    const t = normType(transaction.transaction_type);
    switch (label) {
      case "All":
        return true;
      case "Receipt":
        return t === "RECEIPT" || t === "RECEIVED" || t === "STOCK IN";
      case "Issue":
        return ["OUT", "ISSUE", "ISSUED", "STOCK OUT", "DISPOSAL", "DISPOSED", "LOST", "ADJUSTMENT OUT"].includes(t);
      case "Transfer":
        return t === "TRANSFER" || t === "TRANSFERRED";
      case "Return":
        return ["IN", "RETURN", "RETURNED", "ISSUE RETURN", "MAINTENANCE RETURN", "MAINTENANCE IN", "ADJUSTMENT IN"].includes(t);
      default:
        return true;
    }
  };

  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase();
    return transactions.filter((t) => {
      const asset = String(t.asset_name || "").toLowerCase();
      const serial = String(t.serial_number || "").toLowerCase();
      const type = String(t.transaction_type || "").toLowerCase();
      const matchesSearch = asset.includes(text) || serial.includes(text) || type.includes(text);
      const matchesType = typeFilter === "All" || typeMatches(t, typeFilter);
      return matchesSearch && matchesType;
    });
  }, [transactions, search, typeFilter]);

  const typeCounts = {
    All: transactions.length,
    Receipt: transactions.filter((t) => typeMatches(t, "Receipt")).length,
    Issue: transactions.filter((t) => typeMatches(t, "Issue")).length,
    Transfer: transactions.filter((t) => typeMatches(t, "Transfer")).length,
    Return: transactions.filter((t) => typeMatches(t, "Return")).length,
  };

  const categories = Array.isArray(stockSummary?.categories_summary)
    ? stockSummary.categories_summary
    : [];

  const categoryTotals = categories.reduce(
    (acc, c) => ({
      total: acc.total + (Number(c.total_count) || 0),
      assigned: acc.assigned + (Number(c.assigned_count) || 0),
      available: acc.available + (Number(c.available_count) || 0),
    }),
    { total: 0, assigned: 0, available: 0 }
  );

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f5f7fb", p: { xs: 2, sm: 3, md: 4 } }}>
      <Box sx={{ mb: 3, display: "flex", alignItems: "flex-start" }}>
        <BackButton to="/admin" />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#1f2937" }}>Bin Card Transactions</Typography>
          <Typography sx={{ color: "#6b7280", mt: 0.5 }}>Monitor all stock movements and transactions.</Typography>
        </Box>
      </Box>

      {errorMessage && (
        <Card elevation={0} sx={{ mb: 3, borderRadius: 2, border: "1px solid #fecaca", backgroundColor: "#fef2f2" }}>
          <CardContent><Typography color="error">{errorMessage}</Typography></CardContent>
        </Card>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
        {["All", "Receipt", "Issue", "Return"].map((type) => (
          <Card key={type} onClick={() => setTypeFilter(type)} elevation={0}
            sx={{ cursor: "pointer", borderRadius: 3, border: typeFilter === type ? "2px solid #07548e" : "1px solid #e5e7eb", backgroundColor: "#ffffff" }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: "#6b7280", mb: 1 }}>{type}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#1f2937" }}>{typeCounts[type] ?? 0}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e5e7eb", mb: 3, backgroundColor: "#ffffff" }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#1f2937" }}>Stock by Category</Typography>
            <Typography variant="body2" sx={{ color: "#6b7280" }}>Computed from actual asset lifecycle records</Typography>
          </Box>
          {stockSummary ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f8fafc" }}>
                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Total Registered</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Assigned</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Available (Stock)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow><TableCell colSpan={4} align="center" sx={{ color: "#6b7280" }}>No stock data available.</TableCell></TableRow>
                  ) : (
                    <>
                      {categories.map((c) => (
                        <TableRow key={c.category_id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{c.category_name}</TableCell>
                          <TableCell align="center">{c.total_count}</TableCell>
                          <TableCell align="center">{c.assigned_count}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={c.available_count}
                              size="small"
                              color={Number(c.available_count) > 0 ? "success" : "default"}
                              sx={{ fontWeight: 700 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow sx={{ backgroundColor: "#f8fafc" }}>
                        <TableCell sx={{ fontWeight: 800 }}>Total</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 800 }}>{categoryTotals.total}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 800 }}>{categoryTotals.assigned}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 800 }}>{categoryTotals.available}</TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary">Loading stock summary...</Typography>
          )}
        </CardContent>
      </Card>

      <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e5e7eb", mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField fullWidth placeholder="Search by asset, serial number, or type..." value={search} onChange={(e) => setSearch(e.target.value)}
              sx={{ flex: 1, minWidth: 240, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Transaction Type</InputLabel>
              <Select value={typeFilter} label="Transaction Type" onChange={(e) => setTypeFilter(e.target.value)} sx={{ borderRadius: 2 }}>
                <MenuItem value="All">All Types</MenuItem>
                <MenuItem value="Receipt">Receipt</MenuItem>
                <MenuItem value="Issue">Issue</MenuItem>
                <MenuItem value="Transfer">Transfer</MenuItem>
                <MenuItem value="Return">Return</MenuItem>
              </Select>
            </FormControl>
          </Box>
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
                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Qty</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Receipt #</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 7, color: "#6b7280" }}>No transactions found.</TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((t) => (
                      <TableRow key={t.transaction_id} hover>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600 }}>{t.asset_name || "-"}</Typography>
                          <Typography variant="body2" sx={{ color: "#6b7280" }}>{t.serial_number || ""}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={t.transaction_type || "-"} size="small"
                            color={t.transaction_type === "Receipt" ? "success" : t.transaction_type === "Issue" ? "error" : "primary"} sx={{ fontWeight: 600 }} />
                        </TableCell>
                        <TableCell>{t.quantity || "-"}</TableCell>
                        <TableCell>{t.transaction_date ? new Date(t.transaction_date).toLocaleDateString() : "-"}</TableCell>
                        <TableCell>{t.receipt_number || "-"}</TableCell>
                        <TableCell align="center">
                          <Button size="small" variant="outlined" startIcon={<ViewIcon />}
                            onClick={() => { setSelected(t); setOpenView(true); }}
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
        <DialogTitle sx={{ fontWeight: 800 }}>Transaction Details</DialogTitle>
        <DialogContent>
          {selected && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: "#1f2937" }}>Transaction #{selected.transaction_id}</Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <Box><Typography variant="caption" color="text.secondary">Asset</Typography><Typography>{selected.asset_name || "-"}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Serial Number</Typography><Typography>{selected.serial_number || "-"}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Transaction Type</Typography><Typography>{selected.transaction_type || "-"}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Quantity</Typography><Typography>{selected.quantity || "-"}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Date</Typography><Typography>{selected.transaction_date ? new Date(selected.transaction_date).toLocaleString() : "-"}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Receipt Number</Typography><Typography>{selected.receipt_number || "-"}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Reference Type</Typography><Typography>{selected.reference_type || "-"}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Reference ID</Typography><Typography>{selected.reference_id || "-"}</Typography></Box>
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

export default AdminBinCard;
