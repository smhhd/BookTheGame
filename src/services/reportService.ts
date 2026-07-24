import { query, transaction } from "../config/database";
import { AppError } from "../utils/AppError";

interface ReportInput {
  categoryId: number;
  description: string;
  ticketId?: number;
  reservationId?: number;
  paymentId?: number;
}

export async function createReport(userId: string, input: ReportInput) {
  const category = await query("SELECT 1 FROM report_categories WHERE report_category_id = $1", [
    input.categoryId
  ]);
  if (!category.rowCount) {
    throw new AppError(422, "INVALID_REPORT_CATEGORY", "Report category is invalid");
  }
  let orderId: string | null = null;
  if (input.reservationId) {
    const owner = await query<{ order_id: string }>(
      `SELECT o.order_id FROM reservations rs
       JOIN orders o ON o.order_id = rs.order_id
       WHERE rs.reservation_id = $1 AND o.user_id = $2`,
      [input.reservationId, userId]
    );
    if (!owner.rows[0]) {
      throw new AppError(403, "INVALID_REPORT_SOURCE", "Reservation is not owned by the user");
    }
    orderId = owner.rows[0].order_id;
  } else if (input.paymentId) {
    const owner = await query<{ order_id: string }>(
      `SELECT p.order_id FROM payments p
       JOIN orders o ON o.order_id = p.order_id
       WHERE p.payment_id = $1 AND o.user_id = $2`,
      [input.paymentId, userId]
    );
    if (!owner.rows[0]) {
      throw new AppError(403, "INVALID_REPORT_SOURCE", "Payment is not owned by the user");
    }
    orderId = owner.rows[0].order_id;
  } else {
    const ticket = await query("SELECT 1 FROM tickets WHERE ticket_id = $1", [input.ticketId]);
    if (!ticket.rowCount) throw new AppError(404, "TICKET_NOT_FOUND", "Ticket was not found");
  }
  const result = await query(
    `INSERT INTO reports (
       user_id, order_id, ticket_id, reservation_id, payment_id,
       report_category_id, description
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING report_id, status, created_at`,
    [
      userId,
      orderId,
      input.ticketId ?? null,
      input.reservationId ?? null,
      input.paymentId ?? null,
      input.categoryId,
      input.description
    ]
  );
  return result.rows[0];
}

export async function myReports(userId: string) {
  const result = await query(
    `SELECT r.report_id, r.order_id, r.ticket_id, r.reservation_id, r.payment_id,
            r.description, r.status, r.created_at, r.reviewed_at, r.support_response,
            rc.report_category_id, rc.name AS category_name
     FROM reports r
     JOIN report_categories rc ON rc.report_category_id = r.report_category_id
     WHERE r.user_id = $1 ORDER BY r.created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function adminReports(input: { status?: string; page: number; limit: number }) {
  const values: unknown[] = [];
  const where = input.status ? `WHERE r.status = $${values.push(input.status)}` : "";
  const count = await query<{ total: string }>(
    `SELECT count(*)::text AS total FROM reports r ${where}`,
    values
  );
  values.push(input.limit, (input.page - 1) * input.limit);
  const result = await query(
    `SELECT r.*, rc.name AS category_name,
            u.first_name, u.last_name, u.email, u.phone
     FROM reports r
     JOIN report_categories rc ON rc.report_category_id = r.report_category_id
     JOIN users u ON u.user_id = r.user_id
     ${where}
     ORDER BY r.created_at DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  const total = Number(count.rows[0]?.total ?? 0);
  return {
    items: result.rows,
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.ceil(total / input.limit)
    }
  };
}

export async function adminReport(id: number) {
  const result = await query(
    `SELECT r.*, rc.name AS category_name,
            u.first_name, u.last_name, u.email, u.phone
     FROM reports r
     JOIN report_categories rc ON rc.report_category_id = r.report_category_id
     JOIN users u ON u.user_id = r.user_id
     WHERE r.report_id = $1`,
    [id]
  );
  if (!result.rows[0]) throw new AppError(404, "REPORT_NOT_FOUND", "Report was not found");
  return result.rows[0];
}

export async function updateReportStatus(
  id: number,
  status: string,
  supportId: string,
  response?: string
) {
  return transaction(async (client) => {
    const result = await client.query(
      `UPDATE reports
       SET status = $2, reviewed_by_support_id = $3,
           reviewed_at = CASE WHEN $2 = 'pending' THEN NULL ELSE CURRENT_TIMESTAMP END,
           support_response = CASE
             WHEN $2 = 'pending' THEN NULL
             ELSE COALESCE($4, support_response)
           END
       WHERE report_id = $1
       RETURNING *`,
      [id, status, status === "pending" ? null : supportId, response ?? null]
    );
    if (!result.rows[0]) throw new AppError(404, "REPORT_NOT_FOUND", "Report was not found");
    return result.rows[0];
  });
}
