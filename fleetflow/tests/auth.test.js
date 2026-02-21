import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { resetDb, prisma } from "./helpers.js";
import { register, login } from "../src/services/auth.service.js";

describe("Auth Service", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  describe("register", () => {
    it("should register a new user and return a token", async () => {
      const result = await register({
        email: "test@example.com",
        password: "secret123",
        name: "Test User",
      });

      expect(result.token).toBeDefined();
      expect(result.user.email).toBe("test@example.com");
      expect(result.user.role).toBe("DISPATCHER"); // default
    });

    it("should reject duplicate email", async () => {
      await register({ email: "dup@example.com", password: "secret123", name: "A" });

      await expect(
        register({ email: "dup@example.com", password: "secret123", name: "B" })
      ).rejects.toThrow("Email already registered");
    });

    it("should reject missing fields", async () => {
      await expect(
        register({ email: "", password: "secret123", name: "X" })
      ).rejects.toThrow();
    });

    it("should reject short password", async () => {
      await expect(
        register({ email: "x@x.com", password: "ab", name: "X" })
      ).rejects.toThrow("Password must be at least 6 characters");
    });
  });

  describe("login", () => {
    it("should login with correct credentials", async () => {
      await register({ email: "login@example.com", password: "pass1234", name: "Login" });

      const result = await login({ email: "login@example.com", password: "pass1234" });
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe("login@example.com");
    });

    it("should reject wrong password", async () => {
      await register({ email: "wrong@example.com", password: "correct123", name: "W" });

      await expect(
        login({ email: "wrong@example.com", password: "wrongpass" })
      ).rejects.toThrow("Invalid credentials");
    });

    it("should reject non-existent user", async () => {
      await expect(
        login({ email: "nobody@example.com", password: "x" })
      ).rejects.toThrow("Invalid credentials");
    });

    it("should reject missing fields", async () => {
      await expect(login({ email: "", password: "" })).rejects.toThrow(
        "Email and password are required"
      );
    });
  });
});
