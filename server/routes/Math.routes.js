// backend/routes/math.route.js
import express from "express"
import { solveMath } from "../controllers/math.controller.js"

const router = express.Router()

router.post("/solve", solveMath)

export default router
