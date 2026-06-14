const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

// Health routes
const healthRoutes = require("./routes/health.routes");

const corsOptions = require("./config/cors");
const rateLimiter = require("./middlewares/rateLimiter.middleware");
const notFound = require("./middlewares/notFound.middleware");
const errorHandler = require("./middlewares/error.middleware");
const authRoutes = require("./routes/auth.routes");
const transactionRoutes = require("./routes/transaction.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const budgetRoutes = require("./routes/budget.routes");


const app = express();

app.use(express.json());
app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());
app.use(rateLimiter);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/health", healthRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;