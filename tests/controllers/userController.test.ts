import { jest, describe, it, expect, beforeEach } from "@jest/globals"
import {
  changePassword,
  deleteAccount,
  getUserProfile,
  restoreAccount,
  updateUserProfile,
} from "../../src/services/userService"
import { setRefreshTokenCookie } from "../../src/utils/refreshTokenCookie"
import {
  changePasswordController,
  deleteAccountController,
  getProfile,
  restoreAccountController,
  updateProfile,
  uploadProfileImageController,
} from "../../src/controllers/userController"
import { uploadUserProfileImage } from "../../src/services/uploadService"

jest.mock("../../src/services/userService", () => ({
  getUserProfile: jest.fn(),
  updateUserProfile: jest.fn(),
  changePassword: jest.fn(),
  changeEmail: jest.fn(),
  verifyNewEmail: jest.fn(),
  forgotPassword: jest.fn(),
  verifyResetPasswordCode: jest.fn(),
  resetPassword: jest.fn(),
  deleteAccount: jest.fn(),
  restoreAccount: jest.fn(),
}))

jest.mock("../../src/services/uploadService", () => ({
  uploadUserProfileImage: jest.fn(),
}))

jest.mock("../../src/utils/refreshTokenCookie", () => ({
  setRefreshTokenCookie: jest.fn(),
}))

const mockedGetUserProfile = getUserProfile as jest.MockedFunction<typeof getUserProfile>
const mockedUpdateUserProfile = updateUserProfile as jest.MockedFunction<typeof updateUserProfile>
const mockedChangePassword = changePassword as jest.MockedFunction<typeof changePassword>
const mockedDeleteAccount = deleteAccount as jest.MockedFunction<typeof deleteAccount>
const mockedRestoreAccount = restoreAccount as jest.MockedFunction<typeof restoreAccount>
const mockedUploadUserProfileImage = uploadUserProfileImage as jest.MockedFunction<
  typeof uploadUserProfileImage
>
const mockedSetRefreshTokenCookie = setRefreshTokenCookie as jest.MockedFunction<
  typeof setRefreshTokenCookie
>

const createResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
})

const runController = async (
  controller: (req: any, res: any, next: any) => void,
  req: any,
  res: any,
  next: any
) => {
  controller(req, res, next)
  await Promise.resolve()
  await Promise.resolve()
}

describe("userController", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("gets the authenticated user's profile", async () => {
    const profile = { id: "user-1" }
    const res = createResponse()
    mockedGetUserProfile.mockResolvedValue(profile as never)

    await runController(getProfile, { user: { userId: "user-1" } }, res, jest.fn())

    expect(mockedGetUserProfile).toHaveBeenCalledWith("user-1")
    expect(res.json).toHaveBeenCalledWith(profile)
  })

  it("updates the authenticated user's profile", async () => {
    const body = { fullName: "Ada Lovelace" }
    const updated = { id: "user-1", ...body }
    const res = createResponse()
    mockedUpdateUserProfile.mockResolvedValue(updated as never)

    await runController(updateProfile, { user: { userId: "user-1" }, body }, res, jest.fn())

    expect(mockedUpdateUserProfile).toHaveBeenCalledWith("user-1", body)
    expect(res.json).toHaveBeenCalledWith(updated)
  })

  it("passes password fields to the service", async () => {
    const result = { id: "user-1" }
    const res = createResponse()
    mockedChangePassword.mockResolvedValue(result as never)

    await runController(
      changePasswordController,
      {
        user: { userId: "user-1" },
        body: { currentPassword: "old", newPassword: "new" },
      },
      res,
      jest.fn()
    )

    expect(mockedChangePassword).toHaveBeenCalledWith("user-1", "old", "new")
    expect(res.json).toHaveBeenCalledWith(result)
  })

  it("deletes the authenticated account", async () => {
    const result = { message: "Account deleted successfully. You can restore it later with your email and password." }
    const body = { password: "secret", reason: "taking a break" }
    const res = createResponse()
    mockedDeleteAccount.mockResolvedValue(result as never)

    await runController(deleteAccountController, { user: { userId: "user-1" }, body }, res, jest.fn())

    expect(mockedDeleteAccount).toHaveBeenCalledWith("user-1", body)
    expect(res.json).toHaveBeenCalledWith(result)
  })

  it("sets a refresh-token cookie when restoring an account", async () => {
    const result = {
      message: "Account restored successfully",
      accessToken: "access-token",
      refreshToken: "refresh-token",
    }
    const res = createResponse()
    mockedRestoreAccount.mockResolvedValue(result as never)

    await runController(
      restoreAccountController,
      { body: { email: "ada@example.com", password: "secret" } },
      res,
      jest.fn()
    )

    expect(mockedRestoreAccount).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "secret",
    })
    expect(mockedSetRefreshTokenCookie).toHaveBeenCalledWith(res as any, "refresh-token")
    expect(res.json).toHaveBeenCalledWith(result)
  })

  it("uploads a profile image for the authenticated user", async () => {
    const file = { buffer: Buffer.from("image") }
    const result = { profileImage: "https://res.cloudinary.com/demo/image/upload/avatar.webp" }
    const res = createResponse()
    mockedUploadUserProfileImage.mockResolvedValue(result as never)

    await runController(
      uploadProfileImageController,
      { user: { userId: "user-1" }, file },
      res,
      jest.fn()
    )

    expect(mockedUploadUserProfileImage).toHaveBeenCalledWith("user-1", file)
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(result)
  })
})
