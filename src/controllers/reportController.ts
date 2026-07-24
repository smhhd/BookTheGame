import { Request, Response } from "express";
import * as service from "../services/reportService";
import { success } from "../utils/response";

export async function create(request: Request, response: Response) {
  return success(
    response,
    await service.createReport(request.auth!.userId, request.body),
    "Report submitted successfully",
    201
  );
}
export async function my(request: Request, response: Response) {
  return success(response, await service.myReports(request.auth!.userId));
}
