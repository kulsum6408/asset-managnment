import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Grid,
  Chip,
} from "@mui/material";

import {
  Category as CategoryIcon,
} from "@mui/icons-material";

import API from "../services/api";
import BackButton from "../components/BackButton";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // =====================================================
  // GET CATEGORIES
  // =====================================================
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        setErrorMessage("You are not logged in.");
        return;
      }

      const response = await API.get(
        "/assets/categories",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "CATEGORIES RESPONSE:",
        response.data
      );

      const data = response.data;

      if (Array.isArray(data)) {
        setCategories(data);
      } else if (Array.isArray(data.categories)) {
        setCategories(data.categories);
      } else if (Array.isArray(data.data)) {
        setCategories(data.data);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error(
        "Failed to load categories:",
        error
      );

      setCategories([]);

      setErrorMessage(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to load categories."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

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
          HEADER
      ================================================= */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          alignItems: "flex-start",
        }}
      >
        <BackButton to="/admin" />

        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: "#1f2937",
            }}
          >
            Categories
          </Typography>

          <Typography
            sx={{
              color: "#6b7280",
              mt: 0.5,
            }}
          >
            View asset categories in the system.
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
      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
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
            <CategoryIcon />
          </Box>

          <Box>
            <Typography
              variant="body2"
              sx={{
                color: "#6b7280",
              }}
            >
              Total Categories
            </Typography>

            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: "#1f2937",
              }}
            >
              {loading ? "..." : categories.length}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* =================================================
          CATEGORY LIST
      ================================================= */}
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
      ) : categories.length === 0 ? (
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e5e7eb",
            backgroundColor: "#ffffff",
          }}
        >
          <CardContent
            sx={{
              py: 7,
              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                color: "#6b7280",
              }}
            >
              No categories found.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {categories.map((category, index) => {
            const categoryId =
              category.category_id ||
              category.id ||
              index + 1;

            const categoryName =
              category.category_name ||
              category.name ||
              category.category ||
              "Unknown Category";

            return (
              <Grid
                key={categoryId}
                size={{
                  xs: 12,
                  sm: 6,
                  md: 4,
                }}
              >
                <Card
                  elevation={0}
                  sx={{
                    height: "100%",
                    borderRadius: 3,
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#ffffff",
                    transition: "0.2s",

                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow:
                        "0 8px 20px rgba(0,0,0,0.06)",
                    },
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: "#1f2937",
                        }}
                      >
                        {categoryName}
                      </Typography>

                      <Chip
                        label={`#${categoryId}`}
                        size="small"
                        sx={{
                          fontWeight: 600,
                        }}
                      />
                    </Box>

                    <Typography
                      variant="body2"
                      sx={{
                        color: "#6b7280",
                      }}
                    >
                      {category.description ||
                        "Asset category"}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default Categories;