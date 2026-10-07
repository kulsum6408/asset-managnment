import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const FinanceProtectedRoute = ({ children }) => {
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

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  const role = String(user.role || "")
    .trim()
    .toLowerCase();

  if (role !== "finance_officer") {
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

export default FinanceProtectedRoute;