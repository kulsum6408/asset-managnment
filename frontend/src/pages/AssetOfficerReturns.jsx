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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  MenuItem,
} from "@mui/material";

import {
  Refresh as RefreshIcon,
  ArrowBack,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import API from "../services/api";

const AssetOfficerReturns = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [returns, setReturns] = useState([]);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedRequest, setSelectedRequest] =
    useState(null);
  const [decision, setDecision] = useState(null); // "approve" | "reject" | "complete"
  const [remarks, setRemarks] = useState("");
  const [assetCondition, setAssetCondition] =
    useState("Good");

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

      const [requestsResponse, returnsResponse] =
        await Promise.all([
          API.get("/return-requests", { headers }),
          API.get("/returns", { headers }),
        ]);

      setRequests(
        getList(
          requestsResponse.data,
          "requests"
        )
      );

      setReturns(
        getList(
          returnsResponse.data,
          "returns"
        )
      );
    } catch (err) {
      console.error(
        "Failed to load return information:",
        err
      );

      setError(
        err.response?.data?.error ||
          "Unable to load return information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // =====================================================
  // ACTIONABLE RETURN REQUESTS
  // Pending (awaiting decision) and Approved (awaiting
  // physical receipt/completion) are shown so the officer
  // can approve OR complete the return. Completed/rejected
  // are moved to the reviewed list.
  // =====================================================

  const actionableRequests = requests.filter(
    (r) =>
      ["pending", "approved"].includes(
        String(r.status || "").trim().toLowerCase()
      )
  );

  const reviewedRequests = requests.filter(
    (r) =>
      ["rejected", "completed"].includes(
        String(r.status || "").trim().toLowerCase()
      )
  );

  // =====================================================
  // OPEN DECISION DIALOG
  // =====================================================

  const openDecision = (req, action) => {
    setSelectedRequest(req);
    setDecision(action);
    setRemarks("");
    setAssetCondition("Good");
    setError("");
    setSuccess("");
  };

  const closeDecision = () => {
    if (processing) return;

    setSelectedRequest(null);
    setDecision(null);
    setRemarks("");
    setAssetCondition("Good");
  };

  // =====================================================
  // SUBMIT DECISION
  // =====================================================

  const handleDecision = async () => {
    if (!selectedRequest || !decision) return;

    try {
      setProcessing(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("You are not logged in.");
        return;
      }

      const endpointMap = {
        approve: `/return-requests/${selectedRequest.return_request_id}/approve`,
        reject: `/return-requests/${selectedRequest.return_request_id}/reject`,
        complete: `/return-requests/${selectedRequest.return_request_id}/complete`,
      };

      const endpoint =
        endpointMap[decision];

      const payload =
        decision === "complete"
          ? {
              asset_condition: assetCondition,
              notes: remarks.trim() || null,
            }
          : {
              remarks: remarks.trim() || null,
            };

      const response = await API.put(
        endpoint,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const completionMessages = {
        approve: "Return request approved.",
        reject: "Return request rejected.",
        complete: "Return completed successfully.",
      };

      setSuccess(
        response.data?.message ||
          completionMessages[decision]
      );

      closeDecision();

      await fetchData();
    } catch (err) {
      console.error(
        "Failed to process return request:",
        err
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to process the return request."
      );
    } finally {
      setProcessing(false);
    }
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
        <CircularProgress
          sx={{
            color: "#07548e",
          }}
        />
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
            Asset Returns
          </Typography>

          <Typography
            sx={{
              color: "#6b7280",
            }}
          >
            Review and process asset return requests.
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

      {/* MESSAGES */}

      {success && (
        <Alert
          severity="success"
          onClose={() => setSuccess("")}
          sx={{
            mb: 3,
            borderRadius: 2,
          }}
        >
          {success}
        </Alert>
      )}

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

      {/* PENDING RETURN REQUESTS */}

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 3,
            }}
          >
            Pending & Approved Return Requests
          </Typography>

          {actionableRequests.length === 0 ? (
            <Typography color="text.secondary">
              There are no pending or approved return
              requests right now.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {actionableRequests.map((request) => {
                return (
                <Box
                  key={request.return_request_id}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: "1px solid #e5e7eb",
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
                    <Box>
                      <Typography
                        variant="h6"
                        fontWeight={700}
                      >
                        {request.asset_name || "Asset"}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Employee:{" "}
                        {request.employee_name ||
                          "Employee"}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Serial:{" "}
                        {request.serial_number || "N/A"}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Requested:{" "}
                        {request.requested_date
                          ? new Date(
                              request.requested_date
                            ).toLocaleDateString()
                          : "N/A"}
                      </Typography>

                      {request.reason && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 1 }}
                        >
                          Reason: {request.reason}
                        </Typography>
                      )}
                    </Box>

                    <Box
                      sx={{
                        minWidth: {
                          xs: "100%",
                          sm: 200,
                        },
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          mb: 0.5,
                        }}
                      >
                        <Chip
                          label={request.status}
                          color={
                            String(
                              request.status || ""
                            ).toLowerCase() === "approved"
                              ? "success"
                              : "warning"
                          }
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      </Box>

                      {String(request.status || "")
                        .trim()
                        .toLowerCase() === "approved" ? (
                        <>
                          <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            onClick={() =>
                              openDecision(
                                request,
                                "complete"
                              )
                            }
                            disabled={processing}
                            sx={{
                              textTransform: "none",
                              fontWeight: 700,
                              borderRadius: 2,
                            }}
                          >
                            Receive & Complete Return
                          </Button>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ textAlign: "center" }}
                          >
                            Approved. Scan / receive the
                            asset to make it Available in
                            store.
                          </Typography>
                        </>
                      ) : (
                        <>
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                            }}
                          >
                            <Button
                              fullWidth
                              variant="contained"
                              color="primary"
                              onClick={() =>
                                openDecision(
                                  request,
                                  "approve"
                                )
                              }
                              disabled={processing}
                              sx={{
                                textTransform: "none",
                                fontWeight: 700,
                                borderRadius: 2,
                              }}
                            >
                              Approve
                            </Button>

                            <Button
                              fullWidth
                              variant="outlined"
                              color="error"
                              onClick={() =>
                                openDecision(
                                  request,
                                  "reject"
                                )
                              }
                              disabled={processing}
                              sx={{
                                textTransform: "none",
                                fontWeight: 700,
                                borderRadius: 2,
                              }}
                            >
                              Reject
                            </Button>
                          </Box>
                        </>
                      )}
                    </Box>
                  </Box>
                </Box>
                );
              })}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* REVIEWED REQUESTS */}

      {reviewedRequests.length > 0 && (
        <Card
          elevation={0}
          sx={{
            mt: 4,
            borderRadius: 3,
            border: "1px solid #e5e7eb",
            backgroundColor: "#ffffff",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 3,
              }}
            >
              Recently Reviewed
            </Typography>

            <Stack spacing={1}>
              {reviewedRequests
                .slice(0, 10)
                .map((item) => (
                  <Box
                    key={item.return_request_id}
                    sx={{
                      py: 1.5,
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 2,
                      borderBottom:
                        "1px solid #eeeeee",
                      alignItems: "center",
                    }}
                  >
                    <Box>
                      <Typography fontWeight={600}>
                        {item.asset_name || "Asset"}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {item.employee_name ||
                          "Employee"}
                      </Typography>
                    </Box>

                    <Chip
                      label={item.status}
                      color={
                        String(item.status || "")
                          .toLowerCase() === "completed"
                          ? "primary"
                          : String(item.status || "")
                              .toLowerCase() === "approved"
                          ? "success"
                          : "error"
                      }
                      size="small"
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>
                ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* COMPLETED RETURNS */}

      <Card
        elevation={0}
        sx={{
          mt: 4,
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 3,
            }}
          >
            Recent Completed Returns
          </Typography>

          {returns.length === 0 ? (
            <Typography color="text.secondary">
              No completed returns yet.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {returns
                .slice(0, 10)
                .map((item) => (
                  <Box
                    key={item.return_id}
                    sx={{
                      py: 1.5,
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 2,
                      borderBottom:
                        "1px solid #eeeeee",
                    }}
                  >
                    <Box>
                      <Typography fontWeight={600}>
                        {item.asset_name || "Asset"}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {item.employee_name ||
                          "Employee"}
                      </Typography>
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      {item.return_date
                        ? new Date(
                            item.return_date
                          ).toLocaleDateString()
                        : "N/A"}
                    </Typography>
                  </Box>
                ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* DECISION DIALOG */}

      <Dialog
        open={Boolean(selectedRequest)}
        onClose={closeDecision}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
          }}
        >
          {decision === "complete"
            ? "Complete Asset Return"
            : decision === "approve"
            ? "Approve Return Request"
            : "Reject Return Request"}
        </DialogTitle>

        <DialogContent>
          <Typography
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Asset:{" "}
            <strong>
              {selectedRequest?.asset_name}
            </strong>
            <br />
            Employee:{" "}
            <strong>
              {selectedRequest?.employee_name ||
                "Employee"}
            </strong>
          </Typography>

          {decision === "complete" ? (
            <>
              <TextField
                fullWidth
                select
                label="Asset Condition"
                value={assetCondition}
                onChange={(e) =>
                  setAssetCondition(e.target.value)
                }
                sx={{ mb: 2 }}
              >
                {["Good", "Damaged"].map(
                  (condition) => (
                    <MenuItem
                      key={condition}
                      value={condition}
                    >
                      {condition}
                    </MenuItem>
                  )
                )}
              </TextField>

              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Inspection Notes (optional)"
                placeholder="Record the condition observed during physical inspection..."
                value={remarks}
                onChange={(e) =>
                  setRemarks(e.target.value)
                }
              />

              <Typography
                mt={2}
                variant="body2"
                color="text.secondary"
              >
                {assetCondition === "Damaged"
                  ? "Completing will mark the asset as received and send it to Maintenance (Under Inspection). It will NOT be available for assignment until repaired."
                  : "Completing will mark the asset as returned, set it Available in the store, and record a Bin Card IN transaction. This cannot be undone."}
              </Typography>
            </>
          ) : (
            <TextField
              fullWidth
              multiline
              minRows={3}
              label={
                decision === "approve"
                  ? "Remarks (optional)"
                  : "Rejection Remarks"
              }
              placeholder={
                decision === "approve"
                  ? "Optional note to the employee..."
                  : "Explain why the return is rejected..."
              }
              value={remarks}
              onChange={(e) =>
                setRemarks(e.target.value)
              }
            />
          )}

          {decision === "approve" && (
            <Typography
              mt={2}
              variant="body2"
              color="text.secondary"
            >
              Approving will notify the employee to bring
              the asset for inspection. The asset remains
              assigned until the return is completed.
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={closeDecision}
            disabled={processing}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color={
              decision === "reject"
                ? "error"
                : decision === "approve"
                ? "success"
                : "primary"
            }
            onClick={handleDecision}
            disabled={processing}
            sx={{
              textTransform: "none",
            }}
          >
            {processing
              ? "Processing..."
              : decision === "complete"
              ? "Complete Return"
              : decision === "approve"
              ? "Approve Request"
              : "Reject Request"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssetOfficerReturns;