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
  Stack,
} from "@mui/material";

import {
  Notifications as NotificationIcon,
  Refresh as RefreshIcon,
  DoneAll as DoneAllIcon,
  Delete as DeleteIcon,
  ArrowBack,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import API from "../services/api";

const AssetOfficerNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getList = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.notifications)) {
      return data.notifications;
    }
    return [];
  };

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

      setNotifications(getList(response.data));
    } catch (err) {
      console.error(
        "Failed to load notifications:",
        err
      );

      setError(
        err.response?.data?.error ||
          "Unable to load notifications."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const isUnread = (notification) =>
    notification.is_read === 0 ||
    notification.is_read === false;

  const handleMarkRead = async (id) => {
    try {
      const token = localStorage.getItem("token");

      await API.put(
        `/notifications/${id}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await fetchNotifications();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to mark notification as read."
      );
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem("token");

      await API.put(
        "/notifications/read-all",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess("All notifications marked as read.");
      await fetchNotifications();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to mark notifications as read."
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");

      await API.delete(`/notifications/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccess("Notification deleted.");
      await fetchNotifications();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to delete notification."
      );
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
        <CircularProgress sx={{ color: "#07548e" }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f5f7fb",
        p: { xs: 2, sm: 3, md: 4 },
      }}
    >
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

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, color: "#1f2937" }}
          >
            Notifications
          </Typography>

          <Typography color="text.secondary">
            View important Asset Management System
            notifications.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchNotifications}
            sx={{
              borderColor: "#07548e",
              color: "#07548e",
              textTransform: "none",
            }}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            startIcon={<DoneAllIcon />}
            onClick={handleMarkAllRead}
            sx={{
              backgroundColor: "#07548e",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#064675",
              },
            }}
          >
            Mark All Read
          </Button>
        </Stack>
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

      {notifications.length === 0 ? (
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e5e7eb",
          }}
        >
          <CardContent
            sx={{ textAlign: "center", py: 7 }}
          >
            <NotificationIcon
              sx={{
                fontSize: 60,
                color: "#07548e",
                mb: 2,
              }}
            />

            <Typography variant="h6" fontWeight={700}>
              No Notifications
            </Typography>

            <Typography
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              You currently have no notifications.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {notifications.map((notification) => {
            const unread = isUnread(notification);

            return (
              <Card
                key={notification.notification_id}
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: unread
                    ? "1px solid #07548e"
                    : "1px solid #e5e7eb",
                  backgroundColor: "#ffffff",
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 2,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        <Typography
                          variant="h6"
                          fontWeight={700}
                        >
                          {notification.title}
                        </Typography>

                        {unread && (
                          <Chip
                            label="New"
                            size="small"
                            color="primary"
                          />
                        )}
                      </Box>

                      <Typography color="text.secondary">
                        {notification.message}
                      </Typography>

                      {notification.title ===
                        "New Transfer Request" && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() =>
                            navigate("/asset-officer/transfers")
                          }
                          sx={{
                            mt: 1,
                            color: "#07548e",
                            borderColor: "#07548e",
                            textTransform: "none",
                            fontWeight: 700,
                          }}
                        >
                          Review Transfer Request
                        </Button>
                      )}

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                      >
                        {notification.created_at
                          ? new Date(
                              notification.created_at
                            ).toLocaleString()
                          : ""}
                      </Typography>
                    </Box>

                    <Stack>
                      {unread && (
                        <Button
                          size="small"
                          onClick={() =>
                            handleMarkRead(
                              notification.notification_id
                            )
                          }
                          sx={{
                            textTransform: "none",
                          }}
                        >
                          Mark Read
                        </Button>
                      )}

                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() =>
                          handleDelete(
                            notification.notification_id
                          )
                        }
                        sx={{
                          textTransform: "none",
                        }}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
    </Box>
  );
};

export default AssetOfficerNotifications;