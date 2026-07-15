import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: Number(process.env.SMTP_PORT) || 1025,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || "dev",
    pass: process.env.SMTP_PASS || "dev",
  },
});

export default transporter;

export const emailConfig = {
  from: process.env.SMTP_FROM || "noreply@estatein.local",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
};
