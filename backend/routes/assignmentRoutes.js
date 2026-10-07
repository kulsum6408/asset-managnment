const express = require("express");
const router  = express.Router();
const authenticate = require("../middleware/authMiddleware");
const { isAssetOfficer } = require("../middleware/roleMiddleware");
const {
    getAllAssignments, getAssignmentById,
    createAssignment, updateAssignment, deleteAssignment,
    confirmReceipt
} = require("../controllers/assignmentController");

router.get   ("/",    authenticate, getAllAssignments);
router.get   ("/:id", authenticate, getAssignmentById);
router.post  ("/",    authenticate, isAssetOfficer, createAssignment);
router.post  ("/:id/confirm-receipt", authenticate, confirmReceipt);
router.put   ("/:id", authenticate, isAssetOfficer, updateAssignment);
router.delete("/:id", authenticate, isAssetOfficer, deleteAssignment);

module.exports = router;
