import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";

import {
  AssignmentReturn as ReturnIcon,
  Inventory2 as AssetIcon,
  CalendarMonth as CalendarIcon,
  ArrowBack,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";

import API from "../services/api";

const EmployeeReturnAsset = () => {
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedAssignment, setSelectedAssignment] =
    useState(null);

  const [reason, setReason] = useState("");
  const [returning, setReturning] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);

  const fetchAssignments = async () => {
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

      const [assignmentsRes, requestsRes] =
        await Promise.all([
          API.get("/assignments", { headers }),
          API.get("/return-requests", { headers }),
        ]);

      const data = assignmentsRes.data;

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.assignments)
        ? data.assignments
        : [];

      console.log("Assignments received:", list);

      const activeAssignments = list.filter((assignment) => {
        const status = String(
          assignment.status || ""
        ).trim().toLowerCase();

        return (
          status === "active" ||
          status === "assigned"
        );
      });

      setAssignments(activeAssignments);

      const reqData = requestsRes.data;

      const reqList = Array.isArray(reqData)
        ? reqData
        : Array.isArray(reqData?.data)
        ? reqData.data
        : Array.isArray(reqData?.requests)
        ? reqData.requests
        : [];

      setPendingRequests(
        reqList.filter(
          (r) =>
            String(r.status || "").toLowerCase() ===
            "pending"
        )
      );
    } catch (err) {
      console.error(
        "Failed to load employee assignments:",
        err
      );

      setError(
        err.response?.data?.error ||
          "Unable to load your assigned assets."
      );
    } finally {
      setLoading(false);
    }
  };

  const hasPendingRequest = (assignmentId) =>
    pendingRequests.some(
      (r) => Number(r.assignment_id) === Number(assignmentId)
    );

  useEffect(() => {
    fetchAssignments();
  }, []);

  const getReturnStatus = (assignment) => {
    if (!assignment.expected_return_date) {
      return {
        label: "No Return Date",
        color: "default",
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const returnDate = new Date(
      assignment.expected_return_date
    );
    returnDate.setHours(0, 0, 0, 0);

    const difference = Math.floor(
      (today - returnDate) /
        (1000 * 60 * 60 * 24)
    );

    if (difference > 1) {
      return {
        label: "OVERDUE",
        color: "error",
      };
    }

    if (difference === 1) {
      return {
        label: "GRACE DAY",
        color: "warning",
      };
    }

    if (difference === 0) {
      return {
        label: "DUE TODAY",
        color: "warning",
      };
    }

    return {
      label: "ACTIVE",
      color: "success",
    };
  };

  const handleOpenReturn = (assignment) => {
    setSelectedAssignment(assignment);
    setReason("");
  };

  const handleCloseReturn = () => {
    if (returning) return;

    setSelectedAssignment(null);
    setReason("");
  };

  const handleReturn = async () => {
    if (!selectedAssignment) {
      return;
    }

    try {
      setReturning(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("You are not logged in.");
        return;
      }

      /*
        Employee submits a RETURN REQUEST (not an immediate
        return). The request is created with status 'Pending'
        and the Asset Officer is notified. The asset is NOT
        marked Available here.
      */

      await API.post(
        "/return-requests",
        {
          assignment_id:
            selectedAssignment.assignment_id,
          reason: reason.trim() || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSelectedAssignment(null);
      setReason("");

      await fetchAssignments();

      alert(
        "Return request submitted successfully. " +
          "The Asset Officer has been notified."
      );
    } catch (err) {
      console.error(
        "Failed to submit return request:",
        err
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to submit the return request."
      );
    } finally {
      setReturning(false);
    }
  };

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
          sx={{ color: "#07548e" }}
        />
      </Box>
    );
  }

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

      <Typography
        variant="h4"
        sx={{
          fontWeight: 800,
          color: "#1f2937",
          mb: 1,
        }}
      >
        Return Asset
      </Typography>

      <Typography
        sx={{
          color: "#6b7280",
          mb: 4,
        }}
      >
        View your assigned assets and return them before
        the deadline.
      </Typography>

      {/* ERROR */}

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
          }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {/* NO ASSETS */}

      {assignments.length === 0 ? (
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
            <AssetIcon
              sx={{
                fontSize: 65,
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
              No Assigned Assets
            </Typography>

            <Typography
              color="text.secondary"
            >
              You currently have no active assets assigned
              to you.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {assignments.map((assignment) => {
            const status =
              getReturnStatus(assignment);

            return (
              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  lg: 4,
                }}
                key={assignment.assignment_id}
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
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "flex-start",
                        mb: 3,
                      }}
                    >
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                          }}
                        >
                          {assignment.asset_name ||
                            "Assigned Asset"}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          Serial:{" "}
                          {assignment.serial_number ||
                            "N/A"}
                        </Typography>
                      </Box>

                      <Chip
                        label={status.label}
                        color={status.color}
                        size="small"
                        sx={{
                          fontWeight: 700,
                        }}
                      />
                    </Box>

                    <Box sx={{ mb: 1.5 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Assignment Date
                      </Typography>

                      <Typography fontWeight={600}>
                        {assignment.assignment_date
                          ? new Date(
                              assignment.assignment_date
                            ).toLocaleDateString()
                          : "Not available"}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Expected Return Date
                      </Typography>

                      <Typography
                        fontWeight={700}
                        sx={{
                          display: "flex",
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

                        {assignment.expected_return_date
                          ? new Date(
                              assignment.expected_return_date
                            ).toLocaleDateString()
                          : "Not specified"}
                      </Typography>
                    </Box>

                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={
                        <ReturnIcon />
                      }
                      onClick={() =>
                        handleOpenReturn(
                          assignment
                        )
                      }
                      disabled={hasPendingRequest(
                        assignment.assignment_id
                      )}
                      sx={{
                        backgroundColor:
                          "#07548e",
                        textTransform:
                          "none",
                        fontWeight: 700,

                        "&:hover": {
                          backgroundColor:
                            "#064675",
                        },
                      }}
                    >
                      {hasPendingRequest(
                        assignment.assignment_id
                      )
                        ? "Return Request Pending"
                        : "Return Asset"}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* RETURN DIALOG */}

      <Dialog
        open={Boolean(selectedAssignment)}
        onClose={handleCloseReturn}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
          }}
        >
          Return Asset
        </DialogTitle>

        <DialogContent>
          <Typography
            sx={{
              mb: 3,
              color: "#6b7280",
            }}
          >
            Returning:{" "}
            <strong>
              {selectedAssignment?.asset_name}
            </strong>
          </Typography>

          <TextField
            fullWidth
            multiline
            minRows={4}
            label="Reason for Return"
            placeholder="Add any information about why you are returning the asset..."
            value={reason}
            onChange={(e) =>
              setReason(e.target.value)
            }
          />

          <Typography
            mt={2}
            variant="body2"
            color="text.secondary"
          >
            Your request will be reviewed by the Asset
            Officer. The asset will only be marked
            available after the return is processed.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleCloseReturn}
            disabled={returning}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleReturn}
            disabled={returning}
            sx={{
              backgroundColor: "#07548e",
              "&:hover": {
                backgroundColor:
                  "#064675",
              },
            }}
          >
            {returning
              ? "Submitting..."
              : "Submit Return Request"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeReturnAsset;