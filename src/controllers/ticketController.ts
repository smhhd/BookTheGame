import { Request, Response } from "express";
import * as ticketService from "../services/ticketService";
import { success } from "../utils/response";
import { TicketSearchInput } from "../validators/ticketValidators";

export async function search(request: Request, response: Response) {
  return success(response, await ticketService.search(request.query as unknown as TicketSearchInput));
}

export async function details(request: Request, response: Response) {
  return success(
    response,
    await ticketService.details(Number(request.params.ticketId))
  );
}
