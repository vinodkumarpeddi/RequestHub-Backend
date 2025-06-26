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

// Ensure uploads directory exists (important for Render)
const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // e.g. 1720111111111.pdf
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

const upload = multer({ storage, fileFilter }).single("offerLetter");

// Routes
router.post("/submit-form", upload, submitForm);
router.get("/applications", getApplications);
router.patch("/approve-application/:id", approveApplication);
router.put("/reject-application/:id", rejectApplication);
router.delete("/delete-application/:id", deleteApplication);
router.get("/applicationsApproved", getApprovedApplications);
router.get("/applicationsRejected", getRejectedApplications);
router.get("/applicationsPending", getPendingApplications);

export default router;
