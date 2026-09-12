// ============================================================
// Toggle Mail – Real-Time SSE (Server-Sent Events) Hub
// Pushes live updates to web clients without polling
// ============================================================

import type { ServerResponse } from 'node:http';

class EventHub {
  private clients: Set<ServerResponse> = new Set();
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Send keepalive comment every 25s to keep connections alive through proxies
    this.heartbeatTimer = setInterval(() => {
      this.broadcast(':keepalive\n\n', false);
    }, 25000);
  }

  addClient(res: ServerResponse) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    res.write('data: {"connected":true,"time":"' + new Date().toISOString() + '"}\n\n');
    this.clients.add(res);

    res.on('close', () => {
      this.clients.delete(res);
    });
  }

  broadcast(data: string | object, isEvent = true) {
    const payload = isEvent
      ? `data: ${typeof data === 'string' ? data : JSON.stringify(data)}\n\n`
      : data.toString();

    for (const client of this.clients) {
      try {
        client.write(payload);
      } catch {
        this.clients.delete(client);
      }
    }
  }

  notifyNewEmail(email: any) {
    this.broadcast({ type: 'new_email', email });
  }

  notifyStorageUpdate(stats: any) {
    this.broadcast({ type: 'storage_update', stats });
  }
}

export const events = new EventHub();
