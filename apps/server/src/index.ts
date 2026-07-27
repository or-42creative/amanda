import { createServer } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import { encode } from "@amanda/shared";
import { Match } from "./match.js";
import "./content.js"; // eager-load the card catalog at boot

const PORT = Number(process.env.PORT ?? 2567);

// A tiny HTTP server for health checks (hosts like Render probe GET /).
const http = createServer((req, res) => {
  res.writeHead(200, { "content-type": "text/plain" });
  res.end("Amanda multiplayer server — OK");
});

const wss = new WebSocketServer({ server: http });

/** The player waiting to be matched, if any. */
let waiting: WebSocket | null = null;
const matchOf = new WeakMap<WebSocket, Match>();

wss.on("connection", (ws) => {
  ws.on("message", (data) => {
    const raw = data.toString();
    const match = matchOf.get(ws);
    if (match) {
      match.handle(ws, raw);
      return;
    }
    // Not yet in a match — expect a "hello" to enter the matchmaking queue.
    let t = "";
    try {
      t = (JSON.parse(raw) as { t?: string }).t ?? "";
    } catch {
      return;
    }
    if (t !== "hello") return;

    if (waiting && waiting.readyState === waiting.OPEN && waiting !== ws) {
      const opponent = waiting;
      waiting = null;
      const m = new Match(opponent, ws);
      matchOf.set(opponent, m);
      matchOf.set(ws, m);
      console.log("[server] match started");
    } else {
      waiting = ws;
      ws.send(encode({ t: "waiting" }));
      console.log("[server] player waiting");
    }
  });

  ws.on("close", () => {
    if (waiting === ws) waiting = null;
    const match = matchOf.get(ws);
    if (match) {
      match.leave(ws);
      matchOf.delete(ws);
    }
  });

  ws.on("error", () => {
    /* ignore socket errors; close handler cleans up */
  });
});

http.listen(PORT, () => {
  console.log(`[server] Amanda multiplayer listening on :${PORT}`);
});
