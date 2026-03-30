import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "../entities/User";
import {
  sendInvite,
  listInvites,
  revokeInvite,
} from "../controllers/inviteController";

const router = Router();

// All admin invite routes require authentication + ADMIN role
router.use(authenticate, authorize(UserRole.SYSTEM_ADMIN));

router.post("/", sendInvite);
router.get("/", listInvites);
router.delete("/:id", revokeInvite);

export default router;
