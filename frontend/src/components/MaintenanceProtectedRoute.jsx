import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const MaintenanceProtectedRoute = ({ children }) => {
  const location = useLocation();

  const token = localStorage.getItem("token");

  let user = {};

  try {
    user = JSON.parse(
      localStorage.getItem("user") || "{}"
    );
  } catch {
    user = {};
  }

  // User is not logged in
  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  // Check the authenticated backend role
  const role = String(user.role || "")
    .trim()
    .toLowerCase();

  // Only Maintenance Officer can access these pages
  if (role !== "maintenance_officer") {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
};

export default MaintenanceProtectedRoute;