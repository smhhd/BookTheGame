import { Request, Response } from "express";
import * as cancellationService from "../services/cancellationService";
import * as reservationService from "../services/reservationService";
import { success } from "../utils/response";

export async function create(request: Request, response: Response) {
  return success(
    response,
    await reservationService.createReservation(request.auth!.userId, request.body.ticketIds),
    "Tickets reserved temporarily",
    201
  );
}

export async function active(request: Request, response: Response) {
  return success(response, await reservationService.activeReservations(request.auth!.userId));
}

export async function history(request: Request, response: Response) {
  return success(
    response,
    await reservationService.history(request.auth!.userId, request.query as never)
  );
}

export async function penalty(request: Request, response: Response) {
  return success(
    response,
    await cancellationService.previewPenalty(
      Number(request.params.reservationId),
      request.auth!.userId,
      request.auth!.role
    )
  );
}

export async function cancel(request: Request, response: Response) {
  return success(
    response,
    await cancellationService.cancel(
      Number(request.params.reservationId),
      request.auth!.userId,
      request.auth!.role,
      request.body.reason
    ),
    "Reservation cancelled successfully"
  );
}
