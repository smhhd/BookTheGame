export interface SearchFacility {
  facilityId: string;
  name: string;
}

export interface TicketSearchDocument {
  ticketId: string;
  matchId: string;
  sportTypeId: string;
  sportType: string;
  competitionId: string | null;
  competitionName: string | null;
  homeTeamId: string;
  homeTeam: string;
  awayTeamId: string;
  awayTeam: string;
  cityId: string;
  cityName: string;
  venueId: string;
  venueName: string;
  venueType: string;
  categoryId: string;
  categoryName: string;
  seatId: string;
  sectionName: string;
  rowNumber: string;
  seatNumber: string;
  facilities: SearchFacility[];
  facilityNames: string[];
  price: number;
  status: "available" | "reserved" | "sold" | "cancelled";
  matchStatus: "scheduled" | "postponed" | "cancelled" | "finished";
  remainingCapacity: number;
  matchDatetime: string;
  createdAt: string;
}

export interface BulkFailure {
  id: string;
  reason: string;
}

export interface BulkResult {
  successful: number;
  failed: BulkFailure[];
}
