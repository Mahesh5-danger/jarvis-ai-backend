
const http = require("http");

function send(res, status, data) {
  res.writeHead(status);
  res.end(JSON.stringify(data));
}

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
    return send(res, 200, {
      status: "online",
      assistant: "JARVIS"
    });
  }

  if (req.method === "POST" &&
      (path === "/chat" || path === "/calculate")) {
    let body = "";

    req.on("data", chunk => {
      body += chunk;
      if (body.length > 10000) req.destroy();
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(body);

        if (path === "/calculate") {
          const a = Number(data.a);
          const b = Number(data.b);
          const op = data.operation;

          if (!Number.isFinite(a) || !Number.isFinite(b)) {
            return send(res, 400, { error: "Enter valid numbers" });
          }

          let result;

          if (op === "add") result = a + b;
          else if (op === "subtract") result = a - b;
          else if (op === "multiply") result = a * b;
          else if (op === "divide" && b !== 0) result = a / b;
          else {
            return send(res, 400, {
              error: "Unsupported operation or division by zero"
            });
          }

          return send(res, 200, {
            assistant: "JARVIS",
            tool: "calculator",
            result
          });
        }

        const message = String(data.message || "").trim();

        if (!message) {
          return send(res, 400, {
            error: "Please enter a message"
          });
        }

        return send(res, 200, {
          assistant: "JARVIS",
          reply: "I received your message: " + message
        });

      } catch (error) {
        return send(res, 400, { error: "Invalid JSON" });
      }
    });

    return;
  }

  return send(res, 404, {
    message: "JARVIS route not found"
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("JARVIS server running on port " + PORT);
});
