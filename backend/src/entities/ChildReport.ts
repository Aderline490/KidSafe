import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from "typeorm";
import { Child } from "./Child";
import { Proposal } from "./Proposal";
import { User } from "./User";

@Entity()
export class ChildReport {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  proposalId!: string;

  @ManyToOne(() => Proposal, { onDelete: "CASCADE" })
  @JoinColumn({ name: "proposalId" })
  proposal!: Proposal;

  @Column()
  childId!: string;

  @ManyToOne(() => Child)
  @JoinColumn({ name: "childId" })
  child!: Child;

  @Column()
  authorId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "authorId" })
  author!: User;

  /** e.g. "2024-03" */
  @Column({ length: 7 })
  reportMonth!: string;

  @Column("text")
  generalWellbeing!: string;

  @Column({ nullable: true })
  healthStatus?: string;

  @Column({ nullable: true })
  schoolPerformance?: string;

  @Column({ nullable: true })
  emotionalStatus?: string;

  @Column("text", { nullable: true })
  additionalNotes?: string;

  @Column("simple-json", { nullable: true })
  supportingDocs?: Array<{ fileName: string; url: string; publicId: string }>;

  @CreateDateColumn()
  createdAt!: Date;
}
