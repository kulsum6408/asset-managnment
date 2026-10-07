import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  Button,
  Divider,
  Stack,
  TextField,
  MenuItem,
} from "@mui/material";

import {
  ArrowBack as ArrowBackIcon,
  Inventory2 as AssetIcon,
  AssignmentTurnedIn as AssignmentIcon,
  KeyboardReturn as ReturnIcon,
  SwapHoriz as TransferIcon,
  Build as MaintenanceIcon,
} from "@mui/icons-material";

import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";

const AssetOfficerAssetHistory = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [asset, setAsset] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [returns, setReturns] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [maintenance, setMaintenance] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getList = (data, key) => {
    if (Array.isArray(data)) return data;

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    if (Array.isArray(data?.[key])) {
      return data[key];
    }

    if (Array.isArray(data?.records)) {
      return data.records;
    }

    return [];
  };

  const fetchHistory = async () => {
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
        assetResponse,
        assignmentsResponse,
        returnsResponse,
        transfersResponse,
        maintenanceResponse,
      ] = await Promise.allSettled([
        API.get(`/assets/${id}`, { headers }),
        API.get("/assignments", { headers }),
        API.get("/returns", { headers }),
        API.get("/transfers", { headers }),
        API.get("/maintenance", { headers }),
      ]);

      // =====================================================
      // ASSET
      // =====================================================

      if (assetResponse.status === "fulfilled") {
        const data = assetResponse.value.data;

        const currentAsset =
          data?.data || data?.asset || data;

        setAsset(currentAsset);
      } else {
        setError(
          assetResponse.reason?.response?.data?.error ||
            "Unable to load asset."
        );
      }

      // =====================================================
      // ASSIGNMENTS
      // =====================================================

      if (assignmentsResponse.status === "fulfilled") {
        const list = getList(
          assignmentsResponse.value.data,
          "assignments"
        );

        setAssignments(
          list.filter(
            (item) =>
              String(item.asset_id) === String(id)
          )
        );
      }

      // =====================================================
      // RETURNS
      // =====================================================

      if (returnsResponse.status === "fulfilled") {
        const list = getList(
          returnsResponse.value.data,
          "returns"
        );

        setReturns(
          list.filter(
            (item) =>
              String(item.asset_id) === String(id)
          )
        );
      }

      // =====================================================
      // TRANSFERS
      // =====================================================

      if (transfersResponse.status === "fulfilled") {
        const list = getList(
          transfersResponse.value.data,
          "transfers"
        );

        setTransfers(
          list.filter(
            (item) =>
              String(item.asset_id) === String(id)
          )
        );
      }

      // =====================================================
      // MAINTENANCE
      // =====================================================

      if (maintenanceResponse.status === "fulfilled") {
        const list = getList(
          maintenanceResponse.value.data,
          "maintenance"
        );

        setMaintenance(
          list.filter(
            (item) =>
              String(item.asset_id) === String(id)
          )
        );
      }
    } catch (err) {
      console.error(
        "Failed to load asset history:",
        err
      );

      setError(
        err.response?.data?.error ||
          "Unable to load asset lifecycle history."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchHistory();
    }
  }, [id]);

  // =====================================================
  // BUILD TIMELINE
  // =====================================================

  const timeline = useMemo(() => {
    const events = [];

    if (asset?.created_at) {
      events.push({
        date: asset.created_at,
        title: "Asset Registered",
        description: `Asset "${asset.asset_name}" was registered.`,
        type: "asset",
        icon: <AssetIcon />,
      });
    }

    assignments.forEach((assignment) => {
      events.push({
        date:
          assignment.assignment_date ||
          assignment.created_at,

        title: "Asset Assigned",

        description: `Assigned to ${
          assignment.employee_name ||
          assignment.requester_name ||
          "employee"
        }.`,

        type: "assignment",

        icon: <AssignmentIcon />,
      });
    });

    returns.forEach((item) => {
      events.push({
        date:
          item.return_date ||
          item.created_at,

        title: "Asset Returned",

        description: `Asset returned in ${
          item.asset_condition ||
          "recorded condition"
        } condition.`,

        type: "return",

        icon: <ReturnIcon />,
      });
    });

    transfers.forEach((item) => {
      events.push({
        date:
          item.transfer_date ||
          item.created_at,

        title: "Asset Transferred",

        description: `Transferred from ${
          item.from_location ||
          item.from_employee_name ||
          "previous location"
        } to ${
          item.to_location ||
          item.to_employee_name ||
          "new location"
        }.`,

        type: "transfer",

        icon: <TransferIcon />,
      });
    });

    maintenance.forEach((item) => {
      events.push({
        date:
          item.created_at ||
          item.maintenance_date,

        title: "Maintenance Record",

        description:
          item.issue_type ||
          item.problem_type ||
          item.description ||
          `Maintenance status: ${
            item.status || "Recorded"
          }`,

        type: "maintenance",

        icon: <MaintenanceIcon />,
      });
    });

    return events
      .filter((event) => event.date)
      .sort(
        (a, b) =>
          new Date(a.date) -
          new Date(b.date)
      );
  }, [
    asset,
    assignments,
    returns,
    transfers,
    maintenance,
  ]);

  const getStatusColor = (status) => {
    const value = String(
      status || ""
    ).toLowerCase();

    if (value === "available") {
      return "success";
    }

    if (value === "assigned") {
      return "primary";
    }

    if (
      value === "maintenance" ||
      value === "under maintenance"
    ) {
      return "warning";
    }

    if (value === "disposed") {
      return "error";
    }

    return "default";
  };

  const getEventColor = (type) => {
    switch (type) {
      case "assignment":
        return "#1976d2";

      case "return":
        return "#2e7d32";

      case "transfer":
        return "#9c27b0";

      case "maintenance":
        return "#ed6c02";

      default:
        return "#07548e";
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
        <CircularProgress
          sx={{
            color: "#07548e",
          }}
        />
      </Box>
    );
  }

  if (!asset) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#f5f7fb",
          p: 4,
        }}
      >
        <Alert severity="error">
          {error || "Asset not found."}
        </Alert>
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
      {/* HEADER */}

      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() =>
          navigate("/asset-officer/assets")
        }
        sx={{
          mb: 2,
          color: "#07548e",
          textTransform: "none",
          fontWeight: 700,
        }}
      >
        Back to Assets
      </Button>

      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            color: "#1f2937",
            mb: 1,
          }}
        >
          Asset Lifecycle
        </Typography>

        <Typography color="text.secondary">
          Complete history of this asset.
        </Typography>
      </Box>

      {error && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      {/* ASSET SUMMARY */}

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
          mb: 4,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#e8f2fa",
                    color: "#07548e",
                  }}
                >
                  <AssetIcon fontSize="large" />
                </Box>

                <Box>
                  <Typography
                    variant="h5"
                    fontWeight={800}
                  >
                    {asset.asset_name}
                  </Typography>

                  <Typography color="text.secondary">
                    Serial Number:{" "}
                    {asset.serial_number ||
                      "N/A"}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Stack spacing={1}>
                <Typography color="text.secondary">
                  Current Status
                </Typography>

                <Box>
                  <Chip
                    label={
                      asset.status ||
                      "Unknown"
                    }
                    color={getStatusColor(
                      asset.status
                    )}
                    sx={{
                      fontWeight: 700,
                    }}
                  />
                </Box>
              </Stack>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Condition
              </Typography>

              <Typography fontWeight={700}>
                {asset.asset_condition ||
                  "N/A"}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Location
              </Typography>

              <Typography fontWeight={700}>
                {asset.location || "N/A"}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Purchase Date
              </Typography>

              <Typography fontWeight={700}>
                {asset.purchase_date
                  ? new Date(
                      asset.purchase_date
                    ).toLocaleDateString()
                  : "N/A"}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Purchase Cost
              </Typography>

              <Typography fontWeight={700}>
                {asset.purchase_cost !==
                null &&
                asset.purchase_cost !==
                  undefined
                  ? Number(
                      asset.purchase_cost
                    ).toLocaleString()
                  : "N/A"}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* LIFECYCLE COUNTERS */}

      <Grid
        container
        spacing={3}
        sx={{ mb: 4 }}
      >
        {[
          {
            title: "Assignments",
            value: assignments.length,
          },
          {
            title: "Returns",
            value: returns.length,
          },
          {
            title: "Transfers",
            value: transfers.length,
          },
          {
            title: "Maintenance Records",
            value: maintenance.length,
          },
        ].map((item) => (
          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 3,
            }}
            key={item.title}
          >
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border:
                  "1px solid #e5e7eb",
                backgroundColor:
                  "#ffffff",
              }}
            >
              <CardContent>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  {item.title}
                </Typography>

                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{ mt: 1 }}
                >
                  {item.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* TIMELINE */}

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography
            variant="h6"
            fontWeight={800}
            sx={{ mb: 4 }}
          >
            Lifecycle History
          </Typography>

          {timeline.length === 0 ? (
            <Typography color="text.secondary">
              No lifecycle history is available yet.
            </Typography>
          ) : (
            <Stack spacing={0}>
              {timeline.map(
                (event, index) => (
                  <Box
                    key={`${event.type}-${event.date}-${index}`}
                    sx={{
                      display: "flex",
                      gap: 2,
                      position: "relative",
                      pb:
                        index ===
                        timeline.length - 1
                          ? 0
                          : 4,
                    }}
                  >
                    {/* LINE */}

                    {index !==
                      timeline.length - 1 && (
                      <Box
                        sx={{
                          position:
                            "absolute",
                          left: 20,
                          top: 44,
                          bottom: 0,
                          width: 2,
                          backgroundColor:
                            "#e5e7eb",
                        }}
                      />
                    )}

                    {/* ICON */}

                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        minWidth: 42,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                          "center",
                        backgroundColor:
                          "#f0f6fa",
                        color:
                          getEventColor(
                            event.type
                          ),
                        position:
                          "relative",
                        zIndex: 1,
                      }}
                    >
                      {event.icon}
                    </Box>

                    {/* CONTENT */}

                    <Box sx={{ pt: 0.5 }}>
                      <Typography
                        fontWeight={800}
                      >
                        {event.title}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.3 }}
                      >
                        {new Date(
                          event.date
                        ).toLocaleString()}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 1,
                          color: "#374151",
                        }}
                      >
                        {event.description}
                      </Typography>
                    </Box>
                  </Box>
                )
              )}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default AssetOfficerAssetHistory;