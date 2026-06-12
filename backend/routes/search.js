// ─── Search Routes ────────────────────────────────────────────────────────────
const express = require("express");
const { protect } = require("../middleware/auth");
const { search, getTrending } = require("../controllers/searchController");

const searchRouter = express.Router();
searchRouter.use(protect);
searchRouter.get("/", search);
searchRouter.get("/trending", getTrending);

module.exports = searchRouter;
