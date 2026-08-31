const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");
const seedRoutes = require("./routes/seedRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const metricsRoutes = require("./routes/metricsRoutes");
const disruptionRoutes = require("./routes/disruptionRoutes");
const churnRoutes = require("./routes/churnRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const lookupRoutes = require("./routes/lookupRoutes");

console.log("MONGO_URI:", process.env.MONGO_URI);

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Placement Scheduler API is running",
  });
});

app.use("/api/seed", seedRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/disruptions", disruptionRoutes);
app.use("/api/churn", churnRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/lookup", lookupRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
