const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

// Health routes
const healthRoutes = require("./routes/health.routes");

const corsOptions = require("./config/cors");
const { globalLimiter, authLimiter, aiLimiter, budgetLimiter, transactionsLimiter, analyticsLimiter, profileLimiter, categoriesLimiter, notificationsLimiter } = require("./middlewares/rateLimiter.middleware");
const notFound = require("./middlewares/notFound.middleware");
const errorHandler = require("./middlewares/error.middleware");
const authRoutes = require("./routes/auth.routes");
const transactionRoutes = require("./routes/transaction.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const budgetRoutes = require("./routes/budget.routes");
const aiRoutes = require("./routes/ai.routes");
const profileRoutes = require("./routes/profile.routes");
const categoryRoutes = require("./routes/category.routes");
const notificationRoutes = require("./routes/notification.routes"); 

const app = express();

app.use(express.json());
app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());
app.use(globalLimiter);

// API Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/transactions", transactionsLimiter, transactionRoutes);
app.use("/api/analytics", analyticsLimiter, analyticsRoutes);
app.use("/api/budgets", budgetLimiter, budgetRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/ai", aiLimiter, aiRoutes);
app.use("/api/profile", profileLimiter, profileRoutes);
app.use("/api/categories", categoriesLimiter, categoryRoutes);
app.use("/api/notifications", notificationsLimiter, notificationRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;