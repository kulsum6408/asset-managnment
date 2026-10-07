import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material";

import {
  ArrowBack,
  SwapHoriz as TransferIcon,
  Send as SendIcon,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import API from "../services/api";

const EmployeeTransferRequest = () => {
  const navigate = useNavigate();

  const [myAssets, setMyAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedAsset, setSelectedAsset] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [reason, setReason] = useState("");

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login", { replace: true });
          return;
        }
        const headers = { Authorization: `Bearer ${token}` };

        const [myAssetsRes, usersRes] = await Promise.all([
          API.get("/transfers/my-assets", { headers }).catch(() => null),
          API.get("/users/list/all", { headers }).catch(() => null),
        ]);

        // The dedicated endpoint already returns ONLY the authenticated
        // employee's currently-transferable assets (active assignment,
        // not under maintenance, not disposed, no transfer in flight).
        let activeAssets = [];
        if (myAssetsRes && myAssetsRes.data) {
          const data = myAssetsRes.data;
          activeAssets = Array.isArray(data)
            ? data
            : Array.isArray(data.data)
            ? data.data
            : Array.isArray(data.assignments)
            ? data.assignments
            : [];
        }

        // Fallback (older backend): derive the same list from assignments,
        // keeping only ACTIVE assignments whose asset is currently assignable.
        if (!myAssetsRes || activeAssets.length === 0) {
          try {
            const assignRes = await API.get("/assignments", { headers });
            const assignData = assignRes.data;
            const assignList = Array.isArray(assignData)
              ? assignData
              : Array.isArray(assignData?.data)
              ? assignData.data
              : Array.isArray(assignData?.assignments)
              ? assignData.assignments
              : [];

            activeAssets = assignList.filter((item) => {
              const s = String(item.status || "").toLowerCase();
              if (s !== "active" && s !== "assigned") return false;
              const ast = String(item.asset_status || "").toLowerCase();
              if (ast === "under maintenance") return false;
              if (["disposed", "pending disposal", "lost"].includes(ast)) return false;
              return true;
            });
          } catch (e) {
            console.error("Fallback assignment load failed:", e);
          }
        }

        setMyAssets(activeAssets);

        let employeeList = [];
        if (usersRes && usersRes.data) {
          const usersData = usersRes.data;
          const arr = Array.isArray(usersData)
            ? usersData
            : Array.isArray(usersData?.data)
            ? usersData.data
            : Array.isArray(usersData?.users)
            ? usersData.users
            : [];
          employeeList = arr.filter(
            (u) =>
              String(u.role || "").toLowerCase() === "employee" &&
              Number(u.user_id || u.id) !== Number(user.user_id)
          );
        }
        setEmployees(employeeList);
      } catch (err) {
        console.error("Failed to load data:", err);
        setError(
          err.response?.data?.error ||
            "Failed to load data. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedAsset) {
      setError("Please select an asset to transfer.");
      return;
    }
    if (!selectedEmployee) {
      setError("Please select a target employee.");
      return;
    }
    if (!reason.trim()) {
      setError("Please provide a reason for the transfer.");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      await API.post(
        "/transfers",
        {
          asset_id: parseInt(selectedAsset),
          to_user_id: selectedEmployee,
          reason: reason.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(
        "Transfer request submitted successfully. Waiting for asset officer approval."
      );
      setSelectedAsset("");
      setSelectedEmployee("");
      setReason("");
    } catch (err) {
      console.error("Transfer request failed:", err);
      setError(
        err.response?.data?.error ||
          "Failed to submit transfer request."
      );
    } finally {
      setSubmitting(false);
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

      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            color: "#1f2937",
            mb: 1,
          }}
        >
          Request Asset Transfer
        </Typography>
        <Typography sx={{ color: "#6b7280" }}>
          Transfer one of your currently assigned assets to
          another employee. The request will be sent to the
          asset officer for approval.
        </Typography>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => setSuccess("")}
        >
          {success}
        </Alert>
      )}

      {myAssets.length === 0 ? (
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e5e7eb",
          }}
        >
          <CardContent
            sx={{ p: 5, textAlign: "center" }}
          >
            <TransferIcon
              sx={{
                fontSize: 48,
                color: "#9ca3af",
                mb: 1,
              }}
            />
            <Typography
              fontWeight={700}
              color="text.secondary"
            >
              No assigned assets available for transfer.
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              You don't have any assets currently
              assigned to you that can be transferred.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e5e7eb",
            maxWidth: 600,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box
              component="form"
              onSubmit={handleSubmit}
            >
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ mb: 3 }}
              >
                Transfer Details
              </Typography>

              <TextField
                fullWidth
                select
                label="Asset to Transfer"
                value={selectedAsset}
                onChange={(e) =>
                  setSelectedAsset(e.target.value)
                }
                sx={{ mb: 3 }}
                helperText="Select one of your currently assigned assets"
              >
                <MenuItem value="">
                  <em>Select an asset...</em>
                </MenuItem>
                {myAssets.map((asset) => (
                  <MenuItem
                    key={
                      asset.assignment_id ||
                      asset.asset_id
                    }
                    value={asset.asset_id}
                  >
                    {asset.asset_name || "Asset"} -{" "}
                    {asset.serial_number || "No S/N"}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                select
                label="Transfer To (Employee)"
                value={selectedEmployee}
                onChange={(e) =>
                  setSelectedEmployee(e.target.value)
                }
                sx={{ mb: 3 }}
                helperText="Select the employee who will receive the asset"
              >
                <MenuItem value="">
                  <em>Select an employee...</em>
                </MenuItem>
                {employees.map((emp) => (
                  <MenuItem
                    key={emp.user_id || emp.id}
                    value={emp.user_id || emp.id}
                  >
                    {emp.name || emp.email} (
                    {emp.department || "No dept"})
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Reason for Transfer"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this asset needs to be transferred..."
                sx={{ mb: 3 }}
              />

              <Divider sx={{ mb: 3 }} />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                startIcon={<SendIcon />}
                disabled={submitting}
                sx={{
                  py: 1.5,
                  backgroundColor: "#07548e",
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "1rem",
                  "&:hover": {
                    backgroundColor: "#064a7a",
                  },
                }}
              >
                {submitting
                  ? "Submitting Request..."
                  : "Submit Transfer Request"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default EmployeeTransferRequest;
