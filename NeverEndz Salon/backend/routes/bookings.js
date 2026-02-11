import express from "express";
import { getDB } from "../db.js";

const router = express.Router();

// ---- GET ALL BOOKINGS ----
router.get("/", async (req, res) => {
    try {
        const db = await getDB();
        const rows = await db.all("SELECT * FROM appointments ORDER BY date, time");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ---- CREATE BOOKING ----
router.post("/", async (req, res) => {
    try {
        const { date, time, stylist, service, duration, name, phone, notes } = req.body;

        if (!date || !time || !stylist || !service || !duration || !name || !phone) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        const db = await getDB();

        // Prevent double booking
        const existing = await db.get(
            "SELECT * FROM appointments WHERE date = ? AND time = ? AND stylist = ?",
            [date, time, stylist]
        );

        if (existing) {
            return res.status(400).json({ error: "This stylist is already booked at this time." });
        }

        const stmt = `
            INSERT INTO appointments (date, time, stylist, service, duration, name, phone, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await db.run(stmt, [
            date, time, stylist, service, duration, name, phone, notes ?? ""
        ]);

        res.status(201).json({ success: true, id: result.lastID });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ---- GET BOOKINGS FOR DAY/STYLIST ----
router.get("/check", async (req, res) => {
    try {
        const { date, stylist } = req.query;

        const db = await getDB();
        const rows = await db.all(
            "SELECT * FROM appointments WHERE date = ? AND stylist = ?",
            [date, stylist]
        );

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
