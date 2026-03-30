import "reflect-metadata";
import dotenv from "dotenv";
import { AppDataSource } from "./config/database";
import { Child, ChildStatus, Gender } from "./entities/Child";
import { User } from "./entities/User";

dotenv.config();

const childrenData = [
  {
    firstName: "Amina",
    lastName: "U.",
    dateOfBirth: new Date("2016-03-12"),
    gender: Gender.FEMALE,
    district: "Kigali",
    orphanageName: "Hope Orphanage",
    background: "Amina is a cheerful and energetic girl who loves drawing and singing. She enjoys playing with other children and dreams of becoming a doctor.",
    hasInsurance: false,
    isInSchool: true,
    schoolName: "Kigali Primary School",
    gradeLevel: "P2",
    photo: "https://res.cloudinary.com/dutseqfmu/image/upload/v1774865640/Rectangle_92_rmq5co.png",
  },
  {
    firstName: "David",
    lastName: "N.",
    dateOfBirth: new Date("2013-07-22"),
    gender: Gender.MALE,
    district: "Musanze",
    orphanageName: "Sunrise Children's Home",
    background: "David is a bright and curious boy who excels in mathematics. He loves football and hopes to one day play for the national team.",
    hasInsurance: true,
    isInSchool: true,
    schoolName: "Musanze Academy",
    gradeLevel: "P5",
    photo: "https://res.cloudinary.com/dutseqfmu/image/upload/v1774865607/child_4_uq0kr4.png",
  },
  {
    firstName: "Grace",
    lastName: "M.",
    dateOfBirth: new Date("2018-01-05"),
    gender: Gender.FEMALE,
    district: "Huye",
    orphanageName: "Blessed Children Center",
    background: "Grace is a sweet and gentle girl who loves reading stories and helping younger children. She is known for her warm smile.",
    hasInsurance: false,
    isInSchool: false,
    photo: "https://res.cloudinary.com/dutseqfmu/image/upload/v1774865607/child_3_lwrobc.png",
  },
  {
    firstName: "Eric",
    lastName: "H.",
    dateOfBirth: new Date("2010-09-18"),
    gender: Gender.MALE,
    district: "Rubavu",
    orphanageName: "Lake View Orphanage",
    background: "Eric is a talented teenager who loves art and music. He plays the guitar and dreams of becoming a musician. He is responsible and helps care for younger children.",
    hasInsurance: true,
    isInSchool: true,
    schoolName: "Rubavu Secondary School",
    gradeLevel: "S1",
    photo: "https://res.cloudinary.com/dutseqfmu/image/upload/v1774865607/child_2_xojcjy.png",
  },
  {
    firstName: "Joy",
    lastName: "I.",
    dateOfBirth: new Date("2019-06-30"),
    gender: Gender.FEMALE,
    district: "Kigali",
    orphanageName: "Hope Orphanage",
    background: "Joy is a playful toddler who loves dancing and playing with toys. She is full of life and brings happiness to everyone around her.",
    hasInsurance: false,
    isInSchool: false,
    photo: "https://res.cloudinary.com/dutseqfmu/image/upload/v1774865640/Rectangle_92_rmq5co.png",
  },
  {
    firstName: "Samuel",
    lastName: "K.",
    dateOfBirth: new Date("2015-11-14"),
    gender: Gender.MALE,
    district: "Nyagatare",
    orphanageName: "Eastern Hope Center",
    background: "Samuel is an intelligent and disciplined boy who loves science. He is always asking questions and loves to learn new things about the world.",
    hasInsurance: true,
    isInSchool: true,
    schoolName: "Nyagatare Primary",
    gradeLevel: "P3",
    photo: "https://res.cloudinary.com/dutseqfmu/image/upload/v1774865607/child_4_uq0kr4.png",
  },
  {
    firstName: "Claire",
    lastName: "U.",
    dateOfBirth: new Date("2012-04-08"),
    gender: Gender.FEMALE,
    district: "Muhanga",
    orphanageName: "Southern Stars Home",
    background: "Claire is a creative and artistic girl who loves painting. She is kind-hearted and always willing to help others in her community.",
    hasInsurance: false,
    isInSchool: true,
    schoolName: "Muhanga Model School",
    gradeLevel: "P6",
    photo: "https://res.cloudinary.com/dutseqfmu/image/upload/v1774865607/child_3_lwrobc.png",
  },
  {
    firstName: "Patrick",
    lastName: "N.",
    dateOfBirth: new Date("2014-02-20"),
    gender: Gender.MALE,
    district: "Rwamagana",
    orphanageName: "Eastern Stars Orphanage",
    background: "Patrick is a cheerful boy who loves animals and nature. He dreams of becoming a veterinarian and often helps care for animals near the orphanage.",
    hasInsurance: true,
    isInSchool: true,
    schoolName: "Rwamagana Primary",
    gradeLevel: "P4",
    photo: "https://res.cloudinary.com/dutseqfmu/image/upload/v1774865607/child_2_xojcjy.png",
  },
];

async function seedChildren() {
  await AppDataSource.initialize();
  console.log("Database connected");

  const childRepo = AppDataSource.getRepository(Child);
  const userRepo = AppDataSource.getRepository(User);

  const admin = await userRepo.findOne({ where: { email: "admin@kidsafe.com" } });
  if (!admin) {
    console.error("Admin not found. Run npm run seed first.");
    process.exit(1);
  }

  const existing = await childRepo.count();
  if (existing > 0) {
    console.log(`${existing} children already exist. Skipping.`);
    await AppDataSource.destroy();
    return;
  }

  for (const data of childrenData) {
    const child = childRepo.create({
      ...data,
      status: ChildStatus.AVAILABLE,
      createdBy: admin,
      createdById: admin.id,
    });
    await childRepo.save(child);
    console.log(`✅ Created child: ${data.firstName}`);
  }

  console.log(`\nSeeded ${childrenData.length} children successfully!`);
  await AppDataSource.destroy();
}

seedChildren().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
