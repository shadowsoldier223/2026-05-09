function drop(id, item, category, aliases = []) {
  return { id, item, category, aliases };
}

const commonDrops = {
  crystalCoins: drop("crystal-coins", "crystal coins", "Comum", ["crystal coin"]),
  silverToken: drop("silver-token", "silver token", "Comum", ["silver tokens"]),
  goldToken: drop("gold-token", "gold token", "Comum", ["gold tokens"]),
  nocturniaCoin: drop("nocturnia-coin", "nocturnia coin", "Comum", ["nocturnia coins"])
};

const nocturniaScrolls = {
  powerfulCloudFabric: drop(
    "powerful-cloud-fabric-scroll",
    "Powerful Cloud Fabric Scroll",
    "Semi-raro",
    ["Powerful Cloud Fabric Scrolls"]
  ),
  powerfulElectrify: drop(
    "powerful-electrify-scroll",
    "Powerful Electrify Scroll",
    "Semi-raro",
    ["Powerful Electrify Scrolls"]
  ),
  extendedPromotion: drop(
    "extended-promotion-scroll",
    "Extended Promotion Scroll",
    "Semi-raro",
    ["Extended Promotion Scrolls"]
  ),
  advancedPromotion: drop(
    "advanced-promotion-scroll",
    "Advanced Promotion Scroll",
    "Semi-raro",
    ["Advanced Promotion Scrolls"]
  ),
  rouletteCoin: drop("roulette-coin", "Roulette Coin", "Semi-raro", ["Roulette Coins"])
};

const sharedRareDrops = {
  birthdayCupcake: drop(
    "03-birthday-cupcake",
    "03's birthday cupcake",
    "Raro",
    ["03s birthday cupcake", "03 birthday cupcake"]
  ),
  birthdayCake: drop(
    "03-birthday-cake",
    "03's birthday cake",
    "Raro",
    ["03s birthday cake", "03 birthday cake"]
  ),
  boostedExercisePresent: drop(
    "boosted-exercise-present",
    "Boosted Exercise Present",
    "Raro",
    ["Boosted Exercise Presents"]
  )
};

const nocturniaVeryRareDrops = {
  mercilessBackpack: drop(
    "merciless-backpack",
    "Merciless Backpack",
    "Muito raro",
    ["Merciless Backpacks"]
  ),
  eclipseCatalyst: drop(
    "eclipse-catalyst",
    "Eclipse Catalyst",
    "Muito raro",
    ["Eclypse Catalyst", "Eclypse Catalysts"]
  ),
  unlitCrescentCrystal: drop(
    "unlit-crescent-crystal",
    "Unlit Crescent Crystal",
    "Muito raro",
    ["Unlit Crescent Crystals"]
  )
};

const necroluneDrops = [
  commonDrops.crystalCoins,
  commonDrops.silverToken,
  commonDrops.goldToken,
  commonDrops.nocturniaCoin,
  drop("mystic-bag", "mystic bag", "Semi-raro", ["mystic bags"]),
  drop("mini-obelisk", "mini obelisk", "Semi-raro", ["mini obelisks"]),
  drop("serene-backpack", "serene backpack", "Raro", ["serene backpacks"]),
  drop("plushie-of-necrolune", "plushie of necrolune", "Raro", [
    "plushie of a Necrolune",
    "plushie of Necrolune"
  ]),
  sharedRareDrops.birthdayCupcake,
  drop("eclipse-infusion-core", "Eclipse Infusion Core", "Muito raro", [
    "Eclipse Infusion Cores"
  ])
];

const nocturniaCrescentMoonDrops = [
  commonDrops.crystalCoins,
  commonDrops.silverToken,
  commonDrops.nocturniaCoin,
  nocturniaScrolls.powerfulCloudFabric,
  nocturniaScrolls.powerfulElectrify,
  nocturniaScrolls.rouletteCoin,
  sharedRareDrops.birthdayCupcake,
  sharedRareDrops.boostedExercisePresent,
  drop("03-birthday-cake", "03's birthday cake", "Muito raro", [
    "03s birthday cake",
    "03 birthday cake"
  ])
];

const nocturniaHalfMoonDrops = [
  commonDrops.crystalCoins,
  commonDrops.silverToken,
  commonDrops.goldToken,
  commonDrops.nocturniaCoin,
  nocturniaScrolls.powerfulCloudFabric,
  nocturniaScrolls.powerfulElectrify,
  nocturniaScrolls.extendedPromotion,
  nocturniaScrolls.rouletteCoin,
  sharedRareDrops.birthdayCupcake,
  sharedRareDrops.birthdayCake,
  sharedRareDrops.boostedExercisePresent,
  nocturniaVeryRareDrops.mercilessBackpack,
  nocturniaVeryRareDrops.eclipseCatalyst,
  nocturniaVeryRareDrops.unlitCrescentCrystal
];

const nocturniaFullMoonDrops = [
  commonDrops.crystalCoins,
  commonDrops.silverToken,
  commonDrops.goldToken,
  commonDrops.nocturniaCoin,
  nocturniaScrolls.powerfulCloudFabric,
  nocturniaScrolls.powerfulElectrify,
  nocturniaScrolls.advancedPromotion,
  nocturniaScrolls.rouletteCoin,
  drop("boosted-exercise-present", "Boosted Exercise Present", "Semi-raro", [
    "Boosted Exercise Presents"
  ]),
  sharedRareDrops.birthdayCupcake,
  sharedRareDrops.birthdayCake,
  drop("mini-obelisk", "mini obelisk", "Raro", ["mini obelisks"]),
  drop("stone-of-ascension", "Stone of Ascension", "Raro", ["Stones of Ascension"]),
  drop("soul-core-bag", "Soul Core Bag", "Raro", ["Soul Core Bags"]),
  nocturniaVeryRareDrops.mercilessBackpack,
  nocturniaVeryRareDrops.eclipseCatalyst,
  nocturniaVeryRareDrops.unlitCrescentCrystal,
  drop("23-nocturnia-rubini", "#23 Nocturnia Rubini", "Unico", [
    "23 Nocturnia Rubini",
    "Nocturnia Rubini"
  ])
];

const lootBosses = {
  necrolune: {
    label: "Necrolune",
    bossName: "necrolune",
    drops: necroluneDrops
  },
  nocturniaCrescentMoon: {
    label: "Nocturnia - Crescent Moon",
    bossName: "nocturnia",
    drops: nocturniaCrescentMoonDrops
  },
  nocturniaHalfMoon: {
    label: "Nocturnia - Half Moon",
    bossName: "nocturnia",
    drops: nocturniaHalfMoonDrops
  },
  nocturniaFullMoon: {
    label: "Nocturnia - Full Moon",
    bossName: "nocturnia",
    drops: nocturniaFullMoonDrops
  }
};

function normalizeLootText(value) {
  return value
    .toLowerCase()
    .replace(/['\u2019]/g, "")
    .replace(/\b(a|an)\b/g, " ")
    .replace(/[.,;:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getDropAliases(lootDrop) {
  const item = lootDrop.item;
  const aliases = [item, ...(lootDrop.aliases ?? [])];

  if (item.endsWith("s")) {
    aliases.push(item.slice(0, -1));
  }

  if (!item.endsWith("s")) {
    aliases.push(`${item}s`);
  }

  return aliases;
}

function getKnownDropByItem(itemName, drops) {
  const normalizedItem = normalizeLootText(itemName);

  return drops.find((lootDrop) =>
    getDropAliases(lootDrop).some((alias) => normalizeLootText(alias) === normalizedItem)
  ) ?? null;
}

function getKnownLootDropByItem(itemName) {
  for (const boss of Object.values(lootBosses)) {
    const knownDrop = getKnownDropByItem(itemName, boss.drops);

    if (knownDrop) {
      return knownDrop;
    }
  }

  return null;
}

function toGenericDrop(itemName) {
  const cleanedItem = itemName
    .replace(/^(a|an)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return {
    id: normalizeLootText(cleanedItem),
    item: cleanedItem,
    category: "Loot"
  };
}

function getLootBoss(bossKey) {
  return lootBosses[bossKey] ?? null;
}

function listLootBosses() {
  return Object.entries(lootBosses).map(([key, boss]) => ({
    key,
    label: boss.label
  }));
}

function parseLootPaste(text, bossKey) {
  if (!text.trim()) {
    return [];
  }

  const boss = getLootBoss(bossKey) ?? lootBosses.necrolune;
  const marker = "available in your reward chest:";
  const lowerText = text.toLowerCase();
  const markerIndex = lowerText.indexOf(marker);
  const lootText = markerIndex >= 0
    ? text.slice(markerIndex + marker.length)
    : text.slice(text.lastIndexOf(":") + 1);
  const totals = new Map();
  const parts = lootText
    .split(/,|\s+and\s+|\s+e\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);

  for (const part of parts) {
    const cleanedPart = part.replace(/[.]+$/g, "").trim();
    const match = cleanedPart.match(/^(\d+)\s+(.+)$/);
    const quantity = match ? Number.parseInt(match[1], 10) : 1;
    const itemName = (match ? match[2] : cleanedPart).replace(/^(a|an)\s+/i, "");
    const lootDrop = getKnownDropByItem(itemName, boss.drops) ?? toGenericDrop(itemName);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      continue;
    }

    totals.set(lootDrop.id, {
      drop: lootDrop,
      quantity: (totals.get(lootDrop.id)?.quantity ?? 0) + quantity
    });
  }

  return Array.from(totals.values());
}

module.exports = {
  getKnownLootDropByItem,
  getLootBoss,
  listLootBosses,
  parseLootPaste
};
