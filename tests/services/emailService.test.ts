import { jest, describe, it, expect, beforeEach } from "@jest/globals"
import { emailConfig } from "../../src/config/email"
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../../src/services/emailService"

const sendMock = jest.fn()

jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: sendMock,
    },
  })),
}))

describe("emailService", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    emailConfig.resend.apiKey = "test-api-key"
    emailConfig.resend.fromEmail = "no-reply@example.com"
    emailConfig.resend.fromName = "SkillSwap"
  })

  it("sends verification email through Resend", async () => {
    sendMock.mockResolvedValue({ error: null } as never)

    await sendVerificationEmail({
      email: "ada@example.com",
      name: "Ada Lovelace",
      code: "123456",
    })

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "SkillSwap <no-reply@example.com>",
        to: ["ada@example.com"],
        subject: expect.any(String),
        html: expect.any(String),
        text: expect.any(String),
      })
    )
  })

  it("throws a configuration error when Resend API key is missing", async () => {
    emailConfig.resend.apiKey = undefined

    await expect(
      sendPasswordResetEmail({
        email: "ada@example.com",
        name: "Ada Lovelace",
        code: "123456",
      })
    ).rejects.toMatchObject({
      message: "RESEND_API_KEY is missing. Email service is not configured.",
      statusCode: 500,
    })
  })
})
