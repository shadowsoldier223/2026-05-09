const fs = require("node:fs");
const path = require("node:path");

const dataDir = path.join(__dirname, "..", "data");
const dbPath = path.join(dataDir, "bosses.json");
const backupsDir = path.join(dataDir, "backups");
const duoCooldownMs = 20 * 60 * 60 * 1000;

const emptyDb = {
  bosses: [],
  drops: [],
  duoHistory: [],
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
    duoHistory: db.duoHistory ?? [],
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

function backupLoots(db, reason = "loot") {
  ensureDb();

  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupsDir, `${timestamp}-${reason}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(db, null, 2));
  return backupPath;
}

function nextId(items) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

function normalizeDuoName(value) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function getDuoKey(left, right) {
  return [normalizeDuoName(left), normalizeDuoName(right)].sort().join(" + ");
}

function buildDuoCooldown(duo, status, markedAt) {
  const markedDate = new Date(markedAt);

  return {
    ...duo,
    status,
    markedAt: markedDate.toISOString(),
    cooldownUntil: new Date(markedDate.getTime() + duoCooldownMs).toISOString()
  };
}

function recordDuoHistory(db, position, status, markedAt) {
  const duo = db.dailyDuos[position - 1];

  if (!duo) {
    return null;
  }

  const markedDate = new Date(markedAt);
  const entry = {
    id: nextId(db.duoHistory),
    position,
    left: duo.left,
    right: duo.right,
    duoKey: getDuoKey(duo.left, duo.right),
    status,
    markedAt: markedDate.toISOString(),
    cooldownUntil: new Date(markedDate.getTime() + duoCooldownMs).toISOString(),
    createdAt: new Date().toISOString()
  };

  db.duoHistory.push(entry);
  return entry;
}

function getHistorySortTime(entry) {
  return new Date(entry.createdAt ?? entry.markedAt ?? 0).getTime();
}

function getLatestDuoHistory(db) {
  const latestByKey = new Map();
  const necroluneBossIds = new Set(
    db.bosses
      .filter((boss) => boss.name.toLowerCase() === "necrolune")
      .map((boss) => boss.id)
  );
  const currentDailyMarks = db.dailyDuos
    .map((duo, index) => duo.markedAt
      ? {
          position: index + 1,
          left: duo.left,
          right: duo.right,
          duoKey: getDuoKey(duo.left, duo.right),
          status: duo.status,
          markedAt: duo.markedAt,
          cooldownUntil: duo.cooldownUntil,
          createdAt: duo.markedAt
        }
      : null)
    .filter(Boolean);

  for (const entry of [...db.duoHistory, ...currentDailyMarks]) {
    const key = entry.duoKey ?? getDuoKey(entry.left, entry.right);
    const current = latestByKey.get(key);

    if (!current || getHistorySortTime(entry) > getHistorySortTime(current)) {
      latestByKey.set(key, entry);
    }
  }

  for (const [index, duo] of db.dailyDuos.entries()) {
    const key = getDuoKey(duo.left, duo.right);
    const players = new Set([normalizeDuoName(duo.left), normalizeDuoName(duo.right)]);
    const latestDrop = db.drops
      .filter((drop) =>
        necroluneBossIds.has(drop.bossId) &&
        players.has(normalizeDuoName(drop.player)) &&
        drop.createdAt
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    if (!latestDrop) {
      continue;
    }

    const markedAt = latestDrop.markedAt ?? latestDrop.createdAt;
    const fallbackEntry = {
      position: index + 1,
      left: duo.left,
      right: duo.right,
      duoKey: key,
      status: "done",
      markedAt,
      cooldownUntil: new Date(new Date(markedAt).getTime() + duoCooldownMs).toISOString(),
      createdAt: latestDrop.createdAt
    };
    const current = latestByKey.get(key);

    if (!current || getHistorySortTime(fallbackEntry) > getHistorySortTime(current)) {
      latestByKey.set(key, fallbackEntry);
    }
  }

  return latestByKey;
}

function findBoss(db, { bossId = null, bossName = null }) {
  const normalizedBossName = bossName?.toLowerCase() ?? null;

  return bossId
    ? db.bosses.find((entry) => entry.id === bossId)
    : db.bosses
        .filter((entry) => entry.name.toLowerCase() === normalizedBossName)
        .sort((a, b) => b.id - a.id)[0];
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
  backupLoots(db, "drop");
  writeDb(db);
  return drop;
}

function saveDuoLoot({ position, bossId = null, bossName = null, drops, createdBy, markedAt = null }) {
  const db = readDb();
  const boss = findBoss(db, { bossId, bossName });

  if (!boss) {
    return null;
  }

  const index = position - 1;
  let dailyDuos = null;

  if (markedAt && db.dailyDuos[index]) {
    db.dailyDuos[index] = buildDuoCooldown(db.dailyDuos[index], "done", markedAt);
    recordDuoHistory(db, position, "done", markedAt);
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
    createdAt,
    ...(markedAt ? { markedAt: new Date(markedAt).toISOString() } : {})
  }));

  db.drops.push(...savedDrops);
  backupLoots(db, "duo-loot");
  writeDb(db);
  return { boss, dailyDuos, drops: savedDrops };
}

function saveBossLoot({ bossId = null, bossName = null, drops, createdBy }) {
  const db = readDb();
  const boss = findBoss(db, { bossId, bossName });

  if (!boss) {
    return null;
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
  backupLoots(db, "boss-loot");
  writeDb(db);
  return { boss, drops: savedDrops };
}

function clearAllDrops() {
  const db = readDb();

  if (db.drops.length) {
    backupLoots(db, "before-clear-loots");
  }

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

function getItemLootStats(itemName) {
  const db = readDb();
  const normalizedItem = itemName.toLowerCase().trim();
  const matchingDrops = db.drops.filter((drop) => drop.item.toLowerCase() === normalizedItem);
  const players = new Map();
  let total = 0;

  for (const drop of matchingDrops) {
    total += drop.quantity;
    players.set(drop.player, (players.get(drop.player) ?? 0) + drop.quantity);
  }

  return {
    item: itemName,
    total,
    players: Array.from(players.entries())
      .map(([player, quantity]) => ({ player, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
  };
}

function getCharacterLootTotals() {
  const db = readDb();
  const totalsByCharacter = new Map();

  for (const drop of db.drops) {
    const totals = totalsByCharacter.get(drop.player) ?? new Map();
    const current = totals.get(drop.item) ?? {
      item: drop.item,
      quantity: 0
    };

    current.quantity += drop.quantity;
    totals.set(drop.item, current);
    totalsByCharacter.set(drop.player, totals);
  }

  return Array.from(totalsByCharacter.entries())
    .map(([player, totals]) => ({
      player,
      totals: Array.from(totals.values()).sort((a, b) => b.quantity - a.quantity)
    }))
    .sort((a, b) => a.player.localeCompare(b.player, "pt-BR"));
}

function undoLastLoot() {
  const db = readDb();

  if (!db.drops.length) {
    return null;
  }

  backupLoots(db, "before-undo-loot");
  const lastCreatedAt = db.drops.reduce((latest, drop) =>
    drop.createdAt > latest ? drop.createdAt : latest,
    db.drops[0].createdAt
  );
  const removed = db.drops.filter((drop) => drop.createdAt === lastCreatedAt);
  db.drops = db.drops.filter((drop) => drop.createdAt !== lastCreatedAt);
  backupLoots(db, "undo-loot");
  writeDb(db);
  return removed;
}

function getDailyDuos() {
  return readDb().dailyDuos;
}

function getDailyDuosWithCooldowns() {
  const db = readDb();
  const latestByKey = getLatestDuoHistory(db);

  return db.dailyDuos.map((duo) => {
    const latest = latestByKey.get(getDuoKey(duo.left, duo.right));

    if (!latest) {
      return duo;
    }

    return {
      ...duo,
      status: latest.status ?? null,
      markedAt: latest.markedAt ?? null,
      cooldownUntil: latest.cooldownUntil ?? null
    };
  });
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

  db.dailyDuos[index] = buildDuoCooldown(db.dailyDuos[index], status, markedDate);
  recordDuoHistory(db, position, status, markedDate);
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
  getCharacterLootTotals,
  getDailyDuos,
  getDailyDuosWithCooldowns,
  getItemLootStats,
  getLootTotals,
  getPlayerLootTotals,
  getPlayerStacks,
  listBosses,
  removeDailyDuo,
  resetDailyDuos,
  saveBossLoot,
  saveDuoLoot,
  setDailyDuoStatus,
  undoLastLoot
};
