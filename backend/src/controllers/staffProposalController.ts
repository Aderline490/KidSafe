import { Response } from "express";
import { AppDataSource } from "../config/database";
import { Proposal, ProposalStatus } from "../entities/Proposal";
import { AuthRequest } from "../middleware/auth";
import { UserRole } from "../entities/User";
import { notifyApplicantOfStatusChange } from "./proposalController";
import { documentUploadRequestEmail } from "../utils/emailTemplates";
import { sendEmail } from "../config/email";

const repo = () => AppDataSource.getRepository(Proposal);

// GET /api/staff/proposals — all proposals (staff view)
export const listProposals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, assignedToMe } = req.query;

    const qb = repo()
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.child", "child")
      .leftJoinAndSelect("p.assignedSocialWorker", "sw")
      .orderBy("p.submittedAt", "DESC");

    if (status) qb.andWhere("p.status = :status", { status });

    if (assignedToMe === "true" && req.user?.role === UserRole.SOCIAL_WORKER) {
      qb.andWhere("p.assignedSocialWorkerId = :swId", { swId: req.user.id });
    }

    const proposals = await qb.getMany();

    res.json({
      proposals: proposals.map((p) => ({
        id: p.id,
        applicationNumber: p.applicationNumber,
        status: p.status,
        adoptionType: p.adoptionType,
        submittedAt: p.submittedAt,
        updatedAt: p.updatedAt,
        applicantFirstName: p.applicantFirstName,
        applicantLastName: p.applicantLastName,
        applicantEmail: p.applicantEmail,
        applicantPhone: p.applicantPhone,
        assignedSocialWorker: p.assignedSocialWorker
          ? { id: p.assignedSocialWorker.id, firstName: p.assignedSocialWorker.firstName, lastName: p.assignedSocialWorker.lastName }
          : null,
        child: p.child
          ? { id: p.child.id, firstName: p.child.firstName, district: p.child.district, photo: p.child.photo, dateOfBirth: p.child.dateOfBirth }
          : null,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/staff/proposals/:id
export const getProposal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const proposal = await repo().findOne({
      where: { id: String(req.params.id) },
      relations: ["child", "assignedSocialWorker"],
    });
    if (!proposal) { res.status(404).json({ message: "Proposal not found" }); return; }
    res.json(proposal);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH /api/staff/proposals/:id/assign — assign a social worker
export const assignSocialWorker = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const proposal = await repo().findOne({
      where: { id: String(req.params.id) },
      relations: ["child"],
    });
    if (!proposal) { res.status(404).json({ message: "Proposal not found" }); return; }

    const { socialWorkerId } = req.body;
    if (!socialWorkerId) { res.status(400).json({ message: "socialWorkerId is required" }); return; }

    proposal.assignedSocialWorkerId = socialWorkerId;
    await repo().save(proposal);

    // Email the applicant asking them to upload their documents
    const uploadUrl = `${process.env.FRONTEND_URL}/documents?app=${proposal.applicationNumber}&nationalId=${proposal.applicantNationalId}`;
    const trackingUrl = `${process.env.FRONTEND_URL}/track?app=${proposal.applicationNumber}`;
    sendEmail(
      proposal.applicantEmail,
      `Action Required: Upload documents for ${proposal.applicationNumber}`,
      documentUploadRequestEmail({
        firstName: proposal.applicantFirstName,
        childName: proposal.child?.firstName ?? "the child",
        applicationNumber: proposal.applicationNumber,
        uploadUrl,
        trackingUrl,
      })
    ).catch((err) => console.error("Document request email failed:", err));

    res.json({ message: "Social worker assigned", proposal });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Role → which status transitions are allowed
const APPROVE_MAP: Partial<Record<UserRole, ProposalStatus>> = {
  [UserRole.SOCIAL_WORKER]: ProposalStatus.LEVEL1_APPROVED,
  [UserRole.DISTRICT_COMMISSIONER]: ProposalStatus.LEVEL2_APPROVED,
  [UserRole.NCDA_OFFICIAL]: ProposalStatus.APPROVED,
  [UserRole.SYSTEM_ADMIN]: ProposalStatus.LEVEL1_APPROVED, // admin acts as level-1 by default
};

const REJECT_MAP: Partial<Record<UserRole, ProposalStatus>> = {
  [UserRole.SOCIAL_WORKER]: ProposalStatus.LEVEL1_REJECTED,
  [UserRole.DISTRICT_COMMISSIONER]: ProposalStatus.LEVEL2_REJECTED,
  [UserRole.NCDA_OFFICIAL]: ProposalStatus.REJECTED,
  [UserRole.SYSTEM_ADMIN]: ProposalStatus.LEVEL1_REJECTED,
};

// PATCH /api/staff/proposals/:id/review — approve or reject at the caller's level
export const reviewProposal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const proposal = await repo().findOne({ where: { id: String(req.params.id) } });
    if (!proposal) { res.status(404).json({ message: "Proposal not found" }); return; }

    const { action } = req.body; // action: "approve" | "reject"
    if (!action || !["approve", "reject"].includes(action)) {
      res.status(400).json({ message: "action must be 'approve' or 'reject'" }); return;
    }

    const role = req.user?.role as UserRole;
    const nextStatus = action === "approve" ? APPROVE_MAP[role] : REJECT_MAP[role];
    if (!nextStatus) {
      res.status(403).json({ message: "Your role cannot review proposals" }); return;
    }

    proposal.status = nextStatus;
    await repo().save(proposal);
    notifyApplicantOfStatusChange(proposal.id).catch(() => {});

    res.json({ message: `Proposal ${action}d`, status: proposal.status });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};
