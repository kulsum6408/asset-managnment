const express = require("express");
const router  = express.Router();
const db = require("../config/db");
const authenticate = require("../middleware/authMiddleware");

const q = (sql, params = []) =>
    new Promise((res, rej) => db.query(sql, params, (e, r) => e ? rej(e) : res(r)));
