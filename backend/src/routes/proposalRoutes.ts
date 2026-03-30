import { Router } from "express";
import {
  createProposal,
  trackProposal,
  getMyProposals,
} from "../controllers/proposalController";
import { uploadDocument, listMyDocuments } from "../controllers/documentController";
import { upload } from "../config/multer";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "../entities/User";

const router = Router();

// Public — no account needed
router.post("/", createProposal);
router.get("/track", trackProposal);

// Public document upload/list — verified by applicationNumber + nationalId
router.post("/documents", upload.single("file"), uploadDocument);
router.get("/documents", listMyDocuments);

// Authenticated — stage-2 parents who have been invited to create accounts
router.get("/my", authenticate, authorize(UserRole.ADOPTIVE_FAMILY), getMyProposals);

export default router;
