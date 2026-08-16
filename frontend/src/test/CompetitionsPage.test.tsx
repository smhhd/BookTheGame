import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "../api/endpoints";
import { CompetitionsPage } from "../pages/CompetitionsPage";

vi.mock("../api/endpoints", () => ({
  api: {
    getMatches: vi.fn(),
    cities: vi.fn(),
    venues: vi.fn(),
    getCompetitions: vi.fn(),
  },
}));

describe("CompetitionsPage", () => {
  beforeEach(() => {
    vi.mocked(api.cities).mockResolvedValue({ items: [] });
    vi.mocked(api.venues).mockResolvedValue({ items: [] });
    vi.mocked(api.getCompetitions).mockResolvedValue({ items: [] });
    vi.mocked(api.getMatches).mockResolvedValue({
      items: [
        {
          match_id: 1,
          competition_id: 1,
          competition_name: "لیگ برتر",
          sport_type: "فوتبال",
          home_team: "استقلال",
          away_team: "پرسپولیس",
          venue_name: "آزادی",
          city_name: "تهران",
          match_datetime: "2030-01-01T12:00:00.000Z",
          match_status: "scheduled",
          available_count: 15,
          ticket_count: 15,
          min_price: "120000",
          max_price: "500000",
        },
        {
          match_id: 2,
          competition_id: 2,
          competition_name: "لیگ والیبال",
          sport_type: "والیبال",
          home_team: "شهرداری",
          away_team: "سایپا",
          venue_name: "آزادی",
          city_name: "تهران",
          match_datetime: "2030-02-01T12:00:00.000Z",
          match_status: "scheduled",
          available_count: 9,
          ticket_count: 9,
          min_price: "80000",
          max_price: "300000",
        },
      ],
    });
  });

  test("renders matches and filters by sport and price", async () => {
    render(
      <MemoryRouter>
        <CompetitionsPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: /استقلال.*پرسپولیس/ }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("جستجوی مسابقه")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /جستجوی پیشرفته/ }));

    fireEvent.change(screen.getByLabelText("نوع مسابقه"), {
      target: { value: "والیبال" },
    });
    fireEvent.change(screen.getByLabelText("حداقل قیمت"), {
      target: { value: "100000" },
    });

    await waitFor(() => {
      expect(screen.queryByText("لیگ برتر")).not.toBeInTheDocument();
      expect(screen.getByText("لیگ والیبال")).toBeInTheDocument();
    });

    const link = screen.getByRole("link", { name: /مشاهده بلیت‌های مرتبط/i });
    expect(link).toHaveAttribute("href", "/matches/2/tickets");
  });
});
