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
  MenuItem,
  Stack,
} from "@mui/material";

import {
  Build as MaintenanceIcon,
  Refresh as RefreshIcon,
  PlayArrow as StartIcon,
  CheckCircle as CompleteIcon,
  ArrowBack,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import API from "../services/api";

const MaintenanceOfficerRequests = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [notes, setNotes] = useState("");

  const getList = (data) => {
    if (Array.isArray(data)) return data;

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    if (Array.isArray(data?.maintenance)) {
      return data.maintenance;
    }

    if (Array.isArray(data?.records)) {
      return data.records;
    }

    return [];
  };

  // =====================================================
  // LOAD MAINTENANCE RECORDS
  // =====================================================

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("You are not logged in.");
        return;
      }

      const response = await API.get("/maintenance", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const list = getList(response.data);

      setRecords(list);
    } catch (err) {
      console.error(
        "Failed to load maintenance requests:",
        err
      );

      setError(
        err.response?.data?.error ||
          "Unable to load maintenance requests."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // =====================================================
  // STATUS
  // =====================================================

  const getStatusColor = (status) => {
    const value = String(
      status || ""
    ).toLowerCase();

    if (
      value === "completed" ||
      value === "resolved" ||
      value === "closed"
    ) {
      return "success";
    }

    if (
      value === "in progress" ||
      value === "ongoing"
    ) {
      return "warning";
    }

    if (
      value === "pending" ||
      value === "open"
    ) {
      return "error";
    }

    return "default";
  };

  // =====================================================
  // OPEN STATUS DIALOG
  // =====================================================

  const openStatusDialog = (record, status) => {
    setSelectedRecord(record);
    setNewStatus(status);
    setNotes("");
    setError("");
    setSuccess("");
    setDialogOpen(true);
  };

  const closeStatusDialog = () => {
    if (processingId) return;

    setDialogOpen(false);
    setSelectedRecord(null);
    setNewStatus("");
    setNotes("");
  };

  // =====================================================
  // UPDATE STATUS
  // =====================================================

  const handleUpdateStatus = async () => {
    if (!selectedRecord) {
      return;
    }

    const maintenanceId =
      selectedRecord.maintenance_id ||
      selectedRecord.id;

    if (!maintenanceId) {
      setError("Maintenance record ID is missing.");
      return;
    }

    try {
      setProcessingId(maintenanceId);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("You are not logged in.");
        return;
      }

      /*
       * This uses the common REST pattern:
       * PUT /api/maintenance/:id
       *
       * If your existing maintenance controller uses
       * a different endpoint or field names, this one
       * request is the part that must be matched to it.
       */

      const response = await API.put(
        `/maintenance/${maintenanceId}`,
        {
          status: newStatus,
          notes: notes.trim() || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        response.data?.message ||
          "Maintenance status updated successfully."
      );

      closeStatusDialog();

      await fetchRecords();
    } catch (err) {
      console.error(
        "Failed to update maintenance:",
        err
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to update maintenance status."
      );
    } finally {
      setProcessingId(null);
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
          sx={{ color: "#07548e" }}
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
        onClick={() => navigate("/maintenance-officer")}
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
            Maintenance Requests
          </Typography>

          <Typography color="text.secondary">
            Manage employee-reported asset problems and
            repair work.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchRecords}
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

      {/* RECORDS */}

      {records.length === 0 ? (
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
            <MaintenanceIcon
              sx={{
                fontSize: 60,
                color: "#07548e",
                mb: 2,
              }}
            />

            <Typography
              variant="h6"
              fontWeight={700}
              sx={{ mb: 1 }}
            >
              No Maintenance Requests
            </Typography>

            <Typography color="text.secondary">
              There are currently no maintenance records.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {records.map((record, index) => {
            const status =
              record.status || "Pending";

            const normalizedStatus =
              String(status).toLowerCase();

            const id =
              record.maintenance_id ||
              record.id ||
              index;

            const canStart =
              normalizedStatus === "pending" ||
              normalizedStatus === "open" ||
              normalizedStatus === "scheduled";

            const canComplete =
              normalizedStatus === "in progress" ||
              normalizedStatus === "ongoing";

            return (
              <Card
                key={id}
                elevation={0}
                sx={{
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
                      alignItems: {
                        xs: "flex-start",
                        md: "center",
                      },
                      flexDirection: {
                        xs: "column",
                        md: "row",
                      },
                      gap: 3,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="h6"
                        fontWeight={700}
                      >
                        {record.asset_name ||
                          "Asset"}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Serial:{" "}
                        {record.serial_number ||
                          "N/A"}
                      </Typography>

                      {record.employee_name && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          Reported by:{" "}
                          {record.employee_name}
                        </Typography>
                      )}

                      <Typography
                        sx={{
                          mt: 2,
                          color: "#374151",
                        }}
                      >
                        <strong>
                          Problem:
                        </strong>{" "}
                        {record.issue_type ||
                          record.problem_type ||
                          record.description ||
                          "No description"}
                      </Typography>

                      {record.priority && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 1 }}
                        >
                          Priority:{" "}
                          {record.priority}
                        </Typography>
                      )}

                      {record.notes && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 1 }}
                        >
                          Notes:{" "}
                          {record.notes}
                        </Typography>
                      )}
                    </Box>

                    <Box
                      sx={{
                        minWidth: {
                          xs: "100%",
                          md: 190,
                        },
                      }}
                    >
                      <Chip
                        label={status}
                        color={getStatusColor(
                          status
                        )}
                        sx={{
                          fontWeight: 700,
                          mb: 2,
                        }}
                      />

                      {canStart && (
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<StartIcon />}
                          onClick={() =>
                            openStatusDialog(
                              record,
                              "In Progress"
                            )
                          }
                          sx={{
                            mb: 1,
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
                          Start Repair
                        </Button>
                      )}

                      {canComplete && (
                        <Button
                          fullWidth
                          variant="contained"
                          color="success"
                          startIcon={
                            <CompleteIcon />
                          }
                          onClick={() =>
                            openStatusDialog(
                              record,
                              "Completed"
                            )
                          }
                          sx={{
                            textTransform:
                              "none",
                            fontWeight: 700,
                          }}
                        >
                          Complete Repair
                        </Button>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      {/* STATUS DIALOG */}

      <Dialog
        open={dialogOpen}
        onClose={closeStatusDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{ fontWeight: 800 }}
        >
          {newStatus === "In Progress"
            ? "Start Repair"
            : "Complete Repair"}
        </DialogTitle>

        <DialogContent>
          <Typography
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Asset:{" "}
            <strong>
              {selectedRecord?.asset_name ||
                "Asset"}
            </strong>
          </Typography>

          <TextField
            fullWidth
            select
            label="Status"
            value={newStatus}
            onChange={(e) =>
              setNewStatus(e.target.value)
            }
            sx={{ mb: 3 }}
          >
            <MenuItem value="In Progress">
              In Progress
            </MenuItem>

            <MenuItem value="Completed">
              Completed
            </MenuItem>
          </TextField>

          <TextField
            fullWidth
            multiline
            minRows={4}
            label="Maintenance Notes"
            placeholder="Describe the repair work, findings, or completion notes..."
            value={notes}
            onChange={(e) =>
              setNotes(e.target.value)
            }
          />
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={closeStatusDialog}
            disabled={Boolean(
              processingId
            )}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleUpdateStatus}
            disabled={Boolean(
              processingId
            )}
            sx={{
              backgroundColor: "#07548e",
              textTransform: "none",
              fontWeight: 700,

              "&:hover": {
                backgroundColor: "#064675",
              },
            }}
          >
            {processingId
              ? "Saving..."
              : "Save Status"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MaintenanceOfficerRequests;