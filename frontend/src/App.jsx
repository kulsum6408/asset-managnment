import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/login";

// =====================================================
// ADMIN
// =====================================================
import AdminDashboard from "./pages/AdminDashboard";
import Users from "./pages/Users";
import Assets from "./pages/Assets";
import Categories from "./pages/Categories";
import Requests from "./pages/requests";
import Maintenance from "./pages/Maintenance";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import AuditLog from "./pages/AuditLog";
import AdminNotifications from "./pages/AdminNotifications.jsx";
import InventoryStore from "./pages/InventoryStore.jsx";
import AdminAssignments from "./pages/AdminAssignments";
import AdminDisposal from "./pages/AdminDisposal";
import AdminTransfers from "./pages/AdminTransfers";
import AdminReturns from "./pages/AdminReturns";
import AdminBinCard from "./pages/AdminBinCard";
import AdminInventoryCheck from "./pages/AdminInventoryCheck";
import AdminDepreciation from "./pages/AdminDepreciation";
// =====================================================
// EMPLOYEE
// =====================================================
import EmployeeDashboard from "./pages/EmployeeDashboard";
import EmployeeMyRequests from "./pages/EmployeeMyRequests";
import EmployeeMyAssets from "./pages/EmployeeMyAssets";
import EmployeeNotifications from "./pages/EmployeeNotifications";
import EmployeeSettings from "./pages/EmployeeSettings";
import EmployeeRequestAsset from "./pages/EmployeeRequestAsset";
import EmployeeReportProblem from "./pages/EmployeeReportProblem";
import EmployeeReturnAsset from "./pages/EmployeeReturnAsset";
import EmployeeTransferRequest from "./pages/EmployeeTransferRequest";

// =====================================================
// ASSET OFFICER
// =====================================================
import AssetOfficerDashboard from "./pages/AssetOfficerDashboard";
import AssetOfficerRequests from "./pages/AssetOfficerRequests";
import AssetOfficerAssignments from "./pages/AssetOfficerAssignments";
import AssetOfficerReturns from "./pages/AssetOfficerReturns";
import AssetOfficerAssets from "./pages/AssetOfficerAssets";
import AssetOfficerTransfers from "./pages/AssetOfficerTransfers";
import AssetOfficerMaintenance from "./pages/AssetOfficerMaintenance";
import AssetOfficerReports from "./pages/AssetOfficerReports";
import AssetOfficerNotifications from "./pages/AssetOfficerNotifications";
import AssetOfficerSettings from "./pages/AssetOfficerSettings";
import AssetOfficerAssetHistory from "./pages/AssetOfficerAssetHistory";
import AssetOfficerAssetLookup from "./pages/AssetOfficerAssetLookup";
import AssetOfficerInventoryCheck from "./pages/AssetOfficerInventoryCheck";
import AssetOfficerDepreciation from "./pages/AssetOfficerDepreciation";

// =====================================================
// MAINTENANCE OFFICER
// =====================================================
import MaintenanceOfficerDashboard from "./pages/MaintenanceOfficerDashboard";
import MaintenanceOfficerMaintenanceRequests from "./pages/MaintenanceOfficerMaintenanceRequests";
import MaintenanceOfficerRequestDetails from "./pages/MaintenanceOfficerRequestDetails";
import MaintenanceOfficerAssets from "./pages/MaintenanceOfficerAssets";
import MaintenanceOfficerHistory from "./pages/MaintenanceOfficerHistory";
import MaintenanceOfficerReports from "./pages/MaintenanceOfficerReports";
import MaintenanceOfficerNotifications from "./pages/MaintenanceOfficerNotifications";
import MaintenanceOfficerSettings from "./pages/MaintenanceOfficerSettings";
import MaintenanceOfficerCreateMaintenance from "./pages/MaintenanceOfficerCreateMaintenance";

// =====================================================
// MAINTENANCE SECURITY
// =====================================================
import MaintenanceProtectedRoute from "./components/MaintenanceProtectedRoute";

// =====================================================
// MANAGER
// =====================================================
import ManagerDashboard from "./pages/ManagerDashboard";
import ManagerRequests from "./pages/ManagerRequests";
import ManagerAssets from "./pages/ManagerAssets";
import ManagerMaintenance from "./pages/ManagerMaintenance";
import ManagerReports from "./pages/ManagerReports";
import ManagerNotifications from "./pages/ManagerNotifications";
import ManagerSettings from "./pages/ManagerSettings";
import ManagerDisposal from "./pages/ManagerDisposal";
import ManagerDamageReview from "./pages/ManagerDamageReview";
import ManagerMaintenanceCostApprovals from "./pages/ManagerMaintenanceCostApprovals";
import ManagerTransfers from "./pages/ManagerTransfers";

// =====================================================
// MANAGER SECURITY
// =====================================================
import ManagerProtectedRoute from "./components/ManagerProtectedRoute";

// =====================================================
// FINANCE OFFICER
// =====================================================
import FinanceOfficerDashboard from "./pages/FinanceOfficerDashboard";
import FinanceOfficerAssets from "./pages/FinanceOfficerAssets";
import FinanceOfficerDepreciation from "./pages/FinanceOfficerDepreciation";
import FinanceOfficerDepreciationHistory from "./pages/FinanceOfficerDepreciationHistory";
import FinanceOfficerReports from "./pages/FinanceOfficerReports";
import FinanceOfficerNotifications from "./pages/FinanceOfficerNotifications";
import FinanceOfficerSettings from "./pages/FinanceOfficerSettings";
import FinanceMaintenanceCost from "./pages/FinanceMaintenanceCost";
import FinanceAssetFinancial from "./pages/FinanceAssetFinancial";
import FinanceDisposalFinancial from "./pages/FinanceDisposalFinancial";

// =====================================================
// FINANCE SECURITY
// =====================================================
import FinanceProtectedRoute from "./components/FinanceProtectedRoute";
import AssetOfficerBinCard from "./pages/AssetOfficerBinCard";
import AssetOfficerDisposal from "./pages/AssetOfficerDisposal";
function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =====================================================
            LOGIN — SHARED BY ALL ROLES
        ===================================================== */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* =====================================================
            ADMINISTRATOR
        ===================================================== */}

        {/* Admin Dashboard */}
        <Route
          path="/admin"
          element={<AdminDashboard />}
        />

        {/* Admin Users */}
        <Route
          path="/admin/users"
          element={<Users />}
        />

        {/* Admin Assets */}
        <Route
          path="/admin/assets"
          element={<Assets />}
        />

        {/* Admin Inventory / Store */}
        <Route
          path="/admin/inventory"
          element={<InventoryStore role="admin" />}
        />

        {/* Admin Categories */}
        <Route
          path="/admin/categories"
          element={<Categories />}
        />

        {/* Admin Requests */}
        <Route
          path="/admin/requests"
          element={<Requests />}
        />

        {/* Admin Maintenance */}
        <Route
          path="/admin/maintenance"
          element={<Maintenance />}
        />

        {/* Admin Reports */}
        <Route
          path="/admin/reports"
          element={<Reports />}
        />

        {/* Admin Settings */}
        <Route
          path="/admin/settings"
          element={<Settings />}
        />

        {/* Admin Audit Log */}
        <Route
          path="/admin/audit"
          element={<AuditLog />}
        />
        <Route
  path="/admin/notifications"
  element={<AdminNotifications />}
/>

        {/* Admin Assignments (Monitoring) */}
        <Route
          path="/admin/assignments"
          element={<AdminAssignments />}
        />

        {/* Admin Disposals (Monitoring) */}
        <Route
          path="/admin/disposal"
          element={<AdminDisposal />}
        />

        {/* Admin Transfers (Monitoring) */}
        <Route
          path="/admin/transfers"
          element={<AdminTransfers />}
        />

        {/* Admin Returns (Monitoring) */}
        <Route
          path="/admin/returns"
          element={<AdminReturns />}
        />

        {/* Admin Bin Card (Monitoring) */}
        <Route
          path="/admin/bin-card"
          element={<AdminBinCard />}
        />

        {/* Admin Inventory Checks (Monitoring) */}
        <Route
          path="/admin/inventory-checks"
          element={<AdminInventoryCheck />}
        />

        {/* Admin Depreciation (Monitoring) */}
        <Route
          path="/admin/depreciation"
          element={<AdminDepreciation />}
        />

        {/* =====================================================
            EMPLOYEE
        ===================================================== */}
        <Route
          path="/employee"
          element={<EmployeeDashboard />}
        />

        <Route
          path="/employee/my-requests"
          element={<EmployeeMyRequests />}
        />

        <Route
          path="/employee/my-assets"
          element={<EmployeeMyAssets />}
        />

        <Route
          path="/employee/notifications"
          element={<EmployeeNotifications />}
        />

        <Route
          path="/employee/settings"
          element={<EmployeeSettings />}
        />

        <Route
          path="/employee/request-asset"
          element={<EmployeeRequestAsset />}
        />

        <Route
          path="/employee/report-problem"
          element={<EmployeeReportProblem />}
        />

        <Route
          path="/employee/return-asset"
          element={<EmployeeReturnAsset />}
        />

        <Route
          path="/employee/request-transfer"
          element={<EmployeeTransferRequest />}
        />

        {/* =====================================================
            ASSET OFFICER
        ===================================================== */}
        <Route
          path="/asset-officer"
          element={<AssetOfficerDashboard />}
        />

        <Route
          path="/asset-officer/store"
          element={<InventoryStore role="asset_officer" />}
        />

        <Route
          path="/asset-officer/inventory"
          element={<InventoryStore role="asset_officer" />}
        />

        <Route
          path="/asset-officer/assignments"
          element={<AssetOfficerAssignments />}
        />

        <Route
          path="/asset-officer/returns"
          element={<AssetOfficerReturns />}
        />

        <Route
          path="/asset-officer/assets"
          element={<AssetOfficerAssets />}
        />

        <Route
          path="/asset-officer/transfers"
          element={<AssetOfficerTransfers />}
        />

        <Route
          path="/asset-officer/maintenance"
          element={<AssetOfficerMaintenance />}
        />

        <Route
          path="/asset-officer/reports"
          element={<AssetOfficerReports />}
        />

        <Route
          path="/asset-officer/notifications"
          element={<AssetOfficerNotifications />}
        />

        <Route
          path="/asset-officer/settings"
          element={<AssetOfficerSettings />}
        />

        <Route
          path="/asset-officer/requests"
          element={<AssetOfficerRequests />}
        />

        <Route
          path="/asset-officer/assets/:id/history"
          element={<AssetOfficerAssetHistory />}
        />

        <Route
          path="/asset-officer/asset-lookup"
          element={<AssetOfficerAssetLookup />}
        />

        <Route
          path="/asset-officer/inventory-checks"
          element={<AssetOfficerInventoryCheck />}
        />

        <Route
          path="/asset-officer/depreciation"
          element={<AssetOfficerDepreciation />}
        />

        {/* =====================================================
            MAINTENANCE OFFICER — PROTECTED
        ===================================================== */}
        <Route
          path="/maintenance-officer"
          element={
            <MaintenanceProtectedRoute>
              <MaintenanceOfficerDashboard />
            </MaintenanceProtectedRoute>
          }
        />

        <Route
          path="/maintenance-officer/requests"
          element={
            <MaintenanceProtectedRoute>
              <MaintenanceOfficerMaintenanceRequests />
            </MaintenanceProtectedRoute>
          }
        />

        <Route
          path="/maintenance-officer/requests/:id"
          element={
            <MaintenanceProtectedRoute>
              <MaintenanceOfficerRequestDetails />
            </MaintenanceProtectedRoute>
          }
        />

        <Route
          path="/maintenance-officer/assets"
          element={
            <MaintenanceProtectedRoute>
              <MaintenanceOfficerAssets />
            </MaintenanceProtectedRoute>
          }
        />

        <Route
          path="/maintenance-officer/history"
          element={
            <MaintenanceProtectedRoute>
              <MaintenanceOfficerHistory />
            </MaintenanceProtectedRoute>
          }
        />

        <Route
          path="/maintenance-officer/reports"
          element={
            <MaintenanceProtectedRoute>
              <MaintenanceOfficerReports />
            </MaintenanceProtectedRoute>
          }
        />

        <Route
          path="/maintenance-officer/notifications"
          element={
            <MaintenanceProtectedRoute>
              <MaintenanceOfficerNotifications />
            </MaintenanceProtectedRoute>
          }
        />

        <Route
          path="/maintenance-officer/settings"
          element={
            <MaintenanceProtectedRoute>
              <MaintenanceOfficerSettings />
            </MaintenanceProtectedRoute>
          }
        />

        <Route
          path="/maintenance-officer/create"
          element={
            <MaintenanceProtectedRoute>
              <MaintenanceOfficerCreateMaintenance />
            </MaintenanceProtectedRoute>
          }
        />

        {/* =====================================================
            MANAGER — PROTECTED
        ===================================================== */}
        <Route
          path="/manager"
          element={
            <ManagerProtectedRoute>
              <ManagerDashboard />
            </ManagerProtectedRoute>
          }
        />

        <Route
          path="/manager/requests"
          element={
            <ManagerProtectedRoute>
              <ManagerRequests />
            </ManagerProtectedRoute>
          }
        />

        <Route
          path="/manager/assets"
          element={
            <ManagerProtectedRoute>
              <ManagerAssets />
            </ManagerProtectedRoute>
          }
        />

        <Route
          path="/manager/maintenance"
          element={
            <ManagerProtectedRoute>
              <ManagerMaintenance />
            </ManagerProtectedRoute>
          }
        />

        <Route
          path="/manager/reports"
          element={
            <ManagerProtectedRoute>
              <ManagerReports />
            </ManagerProtectedRoute>
          }
        />

        <Route
          path="/manager/notifications"
          element={
            <ManagerProtectedRoute>
              <ManagerNotifications />
            </ManagerProtectedRoute>
          }
        />

        <Route
          path="/manager/settings"
          element={
            <ManagerProtectedRoute>
              <ManagerSettings />
            </ManagerProtectedRoute>
          }
        />

        <Route
          path="/manager/disposals"
          element={
            <ManagerProtectedRoute>
              <ManagerDisposal />
            </ManagerProtectedRoute>
          }
        />

        <Route
          path="/manager/damage-review"
          element={
            <ManagerProtectedRoute>
              <ManagerDamageReview />
            </ManagerProtectedRoute>
          }
        />

        <Route
          path="/manager/cost-approvals"
          element={
            <ManagerProtectedRoute>
              <ManagerMaintenanceCostApprovals />
            </ManagerProtectedRoute>
          }
        />

        <Route
          path="/manager/transfers"
          element={
            <ManagerProtectedRoute>
              <ManagerTransfers />
            </ManagerProtectedRoute>
          }
        />

        {/* =====================================================
            FINANCE OFFICER — PROTECTED
        ===================================================== */}
        <Route
          path="/finance"
          element={
            <FinanceProtectedRoute>
              <FinanceOfficerDashboard />
            </FinanceProtectedRoute>
          }
        />

        <Route
          path="/finance/assets"
          element={
            <FinanceProtectedRoute>
              <FinanceOfficerAssets />
            </FinanceProtectedRoute>
          }
        />

        <Route
          path="/finance/depreciation"
          element={
            <FinanceProtectedRoute>
              <FinanceOfficerDepreciation />
            </FinanceProtectedRoute>
          }
        />

        <Route
          path="/finance/depreciation-history"
          element={
            <FinanceProtectedRoute>
              <FinanceOfficerDepreciationHistory />
            </FinanceProtectedRoute>
          }
        />

        <Route
          path="/finance/reports"
          element={
            <FinanceProtectedRoute>
              <FinanceOfficerReports />
            </FinanceProtectedRoute>
          }
        />

        <Route
          path="/finance/asset-financial"
          element={
            <FinanceProtectedRoute>
              <FinanceAssetFinancial />
            </FinanceProtectedRoute>
          }
        />

        <Route
          path="/finance/maintenance-cost"
          element={
            <FinanceProtectedRoute>
              <FinanceMaintenanceCost />
            </FinanceProtectedRoute>
          }
        />

        <Route
          path="/finance/disposal-financial"
          element={
            <FinanceProtectedRoute>
              <FinanceDisposalFinancial />
            </FinanceProtectedRoute>
          }
        />

        <Route
          path="/finance/notifications"
          element={
            <FinanceProtectedRoute>
              <FinanceOfficerNotifications />
            </FinanceProtectedRoute>
          }
        />

        <Route
          path="/finance/settings"
          element={
            <FinanceProtectedRoute>
              <FinanceOfficerSettings />
            </FinanceProtectedRoute>
          }
        />
<Route
  path="/asset-officer/bin-card"
  element={<AssetOfficerBinCard />}
/>
<Route
  path="/asset-officer/disposal"
  element={<AssetOfficerDisposal />}
/>
        {/* =====================================================
            DEFAULT
        ===================================================== */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;