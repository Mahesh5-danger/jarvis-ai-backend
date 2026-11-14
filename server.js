
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
      if (body.length > 20000) req.destroy();
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(body);

        if (path === "/calculate") {
          const a = Number(data.a);
          const b = Number(data.b);
          const op = data.operation;

          if (!Number.isFinite(a) || !Number.isFinite(b)) {
            return send(res, 400, {
              error: "Enter valid numbers"
            });
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

        if (message.toLowerCase().startsWith("plan ")) {
          const task = message.slice(5).trim();

          if (!task) {
            return send(res, 400, {
              error: "Please describe your task"
            });
          }

          const plan =
            "Task: " + task +
            "\n\n1. Decide what you want to achieve." +
            "\n2. List what you need." +
            "\n3. Break the task into small steps." +
            "\n4. Complete one step at a time." +
            "\n5. Review your progress.";

          return send(res, 200, {
            assistant: "JARVIS",
            tool: "task-planner",
            reply: plan
          });
        }

        // Accept recent conversation history safely.
        const history = Array.isArray(data.history)
          ? data.history
              .filter(item =>
                item &&
                (item.role === "user" || item.role === "model") &&
                typeof item.text === "string"
              )
              .slice(-12)
              .map(item => ({
                role: item.role,
                parts: [{ text: item.text.slice(0, 2000) }]
              }))
          : [];

        // Add the newest message after the earlier messages.
        history.push({
          role: "user",
          parts: [{ text: message.slice(0, 2000) }]
        });

        (async () => {
          const apiKey = process.env.GEMINI_API_KEY;

          if (!apiKey) {
            return send(res, 500, {
              error: "Gemini API key is missing"
            });
          }

          try {
            const response = await fetch(
              "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-goog-api-key": apiKey
                },
                body: JSON.stringify({
  system_instruction: {
    parts: [{
      text: "You are JARVIS, a helpful AI coding assistant. You can write, explain, debug, and improve code in HTML, CSS, JavaScript, Python, and other programming languages. Give complete beginner-friendly examples. Explain where code should go. Never claim that code has been tested or executed unless it actually has. Never reveal API keys, passwords, or secrets. Do not execute code or make changes to files."
    }]
  },
  contents: history
})
                
              }
            );

            const result = await response.json();

            if (!response.ok) {
              console.error("Gemini error:", result.error);
              return send(res, 502, {
                error: "Gemini AI request failed"
              });
            }

            const reply = result.candidates?.[0]?.content?.parts
              ?.map(part => part.text || "")
              .join("")
              .trim();

            if (!reply) {
              return send(res, 502, {
                error: "Gemini returned an empty response"
              });
            }

            return send(res, 200, {
              assistant: "JARVIS",
              reply: reply
            });

          } catch (error) {
            console.error("AI connection error:", error);

            return send(res, 500, {
              error: "Unable to connect to Gemini AI"
            });
          }
        })();

      } catch (error) {
        return send(res, 400, {
          error: "Invalid JSON"
        });
      }
    });

    return;
  }
  
  if (path === "/news" && req.method === "GET") {
    const params = new URL(req.url, "http://localhost").searchParams;
    const topic = (params.get("topic") || "India").trim().slice(0, 80);

    (async () => {
      try {
        const apiUrl = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
        apiUrl.search = new URLSearchParams({
          query: topic,
          mode: "ArtList",
          format: "json",
          maxrecords: "5",
          timespan: "1d",
          sort: "DateDesc"
        }).toString();

        const response = await fetch(apiUrl);

        if (!response.ok) {
          return send(res, 502, { error: "News provider unavailable" });
        }

        const result = await response.json();
        const articles = Array.isArray(result.articles)
          ? result.articles
          : [];

        return send(res, 200, {
          assistant: "JARVIS",
          source: "GDELT Project",
          topic,
          articles: articles.map(article => ({
            title: String(article.title || "").slice(0, 300),
            url: String(article.url || ""),
            source: String(article.domain || ""),
            seenAt: String(article.seendate || "")
          }))
        });
      } catch (error) {
        console.error("News connection error:", error);
        return send(res, 500, {
          error: "Unable to retrieve news right now"
        });
      }
    })();

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
