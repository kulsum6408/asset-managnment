import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  Grid,
  Avatar,
  MenuItem,
} from "@mui/material";

import {
  Inventory2 as BinCardIcon,
  Refresh as RefreshIcon,
  ArrowUpward as InIcon,
  ArrowDownward as OutIcon,
  Layers as BalanceIcon,
  Category as CategoryIcon,
} from "@mui/icons-material";

import API from "../services/api";
import BackButton from "../components/BackButton";

const IN_TYPES = [
  "RECEIPT",
  "IN",
  "STOCK IN",
  "RECEIVED",
  "ISSUE RETURN",
  "RETURN",
  "RETURNED",
  "ADJUSTMENT IN",
];

const isInType = (type) =>
  IN_TYPES.includes(
    String(type || "")
      .toUpperCase()
      .trim()
  );

const isOutType = (type) => {
  const normalized = String(type || "")
    .toUpperCase()
    .trim();

  const OUT_TYPES = [
    "ISSUE",
    "OUT",
    "STOCK OUT",
    "ISSUED",
    "TRANSFER",
    "TRANSFERRED",
    "DISPOSAL",
    "DISPOSED",
    "LOST",
    "ADJUSTMENT OUT",
  ];

  return OUT_TYPES.includes(normalized);
};

const AssetOfficerBinCard = () => {
  const [transactions, setTransactions] = useState([]);
  const [stockSummary, setStockSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const loadBinCards = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/bin-card");

      const data = response.data;

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.bin_cards)
        ? data.bin_cards
        : [];

      setTransactions(list);
    } catch (err) {
      console.error("Bin Card error:", err);

      setError(
        err.response?.data?.error ||
          "Unable to load Bin Card transactions."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadStockSummary = async () => {
    try {
      const response = await API.get("/inventory/summary");
      setStockSummary(response.data);
    } catch (err) {
      console.error("Stock summary error:", err);
    }
  };

  useEffect(() => {
    loadBinCards();
    loadStockSummary();
  }, []);

  // =====================================================
  // SUMMARY
  // =====================================================

  const summary = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;

    transactions.forEach((transaction) => {
      // Accept both signed and unsigned quantities; a movement's direction
      // is decided by its type, so the magnitude is what counts.
      const magnitude = Math.abs(Number(transaction.quantity) || 0);

      if (isInType(transaction.transaction_type)) {
        totalIn += magnitude;
      } else if (
        isOutType(transaction.transaction_type)
      ) {
        totalOut += magnitude;
      }
    });

    return {
      totalTransactions: transactions.length,
      totalIn,
      totalOut,
      totalBalance: totalIn - totalOut,
      uniqueAssets: new Set(
        transactions.map(
          (transaction) =>
            transaction.asset_id
        )
      ).size,
    };
  }, [transactions]);

  // =====================================================
  // RUNNING BALANCE PER ASSET
  // =====================================================

  const transactionsWithBalance = useMemo(() => {
    const ordered = [...transactions].sort(
      (a, b) =>
        new Date(a.transaction_date) -
        new Date(b.transaction_date)
    );

    const balanceByAsset = {};

    const enriched = ordered.map((transaction) => {
      const assetId = transaction.asset_id;
      // Use magnitude: direction is decided by the transaction type, not the
      // stored sign (assignment ISSUE records -1, disposal records +1, ...).
      const magnitude =
        Math.abs(Number(transaction.quantity) || 0);

      const balanceBefore =
        balanceByAsset[assetId] || 0;

      let balanceAfter = balanceBefore;

      if (
        isInType(transaction.transaction_type)
      ) {
        balanceAfter = balanceBefore + magnitude;
      } else if (
        isOutType(transaction.transaction_type)
      ) {
        balanceAfter = balanceBefore - magnitude;
      }

      balanceByAsset[assetId] = balanceAfter;

      return {
        ...transaction,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
      };
    });

    return enriched.sort(
      (a, b) =>
        new Date(b.transaction_date) -
        new Date(a.transaction_date)
    );
  }, [transactions]);

  // =====================================================
  // FILTERING
  // =====================================================

  const filteredTransactions = transactionsWithBalance.filter(
    (transaction) => {
      const searchText = search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        String(transaction.asset_name || "")
          .toLowerCase()
          .includes(searchText) ||
        String(transaction.serial_number || "")
          .toLowerCase()
          .includes(searchText) ||
        String(transaction.receipt_number || "")
          .toLowerCase()
          .includes(searchText);

      const matchesType =
        typeFilter === "All" ||
        String(transaction.transaction_type || "")
          .toUpperCase()
          .trim() === typeFilter.toUpperCase();

      return matchesSearch && matchesType;
    }
  );

  const getTypeColor = (type) => {
    if (isInType(type)) {
      return "success";
    }

    if (isOutType(type)) {
      return "error";
    }

    return "default";
  };

  const getReceiptType = (type) =>
    isInType(type) ? "In" : "Out";

  const availableTypes = useMemo(() => {
    return [
      ...new Set(
        transactions.map((transaction) =>
          String(transaction.transaction_type || "")
            .toUpperCase()
            .trim()
        )
      ),
    ].sort();
  }, [transactions]);

  const categories = Array.isArray(
    stockSummary?.categories_summary
  )
    ? stockSummary.categories_summary
    : [];

  const categoryTotals = categories.reduce(
    (totals, c) => ({
      total:
        totals.total +
        (Number(c.total_count) || 0),
      assigned:
        totals.assigned +
        (Number(c.assigned_count) || 0),
      available:
        totals.available +
        (Number(c.available_count) || 0),
    }),
    { total: 0, assigned: 0, available: 0 }
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* HEADER */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <BackButton to="/asset-officer" />

          <Box>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
            >
              <BinCardIcon color="primary" />

              <Typography variant="h4" fontWeight="bold">
                Bin Card — Store Ledger
              </Typography>
            </Stack>

            <Typography
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              Professional asset movement and stock
              transaction history
            </Typography>
          </Box>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadBinCards}
          disabled={loading}
        >
          Refresh
        </Button>
      </Stack>

      {/* ERROR */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* STOCK BY CATEGORY */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          mb: 3,
        }}
      >
        <CardContent>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
            sx={{ mb: 2, flexWrap: "wrap" }}
          >
            <Typography
              variant="h6"
              fontWeight={800}
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <BalanceIcon color="primary" />
              Stock by Category
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Computed from actual asset lifecycle records
            </Typography>
          </Stack>

          {stockSummary ? (
            <TableContainer component={Paper} elevation={0}>
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
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ color: "#6b7280" }}>
                        No stock data available.
                      </TableCell>
                    </TableRow>
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
            <Typography color="text.secondary">
              Loading stock summary...
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* LOADING */}
      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            py: 8,
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* ================================================
              SUMMARY CARDS
          ================================================ */}

          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: "1px solid #e5e7eb",
                }}
              >
                <CardContent
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Avatar
                    sx={{
                      backgroundColor: "#e8f2fa",
                      color: "#07548e",
                      width: 48,
                      height: 48,
                    }}
                  >
                    <CategoryIcon />
                  </Avatar>
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight={600}
                    >
                      Total Transactions
                    </Typography>
                    <Typography
                      variant="h4"
                      fontWeight={800}
                    >
                      {summary.totalTransactions}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: "1px solid #e5e7eb",
                }}
              >
                <CardContent
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Avatar
                    sx={{
                      backgroundColor: "#edf7ed",
                      color: "#2e7d32",
                      width: 48,
                      height: 48,
                    }}
                  >
                    <InIcon />
                  </Avatar>
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight={600}
                    >
                      Total In (Receipts)
                    </Typography>
                    <Typography
                      variant="h4"
                      fontWeight={800}
                      color="#2e7d32"
                    >
                      {summary.totalIn}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: "1px solid #e5e7eb",
                }}
              >
                <CardContent
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Avatar
                    sx={{
                      backgroundColor: "#fdeaea",
                      color: "#c62828",
                      width: 48,
                      height: 48,
                    }}
                  >
                    <OutIcon />
                  </Avatar>
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight={600}
                    >
                      Total Out (Issues)
                    </Typography>
                    <Typography
                      variant="h4"
                      fontWeight={800}
                      color="#c62828"
                    >
                      {summary.totalOut}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: "1px solid #e5e7eb",
                }}
              >
                <CardContent
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Avatar
                    sx={{
                      backgroundColor: "#fff4e5",
                      color: "#ed6c02",
                      width: 48,
                      height: 48,
                    }}
                  >
                    <BalanceIcon />
                  </Avatar>
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight={600}
                    >
                      Assets Tracked
                    </Typography>
                    <Typography
                      variant="h4"
                      fontWeight={800}
                      color="#ed6c02"
                    >
                      {summary.uniqueAssets}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* ================================================
              FILTERS
          ================================================ */}

          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid #e5e7eb",
              mb: 3,
            }}
          >
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={7}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search by asset name, serial number or receipt number..."
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                  />
                </Grid>

                <Grid item xs={12} md={5}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Transaction Type"
                    value={typeFilter}
                    onChange={(event) =>
                      setTypeFilter(event.target.value)
                    }
                  >
                    <MenuItem value="All">
                      All Types
                    </MenuItem>

                    {availableTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* ================================================
              LEDGER TABLE
          ================================================ */}

          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid #e5e7eb",
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{ mb: 2 }}
              >
                Store Ledger Transactions
              </Typography>

              {filteredTransactions.length === 0 ? (
                <Alert severity="info">
                  No Bin Card transactions match your
                  filters.
                </Alert>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <strong>Date &amp; Time</strong>
                        </TableCell>

                        <TableCell>
                          <strong>Asset</strong>
                        </TableCell>

                        <TableCell>
                          <strong>Serial Number</strong>
                        </TableCell>

                        <TableCell>
                          <strong>Transaction</strong>
                        </TableCell>

                        <TableCell>
                          <strong>Quantity</strong>
                        </TableCell>

                        <TableCell>
                          <strong>Running Balance</strong>
                        </TableCell>

                        <TableCell>
                          <strong>Receipt / Reference</strong>
                        </TableCell>

                        <TableCell>
                          <strong>Employee</strong>
                        </TableCell>

                        <TableCell>
                          <strong>Performed By</strong>
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {filteredTransactions.map(
                        (transaction) => (
                          <TableRow
                            key={
                              transaction.transaction_id
                            }
                            hover
                          >
                            <TableCell>
                              {transaction.transaction_date
                                ? new Date(
                                    transaction.transaction_date
                                  ).toLocaleString()
                                : "-"}
                            </TableCell>

                            <TableCell sx={{ fontWeight: 600 }}>
                              {transaction.asset_name ||
                                "-"}
                            </TableCell>

                            <TableCell>
                              {transaction.serial_number ||
                                "-"}
                            </TableCell>

                            <TableCell>
                              <Chip
                                label={
                                  transaction.transaction_type ||
                                  "-"
                                }
                                size="small"
                                color={getTypeColor(
                                  transaction.transaction_type
                                )}
                                variant="filled"
                                sx={{ fontWeight: 700 }}
                              />
                            </TableCell>

                            <TableCell>
                              <Chip
                                label={`${
                                  getReceiptType(
                                    transaction.transaction_type
                                  ) === "In"
                                    ? "+"
                                    : "-"
                                }${
                                  transaction.quantity ?? 0
                                }`}
                                size="small"
                                color={getTypeColor(
                                  transaction.transaction_type
                                )}
                                variant="outlined"
                                sx={{
                                  fontWeight: 700,
                                }}
                              />
                            </TableCell>

                            <TableCell>
                              <Typography
                                fontWeight={800}
                                color={
                                  Number(
                                    transaction.balance_after
                                  ) >= 0
                                    ? "#2e7d32"
                                    : "#c62828"
                                }
                              >
                                {transaction.balance_after ??
                                  0}
                              </Typography>
                            </TableCell>

                            <TableCell>
                              <Stack
                                direction="column"
                                spacing={0.25}
                              >
                                {transaction.receipt_number && (
                                  <Chip
                                    label={`Receipt #${transaction.receipt_number}`}
                                    size="small"
                                    variant="outlined"
                                  />
                                )}

                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {transaction.reference_type
                                    ? `${transaction.reference_type}${
                                        transaction.reference_id
                                          ? ` #${transaction.reference_id}`
                                          : ""
                                      }`
                                    : "-"}
                                </Typography>
                              </Stack>
                            </TableCell>

                            <TableCell>
                              {transaction.employee_name ||
                                "-"}
                            </TableCell>

                            <TableCell>
                              {transaction.performed_by_name ||
                                "-"}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default AssetOfficerBinCard;