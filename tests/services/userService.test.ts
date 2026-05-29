import { jest, describe, it, expect, beforeEach } from "@jest/globals"
import * as userRepository from "../../src/repositories/userRepository"
import * as hashUtils from "../../src/utils/hash"
import * as codeUtils from "../../src/utils/generateCode"
import * as tokenUtils from "../../src/utils/generateToken"
import * as emailService from "../../src/services/emailService"
import {
  changePassword,
  deleteAccount,
  getUserProfile,
  restoreAccount,
  updateUserProfile,
} from "../../src/services/userService"

jest.mock("../../src/repositories/userRepository", () => ({
  findAnyUserByEmail: jest.fn(),
  findUserById: jest.fn(),
  getUserSessionStats: jest.fn(),
  updateUser: jest.fn(),
  findUserByResetToken: jest.fn(),
  findUserByEmail: jest.fn(),
  findUserByPendingEmail: jest.fn(),
  findUserByVerificationCode: jest.fn(),
  softDeleteUser: jest.fn(),
  restoreDeletedUser: jest.fn(),
}))

jest.mock("../../src/utils/hash", () => ({
  comparePassword: jest.fn(),
  hashPassword: jest.fn(),
}))

jest.mock("../../src/utils/generateCode", () => ({
  generateEmailCode: jest.fn(),
  generateVerificationCode: jest.fn(),
  hashCode: jest.fn(),
}))

jest.mock("../../src/utils/generateToken", () => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
}))

jest.mock("../../src/services/emailService", () => ({
  sendEmailChangeSuccessEmail: jest.fn(),
  sendEmailChangeVerificationEmail: jest.fn(),
  sendPasswordResetSuccessEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}))

const mockedUserRepository = userRepository as jest.Mocked<typeof userRepository>
const mockedHashUtils = hashUtils as jest.Mocked<typeof hashUtils>
const mockedCodeUtils = codeUtils as jest.Mocked<typeof codeUtils>
const mockedTokenUtils = tokenUtils as jest.Mocked<typeof tokenUtils>

describe("userService", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    void emailService
  })

  it("returns profile data with session stats", async () => {
    const user = { id: "user-1", email: "ada@example.com" }
    mockedUserRepository.findUserById.mockResolvedValue(user as never)
    mockedUserRepository.getUserSessionStats.mockResolvedValue({ swapsCompleted: 3 } as never)

    await expect(getUserProfile("user-1")).resolves.toEqual({
      ...user,
      sessionStats: { swapsCompleted: 3 },
    })
  })

  it("throws when profile user cannot be found", async () => {
    mockedUserRepository.findUserById.mockResolvedValue(null)

    await expect(getUserProfile("missing-user")).rejects.toMatchObject({
      message: "User not found",
      statusCode: 404,
    })
    expect(mockedUserRepository.getUserSessionStats).not.toHaveBeenCalled()
  })

  it("updates a user profile through the repository", async () => {
    const updatedUser = { id: "user-1", fullName: "Ada Lovelace" }
    mockedUserRepository.updateUser.mockResolvedValue(updatedUser as never)

    await expect(updateUserProfile("user-1", { fullName: "Ada Lovelace" })).resolves.toBe(
      updatedUser
    )
    expect(mockedUserRepository.updateUser).toHaveBeenCalledWith("user-1", {
      fullName: "Ada Lovelace",
    })
  })

  it("changes password, clears refresh tokens, and increments token version", async () => {
    mockedUserRepository.findUserById.mockResolvedValue({
      id: "user-1",
      email: "ada@example.com",
    } as never)
    mockedUserRepository.findAnyUserByEmail.mockResolvedValue({
      id: "user-1",
      email: "ada@example.com",
      password: "old-hash",
    } as never)
    mockedHashUtils.comparePassword
      .mockResolvedValueOnce(true as never)
      .mockResolvedValueOnce(false as never)
    mockedHashUtils.hashPassword.mockResolvedValue("new-hash" as never)
    mockedUserRepository.updateUser.mockResolvedValue({ id: "user-1" } as never)

    await changePassword("user-1", "old-password", "new-password")

    expect(mockedUserRepository.updateUser).toHaveBeenCalledWith("user-1", {
      password: "new-hash",
      refreshTokenHash: null,
      refreshTokenExpires: null,
      tokenVersion: { increment: 1 },
    })
  })

  it("rejects account deletion when password is wrong", async () => {
    mockedUserRepository.findUserById.mockResolvedValue({
      id: "user-1",
      email: "ada@example.com",
    } as never)
    mockedUserRepository.findAnyUserByEmail.mockResolvedValue({
      id: "user-1",
      password: "hash",
    } as never)
    mockedHashUtils.comparePassword.mockResolvedValue(false as never)

    await expect(
      deleteAccount("user-1", { password: "wrong-password", reason: "taking a break" })
    ).rejects.toMatchObject({
      message: "Password is incorrect",
      statusCode: 400,
    })
    expect(mockedUserRepository.softDeleteUser).not.toHaveBeenCalled()
  })

  it("restores a deleted account and returns fresh tokens", async () => {
    mockedUserRepository.findAnyUserByEmail.mockResolvedValue({
      id: "user-1",
      email: "ada@example.com",
      password: "hash",
      deletedAt: new Date("2026-01-01T00:00:00.000Z"),
    } as never)
    mockedHashUtils.comparePassword.mockResolvedValue(true as never)
    mockedUserRepository.restoreDeletedUser.mockResolvedValue({
      id: "user-1",
      role: "User",
      tokenVersion: 2,
    } as never)
    mockedTokenUtils.generateAccessToken.mockReturnValue("access-token" as never)
    mockedTokenUtils.generateRefreshToken.mockReturnValue("refresh-token" as never)
    mockedCodeUtils.hashCode.mockReturnValue("refresh-token-hash")
    mockedUserRepository.updateUser.mockResolvedValue({ id: "user-1" } as never)

    await expect(
      restoreAccount({ email: "ada@example.com", password: "correct-password" })
    ).resolves.toEqual({
      message: "Account restored successfully",
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
})
