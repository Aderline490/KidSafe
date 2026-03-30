import { Response } from "express";
import { AppDataSource } from "../config/database";
import { ChildReport } from "../entities/ChildReport";
import { Proposal } from "../entities/Proposal";
import { AuthRequest } from "../middleware/auth";
import cloudinary from "../config/cloudinary";
import fs from "fs";

const reportRepo = () => AppDataSource.getRepository(ChildReport);
const proposalRepo = () => AppDataSource.getRepository(Proposal);

// POST /api/reports — parent submits a monthly report (multipart/form-data)
export const createReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const files = (req.files ?? []) as Express.Multer.File[];
  try {
    const {
      proposalId, childId, reportMonth,
      generalWellbeing, healthStatus, schoolPerformance,
      emotionalStatus, additionalNotes,
    } = req.body;

    if (!proposalId || !childId || !reportMonth || !generalWellbeing) {
      files.forEach((f) => { try { fs.unlinkSync(f.path); } catch {} });
      res.status(400).json({ message: "proposalId, childId, reportMonth and generalWellbeing are required" });
      return;
    }

    // Verify proposal belongs to this user (by familyId or email)
    const proposal = await proposalRepo().findOne({
      where: [
        { id: proposalId, familyId: req.user!.id },
        { id: proposalId, applicantEmail: req.user!.email },
      ],
    });
    if (!proposal) {
      files.forEach((f) => { try { fs.unlinkSync(f.path); } catch {} });
      res.status(403).json({ message: "Proposal not found or does not belong to you" });
      return;
    }

    // Upload supporting docs to Cloudinary
    const supportingDocs: Array<{ fileName: string; url: string; publicId: string }> = [];
    for (const file of files) {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: `kidsafe/reports/${proposalId}`,
          resource_type: "auto",
        });
        supportingDocs.push({ fileName: file.originalname, url: result.secure_url, publicId: result.public_id });
      } finally {
        try { fs.unlinkSync(file.path); } catch {}
      }
    }

    const report = reportRepo().create({
      proposalId,
      childId,
      authorId: req.user!.id,
      reportMonth,
      generalWellbeing,
      healthStatus: healthStatus || undefined,
      schoolPerformance: schoolPerformance || undefined,
      emotionalStatus: emotionalStatus || undefined,
      additionalNotes: additionalNotes || undefined,
      supportingDocs: supportingDocs.length ? supportingDocs : undefined,
    });
    await reportRepo().save(report);

    res.status(201).json({ report });
  } catch (err) {
    files.forEach((f) => { try { fs.unlinkSync(f.path); } catch {} });
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/reports/my — parent's own reports
export const getMyReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reports = await reportRepo().find({
      where: { authorId: req.user!.id },
      relations: ["child", "proposal"],
      order: { createdAt: "DESC" },
    });
    res.json({
      reports: reports.map((r) => ({
        id: r.id,
        reportMonth: r.reportMonth,
        generalWellbeing: r.generalWellbeing,
        healthStatus: r.healthStatus,
        schoolPerformance: r.schoolPerformance,
        emotionalStatus: r.emotionalStatus,
        additionalNotes: r.additionalNotes,
        supportingDocs: r.supportingDocs ?? [],
        createdAt: r.createdAt,
        child: r.child ? { id: r.child.id, firstName: r.child.firstName, photo: r.child.photo, district: r.child.district } : null,
        proposal: r.proposal ? { id: r.proposal.id, applicationNumber: r.proposal.applicationNumber } : null,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/staff/reports — staff view of all reports
export const listAllReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reports = await reportRepo().find({
      relations: ["child", "author", "proposal"],
      order: { createdAt: "DESC" },
    });
    res.json({
      reports: reports.map((r) => ({
        id: r.id,
        reportMonth: r.reportMonth,
        generalWellbeing: r.generalWellbeing,
        healthStatus: r.healthStatus,
        schoolPerformance: r.schoolPerformance,
        emotionalStatus: r.emotionalStatus,
        additionalNotes: r.additionalNotes,
        supportingDocs: r.supportingDocs ?? [],
        createdAt: r.createdAt,
        child: r.child
          ? { id: r.child.id, firstName: r.child.firstName, photo: r.child.photo, district: r.child.district }
          : null,
        author: r.author
          ? { firstName: r.author.firstName, lastName: r.author.lastName, email: r.author.email }
          : null,
        proposal: r.proposal
          ? { id: r.proposal.id, applicationNumber: r.proposal.applicationNumber }
          : null,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/staff/reports/:id
export const getReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const report = await reportRepo().findOne({
      where: { id: String(req.params.id) },
      relations: ["child", "author", "proposal"],
    });
    if (!report) { res.status(404).json({ message: "Report not found" }); return; }
    res.json({ report });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};
