/**
 * SSE Client Registry
 * Maintains all active admin browser connections for Server-Sent Events.
 * Each entry is an Express `res` object with SSE headers already written.
 */

const clients = new Set();

/**
 * Register a new SSE response stream
 * @param {import('express').Response} res
 */
export function addClient(res) {
  clients.add(res);
}

/**
 * Remove a disconnected SSE response stream
 * @param {import('express').Response} res
 */
export function removeClient(res) {
  clients.delete(res);
}

/**
 * Broadcast a named SSE event to all connected admin clients
 * @param {string} event  - SSE event name (e.g. "new_order")
 * @param {object} data   - JSON-serialisable payload
 */
export function broadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    try {
      res.write(payload);
    } catch {
      // Dead connection — remove it
      clients.delete(res);
    }
  }
}
