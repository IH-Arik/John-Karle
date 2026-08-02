import type { RequestHandler } from "express";

import { ApiError } from "../../utils/api-error.util.js";
import { asyncHandler } from "../../utils/async-handler.util.js";
import { sendSuccess } from "../../utils/response.util.js";
import * as memoryChatService from "./memory-chat.service.js";
import type { MemoryChatInput } from "./memory-chat.validation.js";

const requireAuthenticatedUser = (req: Express.Request) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication token is required.", "AUTH_REQUIRED");
  }

  return req.user;
};

export const chat: RequestHandler = asyncHandler(async (req, res) => {
  const user = requireAuthenticatedUser(req);
  const result = await memoryChatService.chat(user, req.body as MemoryChatInput);

  sendSuccess(res, {
    message: "Memory chat response generated successfully.",
    data: result,
  });
});
