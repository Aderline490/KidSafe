import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";

export enum UserRole {
  ADOPTIVE_FAMILY = "adoptive_family",
  SOCIAL_WORKER = "social_worker",
  ORPHANAGE_ADMIN = "orphanage_admin",
  DISTRICT_COMMISSIONER = "district_commissioner",
  NCDA_OFFICIAL = "ncda_official",
  SYSTEM_ADMIN = "system_admin",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ type: "enum", enum: UserRole })
  role!: UserRole;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  profilePhoto?: string;

  @Column({ default: false })
  isEmailVerified!: boolean;

  @Column({ nullable: true })
  emailVerificationToken?: string;

  @Column({ nullable: true })
  passwordResetToken?: string;

  @Column({ nullable: true, type: "timestamp" })
  passwordResetExpires?: Date;

  @Column({ default: true })
  isActive!: boolean;

  // Social Worker specific fields
  @Column({ nullable: true })
  region?: string;

  @Column({ default: 0 })
  caseCount!: number;

  // Adoptive Family specific fields
  @Column({ nullable: true, type: "date" })
  backgroundCheckDate?: Date;

  @Column({ nullable: true, type: "date" })
  dateOfBirth?: Date;

  // System Admin specific fields
  @Column({ nullable: true })
  department?: string;

  @Column({ nullable: true, type: "timestamp" })
  lastLoginAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
