/**
 * In-memory pub/sub for Vocab Jam multiplayer rooms.
 * All code runs in the same browser tab, so this module-level store
 * acts as a WebSocket server substitute during development.
 */

const rooms = {}; // jamId → { players: {}, handlers: [], _botTimer }

function _room(jamId) {
  if (!rooms[jamId]) rooms[jamId] = { players: {}, handlers: [] };
  return rooms[jamId];
}

/** Subscribe to all events for a room. Returns an unsubscribe fn. */
export function subscribe(jamId, handler) {
  const r = _room(jamId);
  r.handlers.push(handler);
  return () => { r.handlers = r.handlers.filter(h => h !== handler); };
}

/** Broadcast an event to all handlers in a room. */
export function broadcast(jamId, event) {
  rooms[jamId]?.handlers.forEach(h => h(event));
}

/** Return current player array sorted by score desc. */
export function getPlayers(jamId) {
  const r = rooms[jamId];
  if (!r) return [];
  return Object.values(r.players).sort((a, b) => b.score - a.score);
}

/** Add or update a player, then broadcast roster. */
export function joinPlayer(jamId, player) {
  const r = _room(jamId);
  r.players[player.id] = { id: player.id, name: player.name, score: 0, isBot: !!player.isBot };
  broadcast(jamId, { type: 'roster', players: Object.values(r.players) });
}

/** Update a player's score and broadcast. */
export function setScore(jamId, playerId, score) {
  const r = rooms[jamId];
  if (!r?.players[playerId]) return;
  r.players[playerId].score = score;
  broadcast(jamId, {
    type: 'score_update',
    playerId,
    score,
    players: Object.values(r.players),
  });
}

/** Simulate bot activity throughout a jam session. */
export function startBots(jamId, wordCount) {
  const r = rooms[jamId];
  if (!r) return;
  const botIds = Object.keys(r.players).filter(id => r.players[id].isBot);
  if (!botIds.length) return;
  let ticks = 0;
  const maxTicks = wordCount * 5;
  r._botTimer = setInterval(() => {
    ticks++;
    if (ticks > maxTicks || !rooms[jamId]) { clearInterval(r._botTimer); return; }
    const id = botIds[Math.floor(Math.random() * botIds.length)];
    if (!r.players[id]) return;
    if (Math.random() < 0.65) {
      const gain = 10 + Math.floor(Math.random() * 22);
      r.players[id].score = (r.players[id].score || 0) + gain;
      broadcast(jamId, {
        type: 'score_update',
        playerId: id,
        score: r.players[id].score,
        players: Object.values(r.players),
      });
    }
  }, 1800 + Math.floor(Math.random() * 1500));
}

/** Stop bot simulation for a room. */
export function stopBots(jamId) {
  const r = rooms[jamId];
  if (r?._botTimer) { clearInterval(r._botTimer); r._botTimer = null; }
}
