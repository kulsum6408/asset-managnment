const express  = require("express");
const router   = express.Router();
const upload   = require("../middleware/uploadMiddleware");
const authenticate = require("../middleware/authMiddleware");

// POST /api/upload/single
router.post("/single", authenticate, upload.single("file"), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file was uploaded." });
        
        const fileUrl = `/uploads/${req.file.filename}`;
        res.status(200).json({
            message: "File uploaded successfully.",
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            url: fileUrl
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/upload/multiple
router.post("/multiple", authenticate, upload.array("files", 5), (req, res) => {
    try {
        if (!req.files || req.files.length === 0)
            return res.status(400).json({ error: "No files were uploaded." });

        const uploadedFiles = req.files.map(f => ({
            filename: f.filename,
            originalName: f.originalname,
            size: f.size,
            mimetype: f.mimetype,
            url: `/uploads/${f.filename}`
        }));

        res.status(200).json({
            message: `${uploadedFiles.length} file(s) uploaded successfully.`,
            files: uploadedFiles
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
