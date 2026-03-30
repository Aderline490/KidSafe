import { Response } from "express";
import { AppDataSource } from "../config/database";
import { HomeVisit, HomeVisitStatus } from "../entities/HomeVisit";
import { Proposal, ProposalStatus } from "../entities/Proposal";
import { AuthRequest } from "../middleware/auth";
import { notifyApplicantOfStatusChange } from "./proposalController";

const visitRepo = () => AppDataSource.getRepository(HomeVisit);
const proposalRepo = () => AppDataSource.getRepository(Proposal);

// POST /api/staff/home-visits — schedule a home visit
export const scheduleVisit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { proposalId, scheduledDate } = req.body;
    if (!proposalId || !scheduledDate) {
      res.status(400).json({ message: "proposalId and scheduledDate are required" }); return;
    }

    const proposal = await proposalRepo().findOne({ where: { id: proposalId } });
    if (!proposal) { res.status(404).json({ message: "Proposal not found" }); return; }

    const visit = visitRepo().create({
      proposalId,
      socialWorkerId: req.user!.id,
      scheduledDate: new Date(scheduledDate),
      status: HomeVisitStatus.SCHEDULED,
    });
    await visitRepo().save(visit);

    // Update proposal status
    proposal.status = ProposalStatus.HOME_VISIT_SCHEDULED;
    proposal.assignedSocialWorkerId = req.user!.id;
    await proposalRepo().save(proposal);
    notifyApplicantOfStatusChange(proposal.id).catch(() => {});

    res.status(201).json({ message: "Home visit scheduled", visit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/staff/home-visits — list visits (mine if SW, all if admin)
export const listVisits = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const qb = visitRepo()
      .createQueryBuilder("v")
      .leftJoinAndSelect("v.proposal", "proposal")
      .leftJoinAndSelect("v.socialWorker", "sw")
      .orderBy("v.scheduledDate", "ASC");

    if (req.user?.role === "social_worker") {
      qb.where("v.socialWorkerId = :id", { id: req.user.id });
    }

    const visits = await qb.getMany();
    res.json({ visits });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH /api/staff/home-visits/:id/complete — mark complete + findings
export const completeVisit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const visit = await visitRepo().findOne({
      where: { id: String(req.params.id) },
      relations: ["proposal"],
    });
    if (!visit) { res.status(404).json({ message: "Visit not found" }); return; }

    const { findings, recommendation, checklist } = req.body;

    visit.status = HomeVisitStatus.COMPLETED;
    visit.findings = findings;
    visit.recommendation = recommendation;
    visit.checklist = checklist;
    visit.completedAt = new Date();
    await visitRepo().save(visit);

    // Update proposal status
    const proposal = await proposalRepo().findOne({ where: { id: visit.proposalId } });
    if (proposal) {
      proposal.status = ProposalStatus.HOME_VISIT_COMPLETED;
      await proposalRepo().save(proposal);
      notifyApplicantOfStatusChange(proposal.id).catch(() => {});
    }

    res.json({ message: "Home visit completed", visit });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH /api/staff/home-visits/:id/cancel
export const cancelVisit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const visit = await visitRepo().findOne({ where: { id: String(req.params.id) } });
    if (!visit) { res.status(404).json({ message: "Visit not found" }); return; }

    visit.status = HomeVisitStatus.CANCELLED;
    await visitRepo().save(visit);
    res.json({ message: "Visit cancelled" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};
