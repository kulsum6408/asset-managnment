import React, { useEffect, useState } from "react";
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Divider,
  CircularProgress,
  Badge,
} from "@mui/material";

import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Assignment as RequestIcon,
  Inventory2 as AssetIcon,
  Notifications as NotificationIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AddBox as RequestAssetIcon,
  ReportProblem as ReportProblemIcon,
  AssignmentReturn as ReturnIcon,
  SwapHoriz as TransferIcon,
} from "@mui/icons-material";

import { useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";

const drawerWidth = 250;
const topBarHeight = 64;

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);

  const [requests, setRequests] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [returns, setReturns] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);

  let user = {};

  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }

  // =====================================================
  // LOAD EMPLOYEE DATA
  // =====================================================

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login", { replace: true });
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [
          requestsResponse,
          assignmentsResponse,
          returnsResponse,
          notificationsResponse,
        ] = await Promise.allSettled([
          API.get("/requests", { headers }),
          API.get("/assignments", { headers }),
          API.get("/returns", { headers }),
          API.get("/notifications", { headers }),
        ]);

        // =================================================
        // REQUESTS
        // =================================================

        if (requestsResponse.status === "fulfilled") {
          const data = requestsResponse.value.data;

          const list = Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.requests)
            ? data.requests
            : [];

          setRequests(list);
        }

        // =================================================
        // ASSIGNMENTS
        // =================================================

        if (assignmentsResponse.status === "fulfilled") {
          const data = assignmentsResponse.value.data;

          const list = Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.assignments)
            ? data.assignments
            : [];

          setAssignments(list);
        }

        // =================================================
        // RETURNS
        // =================================================

        if (returnsResponse.status === "fulfilled") {
          const data = returnsResponse.value.data;

          const list = Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.returns)
            ? data.returns
            : [];

          setReturns(list);
        }

        // =================================================
        // NOTIFICATIONS
        // =================================================

        if (notificationsResponse.status === "fulfilled") {
          const data = notificationsResponse.value.data;

          const list = Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.notifications)
            ? data.notifications
            : [];

          setNotifications(list);
        }
      } catch (error) {
        console.error(
          "Failed to load employee dashboard:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  // =====================================================
  // AUTO REFRESH NOTIFICATIONS
  // =====================================================

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    const fetchNotifications = async () => {
      try {
        const response = await API.get(
          "/notifications"
        );

        const data = response.data;

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.notifications)
          ? data.notifications
          : [];

        setNotifications(list);
      } catch (error) {
        console.error(
          "Failed to refresh notifications:",
          error
        );
      }
    };

    const interval = setInterval(
      fetchNotifications,
      15000
    );

    return () => {
      clearInterval(interval);
    };
  }, []);

  // =====================================================
  // STATISTICS
  // =====================================================

  const pendingRequests = requests.filter(
    (request) =>
      String(request.status).toLowerCase() === "pending"
  ).length;

  const approvedRequests = requests.filter(
    (request) =>
      String(request.status).toLowerCase() === "approved"
  ).length;

  const activeAssignments = assignments.filter(
    (assignment) =>
      String(assignment.status).toLowerCase() === "active"
  );

  const activeAssets = activeAssignments.length;

  // =====================================================
  // RETURN INFORMATION
  // =====================================================

  const returnedAssets = returns.length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dueSoonAssignments = activeAssignments.filter(
    (assignment) => {
      if (!assignment.expected_return_date) {
        return false;
      }

      const returnDate = new Date(
        assignment.expected_return_date
      );

      return (
        returnDate >= today &&
        returnDate <= tomorrow
      );
    }
  );

  const overdueAssignments = activeAssignments.filter(
    (assignment) => {
      if (!assignment.expected_return_date) {
        return false;
      }

      const returnDate = new Date(
        assignment.expected_return_date
      );

      return returnDate < today;
    }
  );

  const dueSoonCount = dueSoonAssignments.length;
  const overdueCount = overdueAssignments.length;

  // =====================================================
  // UNREAD NOTIFICATIONS
  // =====================================================

  const unreadNotifications = notifications.filter(
    (notification) =>
      notification.is_read === 0 ||
      notification.is_read === false ||
      notification.read === 0 ||
      notification.read === false
  ).length;

  // =====================================================
  // MENU
  // =====================================================

  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/employee",
    },
    {
      text: "Request Asset",
      icon: <RequestAssetIcon />,
      path: "/employee/request-asset",
    },
    {
      text: "My Requests",
      icon: <RequestIcon />,
      path: "/employee/my-requests",
    },
    {
      text: "My Assets",
      icon: <AssetIcon />,
      path: "/employee/my-assets",
    },
    {
      text: "Return Asset",
      icon: <ReturnIcon />,
      path: "/employee/return-asset",
    },
    {
      text: "Request Transfer",
      icon: <TransferIcon />,
      path: "/employee/request-transfer",
    },
    {
      text: "Report Problem",
      icon: <ReportProblemIcon />,
      path: "/employee/report-problem",
    },
    {
      text: "Notifications",
      icon: <NotificationIcon />,
      path: "/employee/notifications",
    },
    {
      text: "Settings",
      icon: <SettingsIcon />,
      path: "/employee/settings",
    },
  ];

  // =====================================================
  // NAVIGATION
  // =====================================================

  const handleMenuClick = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setMobileOpen(false);

    navigate("/login", {
      replace: true,
    });
  };

  // =====================================================
  // SIDEBAR
  // =====================================================

  const drawerContent = (
    <>
      <Toolbar
        sx={{
          justifyContent: "center",
          minHeight: `${topBarHeight}px !important`,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            letterSpacing: 0.5,
            fontSize: "17px",
          }}
        >
          ASSET MANAGEMENT
        </Typography>
      </Toolbar>

      <Divider
        sx={{
          borderColor: "rgba(255,255,255,0.15)",
        }}
      />

      <List
        sx={{
          px: 1.5,
          mt: 2,
        }}
      >
        {menuItems.map((item) => {
          const isSelected =
            item.path === "/employee"
              ? location.pathname === "/employee"
              : location.pathname.startsWith(item.path);

          return (
            <ListItem
              key={item.text}
              disablePadding
              sx={{
                mb: 0.5,
              }}
            >
              <ListItemButton
                selected={isSelected}
                onClick={() =>
                  handleMenuClick(item.path)
                }
                sx={{
                  borderRadius: 2,
                  color: "#ffffff",

                  "&.Mui-selected": {
                    backgroundColor:
                      "rgba(255,255,255,0.16)",
                  },

                  "&.Mui-selected:hover": {
                    backgroundColor:
                      "rgba(255,255,255,0.2)",
                  },

                  "&:hover": {
                    backgroundColor:
                      "rgba(255,255,255,0.1)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: "#ffffff",
                    minWidth: 42,
                  }}
                >
                  {item.icon}
                </ListItemIcon>

                <ListItemText
                  primary={item.text}
                  slotProps={{ primary: {
                    fontWeight: isSelected
                      ? 700
                      : 500,
                  } }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}

        {/* LOGOUT */}
        <Box sx={{ mt: 3 }}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                borderRadius: 2,
                color: "#ffffff",

                "&:hover": {
                  backgroundColor:
                    "rgba(255,255,255,0.1)",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: "#ffffff",
                  minWidth: 42,
                }}
              >
                <LogoutIcon />
              </ListItemIcon>

              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        </Box>
      </List>
    </>
  );

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
  // DASHBOARD
  // =====================================================

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#f5f7fb",
      }}
    >
      <CssBaseline />

      {/* =================================================
          TOP BAR
      ================================================= */}

      <AppBar
        position="fixed"
        sx={{
          width: {
            sm: `calc(100% - ${drawerWidth}px)`,
          },

          ml: {
            sm: `${drawerWidth}px`,
          },

          height: `${topBarHeight}px`,

          backgroundColor: "#ffffff",
          color: "#1f2937",

          boxShadow:
            "0 2px 10px rgba(0,0,0,0.06)",

          zIndex: (theme) =>
            theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar
          sx={{
            minHeight: `${topBarHeight}px !important`,
          }}
        >
          <IconButton
            color="inherit"
            edge="start"
            onClick={() =>
              setMobileOpen(true)
            }
            sx={{
              mr: 2,
              display: {
                xs: "block",
                sm: "none",
              },
            }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
            }}
          >
            Employee Dashboard
          </Typography>

          {/* =================================================
              NOTIFICATION BELL
          ================================================= */}

          <IconButton
            onClick={() =>
              navigate(
                "/employee/notifications"
              )
            }
            sx={{
              mr: 2,
              position: "relative",

              color:
                unreadNotifications > 0
                  ? "#07548e"
                  : "#6b7280",

              backgroundColor:
                unreadNotifications > 0
                  ? "#e8f2fa"
                  : "transparent",

              "&:hover": {
                backgroundColor:
                  unreadNotifications > 0
                    ? "#dbeaf5"
                    : "#f3f4f6",
              },

              "&::after": {
                content: '""',
                position: "absolute",
                inset: 3,
                borderRadius: "50%",

                border:
                  unreadNotifications > 0
                    ? "2px solid rgba(7,84,142,0.25)"
                    : "none",

                animation:
                  unreadNotifications > 0
                    ? "notificationRing 1.8s infinite"
                    : "none",

                pointerEvents: "none",
              },

              "@keyframes notificationRing": {
                "0%": {
                  transform: "scale(0.9)",
                  opacity: 0.8,
                },

                "70%": {
                  transform: "scale(1.25)",
                  opacity: 0,
                },

                "100%": {
                  transform: "scale(1.25)",
                  opacity: 0,
                },
              },
            }}
          >
            <Badge
              badgeContent={unreadNotifications}
              color="error"
              invisible={
                unreadNotifications === 0
              }
              max={99}
            >
              <NotificationIcon
                sx={{
                  fontSize: 27,
                }}
              />
            </Badge>
          </IconButton>

          {/* =================================================
              USER AVATAR
          ================================================= */}

          <Avatar
            sx={{
              width: 40,
              height: 40,
              backgroundColor: "#07548e",
            }}
          >
            {(user.name || "E")
              .charAt(0)
              .toUpperCase()}
          </Avatar>
        </Toolbar>
      </AppBar>

      {/* =================================================
          DESKTOP SIDEBAR
      ================================================= */}

      <Drawer
        variant="permanent"
        sx={{
          display: {
            xs: "none",
            sm: "block",
          },

          width: drawerWidth,
          flexShrink: 0,

          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: "#07548e",
            color: "#ffffff",
            border: "none",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* =================================================
          MOBILE SIDEBAR
      ================================================= */}

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() =>
          setMobileOpen(false)
        }
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: {
            xs: "block",
            sm: "none",
          },

          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: "#07548e",
            color: "#ffffff",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <Box
        component="main"
        sx={{
          flexGrow: 1,

          width: {
            xs: "100%",
            sm: `calc(100% - ${drawerWidth}px)`,
          },

          pt: `${topBarHeight + 24}px`,

          px: {
            xs: 2,
            sm: 3,
            md: 4,
          },

          pb: 5,

          minHeight: "100vh",

          boxSizing: "border-box",
        }}
      >
        {/* WELCOME */}

        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            color: "#1f2937",
            mb: 1,
          }}
        >
          Welcome, {user.name || "Employee"}
        </Typography>

        <Typography
          sx={{
            color: "#6b7280",
            mb: 4,
          }}
        >
          Manage your asset requests, assigned
          assets and return dates.
        </Typography>

        {/* =================================================
            STATISTICS
        ================================================= */}

        <Grid container spacing={3}>
          {[
            {
              title: "Pending Requests",
              value: pendingRequests,
              icon: (
                <RequestIcon fontSize="large" />
              ),
            },

            {
              title: "Approved Requests",
              value: approvedRequests,
              icon: (
                <RequestAssetIcon fontSize="large" />
              ),
            },

            {
              title: "My Active Assets",
              value: activeAssets,
              icon: (
                <AssetIcon fontSize="large" />
              ),
            },

            {
              title: "Unread Notifications",
              value: unreadNotifications,
              icon: (
                <NotificationIcon fontSize="large" />
              ),
            },

            {
              title: "Return Due Soon",
              value: dueSoonCount,
              icon: (
                <ReturnIcon fontSize="large" />
              ),
            },

            {
              title: "Overdue Returns",
              value: overdueCount,
              icon: (
                <ReturnIcon fontSize="large" />
              ),
            },
          ].map((stat) => (
            <Grid
              size={{
                xs: 12,
                sm: 6,
                lg: 3,
              }}
              key={stat.title}
            >
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border:
                    "1px solid #e5e7eb",
                  backgroundColor: "#ffffff",
                  height: "100%",
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent:
                        "space-between",
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
                        {stat.title}
                      </Typography>

                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 800,
                          color: "#1f2937",
                        }}
                      >
                        {stat.value}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: 2,
                        display: "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        backgroundColor:
                          "#e8f2fa",
                        color: "#07548e",
                      }}
                    >
                      {stat.icon}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* =================================================
            RETURN REMINDER
        ================================================= */}

        <Card
          elevation={0}
          sx={{
            mt: 4,
            borderRadius: 3,
            border:
              "1px solid #e5e7eb",
            backgroundColor: "#ffffff",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: "#1f2937",
                  }}
                >
                  Return Reminder
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Keep track of when your assigned
                  assets must be returned.
                </Typography>
              </Box>

              <ReturnIcon
                sx={{
                  fontSize: 38,
                  color: "#07548e",
                }}
              />
            </Box>

            {activeAssignments.length === 0 ? (
              <Typography color="text.secondary">
                You currently have no active assets.
              </Typography>
            ) : (
              activeAssignments
                .slice(0, 5)
                .map((assignment, index) => {
                  const returnDate =
                    assignment.expected_return_date
                      ? new Date(
                          assignment.expected_return_date
                        )
                      : null;

                  const isOverdue =
                    returnDate &&
                    returnDate < today;

                  const isDueSoon =
                    returnDate &&
                    returnDate >= today &&
                    returnDate <= tomorrow;

                  return (
                    <Box
                      key={
                        assignment.assignment_id ||
                        index
                      }
                      sx={{
                        py: 1.8,
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems: "center",
                        borderBottom:
                          index !==
                          Math.min(
                            activeAssignments.length,
                            5
                          ) -
                            1
                            ? "1px solid #eeeeee"
                            : "none",
                      }}
                    >
                      <Box>
                        <Typography
                          fontWeight={700}
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

                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          Return date:{" "}
                          {returnDate
                            ? returnDate.toLocaleDateString()
                            : "Not specified"}
                        </Typography>
                      </Box>

                      <Typography
                        sx={{
                          fontWeight: 700,
                          color: isOverdue
                            ? "#d32f2f"
                            : isDueSoon
                            ? "#ed6c02"
                            : "#07548e",
                        }}
                      >
                        {isOverdue
                          ? "OVERDUE"
                          : isDueSoon
                          ? "DUE SOON"
                          : "ACTIVE"}
                      </Typography>
                    </Box>
                  );
                })
            )}

            <Box
              sx={{
                mt: 3,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Box
                onClick={() =>
                  navigate("/employee/my-assets")
                }
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  px: 2.5,
                  py: 1.2,
                  borderRadius: 2,
                  backgroundColor: "#07548e",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: 700,

                  "&:hover": {
                    backgroundColor: "#064675",
                  },
                }}
              >
                <ReturnIcon fontSize="small" />
                View My Assets & Return
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* =================================================
            QUICK ACTIONS
        ================================================= */}

        <Card
          elevation={0}
          sx={{
            mt: 4,
            borderRadius: 3,
            border:
              "1px solid #e5e7eb",
            backgroundColor: "#ffffff",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "#1f2937",
                mb: 3,
              }}
            >
              Employee Actions
            </Typography>

            <Grid container spacing={2}>
              {/* REQUEST ASSET */}

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  md: 3,
                }}
              >
                <Box
                  onClick={() =>
                    navigate(
                      "/employee/request-asset"
                    )
                  }
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border:
                      "1px solid #e5e7eb",
                    cursor: "pointer",
                    transition: "0.2s",

                    "&:hover": {
                      borderColor:
                        "#07548e",
                      backgroundColor:
                        "#f5f9fc",
                    },
                  }}
                >
                  <RequestAssetIcon
                    sx={{
                      fontSize: 35,
                      color: "#07548e",
                      mb: 1,
                    }}
                  />

                  <Typography fontWeight={700}>
                    Request an Asset
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Request equipment you
                    need for your work.
                  </Typography>
                </Box>
              </Grid>

              {/* MY REQUESTS */}

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  md: 3,
                }}
              >
                <Box
                  onClick={() =>
                    navigate(
                      "/employee/my-requests"
                    )
                  }
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border:
                      "1px solid #e5e7eb",
                    cursor: "pointer",

                    "&:hover": {
                      borderColor:
                        "#07548e",
                      backgroundColor:
                        "#f5f9fc",
                    },
                  }}
                >
                  <RequestIcon
                    sx={{
                      fontSize: 35,
                      color: "#07548e",
                      mb: 1,
                    }}
                  />

                  <Typography fontWeight={700}>
                    My Requests
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Track the status of your
                    asset requests.
                  </Typography>
                </Box>
              </Grid>

              {/* MY ASSETS */}

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  md: 3,
                }}
              >
                <Box
                  onClick={() =>
                    navigate(
                      "/employee/my-assets"
                    )
                  }
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border:
                      "1px solid #e5e7eb",
                    cursor: "pointer",

                    "&:hover": {
                      borderColor:
                        "#07548e",
                      backgroundColor:
                        "#f5f9fc",
                    },
                  }}
                >
                  <AssetIcon
                    sx={{
                      fontSize: 35,
                      color: "#07548e",
                      mb: 1,
                    }}
                  />

                  <Typography fontWeight={700}>
                    My Assets
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    View assets currently
                    assigned to you.
                  </Typography>
                </Box>
              </Grid>

              {/* RETURN ASSET */}

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  md: 3,
                }}
              >
                <Box
                  onClick={() =>
                    navigate(
                      "/employee/return-asset"
                    )
                  }
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border:
                      "1px solid #e5e7eb",
                    cursor: "pointer",
                    transition: "0.2s",

                    "&:hover": {
                      borderColor:
                        "#07548e",
                      backgroundColor:
                        "#f5f9fc",
                    },
                  }}
                >
                  <ReturnIcon
                    sx={{
                      fontSize: 35,
                      color: "#07548e",
                      mb: 1,
                    }}
                  />

                  <Typography fontWeight={700}>
                    Return Asset
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Check your return date
                    and return assigned assets.
                  </Typography>
                </Box>
              </Grid>

              {/* REPORT PROBLEM */}

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  md: 3,
                }}
              >
                <Box
                  onClick={() =>
                    navigate(
                      "/employee/report-problem"
                    )
                  }
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border:
                      "1px solid #e5e7eb",
                    cursor: "pointer",
                    transition: "0.2s",

                    "&:hover": {
                      borderColor:
                        "#07548e",
                      backgroundColor:
                        "#f5f9fc",
                    },
                  }}
                >
                  <ReportProblemIcon
                    sx={{
                      fontSize: 35,
                      color: "#07548e",
                      mb: 1,
                    }}
                  />

                  <Typography fontWeight={700}>
                    Report a Problem
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Report a problem with an
                    assigned asset.
                  </Typography>
                </Box>
              </Grid>

              {/* NOTIFICATIONS */}

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  md: 3,
                }}
              >
                <Box
                  onClick={() =>
                    navigate(
                      "/employee/notifications"
                    )
                  }
                  sx={{
                    p: 2.5,
                    borderRadius: 2,

                    border:
                      unreadNotifications > 0
                        ? "2px solid #07548e"
                        : "1px solid #e5e7eb",

                    backgroundColor:
                      unreadNotifications > 0
                        ? "#f0f7fc"
                        : "#ffffff",

                    cursor: "pointer",
                    transition: "0.2s",

                    "&:hover": {
                      borderColor:
                        "#07548e",
                      backgroundColor:
                        "#f5f9fc",
                    },
                  }}
                >
                  <Badge
                    badgeContent={
                      unreadNotifications
                    }
                    color="error"
                    invisible={
                      unreadNotifications === 0
                    }
                  >
                    <NotificationIcon
                      sx={{
                        fontSize: 35,
                        color: "#07548e",
                        mb: 1,
                      }}
                    />
                  </Badge>

                  <Typography fontWeight={700}>
                    Notifications
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    {unreadNotifications > 0
                      ? `${unreadNotifications} unread notification${
                          unreadNotifications !== 1
                            ? "s"
                            : ""
                        }`
                      : "View important system notifications."}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* =================================================
            RECENT REQUESTS
        ================================================= */}

        <Card
          elevation={0}
          sx={{
            mt: 4,
            borderRadius: 3,
            border:
              "1px solid #e5e7eb",
            backgroundColor: "#ffffff",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "#1f2937",
                mb: 2,
              }}
            >
              Recent Requests
            </Typography>

            {requests.length === 0 ? (
              <Typography color="text.secondary">
                You have no asset requests yet.
              </Typography>
            ) : (
              requests
                .slice(0, 5)
                .map((request, index) => (
                  <Box
                    key={
                      request.request_id ||
                      request.id ||
                      index
                    }
                    sx={{
                      py: 1.5,
                      display: "flex",
                      justifyContent:
                        "space-between",
                      borderBottom:
                        index !==
                        Math.min(
                          requests.length,
                          5
                        ) -
                          1
                          ? "1px solid #eeeeee"
                          : "none",
                    }}
                  >
                    <Typography>
                      {request.asset_name ||
                        request.description ||
                        "Asset Request"}
                    </Typography>

                    <Typography
                      sx={{
                        fontWeight: 600,
                        color: "#07548e",
                      }}
                    >
                      {request.status ||
                        "Pending"}
                    </Typography>
                  </Box>
                ))
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default EmployeeDashboard;