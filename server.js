
const http = require("http");

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const path = req.url.split("?")[0];

  if (path === "/health" && req.method === "GET") {
    res.writeHead(200);
    return res.end(JSON.stringify({
      status: "online",
      assistant: "JARVIS"
    }));
  }

  if (path === "/chat" && req.method === "POST") {
    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        const message = String(data.message || "").trim();

        if (!message) {
          res.writeHead(400);
          return res.end(JSON.stringify({
            error: "Please enter a message"
          }));
        }

        res.writeHead(200);
        res.end(JSON.stringify({
          assistant: "JARVIS",
          reply: "Hello! I received your message: " + message
        }));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({
          error: "Invalid JSON"
        }));
      }
    });

    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({
    message: "JARVIS route not found"
  }));
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("JARVIS server running on port " + PORT);
});
