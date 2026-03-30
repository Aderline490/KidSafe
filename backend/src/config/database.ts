import { DataSource } from "typeorm";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource(
  process.env.DATABASE_URL
    ? {
        type: "postgres",
        url: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        synchronize: process.env.DB_SYNC === "true",
        logging: false,
        entities: [__dirname + "/../entities/*.{ts,js}"],
        migrations: [__dirname + "/../migrations/*.{ts,js}"],
      }
    : {
        type: "postgres",
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "5432"),
        username: process.env.DB_USERNAME || "postgres",
        password: process.env.DB_PASSWORD || "postgres",
        database: process.env.DB_NAME || "kidsafe_db",
        synchronize: true,
        logging: true,
        entities: [__dirname + "/../entities/*.{ts,js}"],
        migrations: [__dirname + "/../migrations/*.{ts,js}"],
      }
);
