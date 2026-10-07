const express = require("express");
const router  = express.Router();
const authenticate = require("../middleware/authMiddleware");
const { isAssetOfficer } = require("../middleware/roleMiddleware");
const {
    getAllReturns, getReturnById,
    createReturn, updateReturn, deleteReturn
} = require("../controllers/returnController");

// Employees submit RETURN REQUESTS via /api/return-requests
// (kept Pending and reviewed by the Asset Officer).
//
// /api/returns is the old immediate-return endpoint. It marks
// the asset Available / writes store records at once, so it is
// restricted to Asset Officers only to prevent employees from
// bypassing the review workflow.
router.get   ("/",    authenticate, getAllReturns);
router.get   ("/:id", authenticate, getReturnById);
router.post  ("/",    authenticate, isAssetOfficer, createReturn);
router.put   ("/:id", authenticate, isAssetOfficer, updateReturn);
router.delete("/:id", authenticate, isAssetOfficer, deleteReturn);

module.exports = router;
