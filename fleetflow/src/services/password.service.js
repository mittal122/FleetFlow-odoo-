import { v4 as uuidv4 } from "uuid";
import prisma from "../config/db.js";
import bcrypt from "bcryptjs";

export const requestPasswordReset = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Email not found");
  const token = uuidv4();
  await prisma.passwordReset.create({
    data: {
      id: token,
      email,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });
  return token;
};

export const resetPassword = async (token, newPassword) => {
  const reset = await prisma.passwordReset.findUnique({ where: { id: token } });
  if (!reset || reset.expiresAt < new Date()) throw new Error("Invalid or expired token");
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { email: reset.email },
    data: { password: hashed },
  });
  await prisma.passwordReset.delete({ where: { id: token } });
};
