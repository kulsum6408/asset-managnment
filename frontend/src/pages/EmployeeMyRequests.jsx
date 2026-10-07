import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from "@mui/material";

import {
  ArrowBack,
  HourglassTop as PendingIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  CancelOutlined as CancelIcon,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import API from "../services/api";

const EmployeeMyRequests = () => {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const getStatusInfo = (status) => {
    const value = String(status || "Pending").toLowerCase();

    if (value === "approved") {
      return {
        label: "APPROVED",
        color: "success",
        icon: <ApprovedIcon fontSize="small" />,
      };
    }

    if (
      value === "rejected" ||
      value === "declined"
    ) {
      return {
        label: "REJECTED",
        color: "error",
        icon: <RejectedIcon fontSize="small" />,
      };
    }

    if (value === "cancelled") {
      return {
        label: "CANCELLED",
        color: "default",
        icon: <RejectedIcon fontSize="small" />,
      };
    }

    return {
      label: "PENDING",
      color: "warning",
      icon: <PendingIcon fontSize="small" />,
    };
  };

  const fetchRequests = async () => {
    try {
      setError("");
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }
      const response = await API.get("/requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      setRequests(
        Array.isArray(data)
          ? data
          : Array.isArray(data.data)
          ? data.data
          : Array.isArray(data.requests)
          ? data.requests
          : []
      );
    } catch (err) {
      console.error("Failed to load requests:", err);
      setError(
        err.response?.data?.error ||
          "Unable to load your requests."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [navigate]);

  const handleCancelClick = (request) => {
    setCancelTarget(request);
  };

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    try {
      setCancelLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      await API.delete(`/requests/${cancelTarget.request_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess("Request cancelled successfully.");
      setCancelTarget(null);
      fetchRequests();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to cancel request."
      );
    } finally {
      setCancelLoading(false);
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
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate("/employee")}
        sx={{
          mb: 3,
          color: "#07548e",
          fontWeight: 700,
          textTransform: "none",
        }}
      >
        Back to Dashboard
      </Button>

      <Typography
        variant="h4"
        sx={{
          fontWeight: 800,
          color: "#1f2937",
          mb: 1,
        }}
      >
        My Requests
      </Typography>

      <Typography sx={{ color: "#6b7280", mb: 4 }}>
        Track whether your asset request is pending,
        approved, or rejected.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {requests.length === 0 ? (
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e5e7eb",
          }}
        >
          <CardContent>
            <Typography color="text.secondary">
              You have no asset requests.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {requests.map((request, index) => {
            const status = getStatusInfo(request.status);
            const isPending =
              String(request.status || "Pending").toLowerCase() === "pending";

            return (
              <Grid
                key={request.request_id || index}
                size={{ xs: 12, sm: 6, lg: 4 }}
              >
                <Card
                  elevation={0}
                  sx={{
                    height: "100%",
                    borderRadius: 3,
                    border: isPending
                      ? "2px solid #f59e0b"
                      : "1px solid #e5e7eb",
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 1,
                      }}
                    >
                      <Typography
                        variant="h6"
                        fontWeight={700}
                      >
                        {request.asset_name ||
                          request.description ||
                          "Asset Request"}
                      </Typography>

                      <Chip
                        icon={status.icon}
                        label={status.label}
                        color={status.color}
                        size="small"
                        sx={{
                          fontWeight: 700,
                        }}
                      />
                    </Box>

                    <Typography
                      sx={{
                        color: "#6b7280",
                        mt: 1,
                      }}
                    >
                      {request.reason ||
                        "No reason provided"}
                    </Typography>

                    {request.remarks && (
                      <Typography
                        sx={{
                          mt: 1,
                          color: "#6b7280",
                          fontStyle: "italic",
                        }}
                      >
                        Remarks: {request.remarks}
                      </Typography>
                    )}

                    {request.request_date && (
                      <Typography
                        sx={{
                          mt: 0.5,
                          fontSize: "0.8rem",
                          color: "#9ca3af",
                        }}
                      >
                        Requested:{" "}
                        {new Date(
                          request.request_date
                        ).toLocaleDateString()}
                      </Typography>
                    )}

                    {isPending && (
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={() =>
                          handleCancelClick(request)
                        }
                        sx={{
                          mt: 2,
                          borderColor: "#c62828",
                          color: "#c62828",
                          textTransform: "none",
                          fontWeight: 700,
                          "&:hover": {
                            borderColor: "#b71c1c",
                            backgroundColor: "#fdecea",
                          },
                        }}
                      >
                        Cancel Request
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Cancel Request
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 1 }}>
            Are you sure you want to cancel this request?
          </Typography>
          {cancelTarget && (
            <Typography variant="body2" color="text.secondary">
              Asset: {cancelTarget.asset_name || "N/A"}
            </Typography>
          )}
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            This action cannot be undone. The request will show as Cancelled and
            the manager will no longer be able to approve it.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setCancelTarget(null)}
            sx={{ textTransform: "none" }}
          >
            Keep Request
          </Button>
          <Button
            variant="contained"
            onClick={handleCancelConfirm}
            disabled={cancelLoading}
            sx={{
              textTransform: "none",
              backgroundColor: "#c62828",
              "&:hover": { backgroundColor: "#b71c1c" },
            }}
          >
            {cancelLoading ? "Cancelling..." : "Yes, Cancel Request"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeMyRequests;
