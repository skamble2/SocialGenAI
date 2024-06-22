const express = require("express");
const router = express.Router();
const agent = require("./agent"); 
const openai = require("./openai");

router.get("/recommendation", async (req, res) => {
  try {
    const response = await agent(
      "Please suggest some activities based on my location and the weather."
    );
    res.json({ recommendation: response });
  } catch (error) {
    console.error("Error getting recommendation:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});




module.exports = router;
