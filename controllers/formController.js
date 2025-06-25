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
  const {
    name, rollNumber, college, branch, semester,
    internshipInstitute, startDate, endDate, email
  } = req.body;

  const offerLetterPath = req.file?.path || null;

  try {
    const formData = new FormModel({
      name, rollNumber, college, branch, semester,
      internshipInstitute, startDate, endDate, email, offerLetterPath
    });
    await formData.save();

    const emailContent = `
Name: ${name}
Roll Number: ${rollNumber}
College: ${college}
Branch: ${branch}
Semester: ${semester}
Internship Institute: ${internshipInstitute}
Start Date: ${new Date(startDate).toLocaleDateString()}
End Date: ${new Date(endDate).toLocaleDateString()}
Status: Pending
    `;

    const attachments = offerLetterPath
      ? [{
          filename: req.file.originalname || 'offer_letter.pdf',
          path: offerLetterPath,
          contentType: 'application/pdf'
        }]
      : [];

    // Send confirmation to student
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "✅ Internship Application Form Submission",
      text: `Your application has been submitted successfully.\n\n${emailContent}`,
      attachments
    });

    // Send notification to admin
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: "📩 New Internship Application",
      text: `New Internship application received:\n\n${emailContent}`,
      attachments
    });

    res.status(200).json({ success: true, message: "Form submitted and emails sent!" });
  } catch (error) {
    console.error("Submit Form Error:", error);
    res.status(500).json({ success: false, message: "Something went wrong." });
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
  const { id } = req.params;

  try {
    const application = await FormModel.findByIdAndUpdate(
      id,
      { status: "Approved" },
      { new: true }
    );

    if (!application) return res.status(404).json({ error: "Application not found" });

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

    const attachments = application.offerLetterPath
      ? [{
          filename: 'Approval_Offer_Letter.pdf',
          path: application.offerLetterPath,
          contentType: 'application/pdf'
        }]
      : [];

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: application.email,
      subject: "✅ Internship Application Approved",
      text: emailContent,
      attachments
    });

    res.status(200).json({ success: true, application });
  } catch (error) {
    console.error("Approve Application Error:", error);
    res.status(500).json({ error: "Failed to approve application" });
  }
};

// Reject an application
export const rejectApplication = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const application = await FormModel.findByIdAndUpdate(
      id,
      { status: "Rejected", rejectionReason: reason },
      { new: true }
    );

    if (!application) return res.status(404).json({ error: "Application not found" });

    const emailContent = `
Your internship application has been Rejected.

Application Details:
Name: ${application.name}
Roll Number: ${application.rollNumber}
College: ${application.college}
Internship Institute: ${application.internshipInstitute}
Start Date: ${new Date(application.startDate).toLocaleDateString()}
End Date: ${new Date(application.endDate).toLocaleDateString()}

Reason for Rejection: ${reason || 'Not specified'}

Regards,
RequestHub Team
    `;

    const attachments = application.offerLetterPath
      ? [{
          filename: 'Rejected_Offer_Letter.pdf',
          path: application.offerLetterPath,
          contentType: 'application/pdf'
        }]
      : [];

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: application.email,
      subject: "❌ Internship Application Rejected",
      text: emailContent,
      attachments
    });

    res.status(200).json({ success: true, application });
  } catch (error) {
    console.error("Reject Application Error:", error);
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
