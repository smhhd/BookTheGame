import { Request, Response } from "express";
import * as catalogService from "../services/catalogService";
import { success } from "../utils/response";

export async function cities(_request: Request, response: Response) {
  return success(response, await catalogService.getCities());
}

export async function venues(request: Request, response: Response) {
  return success(
    response,
    await catalogService.getVenues(request.query.cityId as unknown as number),
  );
}

export async function getMatches(_request: Request, response: Response) {
  return success(response, await catalogService.getMatches());
}

export async function getMatchTickets(request: Request, response: Response) {
  return success(
    response,
    await catalogService.getMatchTickets(Number(request.params.matchId)),
  );
}

export async function getCompetitions(_request: Request, response: Response) {
  return success(response, await catalogService.getCompetitions());
}

export async function getCompetitionTickets(
  request: Request,
  response: Response,
) {
  return success(
    response,
    await catalogService.getCompetitionTickets(
      Number(request.params.competitionId),
    ),
  );
}
