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

function setDailyDuoStatus(position, status) {
  const db = readDb();
  const index = position - 1;
  const now = new Date();

  if (!db.dailyDuos[index]) {
    return null;
  }

  db.dailyDuos[index] = {
    ...db.dailyDuos[index],
    status,
    markedAt: now.toISOString(),
    cooldownUntil: new Date(now.getTime() + 20 * 60 * 60 * 1000).toISOString()
  };
  writeDb(db);
  return db.dailyDuos;
}

function getConfig() {
  return readDb().config;
}

function setDuosChannel(channelId) {
  const db = readDb();
  db.config.duosChannelId = channelId;
  writeDb(db);
  return db.config;
}

function setLastDuosPostDate(dateKey) {
  const db = readDb();
  db.config.lastDuosPostDate = dateKey;
  writeDb(db);
  return db.config;
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
  clearDailyDuos,
  createBoss,
  editDailyDuo,
  getBossSummary,
  getConfig,
  getDailyDuos,
  getLootTotals,
  getPlayerStacks,
  listBosses,
  removeDailyDuo,
  resetDailyDuos,
  setDailyDuoStatus,
  setDuosChannel,
  setLastDuosPostDate
};
