export function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return <nav className="pagination" aria-label="صفحه‌بندی">
    <button disabled={page <= 1} onClick={() => onPage(page - 1)}>قبلی</button>
    <span>صفحه {page.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}</span>
    <button disabled={page >= totalPages} onClick={() => onPage(page + 1)}>بعدی</button>
  </nav>;
}
