import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

const BackButton = ({ to = -1 }) => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (typeof to === "number") {
            navigate(to);
        } else {
            navigate(to);
        }
    };

    return (
        <Tooltip title="Back">
            <IconButton
                onClick={handleBack}
                color="inherit"
                sx={{ mr: 1 }}
            >
                <ArrowBackIcon />
            </IconButton>
        </Tooltip>
    );
};

export default BackButton;