import { Request, Response } from "express";
import * as catalogService from "../services/catalogService";
import { success } from "../utils/response";

export async function cities(_request: Request, response: Response) {
  return success(response, await catalogService.getCities());
}

export async function venues(request: Request, response: Response) {
  return success(response, await catalogService.getVenues(request.query.cityId as unknown as number));
}
