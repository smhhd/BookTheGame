import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, expect, test, vi } from "vitest";
import { useAuth } from "../context/AuthContext";
import { ProtectedRoute, SupportRoute } from "../routes/guards";

vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));

beforeEach(() => vi.mocked(useAuth).mockReturnValue({ user: null, loading: false, login: vi.fn(), logout: vi.fn(), refreshUser: vi.fn() }));

test("private route redirects anonymous users", () => {
  render(<MemoryRouter initialEntries={["/private"]}><Routes><Route path="/auth" element={<div>صفحه ورود</div>} /><Route element={<ProtectedRoute />}><Route path="/private" element={<div>محرمانه</div>} /></Route></Routes></MemoryRouter>);
  expect(screen.getByText("صفحه ورود")).toBeInTheDocument();
});

test("support route rejects a spectator", () => {
  vi.mocked(useAuth).mockReturnValue({ user: { user_id: "1", role_name: "spectator", city_id: null, first_name: "کاربر", last_name: "تست", email: null, phone: "09120000000", profile_image_url: null, birth_date: null, wallet_balance: "0", status: "active" }, loading: false, login: vi.fn(), logout: vi.fn(), refreshUser: vi.fn() });
  render(<MemoryRouter initialEntries={["/support"]}><Routes><Route path="/" element={<div>خانه</div>} /><Route element={<SupportRoute />}><Route path="/support" element={<div>پشتیبانی</div>} /></Route></Routes></MemoryRouter>);
  expect(screen.getByText("خانه")).toBeInTheDocument();
});
