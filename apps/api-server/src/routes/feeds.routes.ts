import express from "express";
import { getOfficialNoticeFeed } from "../services/feeds/official-notice-feed.service";

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

export default router;
