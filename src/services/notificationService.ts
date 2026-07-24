export interface OtpNotificationProvider {
  sendOtp(destination: string, code: string): Promise<void>;
}

class DevelopmentNotificationProvider implements OtpNotificationProvider {
  async sendOtp(destination: string, _code: string): Promise<void> {
    const suffix = destination.slice(-3);
    console.info("Development OTP delivery simulated", { destination: `***${suffix}` });
  }
}

export const otpNotificationProvider: OtpNotificationProvider =
  new DevelopmentNotificationProvider();
