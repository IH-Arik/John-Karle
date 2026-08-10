import { Router, type Router as ExpressRouter } from "express";

import { validateRequest } from "../../middleware/validate-request.middleware.js";
import { authenticate } from "../auth/auth.middleware.js";
import { trackAuthenticatedUserActivity } from "../legacy-access/legacy-access.activity.js";
import { memoryChatSpeechBodySchema } from "./memory-chat-speech.validation.js";
import * as memoryChatController from "./memory-chat.controller.js";
import { memoryChatBodySchema } from "./memory-chat.validation.js";

export const memoryChatRouter: ExpressRouter = Router();

memoryChatRouter.use(authenticate, trackAuthenticatedUserActivity);

memoryChatRouter.post(
  "/",
  validateRequest({ body: memoryChatBodySchema }),
  memoryChatController.chat,
);

memoryChatRouter.post(
  "/speech",
  validateRequest({ body: memoryChatSpeechBodySchema }),
  memoryChatController.speech,
);
