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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from "@mui/material";

import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
} from "@mui/icons-material";

import API from "../services/api";
import BackButton from "../components/BackButton";

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [openView, setOpenView] = useState(false);

  const [openAction, setOpenAction] = useState(false);
  const [actionType, setActionType] = useState("");
  const [remarks, setRemarks] = useState("");
  const [savingAction, setSavingAction] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [userRole] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user.role || "";
    } catch {
      return "";
    }
  });

  const isAdmin = userRole === "admin";

  // =====================================================
  // GET REQUESTS
  // =====================================================
  const fetchRequests = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        setRequests([]);
        setErrorMessage("You are not logged in.");
        return;
      }

      const response = await API.get("/requests", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("REQUESTS RESPONSE:", response.data);

      const data = response.data;

      if (Array.isArray(data)) {
        setRequests(data);
      } else if (Array.isArray(data.requests)) {
        setRequests(data.requests);
      } else if (Array.isArray(data.data)) {
        setRequests(data.data);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error("Failed to load requests:", error);

      setRequests([]);

      setErrorMessage(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to load requests."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // =====================================================
  // SEARCH + FILTER
  // =====================================================
  const filteredRequests = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return requests.filter((request) => {
      const requesterName = String(
        request.requester_name || ""
      ).toLowerCase();

      const requesterEmail = String(
        request.requester_email || ""
      ).toLowerCase();

      const assetName = String(
        request.asset_name || ""
      ).toLowerCase();

      const serialNumber = String(
        request.serial_number || ""
      ).toLowerCase();

      const reason = String(
        request.reason || ""
      ).toLowerCase();

      const status = String(
        request.status || ""
      );

      const matchesSearch =
        requesterName.includes(searchText) ||
        requesterEmail.includes(searchText) ||
        assetName.includes(searchText) ||
        serialNumber.includes(searchText) ||
        reason.includes(searchText);

      const matchesStatus =
        statusFilter === "All" ||
        status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, search, statusFilter]);

  // =====================================================
  // STATUS COUNTS
  // =====================================================
  const statusCounts = {
    All: requests.length,
    Pending: requests.filter(
      (request) => request.status === "Pending"
    ).length,
    Approved: requests.filter(
      (request) => request.status === "Approved"
    ).length,
    Rejected: requests.filter(
      (request) => request.status === "Rejected"
    ).length,
  };

  // =====================================================
  // STATUS COLOR
  // =====================================================
  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "warning";

      case "Approved":
        return "success";

      case "Rejected":
        return "error";

      default:
        return "default";
    }
  };

  // =====================================================
  // VIEW REQUEST
  // =====================================================
  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setOpenView(true);
  };

  const handleCloseView = () => {
    setOpenView(false);
    setSelectedRequest(null);
  };

  // =====================================================
  // OPEN APPROVE / REJECT
  // =====================================================
  const handleOpenAction = (request, type) => {
    setSelectedRequest(request);
    setActionType(type);
    setRemarks("");
    setOpenAction(true);
  };

  const handleCloseAction = () => {
    if (savingAction) return;

    setOpenAction(false);
    setSelectedRequest(null);
    setActionType("");
    setRemarks("");
  };

  // =====================================================
  // APPROVE / REJECT REQUEST
  // =====================================================
  const handleAction = async () => {
    if (!selectedRequest) return;

    try {
      setSavingAction(true);
      setErrorMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        setErrorMessage("You are not logged in.");
        return;
      }

      const endpoint =
        actionType === "approve"
          ? `/requests/${selectedRequest.request_id}/approve`
          : `/requests/${selectedRequest.request_id}/reject`;

      await API.put(
        endpoint,
        {
          remarks: remarks.trim() || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      handleCloseAction();

      await fetchRequests();
    } catch (error) {
      console.error(
        "Failed to update request:",
        error
      );

      setErrorMessage(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to update request."
      );
    } finally {
      setSavingAction(false);
    }
  };

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
      {/* =================================================
          HEADER
      ================================================= */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          alignItems: "flex-start",
        }}
      >
        <BackButton to="/admin" />

        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: "#1f2937",
            }}
          >
            Requests
          </Typography>

          <Typography
            sx={{
              color: "#6b7280",
              mt: 0.5,
            }}
          >
            Monitor employee asset requests and approvals.
          </Typography>
        </Box>
      </Box>

      {/* =================================================
          ERROR
      ================================================= */}
      {errorMessage && (
        <Card
          elevation={0}
          sx={{
            mb: 3,
            borderRadius: 2,
            border: "1px solid #fecaca",
            backgroundColor: "#fef2f2",
          }}
        >
          <CardContent>
            <Typography color="error">
              {errorMessage}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* =================================================
          STATUS SUMMARY
      ================================================= */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            sm: "repeat(4, 1fr)",
          },
          gap: 2,
          mb: 3,
        }}
      >
        {["All", "Pending", "Approved", "Rejected"].map(
          (status) => (
            <Card
              key={status}
              onClick={() => setStatusFilter(status)}
              elevation={0}
              sx={{
                cursor: "pointer",
                borderRadius: 3,
                border:
                  statusFilter === status
                    ? "2px solid #07548e"
                    : "1px solid #e5e7eb",
                backgroundColor: "#ffffff",
              }}
            >
              <CardContent>
                <Typography
                  variant="body2"
                  sx={{
                    color: "#6b7280",
                    mb: 1,
                  }}
                >
                  {status}
                </Typography>

                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    color: "#1f2937",
                  }}
                >
                  {statusCounts[status]}
                </Typography>
              </CardContent>
            </Card>
          )
        )}
      </Box>

      {/* =================================================
          SEARCH + FILTER
      ================================================= */}
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
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <TextField
              fullWidth
              placeholder="Search requests..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              sx={{
                flex: 1,
                minWidth: 240,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      sx={{
                        color: "#6b7280",
                      }}
                    />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl
              sx={{
                minWidth: 200,
              }}
            >
              <InputLabel>Status</InputLabel>

              <Select
                value={statusFilter}
                label="Status"
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                sx={{
                  borderRadius: 2,
                }}
              >
                <MenuItem value="All">
                  All Requests
                </MenuItem>

                <MenuItem value="Pending">
                  Pending
                </MenuItem>

                <MenuItem value="Approved">
                  Approved
                </MenuItem>

                <MenuItem value="Rejected">
                  Rejected
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* =================================================
          REQUEST TABLE
      ================================================= */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                py: 8,
              }}
            >
              <CircularProgress
                sx={{
                  color: "#07548e",
                }}
              />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow
                    sx={{
                      backgroundColor: "#f8fafc",
                    }}
                  >
                    <TableCell sx={{ fontWeight: 700 }}>
                      Requester
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>
                      Asset
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>
                      Date
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>
                      Reason
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>
                      Status
                    </TableCell>

                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700 }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredRequests.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        align="center"
                        sx={{
                          py: 7,
                          color: "#6b7280",
                        }}
                      >
                        No requests found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRequests.map((request) => {
                      const isPending =
                        request.status === "Pending";

                      return (
                        <TableRow
                          key={request.request_id}
                          hover
                        >
                          <TableCell>
                            <Typography
                              sx={{
                                fontWeight: 600,
                              }}
                            >
                              {request.requester_name ||
                                "Unknown"}
                            </Typography>

                            <Typography
                              variant="body2"
                              sx={{
                                color: "#6b7280",
                              }}
                            >
                              {request.requester_email ||
                                ""}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Typography
                              sx={{
                                fontWeight: 600,
                              }}
                            >
                              {request.asset_name ||
                                "Unknown Asset"}
                            </Typography>

                            <Typography
                              variant="body2"
                              sx={{
                                color: "#6b7280",
                              }}
                            >
                              {request.serial_number ||
                                ""}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            {request.request_date
                              ? new Date(
                                  request.request_date
                                ).toLocaleDateString()
                              : "-"}
                          </TableCell>

                          <TableCell>
                            {request.reason || "-"}
                          </TableCell>

                          <TableCell>
                            <Chip
                              label={
                                request.status ||
                                "Unknown"
                              }
                              color={getStatusColor(
                                request.status
                              )}
                              size="small"
                              sx={{
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>

                          <TableCell align="center">
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<ViewIcon />}
                              onClick={() =>
                                handleViewRequest(
                                  request
                                )
                              }
                              sx={{
                                mr: 1,
                                textTransform: "none",
                                color: "#07548e",
                                borderColor: "#07548e",
                              }}
                            >
                              View
                            </Button>

                            {isPending && !isAdmin && (
                              <>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  startIcon={
                                    <ApproveIcon />
                                  }
                                  onClick={() =>
                                    handleOpenAction(
                                      request,
                                      "approve"
                                    )
                                  }
                                  sx={{
                                    mr: 1,
                                    textTransform: "none",
                                  }}
                                >
                                  Approve
                                </Button>

                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  startIcon={
                                    <RejectIcon />
                                  }
                                  onClick={() =>
                                    handleOpenAction(
                                      request,
                                      "reject"
                                    )
                                  }
                                  sx={{
                                    textTransform: "none",
                                  }}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* =================================================
          VIEW REQUEST
      ================================================= */}
      <Dialog
        open={openView}
        onClose={handleCloseView}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Request Details
        </DialogTitle>

        <DialogContent>
          {selectedRequest && (
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                }}
              >
                Request #{selectedRequest.request_id}
              </Typography>

              <Divider sx={{ mb: 2 }} />

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "1fr 1fr",
                  },
                  gap: 2,
                }}
              >
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Requester
                  </Typography>

                  <Typography>
                    {selectedRequest.requester_name ||
                      "-"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Email
                  </Typography>

                  <Typography>
                    {selectedRequest.requester_email ||
                      "-"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Asset
                  </Typography>

                  <Typography>
                    {selectedRequest.asset_name ||
                      "-"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Serial Number
                  </Typography>

                  <Typography>
                    {selectedRequest.serial_number ||
                      "-"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Status
                  </Typography>

                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={
                        selectedRequest.status ||
                        "Unknown"
                      }
                      color={getStatusColor(
                        selectedRequest.status
                      )}
                      size="small"
                    />
                  </Box>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Request Date
                  </Typography>

                  <Typography>
                    {selectedRequest.request_date
                      ? new Date(
                          selectedRequest.request_date
                        ).toLocaleString()
                      : "-"}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    gridColumn: {
                      xs: "auto",
                      sm: "1 / -1",
                    },
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Reason
                  </Typography>

                  <Typography>
                    {selectedRequest.reason || "-"}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    gridColumn: {
                      xs: "auto",
                      sm: "1 / -1",
                    },
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Remarks
                  </Typography>

                  <Typography>
                    {selectedRequest.remarks || "-"}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleCloseView}
            sx={{
              textTransform: "none",
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* =================================================
          APPROVE / REJECT DIALOG
      ================================================= */}
      <Dialog
        open={openAction}
        onClose={handleCloseAction}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {actionType === "approve"
            ? "Approve Request"
            : "Reject Request"}
        </DialogTitle>

        <DialogContent>
          <Typography
            sx={{
              mb: 2,
              color: "#4b5563",
            }}
          >
            {actionType === "approve"
              ? "Confirm that you want to approve this asset request."
              : "Confirm that you want to reject this asset request."}
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Remarks"
            value={remarks}
            onChange={(event) =>
              setRemarks(event.target.value)
            }
            placeholder="Optional remarks..."
          />
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleCloseAction}
            disabled={savingAction}
            sx={{
              textTransform: "none",
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color={
              actionType === "approve"
                ? "success"
                : "error"
            }
            onClick={handleAction}
            disabled={savingAction}
            sx={{
              textTransform: "none",
            }}
          >
            {savingAction
              ? "Saving..."
              : actionType === "approve"
              ? "Approve"
              : "Reject"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Requests;