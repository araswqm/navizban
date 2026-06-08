import express from "express";
import cors from "cors";
import { healthRouter } from "./routes/health";
import { trainsRouter } from "./routes/trains";

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api", healthRouter);
app.use("/api", trainsRouter);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

export { app };
