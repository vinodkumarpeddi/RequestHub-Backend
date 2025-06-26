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
    if (!id) return res.status(400).json({ error: "ID is required" });

    const application = await FormModel.findByIdAndUpdate(
      id,
      { status: "Approved" },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ success: false, error: "Application not found" });
    }

    if (application.email) {
      const emailContent = `
Your internship application has been Approved!

Application Details:
Name: ${application.name}
Roll Number: ${application.rollNumber}
College: ${application.college}
Internship Institute: ${application.internshipInstitute}
Start Date: ${new Date(application.startDate).toLocaleDateString()}
End Date: ${new Date(application.endDate).toLocaleDateString()}

Regards,
RequestHub Team
      `;

      const attachments = [];
      if (application.offerLetterPath) {
        const absolutePath = path.join(__dirname, '../', application.offerLetterPath);

        if (fs.existsSync(absolutePath)) {
          attachments.push({
            filename: 'Approval_Offer_Letter.pdf',
            path: absolutePath,
            contentType: 'application/pdf',
          });
        } else {
          console.warn("Offer letter file not found:", absolutePath);
        }
      }

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: application.email,
          subject: "✅ Internship Application Approved",
          text: emailContent,
          attachments: attachments,
        });
        console.log("Approval email sent to:", application.email);
      } catch (emailError) {
        console.error("Error sending approval email:", emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: "Internship application approved",
      application,
    });
  } catch (error) {
    console.error("Error approving application:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
// Reject an application
export const rejectApplication = async (req, res) => {
  const { id } = req.params;  // ✅ From URL
  const { reason } = req.body; // ✅ From body

  try {
    const application = await FormModel.findByIdAndUpdate(
      id,
      { status: "Rejected", rejectionReason: reason },
      { new: true }
    );

    if (!application) return res.status(404).json({ error: "Application not found" });

    const emailContent = `
      Your internship application has been Rejected.

      Name: ${application.name}
      Roll Number: ${application.rollNumber}
      College: ${application.college}
      Internship Institute: ${application.internshipInstitute}
      Start Date: ${application.startDate}
      End Date: ${application.endDate}

      Reason for Rejection: ${reason || 'Not specified'}

      Regards,
      RequestHub Team
    `;

    const attachments = application.offerLetterPath ? [{
      filename: 'Rejected_Offer_Letter.pdf',
      path: application.offerLetterPath,
      contentType: 'application/pdf'
    }] : [];

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: application.email,
      subject: "Internship Application Rejected",
      text: emailContent,
      attachments
    });

    res.status(200).json({ success: true, application });
  } catch (error) {
    console.error("Error rejecting application:", error);
    res.status(500).json({ error: "Failed to reject application" });
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
