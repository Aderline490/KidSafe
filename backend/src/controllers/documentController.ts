import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Document, DocumentType } from "../entities/Document";
import { Proposal } from "../entities/Proposal";
import cloudinary from "../config/cloudinary";
import { AuthRequest } from "../middleware/auth";
import fs from "fs";

const docRepo = () => AppDataSource.getRepository(Document);
const proposalRepo = () => AppDataSource.getRepository(Proposal);

// Verify applicant identity (app number + national ID)
async function verifyApplicant(appNumber: string, nationalId: string): Promise<Proposal | null> {
  return proposalRepo().findOne({
    where: { applicationNumber: appNumber, applicantNationalId: nationalId },
  });
}

// POST /api/proposals/documents — public upload (no account)
export const uploadDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { applicationNumber, nationalId, docType } = req.body;
    const file = req.file;

    if (!applicationNumber || !nationalId || !docType || !file) {
      res.status(400).json({ message: "applicationNumber, nationalId, docType and file are required" });
      return;
    }

    if (!Object.values(DocumentType).includes(docType as DocumentType)) {
      res.status(400).json({ message: "Invalid document type" });
      return;
    }

    const proposal = await verifyApplicant(applicationNumber, nationalId);
    if (!proposal) {
      if (file.path) fs.unlinkSync(file.path);
      res.status(403).json({ message: "Invalid application number or national ID" });
      return;
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      folder: `kidsafe/documents/${proposal.id}`,
      resource_type: "auto",
    });
    if (file.path) fs.unlinkSync(file.path);

    const doc = docRepo().create({
      proposalId: proposal.id,
      docType: docType as DocumentType,
      fileName: file.originalname,
      filePath: result.secure_url,
      cloudinaryPublicId: result.public_id,
      isValid: true,
    });
    await docRepo().save(doc);

    res.status(201).json({
      document: {
        id: doc.id,
        docType: doc.docType,
        fileName: doc.fileName,
        filePath: doc.filePath,
        createdAt: doc.createdAt,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
};

// GET /api/proposals/documents?app=&nationalId= — public list
export const listMyDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { app, nationalId } = req.query;
    if (!app || !nationalId) {
      res.status(400).json({ message: "app and nationalId are required" });
      return;
    }

    const proposal = await verifyApplicant(String(app), String(nationalId));
    if (!proposal) {
      res.status(403).json({ message: "Invalid application number or national ID" });
      return;
    }

    const docs = await docRepo().find({
      where: { proposalId: proposal.id },
      order: { createdAt: "ASC" },
    });

    res.json({
      documents: docs.map((d) => ({
        id: d.id,
        docType: d.docType,
        fileName: d.fileName,
        filePath: d.filePath,
        isValid: d.isValid,
        createdAt: d.createdAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/staff/proposals/:id/documents — staff view
export const listProposalDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const docs = await docRepo().find({
      where: { proposalId: String(req.params.id) },
      order: { createdAt: "ASC" },
    });

    res.json({
      documents: docs.map((d) => ({
        id: d.id,
        docType: d.docType,
        fileName: d.fileName,
        filePath: d.filePath,
        isValid: d.isValid,
        createdAt: d.createdAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/staff/proposals/:proposalId/documents/:docId
export const deleteDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doc = await docRepo().findOne({
      where: { id: String(req.params.docId), proposalId: String(req.params.id) },
    });
    if (!doc) { res.status(404).json({ message: "Document not found" }); return; }

    if (doc.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(doc.cloudinaryPublicId).catch(() => {});
    }
    await docRepo().remove(doc);
    res.json({ message: "Document deleted" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};
