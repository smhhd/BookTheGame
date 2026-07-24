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
