import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Proposal, ProposalStatus, AdoptionType } from "../entities/Proposal";
import { Child, ChildStatus } from "../entities/Child";
import { User, UserRole } from "../entities/User";
import { AuthRequest } from "../middleware/auth";
import { sendEmail } from "../config/email";
import {
  proposalConfirmationEmail,
  proposalStatusUpdateEmail,
} from "../utils/emailTemplates";

const proposalRepo = () => AppDataSource.getRepository(Proposal);
const childRepo = () => AppDataSource.getRepository(Child);
const userRepo = () => AppDataSource.getRepository(User);

// Generate application number: KS-YYYY-NNNNN
async function generateApplicationNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await proposalRepo().count();
  const seq = String(count + 1).padStart(5, "0");
  return `KS-${year}-${seq}`;
}

// POST /api/proposals — public, no account required
export const createProposal = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      childId,
      applicantFirstName,
      applicantLastName,
      applicantEmail,
      applicantPhone,
      applicantNationalId,
      adoptionType,
      motivation,
      housingDescription,
      numberOfPeopleInHousehold,
      hasOtherChildren,
      monthlyIncome,
    } = req.body;

    if (
      !childId ||
      !applicantFirstName ||
      !applicantLastName ||
      !applicantEmail ||
      !applicantNationalId
    ) {
      res.status(400).json({
        message:
          "childId, applicantFirstName, applicantLastName, applicantEmail and applicantNationalId are required",
      });
      return;
    }

    if (!/^\d{16}$/.test(applicantNationalId)) {
      res.status(400).json({ message: "National ID must be exactly 16 digits" });
      return;
    }

    const child = await childRepo().findOne({
      where: { id: childId, status: ChildStatus.AVAILABLE },
    });

    if (!child) {
      res.status(404).json({ message: "Child not found or not available" });
      return;
    }

    // Prevent duplicate pending applications from the same national ID for the same child
    const duplicate = await proposalRepo().findOne({
      where: {
        childId,
        applicantNationalId,
        status: ProposalStatus.SUBMITTED,
      },
    });

    if (duplicate) {
      res.status(409).json({
        message: "An application for this child from this national ID already exists",
        applicationNumber: duplicate.applicationNumber,
      });
      return;
    }

    const applicationNumber = await generateApplicationNumber();

    const familyDescription = [
      `Household size: ${numberOfPeopleInHousehold ?? "not specified"}`,
      `Has other children: ${hasOtherChildren ? "Yes" : "No"}`,
    ].join("\n");

    const financialInfo = monthlyIncome
      ? `Monthly income: ${monthlyIncome} RWF`
      : undefined;

    const proposal = proposalRepo().create({
      applicationNumber,
      applicantFirstName,
      applicantLastName,
      applicantEmail,
      applicantPhone,
      applicantNationalId,
      childId,
      adoptionType: (adoptionType as AdoptionType) || AdoptionType.PERMANENT,
      motivation,
      livingConditions: housingDescription,
      familyDescription,
      financialInfo,
      status: ProposalStatus.SUBMITTED,
      submittedAt: new Date(),
    });

    await proposalRepo().save(proposal);

    // Send confirmation email (non-blocking)
    const trackingUrl = `${process.env.FRONTEND_URL}/track?app=${applicationNumber}`;
    const adoptionTypeLabel =
      adoptionType === "foster_care"
        ? "Foster Care"
        : adoptionType === "emergent"
        ? "Emergent Adoption"
        : "Permanent Adoption";

    sendEmail(
      applicantEmail,
      `Application Received — ${applicationNumber}`,
      proposalConfirmationEmail({
        firstName: applicantFirstName,
        childName: child.firstName,
        applicationNumber,
        adoptionType: adoptionTypeLabel,
        trackingUrl,
      })
    ).catch((err) => console.error("Confirmation email failed:", err));

    // Notify NCDA officials of new proposal (non-blocking)
    userRepo()
      .find({ where: { role: UserRole.NCDA_OFFICIAL, isActive: true }, select: ["email", "firstName"] })
      .then((ncdaUsers) => {
        const casesUrl = `${process.env.FRONTEND_URL}/requests`;
        for (const staff of ncdaUsers) {
          sendEmail(
            staff.email,
            `New Adoption Application — ${applicationNumber}`,
            `
            <div style="font-family:sans-serif;max-width:560px;margin:auto">
              <h2 style="color:#6c63ff">New Adoption Application</h2>
              <p>Hi ${staff.firstName},</p>
              <p>A new adoption application has been submitted and requires a social worker to be assigned.</p>
              <table style="width:100%;border-collapse:collapse;margin:16px 0">
                <tr><td style="padding:6px 0;color:#888;font-size:13px">Application No.</td><td style="padding:6px 0;font-weight:bold">${applicationNumber}</td></tr>
                <tr><td style="padding:6px 0;color:#888;font-size:13px">Applicant</td><td style="padding:6px 0">${applicantFirstName} ${applicantLastName}</td></tr>
                <tr><td style="padding:6px 0;color:#888;font-size:13px">Child</td><td style="padding:6px 0">${child.firstName}</td></tr>
                <tr><td style="padding:6px 0;color:#888;font-size:13px">Type</td><td style="padding:6px 0">${adoptionTypeLabel}</td></tr>
              </table>
              <a href="${casesUrl}" style="display:inline-block;padding:12px 28px;background:#6c63ff;color:white;text-decoration:none;border-radius:8px;font-weight:bold;margin:8px 0">
                View Cases &amp; Assign Social Worker
              </a>
            </div>
            `
          ).catch((err) => console.error(`NCDA notification failed for ${staff.email}:`, err));
        }
      })
      .catch((err) => console.error("NCDA lookup failed:", err));

    res.status(201).json({
      message: "Application submitted successfully",
      applicationNumber,
    });
  } catch (error) {
    console.error("Create proposal error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/proposals/track?app=KS-2024-00001&nationalId=1234567890123456 — public
export const trackProposal = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { app, nationalId } = req.query;

    if (!app || !nationalId) {
      res
        .status(400)
        .json({ message: "Application number and national ID are required" });
      return;
    }

    const proposal = await proposalRepo().findOne({
      where: {
        applicationNumber: String(app),
        applicantNationalId: String(nationalId),
      },
      relations: ["child"],
    });

    if (!proposal) {
      res.status(404).json({
        message:
          "No application found. Please check your application number and national ID.",
      });
      return;
    }

    res.json({
      applicationNumber: proposal.applicationNumber,
      status: proposal.status,
      adoptionType: proposal.adoptionType,
      submittedAt: proposal.submittedAt,
      updatedAt: proposal.updatedAt,
      child: {
        firstName: proposal.child.firstName,
        district: proposal.child.district,
        photo: proposal.child.photo,
      },
      applicantFirstName: proposal.applicantFirstName,
    });
  } catch (error) {
    console.error("Track proposal error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/proposals/my — authenticated (stage-2 parents with account)
export const getMyProposals = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const proposals = await proposalRepo().find({
      where: [
        { familyId: req.user!.id },
        { applicantEmail: req.user!.email },
      ],
      relations: ["child"],
      order: { createdAt: "DESC" },
    });
    // Deduplicate in case both conditions match the same row
    const seen = new Set<string>();
    const unique = proposals.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
    res.json({ proposals: unique });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Called internally when a staff member updates proposal status — sends status email
export const notifyApplicantOfStatusChange = async (
  proposalId: string
): Promise<void> => {
  try {
    const proposal = await proposalRepo().findOne({
      where: { id: proposalId },
      relations: ["child"],
    });
    if (!proposal) return;

    const trackingUrl = `${process.env.FRONTEND_URL}/track?app=${proposal.applicationNumber}`;
    const html = proposalStatusUpdateEmail({
      firstName: proposal.applicantFirstName,
      childName: proposal.child.firstName,
      applicationNumber: proposal.applicationNumber,
      status: proposal.status,
      trackingUrl,
    });

    if (html) {
      await sendEmail(
        proposal.applicantEmail,
        `Update on your application ${proposal.applicationNumber}`,
        html
      );
    }
  } catch (err) {
    console.error("Status notification email failed:", err);
  }
};
