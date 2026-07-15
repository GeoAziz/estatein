import bcrypt from "bcryptjs";
import { authConfig } from "../config/auth.js";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, authConfig.bcryptSaltRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
