/**
 * @swagger
 * tags:
 *   - name: Memory Chat
 *     description: Lineage.AI grounded Q&A about a family member's memories
 */

/**
 * @swagger
 * /api/v1/memory-chat:
 *   post:
 *     tags: [Memory Chat]
 *     summary: Ask Lineage.AI a question about a person's memories
 *     description: Answers a question about the given person, grounded only in that person's memories already stored in the Memory Vault. Defaults to the current user's own memories; pass `familyMemberUserId` to ask about an accepted family member's shared memories instead. Lineage.AI speaks about the person in the third person and never role-plays as them.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [person, question]
 *             properties:
 *               person:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 120
 *                 example: "Margaret"
 *               question:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *                 example: "What did Margaret love to do on weekends?"
 *               familyMemberUserId:
 *                 type: string
 *                 pattern: "^[0-9a-fA-F]{24}$"
 *                 description: Accepted family member user id whose Memory Vault should be searched, if different from the caller.
 *     responses:
 *       200:
 *         description: Memory chat response generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: "#/components/schemas/MemoryChatResponse"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       403:
 *         description: Not permitted to view this family member's memories
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       502:
 *         description: The AI service rejected the request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       503:
 *         description: The AI service is not configured
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */

/**
 * @swagger
 * /api/v1/memory-chat/speech:
 *   post:
 *     tags: [Memory Chat]
 *     summary: Synthesize speech audio for a Memory Chat answer
 *     description: Converts the given text (typically a Lineage.AI chat answer already returned by `POST /memory-chat`) into spoken audio using a fixed assistant voice. Returns raw `audio/mpeg` bytes, not JSON.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text, voice]
 *             properties:
 *               text:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *                 example: "Margaret loved spending weekends gardening with her grandchildren."
 *               voice:
 *                 type: string
 *                 enum: [male, female]
 *     responses:
 *       200:
 *         description: Synthesized speech audio
 *         content:
 *           audio/mpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       502:
 *         description: Speech synthesis failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
