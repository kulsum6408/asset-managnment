import React, { useEffect, useState } from "react";

import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Button,
  Stack,
  Divider,
  Alert,
} from "@mui/material";

import {
  Notifications as NotificationIcon,
  MarkEmailRead as ReadIcon,
  DoneAll as DoneAllIcon,
} from "@mui/icons-material";

import API from "../services/api";
import BackButton from "../components/BackButton";

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // LOAD NOTIFICATIONS
  // =====================================================
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("You are not logged in.");
        return;
      }

      const response = await API.get("/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.notifications)
        ? data.notifications
        : [];

      setNotifications(list);
    } catch (err) {
      console.error(
        "Failed to load admin notifications:",
        err
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to load notifications."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // =====================================================
  // CHECK UNREAD
  // =====================================================
  const isUnread = (notification) => {
    return Number(notification.is_read) === 0;
  };

  // =====================================================
  // UNREAD COUNT
  // =====================================================
  const unreadCount = notifications.filter(
    isUnread
  ).length;

  // =====================================================
  // MARK ONE AS READ
  // =====================================================
  const handleMarkAsRead = async (notification) => {
    if (!notification.notification_id) {
      return;
    }

    if (!isUnread(notification)) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await API.put(
        `/notifications/${notification.notification_id}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "token"
            )}`,
          },
        }
      );

      setNotifications((previous) =>
        previous.map((item) =>
          item.notification_id ===
          notification.notification_id
            ? {
                ...item,
                is_read: 1,
              }
            : item
        )
      );
    } catch (err) {
      console.error(
        "Failed to mark notification as read:",
        err
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to mark notification as read."
      );
    }
  };

  // =====================================================
  // MARK ALL AS READ
  // =====================================================
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await API.put(
        "/notifications/read-all",
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "token"
            )}`,
          },
        }
      );

      setNotifications((previous) =>
        previous.map((item) => ({
          ...item,
          is_read: 1,
        }))
      );

      setSuccess(
        "All notifications marked as read."
      );
    } catch (err) {
      console.error(
        "Failed to mark all notifications as read:",
        err
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to mark all notifications as read."
      );
    } finally {
      setActionLoading(false);
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
          justifyContent: "center",
          alignItems: "center",
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
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
          }}
        >
          <BackButton to="/admin" />

          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: "#1f2937",
                mb: 1,
              }}
            >
              Notifications
            </Typography>

            <Typography
              sx={{
                color: "#6b7280",
              }}
            >
              View your latest administrator notifications.
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<DoneAllIcon />}
          onClick={handleMarkAllAsRead}
          disabled={
            unreadCount === 0 || actionLoading
          }
          sx={{
            backgroundColor: "#07548e",
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 700,
            "&:hover": {
              backgroundColor: "#064471",
            },
          }}
        >
          {actionLoading
            ? "Updating..."
            : "Mark All as Read"}
        </Button>
      </Box>

      {/* UNREAD COUNT */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          backgroundColor: "#fff",
        }}
      >
        <CardContent
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor:
                unreadCount > 0
                  ? "#ffebee"
                  : "#e8f5e9",
              color:
                unreadCount > 0
                  ? "#d32f2f"
                  : "#2e7d32",
            }}
          >
            <NotificationIcon />
          </Box>

          <Box>
            <Typography fontWeight={800}>
              {unreadCount} unread notification
              {unreadCount === 1 ? "" : "s"}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Notifications you have not read yet.
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* ERROR */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {/* SUCCESS */}
      {success && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => setSuccess("")}
        >
          {success}
        </Alert>
      )}

      {/* NO NOTIFICATIONS */}
      {notifications.length === 0 ? (
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e5e7eb",
          }}
        >
          <CardContent
            sx={{
              py: 6,
              textAlign: "center",
            }}
          >
            <NotificationIcon
              sx={{
                fontSize: 60,
                color: "#07548e",
                mb: 2,
              }}
            />

            <Typography
              variant="h6"
              fontWeight={700}
              mb={1}
            >
              No Notifications
            </Typography>

            <Typography color="text.secondary">
              You currently have no notifications.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {notifications.map(
            (notification, index) => {
              const unread =
                isUnread(notification);

              return (
                <Card
                  key={
                    notification.notification_id ||
                    index
                  }
                  elevation={0}
                  onClick={() =>
                    handleMarkAsRead(
                      notification
                    )
                  }
                  sx={{
                    borderRadius: 3,
                    border: unread
                      ? "2px solid #d32f2f"
                      : "1px solid #e5e7eb",
                    backgroundColor:
                      unread
                        ? "#fff8f8"
                        : "#ffffff",
                    cursor: unread
                      ? "pointer"
                      : "default",
                    transition: "0.2s",
                    "&:hover": unread
                      ? {
                          transform:
                            "translateY(-2px)",
                          boxShadow:
                            "0 8px 20px rgba(0,0,0,0.08)",
                        }
                      : {},
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "flex-start",
                        gap: 2,
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
                            width: 42,
                            height: 42,
                            borderRadius: 2,
                            display:
                              "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            backgroundColor:
                              unread
                                ? "#ffebee"
                                : "#e8f5e9",
                            color: unread
                              ? "#d32f2f"
                              : "#2e7d32",
                          }}
                        >
                          {unread ? (
                            <NotificationIcon />
                          ) : (
                            <ReadIcon />
                          )}
                        </Box>

                        <Typography
                          variant="h6"
                          fontWeight={700}
                        >
                          {notification.title ||
                            "Notification"}
                        </Typography>
                      </Box>

                      <Chip
                        label={
                          unread
                            ? "Unread"
                            : "Read"
                        }
                        color={
                          unread
                            ? "error"
                            : "success"
                        }
                        size="small"
                        sx={{
                          fontWeight: 700,
                        }}
                      />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Typography
                      sx={{
                        color: "#4b5563",
                      }}
                    >
                      {notification.message ||
                        "No message available."}
                    </Typography>

                    {notification.created_at && (
                      <Typography
                        variant="caption"
                        sx={{
                          display:
                            "block",
                          mt: 2,
                          color:
                            "#9ca3af",
                        }}
                      >
                        {new Date(
                          notification.created_at
                        ).toLocaleString()}
                      </Typography>
                    )}

                    {unread && (
                      <Button
                        size="small"
                        startIcon={
                          <ReadIcon />
                        }
                        onClick={(event) => {
                          event.stopPropagation();

                          handleMarkAsRead(
                            notification
                          );
                        }}
                        sx={{
                          mt: 2,
                          textTransform:
                            "none",
                          fontWeight: 700,
                        }}
                      >
                        Mark as read
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            }
          )}
        </Stack>
      )}
    </Box>
  );
};

export default AdminNotifications;