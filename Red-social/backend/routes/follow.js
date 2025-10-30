const express = require("express");
const router = express.Router();
const FollowController = require("../controllers/follow");
const check = require("../middlewares/auth");

// Definir rutas
router.post("/save", check.auth, FollowController.save);
router.delete("/unfollow/:id", check.auth, FollowController.unfollow);
router.get("/following/:id/:page", check.auth, FollowController.following);
router.get("/following/:id", check.auth, FollowController.following);

// Exportar router
module.exports = router;