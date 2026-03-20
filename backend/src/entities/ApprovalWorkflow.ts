import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Proposal } from "./Proposal";
import { User } from "./User";

export enum ApprovalLevel {
  LEVEL1_SOCIAL_WORKER = 1,
  LEVEL2_DISTRICT_COMMISSIONER = 2,
  LEVEL3_NCDA = 3,
}

export enum ApprovalAction {
  APPROVED = "approved",
  REJECTED = "rejected",
}

@Entity("approval_workflows")
export class ApprovalWorkflow {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Proposal)
  @JoinColumn({ name: "proposalId" })
  proposal!: Proposal;

  @Column()
  proposalId!: string;

  @Column({ type: "int" })
  level!: number;

  @Column({ type: "enum", enum: ApprovalAction })
  action!: ApprovalAction;

  @ManyToOne(() => User)
  @JoinColumn({ name: "approvedById" })
  approvedBy!: User;

  @Column()
  approvedById!: string;

  @Column({ type: "text" })
  comments!: string;

  @Column({ nullable: true, type: "timestamp" })
  deadline?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
