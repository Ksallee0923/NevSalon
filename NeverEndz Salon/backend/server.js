// backend/server.js
import express from "express";
import cors from "cors";
import bookingsRouter from "./routes/bookings.js";

const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/bookings", bookingsRouter);

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
