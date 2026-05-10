const fs = require("node:fs");
const path = require("node:path");

const dataDir = path.join(__dirname, "..", "data");
const dbPath = path.join(dataDir, "bosses.json");

const emptyDb = {
  bosses: [],
  drops: [],
  config: {
    duosChannelId: null,
    lastDuosPostDate: null
  },
  dailyDuos: [
    { left: "Wanius Zack", right: "Magic Max", status: null, markedAt: null, cooldownUntil: null },
    { left: "Eligos", right: "Malvadinho", status: null, markedAt: null, cooldownUntil: null },
    { left: "Durg Tyre", right: "billy jhin", status: null, markedAt: null, cooldownUntil: null },
    { left: "mr ice", right: "imfellel ///// obelisk", status: null, markedAt: null, cooldownUntil: null },
    { left: "Brezzley", right: "Hunting", status: null, markedAt: null, cooldownUntil: null },
    { left: "Dente", right: "Mr ice", status: null, markedAt: null, cooldownUntil: null },
    { left: "Sodreh Indignado", right: "Ze Elite", status: null, markedAt: null, cooldownUntil: null },
    { left: "Jonas Rushful", right: "hekate", status: null, markedAt: null, cooldownUntil: null },
    { left: "Doutor", right: "Nino rox", status: null, markedAt: null, cooldownUntil: null },
    { left: "Larvae", right: "Dantas Ishigo", status: null, markedAt: null, cooldownUntil: null }
  ]
};

function ensureDb() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(emptyDb, null, 2));
  }
}

function readDb() {
  ensureDb();
  const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  const merged = {
    ...emptyDb,
    ...db,
    config: {
      ...emptyDb.config,
      ...(db.config ?? {})
    },
    dailyDuos: db.dailyDuos?.length
      ? db.dailyDuos.map((duo) => ({
          ...duo,
          status: duo.status ?? (duo.done ? "done" : null),
          markedAt: duo.markedAt ?? null,
          cooldownUntil: duo.cooldownUntil ?? null
        }))
      : emptyDb.dailyDuos
  };

  return merged;
}

function writeDb(db) {
  ensureDb();
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function nextId(items) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

function createBoss({ name, number, createdBy }) {
  const db = readDb();
  const boss = {
    id: nextId(db.bosses),
    name,
    number,
    createdBy,
    createdAt: new Date().toISOString()
  };

  db.bosses.push(boss);
  writeDb(db);
  return boss;
}

function addDrop({ bossId, player, item, quantity, value, category, createdBy }) {
  const db = readDb();
  const boss = db.bosses.find((entry) => entry.id === bossId);

  if (!boss) {
    return null;
  }

  const drop = {
    id: nextId(db.drops),
    bossId,
    player,
    item,
    quantity,
    value,
    category,
    createdBy,
    createdAt: new Date().toISOString()
  };

  db.drops.push(drop);
  writeDb(db);
  return drop;
}

function saveDuoLoot({ position, bossId = null, bossName = null, drops, createdBy, markedAt = null }) {
  const db = readDb();
  const normalizedBossName = bossName?.toLowerCase() ?? null;
  const boss = bossId
    ? db.bosses.find((entry) => entry.id === bossId)
    : db.bosses
        .filter((entry) => entry.name.toLowerCase() === normalizedBossName)
        .sort((a, b) => b.id - a.id)[0];

  if (!boss) {
    return null;
  }

  const index = position - 1;
  let dailyDuos = null;

  if (markedAt && db.dailyDuos[index]) {
    const markedDate = new Date(markedAt);

    db.dailyDuos[index] = {
      ...db.dailyDuos[index],
      status: "done",
      markedAt: markedDate.toISOString(),
      cooldownUntil: new Date(markedDate.getTime() + 20 * 60 * 60 * 1000).toISOString()
    };
    dailyDuos = db.dailyDuos;
  }

  let dropId = nextId(db.drops);
  const createdAt = new Date().toISOString();
  const savedDrops = drops.map((drop) => ({
    id: dropId++,
    bossId: boss.id,
    player: drop.player,
    item: drop.item,
    quantity: drop.quantity,
    value: drop.value ?? 0,
    category: drop.category,
    createdBy,
    createdAt
  }));

  db.drops.push(...savedDrops);
  writeDb(db);
  return { boss, dailyDuos, drops: savedDrops };
}

function clearAllDrops() {
  const db = readDb();
  db.drops = [];
  writeDb(db);
  return db.drops;
}

function listBosses(limit = 10) {
  const db = readDb();
  return db.bosses
    .slice()
    .sort((a, b) => b.id - a.id)
    .slice(0, limit);
}

function getBossSummary(bossId) {
  const db = readDb();
  const boss = db.bosses.find((entry) => entry.id === bossId);

  if (!boss) {
    return null;
  }

  const drops = db.drops.filter((drop) => drop.bossId === bossId);
  const total = drops.reduce((sum, drop) => sum + drop.quantity * drop.value, 0);

  return { boss, drops, total };
}

function getLootTotals() {
  const db = readDb();
  const totals = new Map();

  for (const drop of db.drops) {
    const current = totals.get(drop.item) ?? {
      item: drop.item,
      quantity: 0,
      value: 0
    };

    current.quantity += drop.quantity;
    current.value += drop.quantity * drop.value;
    totals.set(drop.item, current);
  }

  return Array.from(totals.values()).sort((a, b) => b.quantity - a.quantity);
}

function getPlayerStacks() {
  const db = readDb();
  const totals = new Map();

  for (const drop of db.drops) {
    const current = totals.get(drop.player) ?? {
      player: drop.player,
      drops: 0,
      value: 0
    };

    current.drops += drop.quantity;
    current.value += drop.quantity * drop.value;
    totals.set(drop.player, current);
  }

  return Array.from(totals.values()).sort((a, b) => b.drops - a.drops);
}

function getPlayerLootTotals(players) {
  const db = readDb();
  const wantedPlayers = new Set(players);
  const totalsByPlayer = new Map();

  for (const player of players) {
    totalsByPlayer.set(player, new Map());
  }

  for (const drop of db.drops) {
    if (!wantedPlayers.has(drop.player)) {
      continue;
    }

    const playerTotals = totalsByPlayer.get(drop.player);
    const current = playerTotals.get(drop.item) ?? {
      item: drop.item,
      quantity: 0,
      value: 0
    };

    current.quantity += drop.quantity;
    current.value += drop.quantity * drop.value;
    playerTotals.set(drop.item, current);
  }

  return players.map((player) => ({
    player,
    totals: Array.from(totalsByPlayer.get(player).values()).sort((a, b) => b.quantity - a.quantity)
  }));
}

function getDailyDuos() {
  return readDb().dailyDuos;
}

function addDailyDuo(left, right) {
  const db = readDb();
  db.dailyDuos.push({ left, right, status: null, markedAt: null, cooldownUntil: null });
  writeDb(db);
  return db.dailyDuos;
}

function editDailyDuo(position, left, right) {
  const db = readDb();
  const index = position - 1;

  if (!db.dailyDuos[index]) {
    return null;
  }

  db.dailyDuos[index] = {
    ...db.dailyDuos[index],
    left,
    right
  };
  writeDb(db);
  return db.dailyDuos;
}

function removeDailyDuo(position) {
  const db = readDb();
  const index = position - 1;

  if (!db.dailyDuos[index]) {
    return null;
  }

  db.dailyDuos.splice(index, 1);
  writeDb(db);
  return db.dailyDuos;
}

function clearDailyDuos() {
  const db = readDb();
  db.dailyDuos = [];
  writeDb(db);
  return db.dailyDuos;
}

function setDailyDuoStatus(position, status, markedAt = new Date()) {
  const db = readDb();
  const index = position - 1;
  const markedDate = new Date(markedAt);

  if (!db.dailyDuos[index]) {
    return null;
  }

  db.dailyDuos[index] = {
    ...db.dailyDuos[index],
    status,
    markedAt: markedDate.toISOString(),
    cooldownUntil: new Date(markedDate.getTime() + 20 * 60 * 60 * 1000).toISOString()
  };
  writeDb(db);
  return db.dailyDuos;
}

function resetDailyDuos() {
  const db = readDb();
  db.dailyDuos = db.dailyDuos.map((duo) => ({
    ...duo,
    status: null,
    markedAt: null,
    cooldownUntil: null
  }));
  writeDb(db);
  return db.dailyDuos;
}

module.exports = {
  addDrop,
  addDailyDuo,
  clearAllDrops,
  clearDailyDuos,
  createBoss,
  editDailyDuo,
  getBossSummary,
  getDailyDuos,
  getLootTotals,
  getPlayerLootTotals,
  getPlayerStacks,
  listBosses,
  removeDailyDuo,
  resetDailyDuos,
  saveDuoLoot,
  setDailyDuoStatus
};
