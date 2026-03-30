import { Router } from "express";
import { getPublicChildren, getPublicChild } from "../controllers/childController";

const router = Router();

router.get("/", getPublicChildren);
router.get("/:id", getPublicChild);

export default router;
