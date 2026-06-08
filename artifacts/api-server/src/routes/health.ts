import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    version: "1.2.0-beta",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
