import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { expect, test, vi } from "vitest";
import { api } from "../api/endpoints";
import { ReservePage } from "../pages/ReservePage";

vi.mock("../api/endpoints", () => ({ api: { ticket: vi.fn(), reserve: vi.fn() } }));

test("reserves the exact ticket and navigates to payment", async () => {
  const ticket = { ticket_id: "7", home_team: "الف", away_team: "ب", match_datetime: "2030-01-01T00:00:00Z", venue_name: "سالن", category_name: "عادی", section_name: "A", row_number: "1", seat_number: "2", price: "1000" } as any;
  vi.mocked(api.ticket).mockResolvedValue(ticket);
  vi.mocked(api.reserve).mockResolvedValue({ orderId: "3", reservedUntil: "2030-01-01T00:10:00Z", reservations: [{ reservation_id: "9" } as any] });
  render(<MemoryRouter initialEntries={["/reserve/7"]}><Routes><Route path="/reserve/:ticketId" element={<ReservePage />} /><Route path="/pay/:reservationId" element={<div>صفحه پرداخت</div>} /></Routes></MemoryRouter>);
  fireEvent.click(await screen.findByRole("button", { name: "تأیید و رزرو موقت" }));
  expect(await screen.findByText("صفحه پرداخت")).toBeInTheDocument();
  expect(api.reserve).toHaveBeenCalledWith(["7"]);
});
