require("dotenv").config();
const mongoose = require("mongoose");

const connectToDatabase = async () => {
  if (mongoose.connection.readyState) return;

  const MONGO_URI = process.env.MONGO_URI;
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw new Error("Database connection failed");
  }
};

const keywordSchema = new mongoose.Schema({
  text: { type: String, required: true },
  alertCount: { type: Number, default: 0 },
});

const Keyword = mongoose.model("Keyword", keywordSchema);

module.exports = async (req, res) => {
  try {
    console.log("Request method:", req.method);
    console.log("Request body:", req.body);

    await connectToDatabase();

    if (req.method === "GET") {
      const keywords = await Keyword.find();
      res.status(200).json(keywords);
    } else if (req.method === "POST") {
      const { text } = req.body;

      if (!text) {
        return res.status(400).send("Keyword text is required.");
      }

      const existingKeyword = await Keyword.findOne({ text });
      if (existingKeyword) {
        return res.status(400).send("Keyword already exists.");
      }

      const newKeyword = new Keyword({ text });
      await newKeyword.save();
      res.status(201).json(newKeyword);
    } else if (req.method === "DELETE") {
      const { id } = req.query;

      await Keyword.findByIdAndDelete(id);
      res.status(204).send();
    } else {
      res.setHeader("Allow", "GET, POST, DELETE");
      res.status(405).send("Method Not Allowed");
    }
  } catch (err) {
    console.error("Unhandled server error:", err);
    res.status(500).send("A server error has occurred. Please try again later.");
  }
};
