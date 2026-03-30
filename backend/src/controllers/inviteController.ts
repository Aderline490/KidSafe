import { Response } from "express";
import { AppDataSource } from "../config/database";
import { Invite } from "../entities/Invite";
import { User, UserRole } from "../entities/User";
import { AuthRequest } from "../middleware/auth";
import { sendEmail } from "../config/email";
import crypto from "crypto";

const STAFF_ROLES: UserRole[] = [
  UserRole.SOCIAL_WORKER,
  UserRole.ORPHANAGE_ADMIN,
  UserRole.DISTRICT_COMMISSIONER,
  UserRole.NCDA_OFFICIAL,
  UserRole.SYSTEM_ADMIN,
];

const inviteRepo = () => AppDataSource.getRepository(Invite);
const userRepo = () => AppDataSource.getRepository(User);

// POST /api/admin/invites — Admin sends an invite
export const sendInvite = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      res.status(400).json({ message: "Email and role are required" });
      return;
    }

    if (!STAFF_ROLES.includes(role)) {
      res.status(400).json({ message: "Invalid staff role" });
      return;
    }

    // Check if user already exists
    const existingUser = await userRepo().findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: "A user with this email already exists" });
      return;
    }

    // Invalidate any existing unused invite for this email
    const existingInvite = await inviteRepo().findOne({
      where: { email, usedAt: undefined as any },
    });
    if (existingInvite && !existingInvite.isExpired && !existingInvite.isUsed) {
      await inviteRepo().remove(existingInvite);
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    const invite = inviteRepo().create({
      email,
      role,
      token,
      expiresAt,
      invitedBy: req.user,
    });

    await inviteRepo().save(invite);

    // Send invite email
    const roleLabel = role.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
    const registerUrl = `${process.env.FRONTEND_URL}/register/staff?token=${token}`;

    try {
      await sendEmail(
        email,
        `You're invited to join KidSafe as ${roleLabel}`,
        `
        <div style="font-family:sans-serif;max-width:500px;margin:auto">
          <h2 style="color:#6c63ff">You're invited to KidSafe</h2>
          <p>You have been invited by <strong>${req.user?.firstName} ${req.user?.lastName}</strong> to join KidSafe as a <strong>${roleLabel}</strong>.</p>
          <p>Click the button below to complete your registration:</p>
          <a href="${registerUrl}" style="display:inline-block;padding:12px 28px;background:#6c63ff;color:white;text-decoration:none;border-radius:8px;font-weight:bold;margin:16px 0">
            Accept Invitation
          </a>
          <p style="color:#888;font-size:13px">This invite link expires in 48 hours. If you weren't expecting this, you can ignore this email.</p>
        </div>
        `
      );
    } catch (emailErr) {
      console.error("Invite email failed (invite still saved):", emailErr);
    }

    res.status(201).json({
      message: `Invite sent to ${email}`,
      invite: { email, role, expiresAt },
    });
  } catch (error) {
    console.error("Send invite error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/auth/verify-invite?token=xxx — Validate invite token
export const verifyInvite = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token) {
      res.status(400).json({ message: "Token is required" });
      return;
    }

    const invite = await inviteRepo().findOne({
      where: { token: token as string },
    });

    if (!invite) {
      res.status(404).json({ message: "Invalid invite link" });
      return;
    }

    if (invite.isUsed) {
      res.status(400).json({ message: "This invite has already been used" });
      return;
    }

    if (invite.isExpired) {
      res.status(400).json({ message: "This invite link has expired" });
      return;
    }

    res.json({
      valid: true,
      email: invite.email,
      role: invite.role,
    });
  } catch (error) {
    console.error("Verify invite error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/admin/invites — List all invites
export const listInvites = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const invites = await inviteRepo().find({
      relations: ["invitedBy"],
      order: { createdAt: "DESC" },
    });

    res.json({
      invites: invites.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        expiresAt: inv.expiresAt,
        usedAt: inv.usedAt,
        isExpired: inv.isExpired,
        isUsed: inv.isUsed,
        invitedBy: inv.invitedBy
          ? `${inv.invitedBy.firstName} ${inv.invitedBy.lastName}`
          : null,
        createdAt: inv.createdAt,
      })),
    });
  } catch (error) {
    console.error("List invites error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/admin/invites/:id — Revoke an invite
export const revokeInvite = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const invite = await inviteRepo().findOne({ where: { id: req.params.id as string } });

    if (!invite) {
      res.status(404).json({ message: "Invite not found" });
      return;
    }

    await inviteRepo().remove(invite);
    res.json({ message: "Invite revoked" });
  } catch (error) {
    console.error("Revoke invite error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
