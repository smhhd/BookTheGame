import { Request, Response } from "express";
import * as adminService from "../services/adminService";
import * as reportService from "../services/reportService";
import { success } from "../utils/response";

export async function reports(request: Request, response: Response) {
  return success(response, await reportService.adminReports(request.query as never));
}
export async function report(request: Request, response: Response) {
  return success(response, await reportService.adminReport(Number(request.params.id)));
}
export async function reportStatus(request: Request, response: Response) {
  return success(
    response,
    await reportService.updateReportStatus(
      Number(request.params.id),
      request.body.status,
      request.auth!.userId,
      request.body.response
    )
  );
}
export async function reservations(request: Request, response: Response) {
  return success(response, await adminService.listReservations(request.query as never));
}
export async function reservation(request: Request, response: Response) {
  return success(response, await adminService.reservationDetails(Number(request.params.id)));
}
export async function reservationStatus(request: Request, response: Response) {
  return success(
    response,
    await adminService.setReservationStatus(
      Number(request.params.id),
      request.body.status,
      request.auth!.userId
    )
  );
}
export async function reservationTicket(request: Request, response: Response) {
  return success(
    response,
    await adminService.changeReservationTicket(
      Number(request.params.id),
      request.body.ticketId,
      request.auth!.userId
    )
  );
}
export async function suspiciousPayments(_request: Request, response: Response) {
  return success(response, await adminService.suspiciousPayments());
}
