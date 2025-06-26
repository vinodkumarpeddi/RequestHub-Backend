import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  submitForm,
  getApplications,
  approveApplication,
  rejectApplication,
  deleteApplication,
  getApprovedApplications,
  getRejectedApplications,
  getPendingApplications,
} from "../controllers/formController.js";

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage }).single("offerLetter");

// Routes
router.post("/submit-form", upload, submitForm);
router.get("/applications", getApplications);
router.patch("/approve-application/:id", approveApplication);
router.patch("/reject-application/:id", rejectApplication);
router.delete("/delete-application/:id", deleteApplication);
router.get("/applicationsApproved", getApprovedApplications);
router.get("/applicationsRejected", getRejectedApplications);
router.get("/applicationsPending", getPendingApplications);

export default router;
