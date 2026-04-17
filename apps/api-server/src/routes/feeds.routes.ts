import express from "express";
import { getOfficialNoticeFeed, verifyLocalNewsEvidence } from "../services/feeds/official-notice-feed.service";
import { verifyWithTwitter } from "../services/feeds/twitter-verification.service";

const router = express.Router();

router.get("/curfew", (req, res) => {
  const zoneId = String(req.query.zoneId || "").trim();
  if (!zoneId) {
    return res.status(400).json({ error: "zoneId query param is required" });
  }

  return res.json(getOfficialNoticeFeed("curfew", zoneId));
});

router.get("/festival", (req, res) => {
  const zoneId = String(req.query.zoneId || "").trim();
  if (!zoneId) {
    return res.status(400).json({ error: "zoneId query param is required" });
  }

  return res.json(getOfficialNoticeFeed("festival", zoneId));
});

router.get("/local-news", async (req, res) => {
  const zoneId = String(req.query.zoneId || "").trim();
  const title = String(req.query.title || "").trim();
  const description = String(req.query.description || "").trim();

  if (!zoneId) {
    return res.status(400).json({ error: "zoneId query param is required" });
  }

  if (!title && !description) {
    return res.status(400).json({ error: "title or description query param is required" });
  }

  const result = await verifyLocalNewsEvidence({ zoneId, title, description });
  return res.json(result);
});

router.get("/twitter-verify", async (req, res) => {
  const zoneId = String(req.query.zoneId || "").trim();
  const title = String(req.query.title || "").trim();
  const description = String(req.query.description || "").trim();

  if (!zoneId) {
    return res.status(400).json({ error: "zoneId query param is required" });
  }

  if (!title && !description) {
    return res.status(400).json({ error: "title or description query param is required" });
  }

  const queryText = `${title} ${description}`.trim();
  const result = await verifyWithTwitter(zoneId, queryText);
  return res.json(result);
});

export default router;
