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

export enum DocumentType {
  CRIMINAL_RECORD = "criminal_record",
  INCOME_CERTIFICATE = "income_certificate",
  ID_DOCUMENT = "id_document",
  MARRIAGE_CERTIFICATE = "marriage_certificate",
  HOME_VISIT_PHOTO = "home_visit_photo",
  HOME_VISIT_REPORT = "home_visit_report",
  MEDICAL_REPORT = "medical_report",
  OTHER = "other",
}

@Entity("documents")
export class Document {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "enum", enum: DocumentType })
  docType!: DocumentType;

  @Column()
  fileName!: string;

  @Column()
  filePath!: string;

  @Column({ nullable: true })
  cloudinaryPublicId?: string;

  @Column({ nullable: true, type: "date" })
  expiryDate?: Date;

  @Column({ default: true })
  isValid!: boolean;

  @ManyToOne(() => Proposal, (proposal) => proposal.documents, {
    nullable: true,
  })
  @JoinColumn({ name: "proposalId" })
  proposal?: Proposal;

  @Column({ nullable: true })
  proposalId?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "uploadedById" })
  uploadedBy!: User;

  @Column()
  uploadedById!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
