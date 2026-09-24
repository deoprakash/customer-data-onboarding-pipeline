require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { redisClient, connectRedis } = require("./services/redis");

const jobRouter = require("./routes/jobs");
const dashboardRouter = require("./routes/dashboard");
const customersRouter = require("./routes/customers");
const configsRouter = require("./routes/configs");
const integrationsRouter = require("./routes/integrations");
const userRouter = require("./routes/user");
const logsRouter = require("./routes/logs");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/jobs", jobRouter);
app.use("/dashboard", dashboardRouter);
app.use("/customers", customersRouter);
app.use("/configs", configsRouter);
app.use("/integrations", integrationsRouter);
app.use("/user", userRouter);
app.use("/logs", logsRouter);

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "backend",
  });
});

const PORT = 3000;

async function startServer() {
  await connectRedis();

  console.log("Redis connected");

  app.listen(PORT, () => {
    console.log(`Backend API running: ${PORT}`);
  });
}

startServer();
