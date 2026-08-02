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
 *     description: Answers a question about the given person, grounded only in that person's memories already stored in the current user's Memory Vault. Lineage.AI speaks about the person in the third person and never role-plays as them.
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
