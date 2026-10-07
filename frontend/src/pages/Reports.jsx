import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Chip,
} from "@mui/material";

import {
  Inventory2 as AssetIcon,
  People as UserIcon,
  Assignment as RequestIcon,
  Build as MaintenanceIcon,
} from "@mui/icons-material";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

import API from "../services/api";

const Reports = () => {
  const [dashboard, setDashboard] = useState(null);
  const [assetReport, setAssetReport] = useState([]);
  const [maintenanceReport, setMaintenanceReport] = useState([]);
  const [requestReport, setRequestReport] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // =====================================================
  // LOAD REPORTS
  // =====================================================
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const token = localStorage.getItem("token");

        if (!token) {
          setErrorMessage("You are not logged in.");
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [
          dashboardResponse,
          assetResponse,
          maintenanceResponse,
          requestResponse,
        ] = await Promise.all([
          API.get("/reports/dashboard", { headers }),
          API.get("/reports/assets", { headers }),
          API.get("/reports/maintenance", { headers }),
          API.get("/reports/requests", { headers }),
        ]);

        console.log(
          "DASHBOARD:",
          dashboardResponse.data
        );

        console.log(
          "ASSET REPORT:",
          assetResponse.data
        );

        console.log(
          "MAINTENANCE REPORT:",
          maintenanceResponse.data
        );

        console.log(
          "REQUEST REPORT:",
          requestResponse.data
        );

        setDashboard(dashboardResponse.data);

        const assetData = assetResponse.data;

        setAssetReport(
          Array.isArray(assetData)
            ? assetData
            : Array.isArray(assetData.data)
            ? assetData.data
            : Array.isArray(assetData.assets)
            ? assetData.assets
            : []
        );

        const maintenanceData =
          maintenanceResponse.data;

        setMaintenanceReport(
          Array.isArray(maintenanceData)
            ? maintenanceData
            : Array.isArray(maintenanceData.data)
            ? maintenanceData.data
            : []
        );

        const requestData =
          requestResponse.data;

        setRequestReport(
          Array.isArray(requestData)
            ? requestData
            : Array.isArray(requestData.data)
            ? requestData.data
            : []
        );
      } catch (error) {
        console.error(
          "Failed to load reports:",
          error
        );

        setErrorMessage(
          error.response?.data?.error ||
            error.response?.data?.message ||
            "Failed to load reports."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  // =====================================================
  // HELPER
  // =====================================================
  const getDashboardValue = (keys) => {
    if (!dashboard) return 0;

    for (const key of keys) {
      if (
        dashboard[key] !== undefined &&
        dashboard[key] !== null
      ) {
        return Number(dashboard[key]) || 0;
      }
    }

    if (dashboard.data) {
      for (const key of keys) {
        if (
          dashboard.data[key] !== undefined &&
          dashboard.data[key] !== null
        ) {
          return Number(dashboard.data[key]) || 0;
        }
      }
    }

    return 0;
  };

  // =====================================================
  // SUMMARY VALUES
  // =====================================================
  const totalAssets = getDashboardValue([
    "total_assets",
    "totalAssets",
    "assets",
  ]);

  const totalUsers = getDashboardValue([
    "total_users",
    "totalUsers",
    "users",
  ]);

  const totalRequests =
    getDashboardValue([
      "total_requests",
      "totalRequests",
      "requests",
    ]) || requestReport.length;

  const totalMaintenance =
    getDashboardValue([
      "total_maintenance",
      "totalMaintenance",
      "maintenance",
    ]) || maintenanceReport.length;

  // =====================================================
  // ASSET STATUS CHART
  // =====================================================
  const assetStatusData = [
    "Available",
    "Assigned",
    "Under Maintenance",
    "Transferred",
    "Disposed",
    "Lost",
  ].map((status) => ({
    name: status,
    value: assetReport.filter(
      (asset) => asset.status === status
    ).length,
  }));

  // =====================================================
  // REQUEST CHART
  // =====================================================
  const requestData = [
    {
      name: "Pending",
      value: requestReport.filter(
        (request) =>
          request.status === "Pending"
      ).length,
    },
    {
      name: "Approved",
      value: requestReport.filter(
        (request) =>
          request.status === "Approved"
      ).length,
    },
    {
      name: "Rejected",
      value: requestReport.filter(
        (request) =>
          request.status === "Rejected"
      ).length,
    },
  ];

  // =====================================================
  // MAINTENANCE CHART
  // =====================================================
  const maintenanceData = [
    {
      name: "Scheduled",
      value: maintenanceReport.filter(
        (item) =>
          item.status === "Scheduled"
      ).length,
    },
    {
      name: "In Progress",
      value: maintenanceReport.filter(
        (item) =>
          item.status === "In Progress"
      ).length,
    },
    {
      name: "Completed",
      value: maintenanceReport.filter(
        (item) =>
          item.status === "Completed"
      ).length,
    },
    {
      name: "Cancelled",
      value: maintenanceReport.filter(
        (item) =>
          item.status === "Cancelled"
      ).length,
    },
  ];

  // =====================================================
  // SUMMARY BAR CHART
  // =====================================================
  const summaryData = [
    {
      name: "Assets",
      total: totalAssets,
    },
    {
      name: "Users",
      total: totalUsers,
    },
    {
      name: "Requests",
      total: totalRequests,
    },
    {
      name: "Maintenance",
      total: totalMaintenance,
    },
  ];

  // =====================================================
  // PIE COLORS
  // =====================================================
  const assetColors = [
    "#2e7d32",
    "#1976d2",
    "#ed6c02",
    "#0288d1",
    "#757575",
    "#d32f2f",
  ];

  const requestColors = [
    "#ed6c02",
    "#2e7d32",
    "#d32f2f",
  ];

  const maintenanceColors = [
    "#0288d1",
    "#ed6c02",
    "#2e7d32",
    "#d32f2f",
  ];

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f5f7fb",
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
      {/* =================================================
          HEADER
      ================================================= */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            color: "#1f2937",
          }}
        >
          Reports
        </Typography>

        <Typography
          sx={{
            color: "#6b7280",
            mt: 0.5,
          }}
        >
          Visual overview of the asset management system.
        </Typography>
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
          SUMMARY CARDS
      ================================================= */}
      <Grid container spacing={3}>
        {[
          {
            title: "Total Assets",
            value: totalAssets,
            icon: <AssetIcon fontSize="large" />,
          },
          {
            title: "Total Users",
            value: totalUsers,
            icon: <UserIcon fontSize="large" />,
          },
          {
            title: "Requests",
            value: totalRequests,
            icon: <RequestIcon fontSize="large" />,
          },
          {
            title: "Maintenance",
            value: totalMaintenance,
            icon: (
              <MaintenanceIcon fontSize="large" />
            ),
          },
        ].map((item) => (
          <Grid
            key={item.title}
            size={{
              xs: 12,
              sm: 6,
              lg: 3,
            }}
          >
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid #e5e7eb",
                backgroundColor: "#ffffff",
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#6b7280",
                        mb: 1,
                      }}
                    >
                      {item.title}
                    </Typography>

                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 800,
                        color: "#1f2937",
                      }}
                    >
                      {item.value}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#e8f2fa",
                      color: "#07548e",
                    }}
                  >
                    {item.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* =================================================
          SYSTEM OVERVIEW BAR CHART
      ================================================= */}
      <Card
        elevation={0}
        sx={{
          mt: 4,
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 3,
            }}
          >
            System Overview
          </Typography>

          <Box
            sx={{
              width: "100%",
              height: 350,
            }}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart data={summaryData}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="name" />

                <YAxis allowDecimals={false} />

                <Tooltip />

                <Bar
                  dataKey="total"
                  fill="#07548e"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* =================================================
          ASSET STATUS + REQUESTS
      ================================================= */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* ASSET PIE */}
        <Grid
          size={{
            xs: 12,
            lg: 6,
          }}
        >
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid #e5e7eb",
              backgroundColor: "#ffffff",
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                }}
              >
                Asset Status
              </Typography>

              <Box
                sx={{
                  width: "100%",
                  height: 360,
                }}
              >
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>
                    <Pie
                      data={assetStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      label
                    >
                      {assetStatusData.map(
                        (entry, index) => (
                          <Cell
                            key={`asset-${index}`}
                            fill={
                              assetColors[index]
                            }
                          />
                        )
                      )}
                    </Pie>

                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* REQUEST PIE */}
        <Grid
          size={{
            xs: 12,
            lg: 6,
          }}
        >
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid #e5e7eb",
              backgroundColor: "#ffffff",
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                }}
              >
                Request Status
              </Typography>

              <Box
                sx={{
                  width: "100%",
                  height: 360,
                }}
              >
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>
                    <Pie
                      data={requestData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      label
                    >
                      {requestData.map(
                        (entry, index) => (
                          <Cell
                            key={`request-${index}`}
                            fill={
                              requestColors[index]
                            }
                          />
                        )
                      )}
                    </Pie>

                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* =================================================
          MAINTENANCE CHART
      ================================================= */}
      <Card
        elevation={0}
        sx={{
          mt: 4,
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 3,
            }}
          >
            Maintenance Status
          </Typography>

          <Box
            sx={{
              width: "100%",
              height: 350,
            }}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart data={maintenanceData}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="name" />

                <YAxis allowDecimals={false} />

                <Tooltip />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#07548e"
                  strokeWidth={3}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* =================================================
          STATUS CHIPS
      ================================================= */}
      <Card
        elevation={0}
        sx={{
          mt: 4,
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 2,
            }}
          >
            Request Overview
          </Typography>

          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Chip
              label={`Pending: ${
                requestData[0]?.value || 0
              }`}
              color="warning"
            />

            <Chip
              label={`Approved: ${
                requestData[1]?.value || 0
              }`}
              color="success"
            />

            <Chip
              label={`Rejected: ${
                requestData[2]?.value || 0
              }`}
              color="error"
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Reports;