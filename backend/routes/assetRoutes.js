const express = require("express");
const router  = express.Router();
const authenticate = require("../middleware/authMiddleware");
const { isAssetOfficer } = require("../middleware/roleMiddleware");
const {
    getAllAssets, getCategories, getAssetById, getAssetHistory, getAssetQR,
    createAsset, updateAsset, updateAssetStatus, deleteAsset,
    getWarrantiesActive, getWarrantiesExpired, getWarrantiesExpiringSoon
} = require("../controllers/assetController");

router.get   ("/categories",              authenticate, getCategories);
router.get   ("/warranties/active",       authenticate, getWarrantiesActive);
router.get   ("/warranties/expired",      authenticate, getWarrantiesExpired);
router.get   ("/warranties/expiring-soon", authenticate, getWarrantiesExpiringSoon);
router.get   ("/",                        authenticate, getAllAssets);
router.get   ("/:id/history",             authenticate, getAssetHistory);
router.get   ("/:id/qr",                  authenticate, getAssetQR);
router.get   ("/:id",                     authenticate, getAssetById);
router.post  ("/",                        authenticate, isAssetOfficer, createAsset);
router.put   ("/:id",                     authenticate, isAssetOfficer, updateAsset);
router.patch ("/:id/status",              authenticate, isAssetOfficer, updateAssetStatus);
router.delete("/:id",                     authenticate, isAssetOfficer, deleteAsset);

module.exports = router;
