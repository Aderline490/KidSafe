import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

export enum NotificationType {
  PROPOSAL_SUBMITTED = "proposal_submitted",
  PROPOSAL_APPROVED = "proposal_approved",
  PROPOSAL_REJECTED = "proposal_rejected",
  HOME_VISIT_SCHEDULED = "home_visit_scheduled",
  HOME_VISIT_COMPLETED = "home_visit_completed",
  DOCUMENT_EXPIRED = "document_expired",
  APPROVAL_ESCALATION = "approval_escalation",
  NEW_CHILD_REGISTERED = "new_child_registered",
  NEW_DONATION = "new_donation",
  GENERAL = "general",
}

@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column()
  userId!: string;

  @Column({ type: "enum", enum: NotificationType })
  type!: NotificationType;

  @Column()
  title!: string;

  @Column({ type: "text" })
  message!: string;

  @Column({ nullable: true })
  linkUrl?: string;

  @Column({ default: false })
  isRead!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
