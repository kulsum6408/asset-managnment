import React, { useEffect, useState } from "react";

import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from "@mui/material";

import {
  Inventory2 as AssetIcon,
  LocationOn as LocationIcon,
  CalendarMonth as CalendarIcon,
  Numbers as SerialIcon,
  Refresh as RefreshIcon,
  ArrowBack,
  ReceiptLong as ReceiptIcon,
  CheckCircle as ConfirmedIcon,
  LocalShipping as ReadyIcon,
  SwapHoriz as TransferIcon,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";

import API from "../services/api";

const EmployeeMyAssets = () => {
  const navigate = useNavigate();

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState("");

  const [receiptAsset, setReceiptAsset] =
    useState(null);
  const [confirming, setConfirming] =
    useState(false);
  const [success, setSuccess] = useState("");

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  // =====================================================
  // LOAD MY ASSIGNMENTS
  // =====================================================
  const fetchMyAssets = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const token =
        localStorage.getItem("token");

      if (!token) {
        setError("You are not logged in.");
        return;
      }

      const [assignmentsResponse, transfersResponse] =
        await Promise.allSettled([
          API.get("/assignments", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          API.get("/transfers", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

      let list = [];
      if (assignmentsResponse.status === "fulfilled") {
        const assignmentData = assignmentsResponse.value.data;
        list = Array.isArray(assignmentData)
          ? assignmentData
          : Array.isArray(assignmentData?.data)
          ? assignmentData.data
          : Array.isArray(assignmentData?.assignments)
          ? assignmentData.assignments
          : [];
      }

      // Transfer in progress: assets this employee is sending
      // away via a Pending/Approved transfer. These must not be
      // shown as "my assets" anymore because they are being
      // transferred to another employee.
      const transferringOutIds = new Set();
      if (transfersResponse.status === "fulfilled") {
        const transferData = transfersResponse.value.data;
        const transfers = Array.isArray(transferData)
          ? transferData
          : Array.isArray(transferData?.data)
          ? transferData.data
          : Array.isArray(transferData?.transfers)
          ? transferData.transfers
          : [];

        transfers.forEach((transfer) => {
          const status = String(transfer.status || "")
            .trim()
            .toLowerCase();
          const isOutgoing =
            String(transfer.from_user_id) ===
              String(user.user_id) ||
            String(transfer.transferred_by) ===
              String(user.user_id);

          if (
            isOutgoing &&
            (status === "pending" ||
              status === "approved")
          ) {
            transferringOutIds.add(
              String(transfer.asset_id)
            );
          }
        });
      }

      // AssignmentModel creates status = Active
      const activeAssets = list.filter(
        (item) => {
          const status = String(
            item.status || ""
          )
            .trim()
            .toLowerCase();

          const isActive =
            status === "active" ||
            status === "assigned" ||
            status === "approved";

          // Remove any asset that has a transfer in progress
          // sent by this employee.
          const isBeingTransferred =
            transferringOutIds.has(
              String(item.asset_id)
            );

          return isActive && !isBeingTransferred;
        }
      );

      setAssets(activeAssets);
    } catch (err) {
      console.error(
        "Failed to load my assets:",
        err
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to load your assigned assets."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyAssets();
  }, []);

  // =====================================================
  // CONFIRM RECEIPT
  // =====================================================
  const handleConfirmReceipt = async () => {
    if (!receiptAsset || confirming) return;

    try {
      setConfirming(true);
      setError("");
      setSuccess("");

      const token =
        localStorage.getItem("token");

      if (!token) {
        setError("You are not logged in.");
        return;
      }

      const response = await API.post(
        `/assignments/${receiptAsset.assignment_id}/confirm-receipt`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update the asset list in-place so the UI reflects
      // RECEIVED without requiring a manual refresh.
      setAssets((previous) =>
        previous.map((item) =>
          item.assignment_id ===
          response.data.assignment.assignment_id
            ? response.data.assignment
            : item
        )
      );

      if (receiptAsset) {
        setReceiptAsset(
          response.data.assignment
        );
      }

      setSuccess(
        response.data.already_confirmed
          ? "Receipt was already confirmed."
          : "Asset receipt confirmed successfully."
      );
    } catch (err) {
      console.error(
        "Failed to confirm receipt:",
        err
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to confirm receipt."
      );
    } finally {
      setConfirming(false);
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

      {/* HEADER */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
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
            My Assets
          </Typography>

          <Typography
            sx={{
              color: "#6b7280",
            }}
          >
            Approved assets assigned to you, with receipts.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() =>
            fetchMyAssets(true)
          }
          disabled={refreshing}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 700,
          }}
        >
          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </Button>
      </Box>

      {/* ERROR */}
      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
          }}
        >
          {error}
        </Alert>
      )}

      {/* SUCCESS */}
      {success && (
        <Alert
          severity="success"
          sx={{
            mb: 3,
            borderRadius: 2,
          }}
          onClose={() => setSuccess("")}
        >
          {success}
        </Alert>
      )}

      {/* EMPTY */}
      {!error && assets.length === 0 && (
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border:
              "1px solid #e5e7eb",
            backgroundColor: "#ffffff",
          }}
        >
          <CardContent
            sx={{
              py: 6,
              textAlign: "center",
            }}
          >
            <AssetIcon
              sx={{
                fontSize: 60,
                color: "#07548e",
                mb: 2,
              }}
            />

            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 1,
              }}
            >
              No Assets Assigned
            </Typography>

            <Typography color="text.secondary">
              You currently have no active assets
              assigned to you.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* ASSETS */}
      {assets.length > 0 && (
        <Grid container spacing={3}>
          {assets.map(
            (assignment, index) => {
              const assetName =
                assignment.asset_name ||
                "Assigned Asset";

              const serialNumber =
                assignment.serial_number ||
                "Not available";

              const category =
                assignment.category_name ||
                "Not specified";

              const location =
                assignment.location ||
                "Not specified";

              const condition =
                assignment.asset_condition ||
                "Not specified";

              const assignedDate =
                assignment.assignment_date;

              return (
                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                    lg: 4,
                  }}
                  key={
                    assignment.assignment_id ||
                    index
                  }
                >
                  <Card
                    elevation={0}
                    sx={{
                      height: "100%",
                      borderRadius: 3,
                      border:
                        "1px solid #e5e7eb",
                      backgroundColor:
                        "#ffffff",
                    }}
                  >
                    <CardContent
                      sx={{ p: 3 }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "space-between",
                          mb: 2,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems:
                              "center",
                            gap: 1.5,
                          }}
                        >
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 2,
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              backgroundColor:
                                "#e8f2fa",
                              color:
                                "#07548e",
                            }}
                          >
                            <AssetIcon />
                          </Box>

                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                            }}
                          >
                            {assetName}
                          </Typography>
                        </Box>

                        <Chip
                          label={
                            assignment.received_at
                              ? "RECEIVED"
                              : "READY FOR COLLECTION"
                          }
                          color={
                            assignment.received_at
                              ? "success"
                              : "warning"
                          }
                          size="small"
                          icon={
                            assignment.received_at ? (
                              <ConfirmedIcon />
                            ) : (
                              <ReadyIcon />
                            )
                          }
                          sx={{
                            fontWeight: 700,
                          }}
                        />
                      </Box>

                      <Box sx={{ mt: 3 }}>
                        <Box
                          sx={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: 1,
                            mb: 1.5,
                          }}
                        >
                          <SerialIcon
                            fontSize="small"
                            sx={{
                              color:
                                "#07548e",
                            }}
                          />

                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            Serial Number:
                          </Typography>

                          <Typography
                            variant="body2"
                            fontWeight={600}
                          >
                            {serialNumber}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: 1,
                            mb: 1.5,
                          }}
                        >
                          <AssetIcon
                            fontSize="small"
                            sx={{
                              color:
                                "#07548e",
                            }}
                          />

                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            Category:
                          </Typography>

                          <Typography
                            variant="body2"
                            fontWeight={600}
                          >
                            {category}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: 1,
                            mb: 1.5,
                          }}
                        >
                          <LocationIcon
                            fontSize="small"
                            sx={{
                              color:
                                "#07548e",
                            }}
                          />

                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            Location:
                          </Typography>

                          <Typography
                            variant="body2"
                            fontWeight={600}
                          >
                            {location}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: 1,
                            mb: 1.5,
                          }}
                        >
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            Condition:
                          </Typography>

                          <Typography
                            variant="body2"
                            fontWeight={600}
                          >
                            {condition}
                          </Typography>
                        </Box>

                        {assignedDate && (
                          <Box
                            sx={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: 1,
                            }}
                          >
                            <CalendarIcon
                              fontSize="small"
                              sx={{
                                color:
                                  "#07548e",
                              }}
                            />

                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              Assigned:
                            </Typography>

                            <Typography
                              variant="body2"
                              fontWeight={600}
                            >
                              {new Date(
                                assignedDate
                              ).toLocaleDateString()}
                            </Typography>
                          </Box>
                        )}

                        {assignment.received_at && (
                          <Box
                            sx={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: 1,
                              mt: 1.5,
                            }}
                          >
                            <ConfirmedIcon
                              fontSize="small"
                              sx={{
                                color:
                                  "#2e7d32",
                              }}
                            />

                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              Received:
                            </Typography>

                            <Typography
                              variant="body2"
                              fontWeight={600}
                            >
                              {new Date(
                                assignment.received_at
                              ).toLocaleDateString()}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* RECEIPT BUTTON */}
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={
                          <ReceiptIcon />
                        }
                        onClick={() =>
                          setReceiptAsset(
                            assignment
                          )
                        }
                        sx={{
                          mt: 3,
                          borderColor:
                            "#07548e",
                          color: "#07548e",
                          textTransform:
                            "none",
                          fontWeight: 700,
                        }}
                      >
                        View Receipt
                      </Button>

                      {/* REQUEST TRANSFER BUTTON */}
                      {String(
                        assignment.status || ""
                      )
                        .toLowerCase()
                        .includes("assign") ||
                        String(
                          assignment.status || ""
                        )
                          .toLowerCase() ===
                          "active" ? (
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={
                            <TransferIcon />
                          }
                          onClick={() =>
                            navigate(
                              "/employee/request-transfer"
                            )
                          }
                          sx={{
                            mt: 1.5,
                            backgroundColor:
                              "#07548e",
                            color: "#fff",
                            textTransform:
                              "none",
                            fontWeight: 700,
                            "&:hover": {
                              backgroundColor:
                                "#0a5c9e",
                            },
                          }}
                        >
                          Request Transfer
                        </Button>
                      ) : null}
                    </CardContent>
                  </Card>
                </Grid>
              );
            }
          )}
        </Grid>
      )}

      {/* RECEIPT DIALOG */}
      <Dialog
        open={Boolean(receiptAsset)}
        onClose={() =>
          setReceiptAsset(null)
        }
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            color: "#07548e",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <ReceiptIcon />
            ASSET RECEIPT
          </Box>
        </DialogTitle>

        <DialogContent>
          {receiptAsset && (
            <>
              {success && (
                <Alert
                  severity="success"
                  sx={{ mb: 2, borderRadius: 2 }}
                >
                  {success}
                </Alert>
              )}

              {error && (
                <Alert
                  severity="error"
                  sx={{ mb: 2, borderRadius: 2 }}
                >
                  {error}
                </Alert>
              )}

              <Typography
                variant="h5"
                fontWeight={800}
                sx={{ mb: 0.5 }}
              >
                {receiptAsset.asset_name}
              </Typography>

              <Chip
                label={
                  receiptAsset.received_at
                    ? "RECEIVED"
                    : "READY FOR COLLECTION"
                }
                color={
                  receiptAsset.received_at
                    ? "success"
                    : "warning"
                }
                size="small"
                icon={
                  receiptAsset.received_at ? (
                    <ConfirmedIcon />
                  ) : (
                    <ReadyIcon />
                  )
                }
                sx={{
                  fontWeight: 700,
                  mb: 2,
                }}
              />

              <Divider sx={{ mb: 2 }} />

              {[
                {
                  label: "Employee",
                  value:
                    receiptAsset.employee_name ||
                    user.name ||
                    "N/A",
                },
                {
                  label: "Employee ID",
                  value:
                    receiptAsset.user_id ||
                    user.user_id ||
                    "N/A",
                },
                {
                  label: "Asset ID",
                  value:
                    receiptAsset.asset_id ||
                    "N/A",
                },
                {
                  label: "Assignment ID",
                  value:
                    receiptAsset.assignment_id,
                },
                {
                  label: "Serial Number",
                  value:
                    receiptAsset.serial_number ||
                    "Not available",
                },
                {
                  label: "Category",
                  value:
                    receiptAsset.category_name ||
                    "Not specified",
                },
                {
                  label: "Condition",
                  value:
                    receiptAsset.asset_condition ||
                    "Not specified",
                },
                {
                  label: "Location",
                  value:
                    receiptAsset.location ||
                    "Not specified",
                },
                {
                  label: "Assigned On",
                  value:
                    receiptAsset.assignment_date
                      ? new Date(
                          receiptAsset.assignment_date
                        ).toLocaleDateString()
                      : "Not available",
                },
                {
                  label: "Expected Return",
                  value:
                    receiptAsset.expected_return_date
                      ? new Date(
                          receiptAsset.expected_return_date
                        ).toLocaleDateString()
                      : "Not specified",
                },
                {
                  label: "Asset Officer",
                  value:
                    receiptAsset.assigned_by_name ||
                    "Not available",
                },
                {
                  label: "Receipt Confirmed On",
                  value:
                    receiptAsset.received_at
                      ? new Date(
                          receiptAsset.received_at
                        ).toLocaleString()
                      : "Not yet confirmed",
                },
              ].map((row) => (
                <Box
                  key={row.label}
                  sx={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    py: 1,
                    borderBottom:
                      "1px dashed #e5e7eb",
                  }}
                >
                  <Typography
                    color="text.secondary"
                  >
                    {row.label}
                  </Typography>

                  <Typography
                    fontWeight={600}
                  >
                    {row.value}
                  </Typography>
                </Box>
              ))}
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          {receiptAsset &&
            !receiptAsset.received_at && (
              <Button
                variant="contained"
                startIcon={
                  <ConfirmedIcon />
                }
                onClick={handleConfirmReceipt}
                disabled={confirming}
                sx={{
                  backgroundColor: "#2e7d32",
                  textTransform: "none",
                  fontWeight: 700,
                  "&:hover": {
                    backgroundColor: "#1b5e20",
                  },
                }}
              >
                {confirming
                  ? "Confirming..."
                  : "✓ Confirm Receipt"}
              </Button>
            )}

          <Button
            variant={
              receiptAsset &&
              !receiptAsset.received_at
                ? "outlined"
                : "contained"
            }
            onClick={() =>
              setReceiptAsset(null)
            }
            sx={{
              backgroundColor:
                receiptAsset &&
                !receiptAsset.received_at
                  ? "transparent"
                  : "#07548e",
              color:
                receiptAsset &&
                !receiptAsset.received_at
                  ? "#07548e"
                  : "#fff",
              borderColor:
                receiptAsset &&
                !receiptAsset.received_at
                  ? "#07548e"
                  : "transparent",
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeMyAssets;