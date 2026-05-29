import { jest, describe, it, expect, beforeEach } from "@jest/globals"
import * as userRepository from "../../src/repositories/userRepository"
import * as hashUtils from "../../src/utils/hash"
import * as codeUtils from "../../src/utils/generateCode"
import * as tokenUtils from "../../src/utils/generateToken"
import * as authTokenUtils from "../../src/utils/authToken"
import * as emailService from "../../src/services/emailService"
import {
  loginUser,
  logoutUser,
  refreshUserTokens,
  registerUser,
  resendVerificationCode,
  verifyEmail,
} from "../../src/services/authService"

jest.mock("../../src/repositories/userRepository", () => ({
  createUser: jest.fn(),
  deletePendingRegistration: jest.fn(),
  findAnyUserByEmail: jest.fn(),
  findUserByRefreshTokenHash: jest.fn(),
  findUserByEmail: jest.fn(),
  findPendingRegistrationByEmail: jest.fn(),
  findPendingRegistrationByVerificationCode: jest.fn(),
  updateUser: jest.fn(),
  upsertPendingRegistration: jest.fn(),
}))

jest.mock("../../src/utils/hash", () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}))

jest.mock("../../src/utils/generateCode", () => ({
  generateVerificationCode: jest.fn(),
  hashCode: jest.fn(),
}))

jest.mock("../../src/utils/generateToken", () => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
}))

jest.mock("../../src/utils/authToken", () => ({
  verifyRefreshToken: jest.fn(),
}))

jest.mock("../../src/services/emailService", () => ({
  sendVerificationEmail: jest.fn(),
  sendWelcomeEmail: jest.fn(),
}))

const mockedUserRepository = userRepository as jest.Mocked<typeof userRepository>
const mockedHashUtils = hashUtils as jest.Mocked<typeof hashUtils>
const mockedCodeUtils = codeUtils as jest.Mocked<typeof codeUtils>
const mockedTokenUtils = tokenUtils as jest.Mocked<typeof tokenUtils>
const mockedAuthTokenUtils = authTokenUtils as jest.Mocked<typeof authTokenUtils>
const mockedEmailService = emailService as jest.Mocked<typeof emailService>

describe("authService", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("registers a pending user and sends a verification email", async () => {
    mockedUserRepository.findAnyUserByEmail.mockResolvedValue(null)
    mockedHashUtils.hashPassword.mockResolvedValue("hashed-password" as never)
    mockedCodeUtils.generateVerificationCode.mockReturnValue({
      rawCode: "123456",
      hashedCode: "hashed-code",
    })
    mockedUserRepository.upsertPendingRegistration.mockResolvedValue({ id: "pending-1" } as never)
    mockedEmailService.sendVerificationEmail.mockResolvedValue(undefined)

    await expect(
      registerUser({ name: "  Ada   Lovelace ", email: "ada@example.com", password: "secret123" })
    ).resolves.toEqual({
      message: "Verification code sent to your email address.",
      email: "ada@example.com",
    })
    expect(mockedUserRepository.upsertPendingRegistration).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "ada@example.com",
        password: "hashed-password",
        fullName: "Ada Lovelace",
        verificationCode: "hashed-code",
        verificationCodeExpires: expect.any(Date),
      })
    )
    expect(mockedEmailService.sendVerificationEmail).toHaveBeenCalledWith({
      email: "ada@example.com",
      name: "Ada Lovelace",
      code: "123456",
    })
  })

  it("verifies email by creating a user and deleting the pending registration", async () => {
    mockedCodeUtils.hashCode.mockReturnValue("hashed-code")
    mockedUserRepository.findPendingRegistrationByVerificationCode.mockResolvedValue({
      id: "pending-1",
      email: "ada@example.com",
      password: "hashed-password",
      fullName: "Ada Lovelace",
      verificationCodeExpires: new Date(Date.now() + 60_000),
    } as never)
    mockedUserRepository.findAnyUserByEmail.mockResolvedValue(null)
    mockedUserRepository.createUser.mockResolvedValue({
      id: "user-1",
      email: "ada@example.com",
      fullName: "Ada Lovelace",
    } as never)
    mockedUserRepository.deletePendingRegistration.mockResolvedValue({ id: "pending-1" } as never)
    mockedEmailService.sendWelcomeEmail.mockResolvedValue(undefined)

    await expect(verifyEmail("123456")).resolves.toEqual({
      message: "Email verified successfully",
    })
    expect(mockedUserRepository.createUser).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "hashed-password",
      fullName: "Ada Lovelace",
      isVerified: true,
    })
    expect(mockedUserRepository.deletePendingRegistration).toHaveBeenCalledWith("pending-1")
  })

  it("resends a verification code for a pending registration", async () => {
    mockedUserRepository.findAnyUserByEmail.mockResolvedValue(null)
    mockedUserRepository.findPendingRegistrationByEmail.mockResolvedValue({
      id: "pending-1",
      email: "ada@example.com",
      fullName: "Ada Lovelace",
      password: "hashed-password",
    } as never)
    mockedCodeUtils.generateVerificationCode.mockReturnValue({
      rawCode: "4321",
      hashedCode: "new-hashed-code",
    })
    mockedUserRepository.upsertPendingRegistration.mockResolvedValue({ id: "pending-1" } as never)
    mockedEmailService.sendVerificationEmail.mockResolvedValue(undefined)

    await expect(resendVerificationCode("ada@example.com")).resolves.toEqual({
      message: "Verification code resent to your email address.",
      email: "ada@example.com",
    })
    expect(mockedUserRepository.upsertPendingRegistration).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "ada@example.com",
        password: "hashed-password",
        fullName: "Ada Lovelace",
        verificationCode: "new-hashed-code",
        verificationCodeExpires: expect.any(Date),
      })
    )
    expect(mockedEmailService.sendVerificationEmail).toHaveBeenCalledWith({
      email: "ada@example.com",
      name: "Ada Lovelace",
      code: "4321",
    })
  })

  it("logs in a verified user and persists a hashed refresh token", async () => {
    mockedUserRepository.findUserByEmail.mockResolvedValue({
      id: "user-1",
      role: "User",
      tokenVersion: 1,
      password: "hashed-password",
      isVerified: true,
    } as never)
    mockedHashUtils.comparePassword.mockResolvedValue(true as never)
    mockedTokenUtils.generateAccessToken.mockReturnValue("access-token" as never)
    mockedTokenUtils.generateRefreshToken.mockReturnValue("refresh-token" as never)
    mockedCodeUtils.hashCode.mockReturnValue("refresh-token-hash")
    mockedUserRepository.updateUser.mockResolvedValue({ id: "user-1" } as never)

    await expect(loginUser({ email: "ada@example.com", password: "secret123" })).resolves.toEqual({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    })
    expect(mockedUserRepository.updateUser).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        refreshTokenHash: "refresh-token-hash",
        refreshTokenExpires: expect.any(Date),
      })
    )
  })

  it("refreshes tokens only when the stored token hash matches the decoded user", async () => {
    mockedAuthTokenUtils.verifyRefreshToken.mockReturnValue({
      userId: "user-1",
      tokenVersion: 2,
    } as never)
    mockedCodeUtils.hashCode.mockReturnValue("old-refresh-token-hash")
    mockedUserRepository.findUserByRefreshTokenHash.mockResolvedValue({
      id: "user-1",
      role: "User",
      tokenVersion: 2,
      refreshTokenExpires: new Date(Date.now() + 60_000),
      deletedAt: null,
    } as never)
    mockedTokenUtils.generateAccessToken.mockReturnValue("new-access-token" as never)
    mockedTokenUtils.generateRefreshToken.mockReturnValue("new-refresh-token" as never)
    mockedUserRepository.updateUser.mockResolvedValue({ id: "user-1" } as never)

    await expect(refreshUserTokens("old-refresh-token")).resolves.toEqual({
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
    })
  })

  it("logs out by clearing refresh token fields and incrementing token version", async () => {
    mockedUserRepository.updateUser.mockResolvedValue({ id: "user-1" } as never)

    await expect(logoutUser("user-1")).resolves.toEqual({ message: "Logged out successfully" })
    expect(mockedUserRepository.updateUser).toHaveBeenCalledWith("user-1", {
      refreshTokenHash: null,
      refreshTokenExpires: null,
      tokenVersion: { increment: 1 },
    })
  })
})
