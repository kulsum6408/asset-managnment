import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from "@mui/material";

import {
  Search as SearchIcon,
  Security as SecurityIcon,
} from "@mui/icons-material";

import API from "../services/api";

const AuditLog = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("All");

  const [errorMessage, setErrorMessage] = useState("");

  // =====================================================
  // GET AUDIT SUMMARY
  // =====================================================
  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        setAuditLogs([]);
        setErrorMessage("You are not logged in.");
        return;
      }

      const response = await API.get("/reports/audit", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("AUDIT RESPONSE:", response.data);

      const data = response.data;

      if (Array.isArray(data)) {
        setAuditLogs(data);
      } else if (Array.isArray(data.data)) {
        setAuditLogs(data.data);
      } else if (Array.isArray(data.audit)) {
        setAuditLogs(data.audit);
      } else {
        setAuditLogs([]);
      }
    } catch (error) {
      console.error(
        "Failed to load audit logs:",
        error
      );

      setAuditLogs([]);

      setErrorMessage(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to load audit information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  // =====================================================
  // ENTITY TYPES
  // =====================================================
  const entityTypes = useMemo(() => {
    const types = [
      ...new Set(
        auditLogs.map(
          (item) => item.entity_type
        )
      ),
    ];

    return types.filter(Boolean);
  }, [auditLogs]);

  // =====================================================
  // FILTER
  // =====================================================
  const filteredLogs = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    return auditLogs.filter((item) => {
      const action = String(
        item.action || ""
      ).toLowerCase();

      const entityType = String(
        item.entity_type || ""
      ).toLowerCase();

      const matchesSearch =
        action.includes(searchText) ||
        entityType.includes(searchText);

      const matchesEntity =
        entityFilter === "All" ||
        item.entity_type === entityFilter;

      return (
        matchesSearch &&
        matchesEntity
      );
    });
  }, [
    auditLogs,
    search,
    entityFilter,
  ]);

  // =====================================================
  // TOTAL ACTIONS
  // =====================================================
  const totalActions = auditLogs.reduce(
    (sum, item) =>
      sum + Number(item.total || 0),
    0
  );

  // =====================================================
  // DISPLAY LABEL
  // =====================================================
  const formatAction = (action) => {
    if (!action) return "-";

    return action
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  const formatEntity = (entity) => {
    if (!entity) return "-";

    return entity
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "background.default",
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
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 3,
        }}
      >
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
          <SecurityIcon />
        </Box>

        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: "text.primary",
            }}
          >
            Audit Log
          </Typography>

          <Typography
            sx={{
              color: "text.secondary",
              mt: 0.5,
            }}
          >
            Monitor important actions performed in the system.
          </Typography>
        </Box>
      </Box>

      {/* =================================================
          ERROR
      ================================================= */}
      {errorMessage && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
          }}
        >
          {errorMessage}
        </Alert>
      )}

      {/* =================================================
          SUMMARY
      ================================================= */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(3, 1fr)",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e5e7eb",
            backgroundColor: "background.paper",
          }}
        >
          <CardContent>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mb: 1,
              }}
            >
              Audit Action Types
            </Typography>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
              }}
            >
              {auditLogs.length}
            </Typography>
          </CardContent>
        </Card>

        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e5e7eb",
            backgroundColor: "background.paper",
          }}
        >
          <CardContent>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mb: 1,
              }}
            >
              Total Recorded Actions
            </Typography>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
              }}
            >
              {totalActions}
            </Typography>
          </CardContent>
        </Card>

        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e5e7eb",
            backgroundColor: "background.paper",
          }}
        >
          <CardContent>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mb: 1,
              }}
            >
              Entity Types
            </Typography>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
              }}
            >
              {entityTypes.length}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* =================================================
          SEARCH + FILTER
      ================================================= */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          backgroundColor: "background.paper",
          mb: 3,
        }}
      >
        <CardContent>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <TextField
              fullWidth
              placeholder="Search audit actions..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              sx={{
                flex: 1,
                minWidth: 260,

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

            <FormControl
              sx={{
                minWidth: 220,
              }}
            >
              <InputLabel>
                Entity
              </InputLabel>

              <Select
                value={entityFilter}
                label="Entity"
                onChange={(event) =>
                  setEntityFilter(
                    event.target.value
                  )
                }
                sx={{
                  borderRadius: 2,
                }}
              >
                <MenuItem value="All">
                  All Entities
                </MenuItem>

                {entityTypes.map(
                  (entity) => (
                    <MenuItem
                      key={entity}
                      value={entity}
                    >
                      {formatEntity(entity)}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* =================================================
          AUDIT TABLE
      ================================================= */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          backgroundColor: "background.paper",
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                py: 8,
              }}
            >
              <CircularProgress
                sx={{
                  color: "#07548e",
                }}
              />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow
                    sx={{
                      backgroundColor:
                        "#f8fafc",
                    }}
                  >
                    <TableCell
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Action
                    </TableCell>

                    <TableCell
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Entity
                    </TableCell>

                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Count
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredLogs.length ===
                  0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        align="center"
                        sx={{
                          py: 7,
                          color: "text.secondary",
                        }}
                      >
                        No audit records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map(
                      (item, index) => (
                        <TableRow
                          key={`${item.action}-${item.entity_type}-${index}`}
                          hover
                        >
                          <TableCell>
                            <Typography
                              sx={{
                                fontWeight: 600,
                              }}
                            >
                              {formatAction(
                                item.action
                              )}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Chip
                              label={formatEntity(
                                item.entity_type
                              )}
                              size="small"
                              sx={{
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>

                          <TableCell align="center">
                            <Typography
                              sx={{
                                fontWeight: 800,
                              }}
                            >
                              {Number(
                                item.total || 0
                              )}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default AuditLog;