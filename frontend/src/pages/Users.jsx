import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Alert,
  IconButton,
} from "@mui/material";

import {
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LockReset as LockResetIcon,
  ArrowBack,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import API from "../services/api";

const Users = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // =====================================================
  // ADD USER
  // =====================================================
  const [openAddUser, setOpenAddUser] = useState(false);
  const [savingAdd, setSavingAdd] = useState(false);

  // =====================================================
  // EDIT USER
  // =====================================================
  const [openEditUser, setOpenEditUser] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

  // =====================================================
  // DELETE USER
  // =====================================================
  const [openDeleteUser, setOpenDeleteUser] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // =====================================================
  // RESET PASSWORD
  // =====================================================
  const [openResetPassword, setOpenResetPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetUser, setResetUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  // =====================================================
  // MESSAGES
  // =====================================================
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // =====================================================
  // ADD FORM
  // =====================================================
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    department: "",
  });

  // =====================================================
  // EDIT FORM
  // =====================================================
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "employee",
    department: "",
    is_active: 1,
  });

  // =====================================================
  // GET USERS
  // =====================================================
  const fetchUsers = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        setUsers([]);
        setErrorMessage("You are not logged in.");
        return;
      }

      const response = await API.get("/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      console.log("USERS RESPONSE:", data);

      if (Array.isArray(data)) {
        setUsers(data);
      } else if (Array.isArray(data.users)) {
        setUsers(data.users);
      } else if (Array.isArray(data.data)) {
        setUsers(data.data);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Failed to load users:", error);

      setUsers([]);

      setErrorMessage(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to load users."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // =====================================================
  // SEARCH
  // =====================================================
  const filteredUsers = users.filter((user) => {
    const searchText = search.trim().toLowerCase();

    const name = String(
      user.name ||
        user.full_name ||
        user.username ||
        ""
    ).toLowerCase();

    const email = String(user.email || "").toLowerCase();
    const role = String(user.role || "").toLowerCase();
    const department = String(
      user.department || ""
    ).toLowerCase();

    return (
      name.includes(searchText) ||
      email.includes(searchText) ||
      role.includes(searchText) ||
      department.includes(searchText)
    );
  });

  // =====================================================
  // ADD FORM CHANGE
  // =====================================================
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // EDIT FORM CHANGE
  // =====================================================
  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // OPEN ADD USER
  // =====================================================
  const handleOpenAddUser = () => {
    setSuccessMessage("");
    setErrorMessage("");

    setFormData({
      name: "",
      email: "",
      password: "",
      role: "employee",
      department: "",
    });

    setOpenAddUser(true);
  };

  // =====================================================
  // CLOSE ADD USER
  // =====================================================
  const handleCloseAddUser = () => {
    if (savingAdd) return;

    setOpenAddUser(false);
  };

  // =====================================================
  // ADD USER
  // =====================================================
  const handleAddUser = async () => {
    setSuccessMessage("");
    setErrorMessage("");

    const name = formData.name.trim();
    const email = formData.email.trim();
    const password = formData.password;

    if (!name || !email || !password) {
      setErrorMessage(
        "Name, email, and password are required."
      );
      return;
    }

    if (password.length < 6) {
      setErrorMessage(
        "Password must be at least 6 characters."
      );
      return;
    }

    try {
      setSavingAdd(true);

      const token = localStorage.getItem("token");

      if (!token) {
        setErrorMessage("You are not logged in.");
        return;
      }

      const payload = {
        name,
        email,
        password,
        role: formData.role,
        department:
          formData.department.trim() || null,
      };

      const response = await API.post(
        "/users",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setOpenAddUser(false);

      setFormData({
        name: "",
        email: "",
        password: "",
        role: "employee",
        department: "",
      });

      setSuccessMessage(
        response.data?.message ||
          "User created successfully."
      );

      await fetchUsers();
    } catch (error) {
      console.error("Failed to create user:", error);

      setErrorMessage(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to create user."
      );
    } finally {
      setSavingAdd(false);
    }
  };

  // =====================================================
  // OPEN EDIT USER
  // =====================================================
  const handleOpenEditUser = (user) => {
    setSuccessMessage("");
    setErrorMessage("");

    setEditingUserId(
      user.user_id || user.id
    );

    setEditForm({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "employee",
      department: user.department || "",
      is_active:
        user.is_active === 0 ? 0 : 1,
    });

    setOpenEditUser(true);
  };

  // =====================================================
  // CLOSE EDIT USER
  // =====================================================
  const handleCloseEditUser = () => {
    if (savingEdit) return;

    setOpenEditUser(false);
    setEditingUserId(null);
  };

  // =====================================================
  // UPDATE USER
  // =====================================================
  const handleUpdateUser = async () => {
    setSuccessMessage("");
    setErrorMessage("");

    if (!editingUserId) {
      setErrorMessage("No user selected.");
      return;
    }

    if (
      !editForm.name.trim() ||
      !editForm.email.trim() ||
      !editForm.role
    ) {
      setErrorMessage(
        "Name, email, and role are required."
      );
      return;
    }

    try {
      setSavingEdit(true);

      const token = localStorage.getItem("token");

      if (!token) {
        setErrorMessage("You are not logged in.");
        return;
      }

      const payload = {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        role: editForm.role,
        department:
          editForm.department.trim() || null,
        is_active: Number(
          editForm.is_active
        ),
      };

      const response = await API.put(
        `/users/${editingUserId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setOpenEditUser(false);
      setEditingUserId(null);

      setSuccessMessage(
        response.data?.message ||
          "User updated successfully."
      );

      await fetchUsers();
    } catch (error) {
      console.error(
        "Failed to update user:",
        error
      );

      setErrorMessage(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to update user."
      );
    } finally {
      setSavingEdit(false);
    }
  };

  // =====================================================
  // OPEN DELETE USER
  // =====================================================
  const handleOpenDeleteUser = (user) => {
    setSuccessMessage("");
    setErrorMessage("");

    setUserToDelete(user);
    setOpenDeleteUser(true);
  };

  // =====================================================
  // CLOSE DELETE USER
  // =====================================================
  const handleCloseDeleteUser = () => {
    if (deletingUser) return;

    setOpenDeleteUser(false);
    setUserToDelete(null);
  };

  // =====================================================
  // DELETE USER
  // =====================================================
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    const userId =
      userToDelete.user_id ||
      userToDelete.id;

    if (!userId) {
      setErrorMessage("User ID was not found.");
      return;
    }

    try {
      setDeletingUser(true);
      setSuccessMessage("");
      setErrorMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        setErrorMessage("You are not logged in.");
        return;
      }

      const response = await API.delete(
        `/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setOpenDeleteUser(false);
      setUserToDelete(null);

      setSuccessMessage(
        response.data?.message ||
          "User deleted successfully."
      );

      await fetchUsers();
    } catch (error) {
      console.error(
        "Failed to delete user:",
        error
      );

      setErrorMessage(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to delete user."
      );
    } finally {
      setDeletingUser(false);
    }
  };

  // =====================================================
  // OPEN RESET PASSWORD
  // =====================================================
  const handleOpenResetPassword = (user) => {
    setSuccessMessage("");
    setErrorMessage("");

    setResetUser(user);
    setNewPassword("");
    setOpenResetPassword(true);
  };

  // =====================================================
  // CLOSE RESET PASSWORD
  // =====================================================
  const handleCloseResetPassword = () => {
    if (resettingPassword) return;

    setOpenResetPassword(false);
    setResetUser(null);
    setNewPassword("");
  };

  // =====================================================
  // RESET PASSWORD
  // =====================================================
  const handleResetPassword = async () => {
    setSuccessMessage("");
    setErrorMessage("");

    if (!resetUser) {
      setErrorMessage("No user selected.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage(
        "Password must be at least 6 characters."
      );
      return;
    }

    try {
      setResettingPassword(true);

      const token = localStorage.getItem("token");

      if (!token) {
        setErrorMessage("You are not logged in.");
        return;
      }

      const userId =
        resetUser.user_id ||
        resetUser.id;

      if (!userId) {
        setErrorMessage("User ID was not found.");
        return;
      }

      const response = await API.put(
        `/users/${userId}/reset-password`,
        {
          new_password: newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setOpenResetPassword(false);
      setResetUser(null);
      setNewPassword("");

      setSuccessMessage(
        response.data?.message ||
          "Password reset successfully."
      );
    } catch (error) {
      console.error(
        "Failed to reset password:",
        error
      );

      setErrorMessage(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to reset password."
      );
    } finally {
      setResettingPassword(false);
    }
  };

  // =====================================================
  // ROLE LABEL
  // =====================================================
  const getRoleLabel = (role) => {
    const roles = {
      admin: "Administrator",
      manager: "Manager",
      asset_officer: "Asset Officer",
      finance_officer: "Finance Officer",
      maintenance_officer:
        "Maintenance Officer",
      employee: "Employee",
    };

    return roles[role] || role || "User";
  };

  // =====================================================
  // STATUS
  // =====================================================
  const getStatus = (user) => {
    return user.is_active === 0
      ? {
          label: "Inactive",
          color: "default",
        }
      : {
          label: "Active",
          color: "success",
        };
  };

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
          BACK
      ================================================= */}
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate("/admin")}
        sx={{
          mb: 3,
          color: "#07548e",
          fontWeight: 700,
          textTransform: "none",
        }}
      >
        Back to Dashboard
      </Button>

      {/* =================================================
          HEADER
      ================================================= */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: "#1f2937",
            }}
          >
            Users
          </Typography>

          <Typography
            sx={{
              color: "#6b7280",
              mt: 0.5,
            }}
          >
            Manage system users and their roles.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={handleOpenAddUser}
          sx={{
            backgroundColor: "#07548e",
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            px: 2.5,

            "&:hover": {
              backgroundColor: "#064570",
            },
          }}
        >
          Add User
        </Button>
      </Box>

      {/* =================================================
          MESSAGES
      ================================================= */}
      {successMessage && (
        <Alert
          severity="success"
          onClose={() =>
            setSuccessMessage("")
          }
          sx={{
            mb: 2,
            borderRadius: 2,
          }}
        >
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert
          severity="error"
          onClose={() =>
            setErrorMessage("")
          }
          sx={{
            mb: 2,
            borderRadius: 2,
          }}
        >
          {errorMessage}
        </Alert>
      )}

      {/* =================================================
          USERS TABLE
      ================================================= */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <TextField
            fullWidth
            placeholder="Search users..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            sx={{
              mb: 3,
              maxWidth: 450,

              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon
                    sx={{
                      color: "#6b7280",
                    }}
                  />
                </InputAdornment>
              ),
            }}
          />

          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                py: 7,
              }}
            >
              <CircularProgress
                sx={{
                  color: "#07548e",
                }}
              />
            </Box>
          ) : (
            <TableContainer
              component={Paper}
              elevation={0}
            >
              <Table>
                <TableHead>
                  <TableRow
                    sx={{
                      backgroundColor: "#f8fafc",
                    }}
                  >
                    <TableCell sx={{ fontWeight: 700 }}>
                      ID
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>
                      Name
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>
                      Email
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>
                      Role
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>
                      Department
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>
                      Status
                    </TableCell>

                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700 }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        align="center"
                        sx={{
                          py: 7,
                          color: "#6b7280",
                        }}
                      >
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map(
                      (user, index) => {
                        const status =
                          getStatus(user);

                        return (
                          <TableRow
                            key={
                              user.user_id ||
                              user.id ||
                              index
                            }
                            hover
                          >
                            <TableCell>
                              {user.user_id ||
                                user.id ||
                                "-"}
                            </TableCell>

                            <TableCell
                              sx={{
                                fontWeight: 600,
                              }}
                            >
                              {user.name ||
                                user.full_name ||
                                user.username ||
                                "-"}
                            </TableCell>

                            <TableCell>
                              {user.email || "-"}
                            </TableCell>

                            <TableCell>
                              <Chip
                                label={getRoleLabel(
                                  user.role
                                )}
                                size="small"
                                sx={{
                                  fontWeight: 600,
                                }}
                              />
                            </TableCell>

                            <TableCell>
                              {user.department ||
                                "-"}
                            </TableCell>

                            <TableCell>
                              <Chip
                                label={status.label}
                                color={status.color}
                                size="small"
                                sx={{
                                  fontWeight: 600,
                                }}
                              />
                            </TableCell>

                            <TableCell align="center">
                              {/* EDIT */}
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleOpenEditUser(
                                    user
                                  )
                                }
                                sx={{
                                  color: "#07548e",
                                  mr: 0.5,
                                }}
                                aria-label="Edit user"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>

                              {/* RESET PASSWORD */}
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleOpenResetPassword(
                                    user
                                  )
                                }
                                sx={{
                                  color: "#7c3aed",
                                  mr: 0.5,
                                }}
                                aria-label="Reset password"
                              >
                                <LockResetIcon fontSize="small" />
                              </IconButton>

                              {/* DELETE */}
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleOpenDeleteUser(
                                    user
                                  )
                                }
                                sx={{
                                  color: "#d32f2f",
                                }}
                                aria-label="Delete user"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      }
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* =================================================
          ADD USER DIALOG
      ================================================= */}
      <Dialog
        open={openAddUser}
        onClose={handleCloseAddUser}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Add New User
        </DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            required
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            margin="normal"
          />

          <TextField
            fullWidth
            required
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
          />

          <TextField
            fullWidth
            required
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            helperText="Minimum 6 characters"
          />

          <TextField
            select
            fullWidth
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            margin="normal"
          >
            <MenuItem value="admin">
              Administrator
            </MenuItem>

            <MenuItem value="manager">
              Manager
            </MenuItem>

            <MenuItem value="asset_officer">
              Asset Officer
            </MenuItem>

            <MenuItem value="finance_officer">
              Finance Officer
            </MenuItem>

            <MenuItem value="maintenance_officer">
              Maintenance Officer
            </MenuItem>

            <MenuItem value="employee">
              Employee
            </MenuItem>
          </TextField>

          <TextField
            fullWidth
            label="Department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            margin="normal"
          />
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleCloseAddUser}
            disabled={savingAdd}
            sx={{
              textTransform: "none",
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleAddUser}
            disabled={
              savingAdd ||
              !formData.name.trim() ||
              !formData.email.trim() ||
              !formData.password.trim()
            }
            sx={{
              backgroundColor: "#07548e",
              textTransform: "none",

              "&:hover": {
                backgroundColor: "#064570",
              },
            }}
          >
            {savingAdd
              ? "Creating..."
              : "Create User"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* =================================================
          EDIT USER DIALOG
      ================================================= */}
      <Dialog
        open={openEditUser}
        onClose={handleCloseEditUser}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Edit User
        </DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            required
            label="Full Name"
            name="name"
            value={editForm.name}
            onChange={handleEditChange}
            margin="normal"
          />

          <TextField
            fullWidth
            required
            label="Email"
            name="email"
            type="email"
            value={editForm.email}
            onChange={handleEditChange}
            margin="normal"
          />

          <TextField
            select
            fullWidth
            required
            label="Role"
            name="role"
            value={editForm.role}
            onChange={handleEditChange}
            margin="normal"
          >
            <MenuItem value="admin">
              Administrator
            </MenuItem>

            <MenuItem value="manager">
              Manager
            </MenuItem>

            <MenuItem value="asset_officer">
              Asset Officer
            </MenuItem>

            <MenuItem value="finance_officer">
              Finance Officer
            </MenuItem>

            <MenuItem value="maintenance_officer">
              Maintenance Officer
            </MenuItem>

            <MenuItem value="employee">
              Employee
            </MenuItem>
          </TextField>

          <TextField
            fullWidth
            label="Department"
            name="department"
            value={editForm.department}
            onChange={handleEditChange}
            margin="normal"
          />

          <TextField
            select
            fullWidth
            label="Status"
            name="is_active"
            value={editForm.is_active}
            onChange={handleEditChange}
            margin="normal"
          >
            <MenuItem value={1}>
              Active
            </MenuItem>

            <MenuItem value={0}>
              Inactive
            </MenuItem>
          </TextField>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleCloseEditUser}
            disabled={savingEdit}
            sx={{
              textTransform: "none",
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleUpdateUser}
            disabled={
              savingEdit ||
              !editForm.name.trim() ||
              !editForm.email.trim() ||
              !editForm.role
            }
            sx={{
              backgroundColor: "#07548e",
              textTransform: "none",

              "&:hover": {
                backgroundColor: "#064570",
              },
            }}
          >
            {savingEdit
              ? "Saving..."
              : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* =================================================
          DELETE USER DIALOG
      ================================================= */}
      <Dialog
        open={openDeleteUser}
        onClose={handleCloseDeleteUser}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Delete User
        </DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete{" "}
            <strong>
              {userToDelete?.name ||
                "this user"}
            </strong>
            ?
          </Typography>

          <Typography
            sx={{
              mt: 1,
              color: "#6b7280",
              fontSize: 14,
            }}
          >
            This action cannot be undone.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleCloseDeleteUser}
            disabled={deletingUser}
            sx={{
              textTransform: "none",
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteUser}
            disabled={deletingUser}
            sx={{
              textTransform: "none",
            }}
          >
            {deletingUser
              ? "Deleting..."
              : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* =================================================
          RESET PASSWORD DIALOG
      ================================================= */}
      <Dialog
        open={openResetPassword}
        onClose={handleCloseResetPassword}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Reset Password
        </DialogTitle>

        <DialogContent>
          <Typography
            sx={{
              mb: 2,
              color: "#374151",
            }}
          >
            Reset the password for{" "}
            <strong>
              {resetUser?.name ||
                "this user"}
            </strong>
            .
          </Typography>

          <TextField
            fullWidth
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(event) =>
              setNewPassword(
                event.target.value
              )
            }
            helperText="Minimum 6 characters"
            autoFocus
          />
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleCloseResetPassword}
            disabled={resettingPassword}
            sx={{
              textTransform: "none",
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleResetPassword}
            disabled={
              resettingPassword ||
              newPassword.length < 6
            }
            sx={{
              backgroundColor: "#7c3aed",
              textTransform: "none",

              "&:hover": {
                backgroundColor: "#6d28d9",
              },
            }}
          >
            {resettingPassword
              ? "Resetting..."
              : "Reset Password"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;