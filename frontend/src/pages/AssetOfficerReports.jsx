import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material";

import {
  Assessment as ReportIcon,
  Inventory2 as AssetIcon,
  Assignment as AssignmentIcon,
  Build as MaintenanceIcon,
  KeyboardReturn as ReturnIcon,
  Refresh as RefreshIcon,
  ArrowBack,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import API from "../services/api";

const AssetOfficerReports = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [returns, setReturns] = useState([]);
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

  const fetchReports = async () => {
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
        assignmentsResponse,
        returnsResponse,
        maintenanceResponse,
      ] = await Promise.allSettled([
        API.get("/assets", { headers }),
        API.get("/assignments", { headers }),
        API.get("/returns", { headers }),
        API.get("/maintenance", { headers }),
      ]);

      if (assetsResponse.status === "fulfilled") {
        setAssets(
          getList(
            assetsResponse.value.data,
            "assets"
          )
        );
      }

      if (assignmentsResponse.status === "fulfilled") {
        setAssignments(
          getList(
            assignmentsResponse.value.data,
            "assignments"
          )
        );
      }

      if (returnsResponse.status === "fulfilled") {
        setReturns(
          getList(
            returnsResponse.value.data,
            "returns"
          )
        );
      }

      if (maintenanceResponse.status === "fulfilled") {
        setMaintenance(
          getList(
            maintenanceResponse.value.data,
            "maintenance"
          )
        );
      }
    } catch (err) {
      console.error(
        "Failed to load reports:",
        err
      );

      setError(
        err.response?.data?.error ||
          "Unable to load report information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // =====================================================
  // ASSET SUMMARY
  // =====================================================

  const availableAssets = assets.filter(
    (asset) =>
      String(asset.status || "").toLowerCase() ===
      "available"
  ).length;

  const assignedAssets = assets.filter(
    (asset) =>
      String(asset.status || "").toLowerCase() ===
      "assigned"
  ).length;

  const maintenanceAssets = assets.filter(
    (asset) =>
      [
        "maintenance",
        "under maintenance",
      ].includes(
        String(asset.status || "").toLowerCase()
      )
  ).length;

  const disposedAssets = assets.filter(
    (asset) =>
      String(asset.status || "").toLowerCase() ===
      "disposed"
  ).length;

  // =====================================================
  // ASSIGNMENT SUMMARY
  // =====================================================

  const activeAssignments = assignments.filter(
    (assignment) =>
      String(
        assignment.status || ""
      ).toLowerCase() === "active"
  ).length;

  const overdueAssignments = assignments.filter(
    (assignment) => {
      if (
        !assignment.expected_return_date ||
        String(
          assignment.status || ""
        ).toLowerCase() !== "active"
      ) {
        return false;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const returnDate = new Date(
        assignment.expected_return_date
      );
      returnDate.setHours(0, 0, 0, 0);

      return returnDate < today;
    }
  ).length;

  // =====================================================
  // MAINTENANCE SUMMARY
  // =====================================================

  const openMaintenance = maintenance.filter(
    (item) =>
      ![
        "completed",
        "closed",
        "resolved",
      ].includes(
        String(
          item.status || ""
        ).toLowerCase()
      )
  ).length;

  // =====================================================
  // TOTAL PURCHASE VALUE
  // =====================================================

  const totalPurchaseValue = assets.reduce(
    (total, asset) => {
      const value = Number(
        asset.purchase_cost || 0
      );

      return total + value;
    },
    0
  );

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
            Asset Reports
          </Typography>

          <Typography color="text.secondary">
            Overview of assets, assignments, returns and
            maintenance.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchReports}
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

      {error && (
        <Alert
          severity="warning"
          onClose={() => setError("")}
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      {/* ASSET REPORT */}

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
          mb: 3,
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
            <AssetIcon
              sx={{ color: "#07548e" }}
            />

            <Typography
              variant="h6"
              fontWeight={700}
            >
              Asset Summary
            </Typography>
          </Box>

          <Typography
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Current status of the organization's assets.
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            {[
              {
                title: "Total Assets",
                value: assets.length,
              },
              {
                title: "Available",
                value: availableAssets,
              },
              {
                title: "Assigned",
                value: assignedAssets,
              },
              {
                title: "Under Maintenance",
                value: maintenanceAssets,
              },
              {
                title: "Disposed",
                value: disposedAssets,
              },
            ].map((item) => (
              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  md: 4,
                  lg: 2.4,
                }}
                key={item.title}
              >
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: "#f8fafc",
                    border:
                      "1px solid #e5e7eb",
                  }}
                >
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
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* LIFECYCLE REPORT */}

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
          mb: 3,
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
            <AssignmentIcon
              sx={{ color: "#07548e" }}
            />

            <Typography
              variant="h6"
              fontWeight={700}
            >
              Asset Lifecycle
            </Typography>
          </Box>

          <Typography
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Assignment and return activity.
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Active Assignments
              </Typography>

              <Typography
                variant="h4"
                fontWeight={800}
                sx={{ mt: 1 }}
              >
                {activeAssignments}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Completed Returns
              </Typography>

              <Typography
                variant="h4"
                fontWeight={800}
                sx={{ mt: 1 }}
              >
                {returns.length}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Overdue Returns
              </Typography>

              <Typography
                variant="h4"
                fontWeight={800}
                sx={{
                  mt: 1,
                  color:
                    overdueAssignments > 0
                      ? "#d32f2f"
                      : "#1f2937",
                }}
              >
                {overdueAssignments}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* MAINTENANCE REPORT */}

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
          mb: 3,
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
            <MaintenanceIcon
              sx={{ color: "#07548e" }}
            />

            <Typography
              variant="h6"
              fontWeight={700}
            >
              Maintenance Summary
            </Typography>
          </Box>

          <Typography
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Current maintenance workload.
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Typography
            variant="h4"
            fontWeight={800}
          >
            {openMaintenance}
          </Typography>

          <Typography
            color="text.secondary"
          >
            Open maintenance records
          </Typography>
        </CardContent>
      </Card>

      {/* FINANCIAL SNAPSHOT */}

      <Card
        elevation={0}
        sx={{
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
            <ReportIcon
              sx={{ color: "#07548e" }}
            />

            <Typography
              variant="h6"
              fontWeight={700}
            >
              Financial Snapshot
            </Typography>
          </Box>

          <Typography
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Total recorded purchase value of assets.
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Typography
            variant="h4"
            fontWeight={800}
          >
            {totalPurchaseValue.toLocaleString()}
          </Typography>

          <Typography
            color="text.secondary"
          >
            Total purchase cost
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AssetOfficerReports;