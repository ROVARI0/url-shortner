import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma";
import { RegisterInput } from "./auth.schema";

const SALT_ROUNDS = 10;

export const authService = {
  async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new Error("An account with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: hashedPassword,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
  },
};
