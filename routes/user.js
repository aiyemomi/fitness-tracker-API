const express = require("express");
const { registerUser, loginUser, getUserData } = require("../controllers/User");
const validateToken = require("../middleware/validateToken");
const router = express.Router();

router.post("/signup", registerUser);
router.post("/login", loginUser);
router.get("/userData", validateToken, getUserData);

module.exports = router;
