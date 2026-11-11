
const http = require("http");

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.url === "/health") {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: "online",
      assistant: "JARVIS",
      message: "JARVIS backend is running!"
    }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({
      message: "JARVIS route not found"
    }));
  }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("JARVIS server running on port " + PORT);
});
