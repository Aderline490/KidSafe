import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Child } from "./Child";
import { Document } from "./Document";

export enum ProposalStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  HOME_VISIT_SCHEDULED = "home_visit_scheduled",
  HOME_VISIT_COMPLETED = "home_visit_completed",
  LEVEL1_PENDING = "level1_pending",
  LEVEL1_APPROVED = "level1_approved",
  LEVEL1_REJECTED = "level1_rejected",
  LEVEL2_PENDING = "level2_pending",
  LEVEL2_APPROVED = "level2_approved",
  LEVEL2_REJECTED = "level2_rejected",
  LEVEL3_PENDING = "level3_pending",
  LEVEL3_APPROVED = "level3_approved",
  LEVEL3_REJECTED = "level3_rejected",
  APPROVED = "approved",
  REJECTED = "rejected",
  WITHDRAWN = "withdrawn",
}

@Entity("proposals")
export class Proposal {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "familyId" })
  family!: User;

  @Column()
  familyId!: string;

  @ManyToOne(() => Child)
  @JoinColumn({ name: "childId" })
  child!: Child;

  @Column()
  childId!: string;

  @Column({
    type: "enum",
    enum: ProposalStatus,
    default: ProposalStatus.DRAFT,
  })
  status!: ProposalStatus;

  @Column({ type: "text", nullable: true })
  motivation?: string;

  @Column({ type: "text", nullable: true })
  familyDescription?: string;

  @Column({ type: "text", nullable: true })
  livingConditions?: string;

  @Column({ type: "text", nullable: true })
  financialInfo?: string;

  @Column({ nullable: true })
  assignedSocialWorkerId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "assignedSocialWorkerId" })
  assignedSocialWorker?: User;

  @OneToMany(() => Document, (doc) => doc.proposal)
  documents!: Document[];

  @Column({ nullable: true, type: "timestamp" })
  submittedAt?: Date;

  @Column({ nullable: true, type: "timestamp" })
  withdrawnAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
