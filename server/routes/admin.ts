import { Router } from "express";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import { requireApiKey, type AuthedRequest } from "../middleware/apiKey.js";
import { getDb } from "../db.js";
import { apiKeys } from "../../drizzle/schema.js";
import { eq } from "drizzle-orm";

export const adminRouter = Router();

// All admin routes require full scope
adminRouter.use(requireApiKey("full"));

// GET /v1/admin/keys — list all API keys (no hashes)
adminRouter.get("/keys", async (_req, res) => {
  const db = getDb();
  const keys = await db.select({
    id: apiKeys.id,
    keyPrefix: apiKeys.keyPrefix,
    appName: apiKeys.appName,
    scope: apiKeys.scope,
    active: apiKeys.active,
    lastUsedAt: apiKeys.lastUsedAt,
    createdAt: apiKeys.createdAt,
  }).from(apiKeys);
  res.json(keys);
});

// POST /v1/admin/keys — create new API key
adminRouter.post("/keys", async (req, res) => {
  const parsed = z.object({
    appName: z.string().min(1),
    scope: z.array(z.string()).min(1),
  }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const raw = randomBytes(24).toString("hex"); // 48-char key
  const hash = createHash("sha256").update(raw).digest("hex");
  const prefix = raw.slice(0, 8);

  const db = getDb();
  await db.insert(apiKeys).values({
    keyHash: hash,
    keyPrefix: prefix,
    appName: parsed.data.appName,
    scope: parsed.data.scope,
    active: true,
  });

  // Return raw key ONCE — never stored
  res.status(201).json({
    key: raw,
    prefix,
    appName: parsed.data.appName,
    scope: parsed.data.scope,
    note: "Store this key securely — it will not be shown again.",
  });
});

// DELETE /v1/admin/keys/:id — revoke key
adminRouter.delete("/keys/:id", async (req, res) => {
  const db = getDb();
  await db.update(apiKeys).set({ active: false }).where(eq(apiKeys.id, parseInt(req.params.id, 10)));
  res.json({ success: true });
});
