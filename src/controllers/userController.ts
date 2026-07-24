import { Request, Response } from "express";
import * as userService from "../services/userService";
import { success } from "../utils/response";

export async function getMe(request: Request, response: Response) {
  return success(response, await userService.getProfile(request.auth!.userId));
}

export async function updateMe(request: Request, response: Response) {
  return success(
    response,
    await userService.updateProfile(request.auth!.userId, request.body),
    "Profile updated successfully"
  );
}
