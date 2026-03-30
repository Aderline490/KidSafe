import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Child, ChildStatus } from "../entities/Child";
import { AuthRequest } from "../middleware/auth";
import { ILike, Like } from "typeorm";

const childRepo = () => AppDataSource.getRepository(Child);

// GET /api/children (public) — for landing page & explore page
export const getPublicChildren = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      district,
      gender,
      minAge,
      maxAge,
      limit = "12",
      page = "1",
    } = req.query;

    const qb = childRepo()
      .createQueryBuilder("child")
      .where("child.status = :status", { status: ChildStatus.AVAILABLE });

    if (district && district !== "Any") {
      qb.andWhere("LOWER(child.district) = LOWER(:district)", { district });
    }
    if (gender && gender !== "Any") {
      qb.andWhere("child.gender = :gender", { gender });
    }
    if (minAge) {
      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - Number(minAge));
      qb.andWhere("child.dateOfBirth <= :minDate", { minDate });
    }
    if (maxAge) {
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() - Number(maxAge));
      qb.andWhere("child.dateOfBirth >= :maxDate", { maxDate });
    }

    const take = Math.min(Number(limit), 50);
    const skip = (Number(page) - 1) * take;

    const [children, total] = await qb
      .select([
        "child.id",
        "child.firstName",
        "child.dateOfBirth",
        "child.gender",
        "child.district",
        "child.photo",
        "child.status",
        "child.isInSchool",
        "child.hasInsurance",
      ])
      .orderBy("child.createdAt", "DESC")
      .take(take)
      .skip(skip)
      .getManyAndCount();

    res.json({
      children: children.map((c) => ({
        ...c,
        age: Math.floor(
          (Date.now() - new Date(c.dateOfBirth).getTime()) /
            (1000 * 60 * 60 * 24 * 365.25)
        ),
        // Privacy: only show first name + district until matched
        firstName: c.firstName,
      })),
      total,
      page: Number(page),
      totalPages: Math.ceil(total / take),
    });
  } catch (error) {
    console.error("Get children error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/children/:id (public)
export const getPublicChild = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const child = await childRepo().findOne({
      where: { id: String(req.params.id), status: ChildStatus.AVAILABLE },
      select: [
        "id", "firstName", "dateOfBirth", "gender", "district",
        "photo", "background", "isInSchool", "hasInsurance",
        "schoolName", "orphanageName", "status",
      ],
    });

    if (!child) {
      res.status(404).json({ message: "Child not found" });
      return;
    }

    res.json({
      ...child,
      age: Math.floor(
        (Date.now() - new Date(child.dateOfBirth).getTime()) /
          (1000 * 60 * 60 * 24 * 365.25)
      ),
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
