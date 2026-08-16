import { cacheGet, cacheSet } from "../config/redis";
import { env } from "../config/env";
import * as catalogRepository from "../repositories/catalogRepository";

export async function getCities() {
  const key = "catalog:cities";
  const cached = await cacheGet<unknown[]>(key);
  if (cached) return { items: cached, cacheHit: true };
  const items = await catalogRepository.listCities();
  await cacheSet(key, items, env.CACHE_LIST_TTL_SECONDS);
  return { items, cacheHit: false };
}

export async function getVenues(cityId?: number) {
  const key = `catalog:venues:city:${cityId ?? "all"}`;
  const cached = await cacheGet<unknown[]>(key);
  if (cached) return { items: cached, cacheHit: true };
  const items = await catalogRepository.listVenues(cityId);
  await cacheSet(key, items, env.CACHE_LIST_TTL_SECONDS);
  return { items, cacheHit: false };
}

// Match-based catalog methods
export async function getMatches() {
  const key = "catalog:matches";
  const cached = await cacheGet<unknown[]>(key);
  if (cached) return { items: cached, cacheHit: true };
  const items = await catalogRepository.listMatches();
  await cacheSet(key, items, env.CACHE_LIST_TTL_SECONDS);
  return { items, cacheHit: false };
}

export async function getMatchTickets(matchId: number) {
  const key = `catalog:match:${matchId}:tickets`;
  const cached = await cacheGet<unknown[]>(key);
  if (cached) return { items: cached, cacheHit: true };
  const items = await catalogRepository.listMatchTickets(matchId);
  await cacheSet(key, items, env.CACHE_LIST_TTL_SECONDS);
  return { items, cacheHit: false };
}

export async function getCompetitions() {
  const key = "catalog:competitions";
  const cached = await cacheGet<unknown[]>(key);
  if (cached) return { items: cached, cacheHit: true };
  const items = await catalogRepository.listCompetitions();
  await cacheSet(key, items, env.CACHE_LIST_TTL_SECONDS);
  return { items, cacheHit: false };
}

export async function getCompetitionTickets(competitionId: number) {
  const key = `catalog:competition:${competitionId}:tickets`;
  const cached = await cacheGet<unknown[]>(key);
  if (cached) return { items: cached, cacheHit: true };
  const items = await catalogRepository.listCompetitionTickets(competitionId);
  await cacheSet(key, items, env.CACHE_LIST_TTL_SECONDS);
  return { items, cacheHit: false };
}
