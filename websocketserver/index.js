const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const mongoose = require("mongoose");
const cors = require("cors")
// Connect to local MongoDB
mongoose.connect("mongodb://localhost:27017/websocketserver", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("Connected to MongoDB");
}).catch(err => {
  console.error("MongoDB connection error:", err);
});

// Define Message schema
const messageSchema = new mongoose.Schema({
  text: String,
  timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model("Message", messageSchema);

const app = express();

app.use(cors());            
app.use(express.json());  
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// WebSocket connection handling
wss.on("connection", (ws) => {
  console.log("New WebSocket connection");
  ws.send("Connected to WebSocket");

  ws.on("message", async (data) => {
    const msg = data.toString();
    console.log("Received message:", msg);

    // Save message to MongoDB
    const newMessage = new Message({ text: msg });
    await newMessage.save();

    // Broadcast message to all connected clients
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  });

  ws.on("close", () => {
    console.log("WebSocket connection closed");
  });
});

















// Express routes for messages
app.get("/messages", async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: -1 }).limit(10);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/messages", express.json(), async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Message text is required" });
    }
    const newMessage = new Message({ text });
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

server.listen(8086, () => {
  console.log("HTTP + WS server running on port 8085");
});
