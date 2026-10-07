import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Paper,
} from "@mui/material";

import {
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import API from "../services/api";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const response = await API.post("/auth/login", {
        email: email.trim(),
        password,
      });

      console.log("LOGIN RESPONSE:", response.data);

      const token = response.data?.token;
      const user = response.data?.user;

      // =====================================================
      // CHECK BACKEND RESPONSE
      // =====================================================

      if (!token || !user) {
        setError("Invalid login response from server.");
        return;
      }

      // =====================================================
      // SAVE AUTHENTICATION INFORMATION
      // =====================================================

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      const role = String(user.role || "")
        .toLowerCase()
        .trim();

      console.log("LOGIN ROLE:", role);

      // =====================================================
      // ADMINISTRATOR
      // DO NOT CHANGE THIS ROUTE
      // =====================================================

      if (
        role === "admin" ||
        role === "administrator"
      ) {
        navigate("/admin", { replace: true });
        return;
      }

      // =====================================================
      // EMPLOYEE
      // DO NOT CHANGE THIS ROUTE
      // =====================================================

      if (role === "employee") {
        navigate("/employee", { replace: true });
        return;
      }

      // =====================================================
      // MANAGER
      // =====================================================

      if (role === "manager") {
        navigate("/manager", { replace: true });
        return;
      }

      // =====================================================
      // ASSET OFFICER
      // =====================================================

      if (
        role === "asset_officer" ||
        role === "asset officer"
      ) {
        navigate("/asset-officer", {
          replace: true,
        });
        return;
      }

      // =====================================================
      // MAINTENANCE OFFICER
      // =====================================================

      if (
        role === "maintenance_officer" ||
        role === "maintenance officer"
      ) {
        navigate("/maintenance-officer", {
          replace: true,
        });
        return;
      }

      // =====================================================
      // FINANCE OFFICER
      // =====================================================

      if (
        role === "finance_officer" ||
        role === "finance officer"
      ) {
        navigate("/finance", {
          replace: true,
        });
        return;
      }

      // =====================================================
      // UNKNOWN ROLE
      // =====================================================

      setError(`Unsupported role: ${user.role}`);

      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      if (error.response) {
        setError(
          error.response.data?.error ||
            error.response.data?.message ||
            "Invalid email or password."
        );
      } else if (error.request) {
        setError(
          "Unable to connect to the server. Make sure your backend is running on port 5000."
        );
      } else {
        setError(
          "Login failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        width: "100vw",
        minHeight: "100vh",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        background:
          "linear-gradient(135deg, #0788e8, #07548e)",

        margin: 0,
        padding: 2,
        boxSizing: "border-box",
      }}
    >
      <Paper
        elevation={10}
        sx={{
          width: "100%",
          maxWidth: "850px",
          minHeight: "500px",

          display: "flex",

          borderRadius: "20px",
          overflow: "hidden",

          backgroundColor: "#ffffff",
        }}
      >
        {/* =================================================
            LOGO SIDE
        ================================================= */}

        <Box
          sx={{
            width: "45%",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            background:
              "linear-gradient(145deg, #0788e8, #07548e)",
          }}
        >
          <Box
            component="img"
            src="/images/photo_2026-08-24_09-20-15.jpg"
            alt="Asset Management System"
            sx={{
              width: "180px",
              height: "180px",
              objectFit: "contain",
            }}
          />
        </Box>

        {/* =================================================
            LOGIN SIDE
        ================================================= */}

        <Box
          sx={{
            width: "55%",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            padding: "50px",

            boxSizing: "border-box",
          }}
        >
          <Box
            component="form"
            onSubmit={handleLogin}
            sx={{
              width: "100%",
              maxWidth: "350px",
            }}
          >
            {/* EMAIL */}

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
              disabled={loading}
              sx={{
                mb: 3,

                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                },
              }}
            />

            {/* PASSWORD */}

            <TextField
              fullWidth
              label="Password"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
              disabled={loading}
              sx={{
                mb: 1,

                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                },
              }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            (prev) => !prev
                          )
                        }
                        edge="end"
                      >
                        {showPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            {/* ERROR */}

            {error && (
              <Box
                sx={{
                  color: "#d32f2f",
                  fontSize: "14px",
                  marginTop: "10px",
                }}
              >
                {error}
              </Box>
            )}

            {/* LOGIN BUTTON */}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                marginTop: "25px",
                height: "52px",

                borderRadius: "10px",

                backgroundColor: "#07548e",

                fontSize: "16px",
                fontWeight: "bold",

                textTransform: "none",

                "&:hover": {
                  backgroundColor: "#064570",
                },
              }}
            >
              {loading
                ? "Logging in..."
                : "Login"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;