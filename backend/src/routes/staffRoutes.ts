import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "../entities/User";
import {
  listProposals,
  getProposal,
  assignSocialWorker,
  reviewProposal,
} from "../controllers/staffProposalController";
import {
  scheduleVisit,
  listVisits,
  completeVisit,
  cancelVisit,
} from "../controllers/homeVisitController";
import { listAllReports, getReport } from "../controllers/reportController";
import { listProposalDocuments, deleteDocument } from "../controllers/documentController";
import { upload } from "../config/multer";
import { Proposal, ProposalStatus } from "../entities/Proposal";
import { Child, ChildStatus, Gender } from "../entities/Child";
import { User } from "../entities/User";
import { Invite } from "../entities/Invite";
import { sendEmail } from "../config/email";
import cloudinary from "../config/cloudinary";
import fs from "fs";
import crypto from "crypto";
import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { AuthRequest } from "../middleware/auth";

const router = Router();

const STAFF = [
  UserRole.SOCIAL_WORKER,
  UserRole.ORPHANAGE_ADMIN,
  UserRole.DISTRICT_COMMISSIONER,
  UserRole.NCDA_OFFICIAL,
  UserRole.SYSTEM_ADMIN,
];

// All routes require authentication + staff role
router.use(authenticate, authorize(...STAFF));

// --- Proposals ---
router.get("/proposals", listProposals);
router.get("/proposals/:id", getProposal);
router.patch("/proposals/:id/assign", assignSocialWorker);
router.patch("/proposals/:id/review", reviewProposal);

// --- Home Visits ---
router.post("/home-visits", scheduleVisit);
router.get("/home-visits", listVisits);
router.patch("/home-visits/:id/complete", completeVisit);
router.patch("/home-visits/:id/cancel", cancelVisit);

// --- Children (staff: see all statuses) ---
router.get("/children", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, district, gender, page = "1", limit = "20" } = req.query;
    const childRepo = AppDataSource.getRepository(Child);
    const qb = childRepo.createQueryBuilder("child").leftJoinAndSelect("child.createdBy", "createdBy");

    if (status) qb.andWhere("child.status = :status", { status });
    if (district && district !== "Any") qb.andWhere("LOWER(child.district) = LOWER(:district)", { district });
    if (gender && gender !== "Any") qb.andWhere("child.gender = :gender", { gender });

    const take = Math.min(Number(limit), 50);
    const skip = (Number(page) - 1) * take;

    const [children, total] = await qb
      .orderBy("child.createdAt", "DESC")
      .take(take)
      .skip(skip)
      .getManyAndCount();

    res.json({
      children: children.map((c) => ({
        ...c,
        age: Math.floor((Date.now() - new Date(c.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25)),
      })),
      total,
      page: Number(page),
      totalPages: Math.ceil(total / take),
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// --- Create child (orphanage admin) ---
router.post("/children", upload.single("photo"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const childRepo = AppDataSource.getRepository(Child);
    const {
      firstName, lastName, dateOfBirth, gender, district,
      orphanageName, background, medicalHistory,
      hasInsurance, isInSchool, schoolName,
    } = req.body;

    if (!firstName || !lastName || !dateOfBirth || !gender || !district) {
      res.status(400).json({ message: "firstName, lastName, dateOfBirth, gender, and district are required" });
      return;
    }

    let photoUrl: string | undefined;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "kidsafe/children",
        resource_type: "image",
      });
      photoUrl = result.secure_url;
      fs.unlink(req.file.path, () => {});
    }

    const child = childRepo.create({
      firstName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      gender: gender as Gender,
      district,
      orphanageName: orphanageName || undefined,
      background: background || undefined,
      medicalHistory: medicalHistory || undefined,
      hasInsurance: hasInsurance === "true" || hasInsurance === true,
      isInSchool: isInSchool === "true" || isInSchool === true,
      schoolName: schoolName || undefined,
      photo: photoUrl,
      status: ChildStatus.AVAILABLE,
      createdBy: req.user as User,
      createdById: (req.user as User).id,
    });

    await childRepo.save(child);
    res.status(201).json({ child });
  } catch (err) {
    console.error("Create child error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// --- Update child (orphanage admin) ---
router.patch("/children/:id", upload.single("photo"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const childRepo = AppDataSource.getRepository(Child);
    const child = await childRepo.findOne({ where: { id: String(req.params.id) } });
    if (!child) { res.status(404).json({ message: "Child not found" }); return; }

    const allowedFields = [
      "firstName", "lastName", "dateOfBirth", "gender", "district",
      "orphanageName", "background", "medicalHistory",
      "hasInsurance", "isInSchool", "schoolName", "status",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === "hasInsurance" || field === "isInSchool") {
          (child as any)[field] = req.body[field] === "true" || req.body[field] === true;
        } else if (field === "dateOfBirth") {
          child.dateOfBirth = new Date(req.body[field]);
        } else {
          (child as any)[field] = req.body[field];
        }
      }
    }

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "kidsafe/children",
        resource_type: "image",
      });
      child.photo = result.secure_url;
      fs.unlink(req.file.path, () => {});
    }

    await childRepo.save(child);
    res.json({ child });
  } catch (err) {
    console.error("Update child error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// --- Social workers list (for assignment UI) ---
router.get("/social-workers", async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await AppDataSource.getRepository(User).find({
      where: { role: UserRole.SOCIAL_WORKER, isActive: true },
      select: ["id", "firstName", "lastName", "email"],
      order: { firstName: "ASC" },
    });
    res.json({ socialWorkers: users });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// --- Invite approved family to create an account ---
router.post("/proposals/:id/invite-family", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const proposal = await AppDataSource.getRepository(Proposal).findOne({
      where: { id: String(req.params.id) },
    });
    if (!proposal) { res.status(404).json({ message: "Proposal not found" }); return; }
    if (proposal.status !== ProposalStatus.APPROVED) {
      res.status(400).json({ message: "Proposal must be fully approved before inviting the family" }); return;
    }
    if (proposal.familyId) {
      res.status(400).json({ message: "This family already has an account linked" }); return;
    }

    const email = proposal.applicantEmail;
    const existingUser = await AppDataSource.getRepository(User).findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: "A user with this email already exists" }); return;
    }

    // Remove any unused invite for this email
    const inviteRepo = AppDataSource.getRepository(Invite);
    const existing = await inviteRepo.findOne({ where: { email } });
    if (existing) await inviteRepo.remove(existing);

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72h

    const invite = inviteRepo.create({
      email,
      role: UserRole.ADOPTIVE_FAMILY,
      token,
      expiresAt,
      invitedBy: req.user as User,
    });
    await inviteRepo.save(invite);

    const registerUrl = `${process.env.FRONTEND_URL}/register/family?token=${token}`;
    try {
      await sendEmail(
        email,
        "Your adoption has been approved — Create your KidSafe account",
        `
        <div style="font-family:sans-serif;max-width:560px;margin:auto">
          <h2 style="color:#6c63ff">Congratulations, ${proposal.applicantFirstName}!</h2>
          <p>Your adoption application <strong>${proposal.applicationNumber}</strong> has been <strong style="color:#16a34a">fully approved</strong> by the National Child Development Agency.</p>
          <p>Please create your KidSafe account to track placement progress and submit monthly progress reports.</p>
          <a href="${registerUrl}" style="display:inline-block;padding:12px 28px;background:#6c63ff;color:white;text-decoration:none;border-radius:8px;font-weight:bold;margin:16px 0">
            Create My Account
          </a>
          <p style="color:#888;font-size:13px">This link expires in 72 hours.</p>
        </div>
        `
      );
    } catch (e) {
      console.error("Family invite email failed:", e);
    }

    res.json({ message: `Invitation sent to ${email}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// --- Mark child as placed (adopted/matched) ---
router.patch("/proposals/:id/place", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const proposalRepo = AppDataSource.getRepository(Proposal);
    const childRepo = AppDataSource.getRepository(Child);

    const proposal = await proposalRepo.findOne({
      where: { id: String(req.params.id) },
      relations: ["child"],
    });
    if (!proposal) { res.status(404).json({ message: "Proposal not found" }); return; }
    if (proposal.status !== ProposalStatus.APPROVED) {
      res.status(400).json({ message: "Proposal must be fully approved to mark as placed" }); return;
    }

    const { placementType } = req.body; // "matched" | "adopted"
    const newStatus = placementType === "adopted" ? ChildStatus.ADOPTED : ChildStatus.MATCHED;

    if (proposal.child) {
      await childRepo.update(proposal.child.id, { status: newStatus });
    }

    res.json({ message: `Child marked as ${newStatus}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// --- Reports (parent monthly reports) ---
router.get("/reports", listAllReports);
router.get("/reports/:id", getReport);

// --- Documents ---
router.get("/proposals/:id/documents", listProposalDocuments);
router.delete("/proposals/:id/documents/:docId", deleteDocument);

export default router;
