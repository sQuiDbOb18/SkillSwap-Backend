import { jest, describe, it, expect, beforeEach } from "@jest/globals"
import {
  loginWithGoogle,
  loginUser,
  logoutUser,
  refreshUserTokens,
  registerUser,
  verifyEmail,
} from "../../src/services/authService"
import {
  clearRefreshTokenCookie,
  getRefreshTokenFromRequest,
  setRefreshTokenCookie,
} from "../../src/utils/refreshTokenCookie"
import { googleAuth, login, logout, refreshTokens, register, verifyEmailController } from "../../src/controllers/authController"

jest.mock("../../src/services/authService", () => ({
  registerUser: jest.fn(),
  verifyEmail: jest.fn(),
  loginUser: jest.fn(),
  loginWithGoogle: jest.fn(),
  logoutUser: jest.fn(),
  refreshUserTokens: jest.fn(),
}))

jest.mock("../../src/utils/refreshTokenCookie", () => ({
  clearRefreshTokenCookie: jest.fn(),
  getRefreshTokenFromRequest: jest.fn(),
  setRefreshTokenCookie: jest.fn(),
}))

const mockedRegisterUser = registerUser as jest.MockedFunction<typeof registerUser>
const mockedVerifyEmail = verifyEmail as jest.MockedFunction<typeof verifyEmail>
const mockedLoginUser = loginUser as jest.MockedFunction<typeof loginUser>
const mockedLoginWithGoogle = loginWithGoogle as jest.MockedFunction<typeof loginWithGoogle>
const mockedLogoutUser = logoutUser as jest.MockedFunction<typeof logoutUser>
const mockedRefreshUserTokens = refreshUserTokens as jest.MockedFunction<typeof refreshUserTokens>
const mockedGetRefreshTokenFromRequest = getRefreshTokenFromRequest as jest.MockedFunction<
  typeof getRefreshTokenFromRequest
>
const mockedSetRefreshTokenCookie = setRefreshTokenCookie as jest.MockedFunction<
  typeof setRefreshTokenCookie
>
const mockedClearRefreshTokenCookie = clearRefreshTokenCookie as jest.MockedFunction<
  typeof clearRefreshTokenCookie
>

const createResponse = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() })
const runController = async (controller: any, req: any, res: any, next = jest.fn()) => {
  controller(req, res, next)
  await Promise.resolve()
  await Promise.resolve()
  return next
}

describe("authController", () => {
  beforeEach(() => jest.clearAllMocks())

  it("registers with status 201", async () => {
    const res = createResponse()
    mockedRegisterUser.mockResolvedValue({ message: "sent", email: "ada@example.com" } as never)
    await runController(register, { body: { email: "ada@example.com" } }, res)
    expect(mockedRegisterUser).toHaveBeenCalledWith({ email: "ada@example.com" })
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it("verifies email with status 201", async () => {
    const res = createResponse()
    mockedVerifyEmail.mockResolvedValue({
      message: "verified",
      accessToken: "access",
      refreshToken: "refresh",
    } as never)
    await runController(verifyEmailController, { body: { code: "123456" } }, res)
    expect(mockedVerifyEmail).toHaveBeenCalledWith("123456")
    expect(mockedSetRefreshTokenCookie).toHaveBeenCalledWith(res as any, "refresh")
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it("sets refresh cookies on login and refresh", async () => {
    const res = createResponse()
    mockedLoginUser.mockResolvedValue({ accessToken: "access", refreshToken: "refresh" } as never)
    mockedGetRefreshTokenFromRequest.mockReturnValue("old-refresh")
    mockedRefreshUserTokens.mockResolvedValue({
      accessToken: "new-access",
      refreshToken: "new-refresh",
    } as never)

    await runController(login, { body: { email: "ada@example.com" } }, res)
    await runController(refreshTokens, {}, res)

    expect(mockedSetRefreshTokenCookie).toHaveBeenCalledWith(res as any, "refresh")
    expect(mockedRefreshUserTokens).toHaveBeenCalledWith("old-refresh")
    expect(mockedSetRefreshTokenCookie).toHaveBeenCalledWith(res as any, "new-refresh")
  })

  it("sets refresh cookie on Google auth", async () => {
    const res = createResponse()
    mockedLoginWithGoogle.mockResolvedValue({ accessToken: "access", refreshToken: "refresh" } as never)

    await runController(googleAuth, { body: { idToken: "google-id-token" } }, res)

    expect(mockedLoginWithGoogle).toHaveBeenCalledWith({ idToken: "google-id-token" })
    expect(mockedSetRefreshTokenCookie).toHaveBeenCalledWith(res as any, "refresh")
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it("clears refresh cookie on logout", async () => {
    const res = createResponse()
    mockedLogoutUser.mockResolvedValue({ message: "Logged out successfully" } as never)
    await runController(logout, { user: { userId: "user-1" } }, res)
    expect(mockedLogoutUser).toHaveBeenCalledWith("user-1")
    expect(mockedClearRefreshTokenCookie).toHaveBeenCalledWith(res as any)
  })
})
