import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  MenuItem,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import {
  SwapHoriz as TransferIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  AssignmentTurnedIn as CompleteIcon,
  VerifiedUser as RequestIcon,
} from "@mui/icons-material";

import API from "../services/api";
import BackButton from "../components/BackButton";

const AssetOfficerTransfers = () => {
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [transfers, setTransfers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    asset_id: "",
    from_location: "",
    to_location: "",
    reason: "",
    transfer_date: "",
    notes: "",
  });

  // Approve / Reject / Complete dialogs
  const [openRejectDialog, setOpenRejectDialog] =
    useState(false);
  const [rejectReason, setRejectReason] =
    useState("");
  const [selected, setSelected] = useState(null);

  const getList = (data, key) => {
    if (Array.isArray(data)) return data;

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    if (Array.isArray(data?.[key])) {
      return data[key];
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
        assetsResponse,
        usersResponse,
        transfersResponse,
      ] = await Promise.allSettled([
        API.get("/assets", { headers }),
        API.get("/users/list/all", { headers }),
        API.get("/transfers", { headers }),
      ]);

      if (assetsResponse.status === "fulfilled") {
        setAssets(
          getList(
            assetsResponse.value.data,
            "assets"
          )
        );
      }

      if (usersResponse.status === "fulfilled") {
        setUsers(
          getList(
            usersResponse.value.data,
            "users"
          )
        );
      }

      if (transfersResponse.status === "fulfilled") {
        setTransfers(
          getList(
            transfersResponse.value.data,
            "transfers"
          )
        );
      }
    } catch (err) {
      console.error(
        "Failed to load transfer information:",
        err
      );

      setError(
        err.response?.data?.error ||
          "Unable to load transfer information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // =====================================================
  // AVAILABLE / ASSIGNED ASSETS (for hand return form)
  // =====================================================

  const transferableAssets = useMemo(() => {
    return assets.filter((asset) => {
      const status = String(
        asset.status || ""
      ).toLowerCase();

      return (
        status === "assigned" ||
        status === "available"
      );
    });
  }, [assets]);

  // =====================================================
  // HAND-RETURN FORM
  // =====================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (name === "asset_id") {
      const selectedAsset = assets.find(
        (asset) =>
          String(asset.asset_id) ===
          String(value)
      );

      setForm((previous) => ({
        ...previous,
        asset_id: value,
        from_location:
          selectedAsset?.location || "",
      }));
    }
  };

  const clearForm = () => {
    setForm({
      asset_id: "",
      from_location: "",
      to_location: "",
      reason: "",
      transfer_date: "",
      notes: "",
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.asset_id) {
      setError("Please select an asset.");
      return;
    }

    if (!form.to_location.trim()) {
      setError(
        "Please enter a destination location."
      );
      return;
    }

    if (!form.reason.trim()) {
      setError("Please provide a transfer reason.");
      return;
    }

    if (!form.transfer_date) {
      setError("Transfer date is required.");
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("token");

      if (!token) {
        setError("You are not logged in.");
        return;
      }

      const payload = {
        asset_id: Number(form.asset_id),

        from_location:
          form.from_location.trim() || null,

        to_location:
          form.to_location.trim() || null,

        reason: form.reason.trim(),

        transfer_date:
          form.transfer_date,

        notes:
          form.notes.trim() || null,
      };

      const response = await API.post(
        "/transfers",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        response.data?.message ||
          "Asset transferred successfully."
      );

      clearForm();

      await fetchData();
    } catch (err) {
      console.error(
        "Failed to create transfer:",
        err
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to complete the asset transfer."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // APPROVE / REJECT / COMPLETE TRANSFER REQUEST
  // =====================================================

  const handleApprove = async (transfer) => {
    try {
      setActionLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      await API.put(
        `/transfers/${transfer.transfer_id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(
        `Transfer #${transfer.transfer_id} approved. Awaiting handover confirmation.`
      );
      await fetchData();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to approve transfer."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (transfer) => {
    try {
      setActionLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      await API.put(
        `/transfers/${transfer.transfer_id}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(
        `Transfer #${transfer.transfer_id} completed. Asset reassigned to the receiving employee.`
      );
      await fetchData();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to complete transfer."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClick = (transfer) => {
    setSelected(transfer);
    setRejectReason("");
    setOpenRejectDialog(true);
  };

  const handleRejectConfirm = async () => {
    if (!selected) return;
    try {
      setActionLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      await API.put(
        `/transfers/${selected.transfer_id}/reject`,
        { rejection_reason: rejectReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(
        `Transfer #${selected.transfer_id} rejected.`
      );
      setOpenRejectDialog(false);
      setSelected(null);
      await fetchData();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to reject transfer."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "warning";
      case "Approved":
        return "info";
      case "Rejected":
        return "error";
      case "Completed":
        return "success";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress sx={{ color: "#07548e" }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f5f7fb",
        p: { xs: 2, sm: 3, md: 4 },
      }}
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: {
            xs: "flex-start",
            sm: "center",
          },
          flexDirection: {
            xs: "column",
            sm: "row",
          },
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <BackButton to="/asset-officer" />

            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: "#1f2937",
                mb: 1,
              }}
            >
              Asset Transfers
            </Typography>
          </Box>

          <Typography color="text.secondary">
            Review employee transfer requests and return
            assets by hand between departments or locations.
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

      {success && (
        <Alert
          severity="success"
          onClose={() => setSuccess("")}
          sx={{ mb: 3 }}
        >
          {success}
        </Alert>
      )}

      {error && (
        <Alert
          severity="error"
          onClose={() => setError("")}
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      {/* =================================================
          TRANSFER REQUESTS (review/approval)
      ================================================= */}

      <Card
        elevation={0}
        sx={{
          mb: 4,
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              mb: 1,
            }}
          >
            <RequestIcon
              sx={{ color: "#07548e", fontSize: 30 }}
            />
            <Typography variant="h6" fontWeight={700}>
              Transfer Requests
            </Typography>
          </Box>

          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Review pending transfer requests from employees.
            Approve a request, then confirm the handover to
            complete it and reassign the asset.
          </Typography>

          {transfers.length === 0 ? (
            <Typography color="text.secondary">
              No transfer requests found.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {transfers.map((transfer) => {
                const isPending =
                  transfer.status === "Pending";
                const isApproved =
                  transfer.status === "Approved";
                return (
                  <Box
                    key={transfer.transfer_id}
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border: isPending
                        ? "2px solid #f59e0b"
                        : "1px solid #e5e7eb",
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      spacing={1}
                      sx={{ mb: 1 }}
                    >
                      <Typography fontWeight={700}>
                        {transfer.asset_name || "Asset"} —{" "}
                        {transfer.serial_number || "No S/N"}
                      </Typography>
                      <Chip
                        size="small"
                        label={transfer.status || "Pending"}
                        color={getStatusColor(transfer.status)}
                        sx={{ fontWeight: 700 }}
                      />
                    </Stack>

                    <Grid container spacing={1}>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={700}
                        >
                          Asset ID
                        </Typography>
                        <Typography variant="body2">
                          #{transfer.asset_id}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={700}
                        >
                          Current Employee
                        </Typography>
                        <Typography variant="body2">
                          {transfer.from_user_name ||
                            transfer.from_employee_name ||
                            "Unassigned"}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={700}
                        >
                          Receiving Employee
                        </Typography>
                        <Typography variant="body2">
                          {transfer.to_user_name ||
                            transfer.to_employee_name ||
                            "N/A"}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={700}
                        >
                          Request Date
                        </Typography>
                        <Typography variant="body2">
                          {transfer.transfer_date
                            ? new Date(
                                transfer.transfer_date
                              ).toLocaleDateString()
                            : "N/A"}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 12 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={700}
                        >
                          Reason
                        </Typography>
                        <Typography variant="body2">
                          {transfer.reason || "-"}
                        </Typography>
                      </Grid>

                      {transfer.status === "Rejected" &&
                        transfer.rejection_reason && (
                          <Grid size={{ xs: 12 }}>
                            <Alert severity="error" sx={{ py: 0 }}>
                              <Typography variant="body2">
                                <strong>Rejection Reason:</strong>{" "}
                                {transfer.rejection_reason}
                              </Typography>
                            </Alert>
                          </Grid>
                        )}

                      {transfer.status === "Rejected" &&
                        transfer.approved_by_name && (
                          <Grid size={{ xs: 12 }}>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              <strong>Rejected by:</strong>{" "}
                              {transfer.approved_by_name}
                            </Typography>
                          </Grid>
                        )}

                      {transfer.status === "Approved" &&
                        transfer.approved_by_name && (
                          <Grid size={{ xs: 12 }}>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              <strong>Approved by:</strong>{" "}
                              {transfer.approved_by_name} — awaiting
                              handover confirmation.
                            </Typography>
                          </Grid>
                        )}
                    </Grid>

                    <Divider sx={{ my: 1.5 }} />

                    {isPending && (
                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        useFlexGap
                      >
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<ApproveIcon />}
                          disabled={actionLoading}
                          onClick={() =>
                            handleApprove(transfer)
                          }
                          sx={{
                            textTransform: "none",
                            backgroundColor: "#2e7d32",
                            "&:hover": {
                              backgroundColor: "#1b5e20",
                            },
                            flex: 1,
                            minWidth: 120,
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<RejectIcon />}
                          disabled={actionLoading}
                          onClick={() =>
                            handleRejectClick(transfer)
                          }
                          sx={{
                            textTransform: "none",
                            backgroundColor: "#c62828",
                            "&:hover": {
                              backgroundColor: "#b71c1c",
                            },
                            flex: 1,
                            minWidth: 120,
                          }}
                        >
                          Reject
                        </Button>
                      </Stack>
                    )}

                    {isApproved && (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<CompleteIcon />}
                        disabled={actionLoading}
                        onClick={() =>
                          handleComplete(transfer)
                        }
                        sx={{
                          textTransform: "none",
                          backgroundColor: "#07548e",
                          "&:hover": {
                            backgroundColor: "#064675",
                          },
                        }}
                      >
                        Confirm Handover & Complete
                      </Button>
                    )}

                    {transfer.status === "Completed" && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Completed on{" "}
                        {transfer.completed_at
                          ? new Date(
                              transfer.completed_at
                            ).toLocaleString()
                          : "-"}
                        . Asset reassigned to{" "}
                        {transfer.to_user_name ||
                          "the receiving employee"}.
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* =================================================
          HAND-RETURN (LOCATION TRANSFER) FORM
      ================================================= */}

      <Card
        elevation={0}
        sx={{
          maxWidth: 900,
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              mb: 1,
            }}
          >
            <TransferIcon
              sx={{ color: "#07548e", fontSize: 30 }}
            />

            <Typography variant="h6" fontWeight={700}>
              Return Asset by Hand (Location Transfer)
            </Typography>
          </Box>

          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Select the asset being returned by hand and
            specify the location it is being moved to.
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              {/* ASSET */}

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Asset"
                  name="asset_id"
                  value={form.asset_id}
                  onChange={handleChange}
                >
                  {transferableAssets.length === 0 ? (
                    <MenuItem disabled>
                      No transferable assets
                    </MenuItem>
                  ) : (
                    transferableAssets.map((asset) => (
                      <MenuItem
                        key={asset.asset_id}
                        value={asset.asset_id}
                      >
                        {asset.asset_name}
                        {asset.serial_number
                          ? ` — ${asset.serial_number}`
                          : ""}
                      </MenuItem>
                    ))
                  )}
                </TextField>
              </Grid>

              {/* FROM LOCATION */}

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Returning From (Current Location)"
                  name="from_location"
                  value={form.from_location}
                  onChange={handleChange}
                />
              </Grid>

              {/* TO LOCATION */}

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Returning To (New Location)"
                  name="to_location"
                  value={form.to_location}
                  onChange={handleChange}
                  placeholder="Office, department, building..."
                />
              </Grid>

              {/* DATE */}

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  label="Transfer Date"
                  name="transfer_date"
                  value={form.transfer_date}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* REASON */}

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="Reason"
                  name="reason"
                  value={form.reason}
                  onChange={handleChange}
                  placeholder="Why is this asset being transferred?"
                />
              </Grid>

              {/* NOTES */}

              <Grid size={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  label="Transfer Notes"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Additional transfer information..."
                />
              </Grid>
            </Grid>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ mt: 3 }}
            >
              <Button
                type="submit"
                variant="contained"
                fullWidth
                startIcon={<TransferIcon />}
                disabled={saving}
                sx={{
                  py: 1.4,
                  backgroundColor: "#07548e",
                  textTransform: "none",
                  fontWeight: 700,

                  "&:hover": {
                    backgroundColor: "#064675",
                  },
                }}
              >
                {saving
                  ? "Processing..."
                  : "Return Asset by Hand"}
              </Button>

              <Button
                type="button"
                variant="outlined"
                fullWidth
                onClick={clearForm}
                disabled={saving}
                sx={{
                  py: 1.4,
                  borderColor: "#07548e",
                  color: "#07548e",
                  textTransform: "none",
                  fontWeight: 700,
                }}
              >
                Clear
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* REJECT DIALOG */}

      <Dialog
        open={openRejectDialog}
        onClose={() => {
          if (actionLoading) return;
          setOpenRejectDialog(false);
          setSelected(null);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Reject Transfer Request
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Provide a reason for rejecting this transfer
            request. The asset will remain assigned to the
            current employee.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Rejection Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter reason for rejection..."
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => {
              setOpenRejectDialog(false);
              setSelected(null);
            }}
            disabled={actionLoading}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleRejectConfirm}
            disabled={actionLoading}
            sx={{
              textTransform: "none",
              backgroundColor: "#c62828",
              "&:hover": { backgroundColor: "#b71c1c" },
            }}
          >
            {actionLoading ? "Rejecting..." : "Reject Transfer"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssetOfficerTransfers;