import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import {
  AssignmentTurnedIn as AssignmentIcon,
  Refresh as RefreshIcon,
  EventAvailable as AssignIcon,
  Person as PersonIcon,
  Inventory2 as AssetIcon,
  CalendarMonth as CalendarIcon,
  ArrowBack,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import API from "../services/api";

const AssetOfficerAssignments = () => {
  const navigate = useNavigate();
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selected, setSelected] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [assignmentDate, setAssignmentDate] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getList = (data, key) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.[key])) return data[key];
    return [];
  };

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

      const [requestsResponse] =
        await Promise.all([
          API.get("/requests", { headers }),
        ]);

      const requests = getList(
        requestsResponse.data,
        "requests"
      );

      // Only Approved requests that are not yet assigned
      const approved = requests.filter(
        (request) =>
          String(request.status || "")
            .trim()
            .toLowerCase() === "approved"
      );

      setApprovedRequests(approved);
    } catch (err) {
      console.error(
        "Failed to load assignment data:",
        err
      );

      setError(
        err.response?.data?.error ||
          "Unable to load assignment information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAssignForm = (request) => {
    setSelected(request);
    setSelectedAssetId(request.asset_id || "");
    setError("");
    setSuccess("");

    // Default assignment date = now (YYYY-MM-DD for input)
    const now = new Date();
    setAssignmentDate(
      now.toISOString().slice(0, 10)
    );

    setOpenForm(true);
  };

  const handleAssign = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!selected) {
      setError("Please select an approved request.");
      return;
    }

    try {
      setSubmitting(true);

      const token = localStorage.getItem("token");

      if (!token) {
        setError("You are not logged in.");
        return;
      }

      const response = await API.post(
        "/assignments",
        {
          user_id: selected.user_id,
          asset_id: Number(selectedAssetId),
          request_id: selected.request_id,
          assignment_date: new Date().toISOString(),
          notes: null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        response.data?.message ||
          "Asset assigned successfully."
      );

      setOpenForm(false);
      setSelected(null);
      setSelectedAssetId("");

      await fetchData();
    } catch (err) {
      console.error(
        "Failed to assign asset:",
        err
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to assign the asset."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Not specified";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString();
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "Not specified";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleString();
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
            Assign Assets
          </Typography>

          <Typography
            sx={{
              color: "#6b7280",
            }}
          >
            Assign available assets to approved employee
            requests.
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
          sx={{ mb: 3, borderRadius: 2 }}
        >
          {success}
        </Alert>
      )}

      {error && (
        <Alert
          severity="error"
          onClose={() => setError("")}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          {error}
        </Alert>
      )}

      {/* EMPTY STATE */}

      {approvedRequests.length === 0 ? (
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
            <AssignmentIcon
              sx={{
                fontSize: 56,
                color: "#07548e",
                mb: 2,
              }}
            />
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, mb: 1 }}
            >
              No Approved Requests
            </Typography>
            <Typography color="text.secondary">
              There are currently no approved employee
              requests waiting to be assigned. Pending,
              rejected, cancelled, and already-assigned
              requests are not shown here.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* SUMMARY */}

          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid #e5e7eb",
              mb: 3,
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <AssignmentIcon
                  sx={{ color: "#07548e" }}
                />
                <Box>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                  >
                    Approved Requests
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    {approvedRequests.length} approved
                    request
                    {approvedRequests.length === 1
                      ? ""
                      : "s"}{" "}
                    waiting for asset assignment.
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* APPROVED REQUESTS LIST */}

          <Grid container spacing={3}>
            {approvedRequests.map((request) => (
              <Grid
                key={request.request_id}
                size={{ xs: 12, md: 6, lg: 4 }}
              >
                <Card
                  elevation={0}
                  sx={{
                    height: "100%",
                    borderRadius: 3,
                    border: "2px solid #2e7d32",
                    backgroundColor: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <CardContent
                    sx={{ flexGrow: 1, p: 3 }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 1,
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="h6"
                        fontWeight={800}
                      >
                        {request.asset_name ||
                          "Asset Request"}
                      </Typography>
                      <Chip
                        label="APPROVED"
                        color="success"
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>

                    <Stack spacing={1}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        <strong>Request ID:</strong>{" "}
                        {request.request_id}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        <PersonIcon fontSize="small" />
                        <strong>Employee:</strong>{" "}
                        {request.requester_name ||
                          request.employee_name ||
                          "N/A"}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        <AssetIcon fontSize="small" />
                        <strong>
                          Requested Asset:
                        </strong>{" "}
                        {request.asset_name ||
                          "N/A"}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        <CalendarIcon fontSize="small" />
                        <strong>
                          Request Date:
                        </strong>{" "}
                        {formatDate(
                          request.request_date
                        )}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        <CalendarIcon fontSize="small" />
                        <strong>Approved Date:</strong>{" "}
                        {formatDateTime(
                          request.approved_at
                        )}
                      </Typography>

                      {request.expected_return_date && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <CalendarIcon fontSize="small" />
                          <strong>
                            Expected Return:
                          </strong>{" "}
                          {formatDate(
                            request.expected_return_date
                          )}
                        </Typography>
                      )}

                      {request.reason && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 1 }}
                        >
                          <strong>Reason:</strong>{" "}
                          {request.reason}
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>

                  <Box sx={{ px: 3, pb: 3 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<AssignIcon />}
                      onClick={() =>
                        openAssignForm(request)
                      }
                      sx={{
                        my: 0,
                        py: 1.2,
                        backgroundColor: "#07548e",
                        textTransform: "none",
                        fontWeight: 700,
                        "&:hover": {
                          backgroundColor: "#064a7a",
                        },
                      }}
                    >
                      Assign Asset
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* ASSIGNMENT FORM DIALOG */}

      <Dialog
        open={openForm}
        onClose={() => {
          if (!submitting) {
            setOpenForm(false);
            setSelected(null);
          }
        }}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#07548e" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <AssignIcon />
            Assign Asset
          </Box>
        </DialogTitle>

        <DialogContent>
          {selected && (
            <Box
              component="form"
              onSubmit={handleAssign}
            >
              {/* REQUEST SUMMARY */}

              <Card
                elevation={0}
                sx={{
                  mb: 3,
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e5e7eb",
                }}
              >
                <Stack spacing={1}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography fontWeight={800}>
                      Request #{selected.request_id}
                    </Typography>
                    <Chip
                      label="APPROVED"
                      color="success"
                      size="small"
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    <strong>Employee:</strong>{" "}
                    {selected.requester_name ||
                      selected.employee_name ||
                      "N/A"}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    <strong>Approved Date:</strong>{" "}
                    {formatDateTime(
                      selected.approved_at
                    )}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    <strong>Asset to Assign:</strong>{" "}
                    {selected.asset_name ||
                      "N/A"}
                    {selected.serial_number
                      ? ` — ${selected.serial_number}`
                      : ""}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    <strong>
                      Expected Return:
                    </strong>{" "}
                    {formatDate(
                      selected.expected_return_date
                    )}
                  </Typography>
                </Stack>
              </Card>

              {/* ASSIGNMENT DATE (read-only display of save date) */}

              <TextField
                fullWidth
                label="Assignment Date"
                value={assignmentDate}
                onChange={(e) =>
                  setAssignmentDate(
                    e.target.value
                  )
                }
                InputProps={{ readOnly: true }}
                helperText={
                  <Box component="span">
                    Saved in DATETIME format, e.g.{" "}
                    {new Date().toISOString().slice(0,19).replace("T", " ")}
                  </Box>
                }
                sx={{ mb: 3 }}
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => {
              setOpenForm(false);
              setSelected(null);
            }}
            disabled={submitting}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAssign}
            disabled={submitting}
            sx={{
              backgroundColor: "#07548e",
              textTransform: "none",
              fontWeight: 700,
              "&:hover": {
                backgroundColor: "#064a7a",
              },
            }}
          >
            {submitting
              ? "Assigning..."
              : "Assign Asset"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* WORKFLOW CARD */}

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
            sx={{ fontWeight: 700, mb: 1 }}
          >
            Assignment Workflow
          </Typography>

          <Typography color="text.secondary">
            Employee request → Manager approves → Asset
            Officer assigns available asset → Asset becomes
            Assigned → Bin Card OUT → Employee notified →
            Asset appears in My Assets → Return date → Reminder
            → 1-day grace → Overdue if not returned.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AssetOfficerAssignments;
