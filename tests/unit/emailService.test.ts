const mockSendMail = jest.fn();
const mockCreateTransport = jest.fn(() => ({ sendMail: mockSendMail }));

jest.mock("nodemailer", () => ({
  __esModule: true,
  default: {
    createTransport: mockCreateTransport
  }
}));

import { sendVerificationCode } from "../../src/services/emailService";

describe("emailService", () => {
  beforeEach(() => {
    mockSendMail.mockResolvedValue({ messageId: "test-message" });
  });

  it("sends the code to the user's email in text and HTML forms", async () => {
    await sendVerificationCode({
      to: "spectator@example.com",
      code: "482913",
      expiresInSeconds: 300
    });

    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      from: { name: "Book The Game", address: "sender@example.com" },
      to: "spectator@example.com",
      subject: "Book The Game verification code",
      text: expect.stringContaining("Verification Code: 482913"),
      html: expect.stringContaining("482913")
    }));
    const message = mockSendMail.mock.calls[0]![0];
    expect(message.text).toContain("valid for 5 minutes");
    expect(message.html).toContain("valid for 5 minutes");
    expect(message.text).toContain("safely ignore");
    expect(message.html).toContain("safely ignore");
    expect(JSON.stringify(message)).not.toContain("test-only-smtp-password");
  });
});
