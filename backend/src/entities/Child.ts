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

export enum ChildStatus {
  AVAILABLE = "available",
  MATCHED = "matched",
  ADOPTED = "adopted",
  ARCHIVED = "archived",
}

export enum Gender {
  MALE = "male",
  FEMALE = "female",
}

@Entity("children")
export class Child {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ type: "date" })
  dateOfBirth!: Date;

  @Column({ type: "enum", enum: Gender })
  gender!: Gender;

  @Column({ type: "enum", enum: ChildStatus, default: ChildStatus.AVAILABLE })
  status!: ChildStatus;

  @Column()
  district!: string;

  @Column({ nullable: true })
  orphanageName?: string;

  @Column({ type: "text", nullable: true })
  background?: string;

  @Column({ type: "text", nullable: true })
  medicalHistory?: string;

  @Column({ nullable: true })
  photo?: string;

  @Column("simple-array", { nullable: true })
  additionalPhotos?: string[];

  @Column({ default: false })
  hasInsurance!: boolean;

  @Column({ default: false })
  isInSchool!: boolean;

  @Column({ nullable: true })
  schoolName?: string;

  @Column({ nullable: true })
  gradeLevel?: string;

  @Column({ type: "jsonb", nullable: true })
  healthInfo?: Record<string, any>;

  @ManyToOne(() => User)
  @JoinColumn({ name: "createdById" })
  createdBy!: User;

  @Column()
  createdById!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
