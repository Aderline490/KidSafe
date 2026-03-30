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

export enum AdoptionType {
  PERMANENT = "permanent",
  FOSTER_CARE = "foster_care",
  EMERGENT = "emergent",
}

@Entity("proposals")
export class Proposal {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  // Auto-generated human-readable number e.g. KS-2024-00142
  @Column({ unique: true })
  applicationNumber!: string;

  // Applicant info — stored directly so no account is needed
  @Column()
  applicantFirstName!: string;

  @Column()
  applicantLastName!: string;

  @Column()
  applicantEmail!: string;

  @Column({ nullable: true })
  applicantPhone?: string;

  @Column({ length: 16 })
  applicantNationalId!: string;

  // Optional link to a user account (set when applicant is invited to create one at stage 2)
  @Column({ nullable: true })
  familyId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "familyId" })
  family?: User;

  @ManyToOne(() => Child)
  @JoinColumn({ name: "childId" })
  child!: Child;

  @Column()
  childId!: string;

  @Column({
    type: "enum",
    enum: ProposalStatus,
    default: ProposalStatus.SUBMITTED,
  })
  status!: ProposalStatus;

  @Column({
    type: "enum",
    enum: AdoptionType,
    default: AdoptionType.PERMANENT,
  })
  adoptionType!: AdoptionType;

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
