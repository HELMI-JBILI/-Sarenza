import "dotenv/config";
import path from "node:path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { rateLimit } from "express-rate-limit";

import categoryRoutes from "./routes/categories";
import brandRoutes from "./routes/brands";
import productRoutes from "./routes/products";
import orderRoutes from "./routes/orders";
import authRoutes from "./routes/auth";
import uploadRoutes from "./routes/uploads";
import advertisementRoutes from "./routes/advertisements";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: (process.env.CORS_ORIGINS || "http://localhost:5173").split(","),
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Uploaded product images live on local disk — no external storage account required.
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Basic API-wide rate limiting; tighten further on auth routes.
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "sarenza-api", time: new Date().toISOString() });
});

app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/advertisements", advertisementRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "NOT_FOUND", message: "This endpoint does not exist." });
});

app.use(errorHandler);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Sarenza API listening on port ${PORT}`);
});
