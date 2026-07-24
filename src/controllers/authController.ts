import { Request, Response } from "express";
import * as authService from "../services/authService";
import { success } from "../utils/response";

export async function signup(request: Request, response: Response) {
  const data = await authService.signup(request.body);
  return success(response, data, "User registered successfully", 201);
}

export async function requestOtp(request: Request, response: Response) {
  const data = await authService.requestOtp(request.body.identifier);
  return success(response, data, "If the account exists, an OTP has been sent");
}

export async function verifyOtp(request: Request, response: Response) {
  const data = await authService.verifyOtp(request.body.identifier, request.body.otp);
  return success(response, data, "Login successful");
}
