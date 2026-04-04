import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function readBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

function decodePhone(token: string): string | null {
  try {
    const payload = Buffer.from(token, "base64").toString("utf8");
    const parsed = JSON.parse(payload) as { phone?: string };
    return parsed.phone ?? null;
  } catch {
    return null;
  }
}

export async function authenticateWorker(req: Request, res: Response, next: NextFunction) {
  try {
    const token = readBearerToken(req);
    if (!token) {
      return res.status(401).json({ success: false, message: "Missing Bearer token" });
    }

    const phone = decodePhone(token);
    if (!phone) {
      return res.status(401).json({ success: false, message: "Invalid auth token" });
    }

    let worker = await prisma.worker.findUnique({ where: { phone } });
    if (!worker) {
      worker = await prisma.worker.create({
        data: {
          phone,
          name: `Worker-${phone.slice(-4)}`,
        },
      });
    }

    req.user = {
      id: worker.id,
      role: "worker",
      zoneId: worker.zoneId ?? undefined,
    };

    next();
  } catch (err) {
    console.error("[authenticateWorker]", err);
    return res.status(500).json({ success: false, message: "Authentication failed" });
  }
}
