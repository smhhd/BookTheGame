export const ticketIndexDefinition = {
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
    analysis: {
      analyzer: {
        mixed_text: {
          type: "custom",
          tokenizer: "standard",
          filter: ["lowercase", "decimal_digit", "arabic_normalization", "persian_normalization"]
        }
      }
    }
  },
  mappings: {
    dynamic: "strict",
    properties: {
      ticketId: { type: "keyword" },
      ticketOrder: { type: "long" },
      matchId: { type: "keyword" },
      sportTypeId: { type: "keyword" },
      sportType: { type: "text", analyzer: "mixed_text", fields: { keyword: { type: "keyword" } } },
      competitionId: { type: "keyword" },
      competitionName: { type: "text", analyzer: "mixed_text", fields: { keyword: { type: "keyword" } } },
      homeTeamId: { type: "keyword" },
      homeTeam: { type: "text", analyzer: "mixed_text", fields: { keyword: { type: "keyword" } } },
      awayTeamId: { type: "keyword" },
      awayTeam: { type: "text", analyzer: "mixed_text", fields: { keyword: { type: "keyword" } } },
      cityId: { type: "keyword" },
      cityName: { type: "text", analyzer: "mixed_text", fields: { keyword: { type: "keyword" } } },
      venueId: { type: "keyword" },
      venueName: { type: "text", analyzer: "mixed_text", fields: { keyword: { type: "keyword" } } },
      venueType: { type: "keyword" },
      categoryId: { type: "keyword" },
      categoryName: { type: "text", analyzer: "mixed_text", fields: { keyword: { type: "keyword" } } },
      seatId: { type: "keyword" },
      sectionName: { type: "keyword" },
      rowNumber: { type: "keyword" },
      seatNumber: { type: "keyword" },
      facilities: {
        type: "object",
        dynamic: "strict",
        properties: { facilityId: { type: "keyword" }, name: { type: "keyword" } }
      },
      facilityNames: { type: "keyword" },
      price: { type: "scaled_float", scaling_factor: 100 },
      status: { type: "keyword" },
      matchStatus: { type: "keyword" },
      remainingCapacity: { type: "integer" },
      matchDatetime: { type: "date" },
      createdAt: { type: "date" }
    }
  }
} as const;
