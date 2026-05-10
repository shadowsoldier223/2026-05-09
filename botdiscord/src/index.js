require("dotenv").config();

const {
  ActionRowBuilder,
  Client,
  GatewayIntentBits,
  MessageFlags,
  ModalBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");
const { explainLoginError, requireEnv, warnUnsupportedNode } = require("./env");
const {
  addDailyDuo,
  addDrop,
  clearAllDrops,
  clearDailyDuos,
  createBoss,
  editDailyDuo,
  getBossSummary,
  getCharacterLootTotals,
  getDailyDuos,
  getItemLootStats,
  getLootTotals,
  getPlayerLootTotals,
  getPlayerStacks,
  listBosses,
  removeDailyDuo,
  resetDailyDuos,
  saveDuoLoot,
  setDailyDuoStatus,
  undoLastLoot
} = require("./storage");
const { formatDailyDuos, formatDate, formatGold, formatTime, trimDiscord } = require("./format");

warnUnsupportedNode();
requireEnv(["DISCORD_TOKEN"]);

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const necroluneDrops = [
  { id: "crystal-coins", item: "crystal coins", category: "Comum", aliases: ["crystal coin"] },
  { id: "silver-token", item: "silver token", category: "Comum", aliases: ["silver tokens"] },
  { id: "gold-token", item: "gold token", category: "Comum", aliases: ["gold tokens"] },
  { id: "nocturnia-coin", item: "nocturnia coin", category: "Comum", aliases: ["nocturnia coins"] },
  { id: "mystic-bag", item: "mystic bag", category: "Semi-raro", aliases: ["mystic bags"] },
  { id: "mini-obelisk", item: "mini obelisk", category: "Semi-raro", aliases: ["mini obelisks"] },
  { id: "serene-backpack", item: "serene backpack", category: "Raro", aliases: ["serene backpacks"] },
  {
    id: "plushie-of-necrolune",
    item: "plushie of necrolune",
    category: "Raro",
    aliases: ["plushie of a Necrolune", "plushie of Necrolune"]
  },
  {
    id: "03-birthday-cupcake",
    item: "03's birthday cupcake",
    category: "Raro",
    aliases: ["03s birthday cupcake", "03 birthday cupcake"]
  },
  {
    id: "eclipse-infusion-core",
    item: "Eclipse Infusion Core",
    category: "Muito raro",
    aliases: ["Eclipse Infusion Cores"]
  }
];

const lootBosses = {
  necrolune: {
    label: "Necrolune",
    bossName: "necrolune",
    drops: necroluneDrops
  },
  nocturnia: {
    label: "Nocturnia",
    bossName: "nocturnia",
    drops: null
  }
};

const playerCharacters = [
  {
    owner: "Andre",
    characters: ["Wanius Zack", "Eligos", "Durg Tyre", "Hunting", "Doutor", "Larvae"]
  },
  {
    owner: "Guilherme",
    characters: ["Malvadinho", "Imfellel", "Dente", "Sodreh", "Hekate"]
  },
  {
    owner: "Jonas",
    characters: [
      "Magic Max",
      "billy jhin",
      "Mr Ice",
      "mr ice",
      "Brezzley",
      "Ze Elite",
      "Jonas Rushful",
      "Jonas Rushfull",
      "Nino Rox",
      "Dantas Ishigo"
    ]
  }
];

function getKnownDropByItem(itemName, drops) {
  const normalizedItem = normalizeLootText(itemName);

  return drops.find((drop) =>
    getDropAliases(drop).some((alias) => normalizeLootText(alias) === normalizedItem)
  ) ?? null;
}

function getNecroluneDropByItem(itemName) {
  return getKnownDropByItem(itemName, necroluneDrops);
}

function createDuoPanelComponents() {
  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("duo-action")
        .setPlaceholder("Selecione uma acao...")
        .addOptions(
          {
            label: "Ver lista",
            description: "Mostra a lista diaria de duos",
            value: "view"
          },
          {
            label: "Enviar lista limpa",
            description: "Envia a lista e limpa marcacoes antigas",
            value: "send"
          },
          {
            label: "Adicionar duo",
            description: "Cadastra uma nova dupla",
            value: "add"
          },
          {
            label: "Editar duo",
            description: "Altera uma dupla pelo numero da lista",
            value: "edit"
          },
          {
            label: "Marcar OK",
            description: "Marca como concluido e abre os drops",
            value: "done"
          },
          {
            label: "Marcar fail",
            description: "Marca como falhou",
            value: "fail"
          },
          {
            label: "Remover duo",
            description: "Remove uma dupla pelo numero da lista",
            value: "remove"
          },
          {
            label: "Limpar lista",
            description: "Remove todos os duos cadastrados",
            value: "clear"
          },
          {
            label: "Limpar todos os loots",
            description: "Apaga todos os drops salvos",
            value: "clear-loots"
          },
          {
            label: "Ver total de loots",
            description: "Mostra o total geral por dono",
            value: "loot-total"
          },
          {
            label: "Ver total por char",
            description: "Mostra o total de drops por character",
            value: "loot-chars"
          },
          {
            label: "Desfazer ultimo loot",
            description: "Remove o ultimo envio de loot salvo",
            value: "undo-loot"
          },
          {
            label: "Duos prontos",
            description: "Mostra quem ja saiu do cooldown",
            value: "duo-ready"
          },
          {
            label: "Duos em cooldown",
            description: "Mostra quanto falta para liberar",
            value: "duo-cooldown"
          }
        )
    )
  ];
}

function createBossLootComponents(position) {
  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`boss-loot:${position}`)
        .setPlaceholder("Escolha o boss do loot")
        .addOptions(
          ...Object.entries(lootBosses).map(([value, boss]) => ({
            label: boss.label,
            description: `Colar loot do ${boss.label}`,
            value
          }))
        )
    )
  ];
}

function createTextInput(id, label, placeholder, required = true, style = TextInputStyle.Short) {
  return new TextInputBuilder()
    .setCustomId(id)
    .setLabel(label)
    .setPlaceholder(placeholder)
    .setStyle(style)
    .setRequired(required);
}

function createDuoModal(action) {
  const titles = {
    add: "Adicionar duo",
    edit: "Editar duo",
    remove: "Remover duo",
    done: "Marcar OK",
    fail: "Marcar fail"
  };
  const modal = new ModalBuilder()
    .setCustomId(`duo-modal:${action}`)
    .setTitle(titles[action]);

  if (action === "add") {
    modal.addComponents(
      new ActionRowBuilder().addComponents(createTextInput("p1", "Jogador 1", "Eligos")),
      new ActionRowBuilder().addComponents(createTextInput("p2", "Jogador 2", "Malvadinho"))
    );
    return modal;
  }

  modal.addComponents(
    new ActionRowBuilder().addComponents(createTextInput("n", "Numero da lista", "2"))
  );

  if (action === "edit") {
    modal.addComponents(
      new ActionRowBuilder().addComponents(createTextInput("p1", "Jogador 1", "Eligos")),
      new ActionRowBuilder().addComponents(createTextInput("p2", "Jogador 2", "Malvadinho"))
    );
  }

  return modal;
}

function createClearLootsModal() {
  return new ModalBuilder()
    .setCustomId("clear-loots")
    .setTitle("Limpar todos os loots")
    .addComponents(
      new ActionRowBuilder().addComponents(
        createTextInput("confirm", "Digite LIMPAR para confirmar", "LIMPAR")
      )
    );
}

function createLootPasteModal(position, bossKey) {
  const duo = getDailyDuos()[position - 1];
  const leftName = duo?.left ?? `Jogador 1 do duo ${position}`;
  const rightName = duo?.right ?? `Jogador 2 do duo ${position}`;
  const boss = lootBosses[bossKey] ?? lootBosses.necrolune;

  return new ModalBuilder()
    .setCustomId(`loot-paste:${bossKey}:${position}`)
    .setTitle(`Colar loot do ${boss.label}`)
    .addComponents(
      new ActionRowBuilder().addComponents(
        createTextInput(
          "lootLeft",
          `Loot ${leftName}`.slice(0, 45),
          "3 silver tokens, 3 nocturnia coins, 7 crystal coins...",
          false,
          TextInputStyle.Paragraph
        )
      ),
      new ActionRowBuilder().addComponents(
        createTextInput(
          "lootRight",
          `Loot ${rightName}`.slice(0, 45),
          "Cole aqui o loot do segundo jogador",
          false,
          TextInputStyle.Paragraph
        )
      )
    );
}

function normalizeLootText(value) {
  return value
    .toLowerCase()
    .replace(/['\u2019]/g, "")
    .replace(/\b(a|an)\b/g, " ")
    .replace(/[.,;:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCharacterName(value) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function getSaoPauloDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
    year: "numeric"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function parseLootTime(text) {
  const match = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);

  if (!match) {
    return null;
  }

  const [, hour, minute] = match;
  const dateKey = getSaoPauloDateKey();
  let parsedDate = new Date(`${dateKey}T${hour.padStart(2, "0")}:${minute}:00-03:00`);
  const now = new Date();

  if (parsedDate.getTime() - now.getTime() > 2 * 60 * 60 * 1000) {
    parsedDate = new Date(parsedDate.getTime() - 24 * 60 * 60 * 1000);
  }

  return parsedDate;
}

function getEarliestDate(dates) {
  const validDates = dates.filter(Boolean);

  if (!validDates.length) {
    return null;
  }

  return validDates.reduce((earliest, date) =>
    date.getTime() < earliest.getTime() ? date : earliest
  );
}

function getDropAliases(drop) {
  const item = drop.item;
  const aliases = [item, ...(drop.aliases ?? [])];

  if (item.endsWith("s")) {
    aliases.push(item.slice(0, -1));
  }

  if (!item.endsWith("s")) {
    aliases.push(`${item}s`);
  }

  return aliases;
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

function parseLootPaste(text, bossKey) {
  if (!text.trim()) {
    return [];
  }

  const boss = lootBosses[bossKey] ?? lootBosses.necrolune;
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
    const drop = boss.drops
      ? getKnownDropByItem(itemName, boss.drops)
      : getKnownDropByItem(itemName, necroluneDrops) ?? toGenericDrop(itemName);

    if (!drop || !Number.isInteger(quantity) || quantity <= 0) {
      continue;
    }

    totals.set(drop.id, {
      drop,
      quantity: (totals.get(drop.id)?.quantity ?? 0) + quantity
    });
  }

  return Array.from(totals.values());
}

function parsePosition(value) {
  const position = Number.parseInt(value, 10);
  return Number.isInteger(position) && position > 0 ? position : null;
}

function formatAllTimeLootTotalsByPlayer(players) {
  const totalsByPlayer = getPlayerLootTotals(players);
  const lines = ["**Total de drops de todos os dias por jogador**"];

  for (const entry of totalsByPlayer) {
    lines.push(`**${entry.player} total**`);

    if (!entry.totals.length) {
      lines.push("- Nenhum drop registrado.");
      continue;
    }

    lines.push(...entry.totals.slice(0, 25).map((total) => `- ${total.item}: ${total.quantity}x`));
  }

  return lines.join("\n");
}

function getCharacterOwner(character) {
  const normalizedCharacter = normalizeCharacterName(character);

  return playerCharacters.find((group) =>
    group.characters.some((knownCharacter) =>
      normalizeCharacterName(knownCharacter) === normalizedCharacter
    )
  ) ?? null;
}

function formatAllTimeLootTotalsByOwner(characters) {
  const owners = [];
  const seenOwners = new Set();

  for (const character of characters) {
    const owner = getCharacterOwner(character);

    if (!owner || seenOwners.has(owner.owner)) {
      continue;
    }

    owners.push(owner);
    seenOwners.add(owner.owner);
  }

  if (!owners.length) {
    return formatAllTimeLootTotalsByPlayer(characters);
  }

  const lines = ["**Total de loot de todos os dias por dono**"];
  const characterTotals = getPlayerLootTotals(owners.flatMap((owner) => owner.characters));

  for (const owner of owners) {
    const totals = new Map();
    const ownerCharacters = new Set(owner.characters.map(normalizeCharacterName));

    for (const character of characterTotals) {
      if (!ownerCharacters.has(normalizeCharacterName(character.player))) {
        continue;
      }

      for (const total of character.totals) {
        const current = totals.get(total.item) ?? {
          item: total.item,
          quantity: 0
        };

        current.quantity += total.quantity;
        totals.set(total.item, current);
      }
    }

    const sortedTotals = Array.from(totals.values()).sort((a, b) => b.quantity - a.quantity);
    lines.push(`**${owner.owner} total**`);

    if (!sortedTotals.length) {
      lines.push("- Nenhum drop registrado.");
      continue;
    }

    lines.push(...sortedTotals.slice(0, 25).map((total) => `- ${total.item}: ${total.quantity}x`));
  }

  return lines.join("\n");
}

function formatAllOwnerLootTotals() {
  return formatAllTimeLootTotalsByOwner(
    playerCharacters.flatMap((group) => group.characters)
  );
}

function formatItemLootStats(itemName) {
  const drop = getNecroluneDropByItem(itemName);
  const stats = getItemLootStats(drop?.item ?? itemName);

  if (!stats.total) {
    return `Nenhum drop encontrado para **${itemName}**.`;
  }

  const lines = stats.players.map((entry, index) =>
    `${index + 1}. **${entry.player}**: ${entry.quantity}x`
  );

  return `**${stats.item}**\nTotal: **${stats.total}x**\n\n${lines.join("\n")}`;
}

function formatCharacterLootTotals() {
  const characters = getCharacterLootTotals();

  if (!characters.length) {
    return "Ainda nao tem drops registrados.";
  }

  const lines = characters.flatMap((character) => [
    `**${character.player}**`,
    ...character.totals.slice(0, 25).map((total) => `- ${total.item}: ${total.quantity}x`)
  ]);

  return `**Total por character**\n${lines.join("\n")}`;
}

function formatUndoLootResult(removedDrops) {
  if (!removedDrops?.length) {
    return "Nao tem loot salvo para desfazer.";
  }

  const lines = removedDrops.map((drop) =>
    `- ${drop.player}: ${drop.quantity}x ${drop.item}`
  );

  return `Ultimo loot removido:\n${lines.join("\n")}`;
}

function getReadyDuos(duos) {
  const now = Date.now();

  return duos
    .map((duo, index) => ({ ...duo, position: index + 1 }))
    .filter((duo) => !duo.cooldownUntil || new Date(duo.cooldownUntil).getTime() <= now);
}

function getCooldownDuos(duos) {
  const now = Date.now();

  return duos
    .map((duo, index) => ({ ...duo, position: index + 1 }))
    .filter((duo) => duo.cooldownUntil && new Date(duo.cooldownUntil).getTime() > now);
}

function formatReadyDuos() {
  const ready = getReadyDuos(getDailyDuos());

  if (!ready.length) {
    return "Nenhum duo pronto agora.";
  }

  return `**Duos prontos**\n${ready
    .map((duo) => `${duo.position}. **${duo.left}** + **${duo.right}**`)
    .join("\n")}`;
}

function formatCooldownDuos() {
  const cooldowns = getCooldownDuos(getDailyDuos());

  if (!cooldowns.length) {
    return "Nenhum duo em cooldown agora.";
  }

  return `**Duos em cooldown**\n${cooldowns
    .map((duo) => `${duo.position}. **${duo.left}** + **${duo.right}** libera ${formatTime(duo.cooldownUntil)}`)
    .join("\n")}`;
}

async function sendPrivateError(interaction, content) {
  const response = {
    content,
    flags: MessageFlags.Ephemeral
  };

  if (interaction.deferred || interaction.replied) {
    await interaction.followUp(response).catch((error) => console.error(error));
    return;
  }

  await interaction.reply(response).catch((error) => console.error(error));
}

process.once("exit", (code) => {
  console.log(`Processo encerrado com codigo ${code}.`);
});

process.on("unhandledRejection", (error) => {
  console.error("Erro nao tratado:", error);
});

process.on("uncaughtException", (error) => {
  console.error("Excecao nao tratada:", error);
});

client.once("clientReady", () => {
  console.log(`Bot ligado como ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isStringSelectMenu()) {
    console.log(`Selecao recebida: ${interaction.customId}`);

    try {
      if (interaction.customId === "duo-action") {
        const action = interaction.values[0];

        if (action === "view") {
          await interaction.reply({
            content: trimDiscord(formatDailyDuos(getDailyDuos())),
            components: createDuoPanelComponents(),
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        if (action === "send") {
          const duos = resetDailyDuos();
          await interaction.reply({
            content: trimDiscord(formatDailyDuos(duos)),
            components: createDuoPanelComponents()
          });
          return;
        }

        if (action === "clear") {
          const duos = clearDailyDuos();
          await interaction.reply({
            content: trimDiscord(`Lista limpa.\n\n${formatDailyDuos(duos)}`),
            components: createDuoPanelComponents()
          });
          return;
        }

        if (action === "clear-loots") {
          await interaction.showModal(createClearLootsModal());
          return;
        }

        if (action === "loot-total") {
          await interaction.reply({
            content: trimDiscord(formatAllOwnerLootTotals()),
            components: createDuoPanelComponents()
          });
          return;
        }

        if (action === "loot-chars") {
          await interaction.reply({
            content: trimDiscord(formatCharacterLootTotals()),
            components: createDuoPanelComponents()
          });
          return;
        }

        if (action === "undo-loot") {
          await interaction.reply({
            content: trimDiscord(formatUndoLootResult(undoLastLoot())),
            components: createDuoPanelComponents()
          });
          return;
        }

        if (action === "duo-ready") {
          await interaction.reply({
            content: trimDiscord(formatReadyDuos()),
            components: createDuoPanelComponents()
          });
          return;
        }

        if (action === "duo-cooldown") {
          await interaction.reply({
            content: trimDiscord(formatCooldownDuos()),
            components: createDuoPanelComponents()
          });
          return;
        }

        await interaction.showModal(createDuoModal(action));
        return;
      }

      const [kind, positionText] = interaction.customId.split(":");

      const position = parsePosition(positionText);
      const selectedDrop = interaction.values[0];

      if (kind === "boss-loot" && position && lootBosses[selectedDrop]) {
        await interaction.showModal(createLootPasteModal(position, selectedDrop));
        return;
      }

      if (kind === "necrolune-drop" && position && selectedDrop === "paste") {
        await interaction.showModal(createLootPasteModal(position, "necrolune"));
        return;
      }
    } catch (error) {
      console.error(error);
      await sendPrivateError(interaction, "Deu erro ao escolher esse drop.");
    }
    return;
  }

  if (interaction.isModalSubmit()) {
    console.log(`Formulario recebido: ${interaction.customId}`);

    try {
      if (interaction.customId === "clear-loots") {
        await interaction.deferReply();

        const confirm = interaction.fields.getTextInputValue("confirm").trim().toUpperCase();

        if (confirm !== "LIMPAR") {
          await interaction.editReply("Limpeza cancelada. Para apagar, digite exatamente LIMPAR.");
          return;
        }

        clearAllDrops();
        await interaction.editReply({
          content: "Todos os loots foram apagados. Bosses e lista de duos foram mantidos.",
          components: createDuoPanelComponents()
        });
        return;
      }

      if (
        interaction.customId.startsWith("loot-paste:") ||
        interaction.customId.startsWith("necrolune-paste:")
      ) {
        await interaction.deferReply();

        const idParts = interaction.customId.split(":");
        const bossKey = idParts[0] === "loot-paste" ? idParts[1] : "necrolune";
        const positionText = idParts[0] === "loot-paste" ? idParts[2] : idParts[1];
        const boss = lootBosses[bossKey] ?? lootBosses.necrolune;
        const position = parsePosition(positionText);

        if (!position) {
          await interaction.editReply("Nao consegui identificar o duo dessa lista.");
          return;
        }

        const duo = getDailyDuos()[position - 1];
        const leftLootText = interaction.fields.getTextInputValue("lootLeft");
        const rightLootText = interaction.fields.getTextInputValue("lootRight");
        const lootTime = getEarliestDate([
          parseLootTime(leftLootText),
          parseLootTime(rightLootText)
        ]);
        const pastedLoots = [
          {
            player: duo?.left ?? `Jogador 1 do duo ${position}`,
            drops: parseLootPaste(leftLootText, bossKey)
          },
          {
            player: duo?.right ?? `Jogador 2 do duo ${position}`,
            drops: parseLootPaste(rightLootText, bossKey)
          }
        ].filter((entry) => entry.drops.length);

        if (!pastedLoots.length) {
          await interaction.editReply(
            `Nao reconheci nenhum drop do ${boss.label}. Cole pelo menos um loot em uma das caixas.`
          );
          return;
        }

        const saveResult = saveDuoLoot({
          position,
          bossName: boss.bossName,
          markedAt: lootTime,
          createdBy: interaction.user.tag,
          drops: pastedLoots.flatMap((pastedLoot) =>
            pastedLoot.drops.map(({ drop, quantity }) => ({
              player: pastedLoot.player,
              item: drop.item,
              quantity,
              value: 0,
              category: drop.category
            }))
          )
        });

        if (!saveResult) {
          await interaction.editReply(
            `Nao consegui salvar os drops porque nao encontrei o boss ${boss.label}.`
          );
          return;
        }

        const lines = pastedLoots.flatMap((pastedLoot) => [
          `**${pastedLoot.player}**`,
          ...pastedLoot.drops.map(({ drop, quantity }) => `- ${quantity}x ${drop.item}`)
        ]);
        const ownerTotals = formatAllTimeLootTotalsByOwner(
          pastedLoots.map((pastedLoot) => pastedLoot.player)
        );

        await interaction.editReply(
          {
            content: trimDiscord(
              `Drops salvos no ${boss.label} #${saveResult.boss.id}:\n${lines.join("\n")}` +
                `${saveResult.dailyDuos ? `\n\n${formatDailyDuos(saveResult.dailyDuos)}` : ""}` +
                `\n\n${ownerTotals}`
            ),
            components: createDuoPanelComponents()
          }
        );
        return;
      }

      const [, action] = interaction.customId.split(":");
      let duos = null;

      if (action === "add") {
        await interaction.deferReply();

        duos = addDailyDuo(
          interaction.fields.getTextInputValue("p1"),
          interaction.fields.getTextInputValue("p2")
        );
        await interaction.editReply({
          content: trimDiscord(`Duo adicionado.\n\n${formatDailyDuos(duos)}`),
          components: createDuoPanelComponents()
        });
        return;
      }

      const position = parsePosition(interaction.fields.getTextInputValue("n"));

      await interaction.deferReply();

      if (!position) {
        await interaction.editReply("Digite um numero valido da lista.");
        return;
      }

      if (action === "edit") {
        duos = editDailyDuo(
          position,
          interaction.fields.getTextInputValue("p1"),
          interaction.fields.getTextInputValue("p2")
        );
      }

      if (action === "remove") {
        duos = removeDailyDuo(position);
      }

      if (action === "done" || action === "fail") {
        duos = setDailyDuoStatus(position, action);
      }

      if (!duos) {
        await interaction.editReply("Nao encontrei esse numero na lista.");
        return;
      }

      const labels = {
        edit: `Duo ${position} editado.`,
        remove: `Duo ${position} removido.`,
        done: `Duo ${position} marcado como OK. Cooldown de 20h iniciado.`,
        fail: `Duo ${position} marcado como fail. Cooldown de 20h iniciado.`
      };
      await interaction.editReply({
        content: trimDiscord(`${labels[action]}\n\n${formatDailyDuos(duos)}`),
        components: action === "done"
          ? createBossLootComponents(position)
          : createDuoPanelComponents()
      });
    } catch (error) {
      console.error(error);
      await sendPrivateError(interaction, "Deu erro ao salvar esse formulario.");
    }
    return;
  }

  if (!interaction.isChatInputCommand()) {
    return;
  }

  console.log(`Comando recebido: /${interaction.commandName}`);

  try {
    if (interaction.commandName === "boss") {
      const subcommand = interaction.options.getSubcommand();

      if (subcommand === "novo") {
        const name = interaction.options.getString("nome", true);
        const number = interaction.options.getInteger("n") ?? null;
        const boss = createBoss({
          name,
          number,
          createdBy: interaction.user.tag
        });

        await interaction.reply(
          `Boss criado: **#${boss.id} - ${boss.name}${boss.number ? ` ${boss.number}` : ""}**`
        );
        return;
      }

      if (subcommand === "lista") {
        const bosses = listBosses();
        const text = bosses.length
          ? bosses
              .map((boss) => {
                const label = boss.number ? `${boss.name} ${boss.number}` : boss.name;
                return `#${boss.id} | ${formatDate(boss.createdAt)} | ${label}`;
              })
              .join("\n")
          : "Ainda nao tem boss registrado.";

        await interaction.reply(`**Bosses recentes**\n${text}`);
        return;
      }

      if (subcommand === "ver") {
        const bossId = interaction.options.getInteger("id", true);
        const summary = getBossSummary(bossId);

        if (!summary) {
          await interaction.reply({
            content: "Nao encontrei esse boss. Use `/boss lista` para ver os IDs.",
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        const dropLines = summary.drops.length
          ? summary.drops.map((drop) => {
              const total = drop.quantity * drop.value;
              return `- ${drop.category}: ${drop.player} - ${drop.quantity}x ${drop.item} (${formatGold(total)})`;
            })
          : ["Sem drops registrados ainda."];

        const label = summary.boss.number
          ? `${summary.boss.name} ${summary.boss.number}`
          : summary.boss.name;

        await interaction.reply(
          trimDiscord(
            `**Resumo do boss #${summary.boss.id} - ${label}**\n` +
              `${dropLines.join("\n")}\n\n` +
              `**Lucro geral:** ${formatGold(summary.total)}`
          )
        );
        return;
      }
    }

    if (interaction.commandName === "drop") {
      const drop = addDrop({
        bossId: interaction.options.getInteger("id", true),
        player: interaction.options.getString("jogador", true),
        item: interaction.options.getString("item", true),
        quantity: interaction.options.getInteger("qtd") ?? 1,
        value: interaction.options.getNumber("valor") ?? 0,
        category: interaction.options.getString("tipo") ?? "Loot",
        createdBy: interaction.user.tag
      });

      if (!drop) {
        await interaction.reply({
          content: "Nao encontrei esse boss. Use `/boss lista` para ver os IDs.",
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      await interaction.reply(
        `Drop salvo: **${drop.player}** pegou **${drop.quantity}x ${drop.item}** no boss **#${drop.bossId}**. Total: **${formatGold(drop.quantity * drop.value)}**`
      );
      return;
    }

    if (interaction.commandName === "loot") {
      const subcommand = interaction.options.getSubcommand();

      if (subcommand === "geral") {
        const totals = getLootTotals();
        const text = totals.length
          ? totals
              .slice(0, 25)
              .map((entry) => `- ${entry.item}: ${entry.quantity}x | ${formatGold(entry.value)}`)
              .join("\n")
          : "Ainda nao tem drops registrados.";

        await interaction.reply(trimDiscord(`**Loot geral**\n${text}`));
        return;
      }

      if (subcommand === "item") {
        await interaction.reply(
          trimDiscord(formatItemLootStats(interaction.options.getString("nome", true)))
        );
        return;
      }

      if (subcommand === "chars") {
        await interaction.reply(trimDiscord(formatCharacterLootTotals()));
        return;
      }

      if (subcommand === "desfazer") {
        await interaction.reply(trimDiscord(formatUndoLootResult(undoLastLoot())));
        return;
      }
    }

    if (interaction.commandName === "stacks") {
      const totals = getPlayerStacks();
      const text = totals.length
        ? totals
            .map((entry) => `- ${entry.player}: ${entry.drops} drops | ${formatGold(entry.value)}`)
            .join("\n")
        : "Ainda nao tem drops registrados.";

      await interaction.reply(trimDiscord(`**Stacks por jogador**\n${text}`));
      return;
    }

    if (interaction.commandName === "painel") {
      await interaction.reply({
        content: "**Painel de duos**\nUse o menu abaixo para mexer na lista sem digitar comandos longos.",
        components: createDuoPanelComponents()
      });
      return;
    }

    if (interaction.commandName === "duo") {
      const group = interaction.options.getSubcommandGroup();
      const subcommand = interaction.options.getSubcommand();

      if (group === "lista" && subcommand === "ver") {
        const duos = getDailyDuos();
        await interaction.reply({
          content: trimDiscord(formatDailyDuos(duos)),
          components: createDuoPanelComponents()
        });
        return;
      }

      if (group === "lista" && subcommand === "enviar") {
        const duos = resetDailyDuos();
        await interaction.reply({
          content: trimDiscord(formatDailyDuos(duos)),
          components: createDuoPanelComponents()
        });
        return;
      }

      if (group === "lista" && subcommand === "prontos") {
        await interaction.reply({
          content: trimDiscord(formatReadyDuos()),
          components: createDuoPanelComponents()
        });
        return;
      }

      if (group === "lista" && subcommand === "cooldown") {
        await interaction.reply({
          content: trimDiscord(formatCooldownDuos()),
          components: createDuoPanelComponents()
        });
        return;
      }

      if (group === "editar" && subcommand === "add") {
        const duos = addDailyDuo(
          interaction.options.getString("p1", true),
          interaction.options.getString("p2", true)
        );
        await interaction.reply({
          content: trimDiscord(`Duo adicionado.\n\n${formatDailyDuos(duos)}`),
          components: createDuoPanelComponents()
        });
        return;
      }

      if (group === "editar" && subcommand === "alterar") {
        const position = interaction.options.getInteger("n", true);
        const duos = editDailyDuo(
          position,
          interaction.options.getString("p1", true),
          interaction.options.getString("p2", true)
        );

        if (!duos) {
          await interaction.reply({
            content: "Nao encontrei esse numero na lista. Use `/duo lista ver` para conferir.",
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        await interaction.reply({
          content: trimDiscord(`Duo ${position} editado.\n\n${formatDailyDuos(duos)}`),
          components: createDuoPanelComponents()
        });
        return;
      }

      if (group === "editar" && subcommand === "remover") {
        const position = interaction.options.getInteger("n", true);
        const duos = removeDailyDuo(position);

        if (!duos) {
          await interaction.reply({
            content: "Nao encontrei esse numero na lista. Use `/duo lista ver` para conferir.",
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        await interaction.reply({
          content: trimDiscord(`Duo ${position} removido.\n\n${formatDailyDuos(duos)}`),
          components: createDuoPanelComponents()
        });
        return;
      }

      if (group === "status" && (subcommand === "done" || subcommand === "fail")) {
        const position = interaction.options.getInteger("n", true);
        const duos = setDailyDuoStatus(position, subcommand);

        if (!duos) {
          await interaction.reply({
            content: "Nao encontrei esse numero na lista. Use `/duo lista ver` para conferir.",
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        const label = subcommand === "done" ? "concluido" : "marcado como fail";
        await interaction.reply({
          content: trimDiscord(`Duo ${position} ${label}. Cooldown de 20h iniciado.\n\n${formatDailyDuos(duos)}`),
          components: subcommand === "done"
            ? createBossLootComponents(position)
            : createDuoPanelComponents()
        });
        return;
      }

      if (group === "editar" && subcommand === "limpar") {
        const duos = clearDailyDuos();
        await interaction.reply({
          content: trimDiscord(`Lista limpa.\n\n${formatDailyDuos(duos)}`),
          components: createDuoPanelComponents()
        });
        return;
      }
    }
  } catch (error) {
    console.error(error);
    await sendPrivateError(
      interaction,
      "Deu erro ao executar esse comando. Veja o log do bot para detalhes."
    );
  }
});

client.login(process.env.DISCORD_TOKEN).catch((error) => {
  explainLoginError(error);
  process.exit(1);
});
