import express      from "express";
import cors         from "cors";
import authRoutes   from "./routes/auth.routes";
import policyRoutes from "./routes/policy.routes";
import claimRoutes  from "./routes/claim.routes";
import triggerRoutes from "./routes/trigger.routes";
import workerRoutes from "./routes/worker.routes";
import communityTriggersRoutes from "./routes/community-triggers.routes";
import workerDashboardRoutes from "./routes/worker-dashboard.routes";
import feedsRoutes from "./routes/feeds.routes";
import adminRoutes from "./routes/admin.routes";
import antiSpoofingRoutes from "./routes/anti-spoofing.routes";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Trust proxy — needed to get real client IP
app.set("trust proxy", true);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "api-server", ts: new Date().toISOString() });
});

app.use("/auth",   authRoutes);
app.use("/policy", policyRoutes);
app.use("/claims", claimRoutes);
app.use("/triggers", triggerRoutes);
app.use("/worker", workerRoutes);
app.use("/api/community-triggers", communityTriggersRoutes);
app.use("/api/worker-dashboard", workerDashboardRoutes);
app.use("/feeds", feedsRoutes);
app.use("/admin", adminRoutes);
app.use("/api", antiSpoofingRoutes);

export default app;