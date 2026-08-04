import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "../api/endpoints";
import { SearchPage } from "../pages/SearchPage";

vi.mock("../api/endpoints", () => ({
  api: { searchTickets: vi.fn(), cities: vi.fn(), venues: vi.fn() }
}));

const ticket = {
  ticket_id: "7", match_id: "2", sport_type_id: 1, sport_type: "فوتبال",
  home_team_id: "1", home_team: "استقلال", away_team_id: "2", away_team: "پرسپولیس",
  venue_id: 1, venue_name: "آزادی", city_id: 1, city_name: "تهران",
  match_datetime: "2030-01-01T12:00:00.000Z", match_status: "scheduled",
  category_id: 1, category_name: "عادی", price: "250000", status: "available",
  remaining_capacity: 1, section_name: "A", row_number: "1", seat_number: "8"
};

describe("SearchPage", () => {
  beforeEach(() => {
    vi.mocked(api.cities).mockResolvedValue({ items: [] });
    vi.mocked(api.venues).mockResolvedValue({ items: [] });
    vi.mocked(api.searchTickets).mockResolvedValue({ items: [ticket], pagination: { page: 1, limit: 12, total: 1, totalPages: 1 }, search: { source: "elasticsearch", tookMs: 4 } });
  });

  test("shows loading then renders search results", async () => {
    render(<MemoryRouter><SearchPage /></MemoryRouter>);
    expect(screen.getByRole("status")).toHaveTextContent("در حال دریافت اطلاعات");
    expect(await screen.findByRole("heading", { name: /استقلال.*پرسپولیس/ })).toBeInTheDocument();
    expect(screen.getByText(/جستجوی سریع/)).toBeInTheDocument();
  });

  test("writes filters to the URL and searches again", async () => {
    render(<MemoryRouter><SearchPage /></MemoryRouter>);
    await screen.findByRole("heading", { name: /استقلال.*پرسپولیس/ });
    fireEvent.change(screen.getByLabelText("جستجوی آزاد"), { target: { value: "دربی" } });
    fireEvent.click(screen.getByRole("button", { name: "جستجوی بلیت" }));
    await waitFor(() => expect(vi.mocked(api.searchTickets).mock.calls.at(-1)?.[0].get("q")).toBe("دربی"));
  });

  test("renders a clear empty state", async () => {
    vi.mocked(api.searchTickets).mockResolvedValue({ items: [], pagination: { page: 1, limit: 12, total: 0, totalPages: 0 } });
    render(<MemoryRouter><SearchPage /></MemoryRouter>);
    expect(await screen.findByText(/بلیتی پیدا نشد/)).toBeInTheDocument();
  });
});
