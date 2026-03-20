import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Proposal } from "./Proposal";

export enum HomeVisitStatus {
  SCHEDULED = "scheduled",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

@Entity("home_visits")
export class HomeVisit {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Proposal)
  @JoinColumn({ name: "proposalId" })
  proposal!: Proposal;

  @Column()
  proposalId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "socialWorkerId" })
  socialWorker!: User;

  @Column()
  socialWorkerId!: string;

  @Column({ type: "timestamp" })
  scheduledDate!: Date;

  @Column({
    type: "enum",
    enum: HomeVisitStatus,
    default: HomeVisitStatus.SCHEDULED,
  })
  status!: HomeVisitStatus;

  @Column({ type: "text", nullable: true })
  findings?: string;

  @Column({ type: "jsonb", nullable: true })
  checklist?: Record<string, any>;

  @Column("simple-array", { nullable: true })
  photos?: string[];

  @Column({ type: "text", nullable: true })
  recommendation?: string;

  @Column({ nullable: true, type: "timestamp" })
  completedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
