import { describe, expect, it } from "@jest/globals"
import { getTypingPayload } from "../../src/socket/chatSocket"

describe("chatSocket typing payload", () => {
  it("builds the payload mobile clients use for active chat and conversation list typing states", () => {
    expect(getTypingPayload("sender-1", "receiver-1", true)).toEqual({
      userId: "sender-1",
      senderId: "sender-1",
      receiverId: "receiver-1",
      isTyping: true,
    })
  })
})
