import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "../entities/User";
import { createReport, getMyReports } from "../controllers/reportController";
import { upload } from "../config/multer";

const router = Router();

router.use(authenticate, authorize(UserRole.ADOPTIVE_FAMILY));

router.post("/", upload.array("files", 5), createReport);
router.get("/my", getMyReports);

export default router;
