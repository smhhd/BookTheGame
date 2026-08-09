import type { NextFunction, Request, Response } from "express";
import { errorHandler } from "../../src/middlewares/errorHandler";

function responseMock() {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  return { response: { status } as unknown as Response, status, json };
}

test.each([
  [{ status: 400, type: "entity.parse.failed" }, 400, "MALFORMED_JSON"],
  [{ status: 413, type: "entity.too.large" }, 413, "PAYLOAD_TOO_LARGE"]
])("maps body parser errors to controlled responses", (metadata, expectedStatus, expectedCode) => {
  const error = Object.assign(new SyntaxError("body parser failure"), metadata);
  const { response, status, json } = responseMock();
  errorHandler(error, {} as Request, response, jest.fn() as NextFunction);
  expect(status).toHaveBeenCalledWith(expectedStatus);
  expect(json).toHaveBeenCalledWith(expect.objectContaining({
    success: false,
    error: expect.objectContaining({ code: expectedCode })
  }));
});
