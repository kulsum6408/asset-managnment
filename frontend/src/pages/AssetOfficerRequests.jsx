import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Stack,
} from "@mui/material";

import {
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  ArrowBack,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import API from "../services/api";

const AssetOfficerRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // =====================================================
  // LOAD REQUESTS
  // =====================================================

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("You are not logged in.");
        return;
      }

      const response = await API.get("/requests", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.requests)
        ? data.requests
        : [];

      setRequests(list);
    } catch (err) {
      console.error("Failed to load requests:", err);

      setError(
        err.response?.data?.error ||
          "Unable to load employee requests."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // =====================================================
  // REQUEST STATUS
  // =====================================================

  const getStatusColor = (status) => {
    const value = String(status || "").toLowerCase();

    if (value === "approved") {
      return "success";
    }

    if (value === "rejected") {
      return "error";
    }

    if (value === "assigned") {
      return "info";
    }

    return "warning";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Not available";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString();
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "Not available";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleString();
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress sx={{ color: "#07548e" }} />
      </Box>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

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
      {/* BACK */}
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate("/asset-officer")}
        sx={{
          mb: 3,
          color: "#07548e",
          fontWeight: 700,
          textTransform: "none",
        }}
      >
        Back to Dashboard
      </Button>

      {/* HEADER */}

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
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: "#1f2937",
              mb: 1,
            }}
          >
            Employee Requests
          </Typography>

          <Typography sx={{ color: "#6b7280" }}>
            View employee asset requests. Approvals and
            rejections are handled by the Manager.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchRequests}
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

      {/* INFO */}

      <Alert
        severity="info"
        icon={<ViewIcon />}
        sx={{
          mb: 3,
          borderRadius: 2,
        }}
      >
        This screen is read-only.{" "}
        <strong>Approve</strong> and <strong>Reject</strong>{" "}
        actions are only available to the Manager. Approved
        requests can be assigned from the{" "}
        <strong>Assign Assets</strong> section.
      </Alert>

      {/* ERROR */}

      {error && (
        <Alert
          severity="error"
          onClose={() => setError("")}
          sx={{
            mb: 3,
            borderRadius: 2,
          }}
        >
          {error}
        </Alert>
      )}

      {/* EMPTY */}

      {requests.length === 0 ? (
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e5e7eb",
            backgroundColor: "#ffffff",
          }}
        >
          <CardContent
            sx={{
              py: 7,
              textAlign: "center",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 1,
              }}
            >
              No Requests Found
            </Typography>

            <Typography color="text.secondary">
              There are currently no employee asset requests.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {requests.map((request) => {
            const status = String(
              request.status || "Pending"
            );

            return (
              <Card
                key={request.request_id}
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#ffffff",
                }}
              >
                <CardContent
                  sx={{
                    p: {
                      xs: 2,
                      sm: 3,
                    },
                  }}
                >
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
                    }}
                  >
                    {/* REQUEST INFORMATION */}

                    <Box sx={{ flex: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 0.5,
                          flexWrap: "wrap",
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 800,
                            color: "#6b7280",
                          }}
                        >
                          Request #{request.request_id}
                        </Typography>
                      </Box>

                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: "#1f2937",
                        }}
                      >
                        {request.asset_name ||
                          request.description ||
                          "Asset Request"}
                      </Typography>

                      <Typography
                        sx={{
                          color: "#6b7280",
                          mt: 0.5,
                        }}
                      >
                        Employee:{" "}
                        {request.requester_name ||
                          request.employee_name ||
                          "Employee"}
                      </Typography>

                      {request.requester_email && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          Email: {request.requester_email}
                        </Typography>
                      )}

                      {request.department && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          Department: {request.department}
                        </Typography>
                      )}

                      {request.serial_number && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          Serial Number:{" "}
                          {request.serial_number}
                        </Typography>
                      )}

                      <Typography
                        sx={{
                          mt: 2,
                          color: "#374151",
                        }}
                      >
                        <strong>Reason:</strong>{" "}
                        {request.reason ||
                          "No reason provided"}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                      >
                        Requested:{" "}
                        {formatDate(request.request_date)}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        Expected Return:{" "}
                        {formatDate(
                          request.expected_return_date
                        )}
                      </Typography>

                      {request.approved_at && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          Approved:{" "}
                          {formatDateTime(
                            request.approved_at
                          )}
                        </Typography>
                      )}
                    </Box>

                    {/* STATUS */}

                    <Box
                      sx={{
                        minWidth: {
                          xs: "100%",
                          sm: 160,
                        },
                        textAlign: {
                          xs: "left",
                          sm: "right",
                        },
                      }}
                    >
                      <Chip
                        label={status}
                        color={getStatusColor(status)}
                        sx={{
                          fontWeight: 700,
                        }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
    </Box>
  );
};

export default AssetOfficerRequests;
