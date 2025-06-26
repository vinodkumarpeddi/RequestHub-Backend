import FormModel from "../models/formModel.js";
import nodemailer from "nodemailer";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Submit new internship form
export const submitForm = async (req, res) => {
  try {
    const {
      name, rollNumber, college, branch, semester,
      internshipInstitute, email, startDate, endDate
    } = req.body;

    if (!name || !rollNumber || !college || !branch || !semester ||
        !internshipInstitute || !email || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Offer letter file is required" });
    }

    const newSubmission = new FormModel({
      name,
      rollNumber,
      college,
      branch,
      semester,
      internshipInstitute,
      email,
      startDate,
      endDate,
      offerLetterPath: req.file.path,
    });

    await newSubmission.save();

    res.status(201).json({
      success: true,
      message: "Internship form submitted successfully",
    });

  } catch (err) {
    console.error("submitForm error:", err);
    res.status(500).json({ success: false, message: "Server error. Try again later." });
  }
};

// Get all applications
export const getApplications = async (req, res) => {
  try {
    const applications = await FormModel.find().sort({ createdAt: -1 });
    res.status(200).json(applications);
  } catch (error) {
    console.error("Fetch Applications Error:", error);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
};

// Approve an application
export const approveApplication = async (req, res) => {
  try {
    const { id } = req.body;
    
    // Validate ID
    if (!id || id.length !== 24) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid application ID" 
      });
    }

    // Update application status
    const application = await FormModel.findByIdAndUpdate(
      id,
      { status: "Approved" },
      { new: true, runValidators: true }
    );

    if (!application) {
      return res.status(404).json({ 
        success: false, 
        error: "Application not found" 
      });
    }

    // Send approval email
    if (application.email) {
      const emailContent = `
        <h2>Your internship application has been approved!</h2>
        <p><strong>Details:</strong></p>
        <ul>
          <li>Name: ${application.name}</li>
          <li>Roll Number: ${application.rollNumber}</li>
          <li>Institute: ${application.internshipInstitute}</li>
          <li>Duration: ${new Date(application.startDate).toLocaleDateString()} - 
              ${new Date(application.endDate).toLocaleDateString()}</li>
        </ul>
        <p>Congratulations!</p>
      `;

      await transporter.sendMail({
        from: `"RequestHub" <${process.env.EMAIL_USER}>`,
        to: application.email,
        subject: "Internship Application Approved",
        html: emailContent,
      });
    }

    res.status(200).json({
      success: true,
      message: "Application approved successfully",
      data: application
    });

  } catch (error) {
    console.error("Approval Error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Internal server error",
      details: error.message 
    });
  }
};

// Reject an application
export const rejectApplication = async (req, res) => {
  try {
    const { id, reason } = req.body;
    
    // Validate input
    if (!id || id.length !== 24) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid application ID" 
      });
    }

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ 
        success: false, 
        error: "Please provide a valid rejection reason (min 5 characters)" 
      });
    }

    // Update application status
    const application = await FormModel.findByIdAndUpdate(
      id,
      { 
        status: "Rejected",
        rejectionReason: reason.trim() 
      },
      { new: true, runValidators: true }
    );

    if (!application) {
      return res.status(404).json({ 
        success: false, 
        error: "Application not found" 
      });
    }

    // Send rejection email
    if (application.email) {
      const emailContent = `
        <h2>Your internship application status</h2>
        <p>We regret to inform you that your application has been rejected.</p>
        
        <p><strong>Details:</strong></p>
        <ul>
          <li>Name: ${application.name}</li>
          <li>Roll Number: ${application.rollNumber}</li>
          <li>Institute: ${application.internshipInstitute}</li>
        </ul>
        
        <p><strong>Reason for rejection:</strong></p>
        <p>${reason}</p>
        
        <p>Please contact the admin office if you have any questions.</p>
      `;

      await transporter.sendMail({
        from: `"RequestHub" <${process.env.EMAIL_USER}>`,
        to: application.email,
        subject: "Internship Application Decision",
        html: emailContent,
      });
    }

    res.status(200).json({
      success: true,
      message: "Application rejected successfully",
      data: application
    });

  } catch (error) {
    console.error("Rejection Error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Internal server error",
      details: error.message 
    });
  }
};


// Delete an application
export const deleteApplication = async (req, res) => {
  const { id } = req.params;

  try {
    const application = await FormModel.findByIdAndDelete(id);
    if (!application) return res.status(404).json({ error: "Application not found" });

    if (application.offerLetterPath) {
      fs.unlink(application.offerLetterPath, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Delete Application Error:", error);
    res.status(500).json({ error: "Failed to delete application" });
  }
};

// Get all approved applications
export const getApprovedApplications = async (req, res) => {
  try {
    const applications = await FormModel.find({ status: 'Approved' }).sort({ createdAt: -1 });
    res.status(200).json(applications);
  } catch (error) {
    console.error("Get Approved Error:", error);
    res.status(500).json({ error: "Failed to fetch approved applications" });
  }
};

// Get all rejected applications
export const getRejectedApplications = async (req, res) => {
  try {
    const applications = await FormModel.find({ status: 'Rejected' }).sort({ createdAt: -1 });
    res.status(200).json(applications);
  } catch (error) {
    console.error("Get Rejected Error:", error);
    res.status(500).json({ error: "Failed to fetch rejected applications" });
  }
};

// Get all pending applications
export const getPendingApplications = async (req, res) => {
  try {
    const applications = await FormModel.find({ status: 'Pending' }).sort({ createdAt: -1 });
    res.status(200).json(applications);
  } catch (error) {
    console.error("Get Pending Error:", error);
    res.status(500).json({ error: "Failed to fetch pending applications" });
  }
};
