require("dotenv").config();

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  GatewayIntentBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");
const commands = require("./commands");
const { explainLoginError, requireEnv, warnUnsupportedNode } = require("./env");
const {
  addDailyDuo,
  addDrop,
  clearDailyDuos,
  createBoss,
  editDailyDuo,
  getBossSummary,
  getDailyDuos,
  getLootTotals,
  getPlayerStacks,
  listBosses,
  removeDailyDuo,
  resetDailyDuos,
  setDailyDuoStatus
} = require("./storage");
const { formatDailyDuos, formatDate, formatGold, trimDiscord } = require("./format");

warnUnsupportedNode();
requireEnv(["DISCORD_TOKEN"]);

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

function createDuoPanelComponents() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("duo:view")
        .setLabel("Ver lista")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("duo:send")
        .setLabel("Enviar limpa")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("duo:add")
        .setLabel("Adicionar")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("duo:edit")
        .setLabel("Editar")
        .setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("duo:done")
        .setLabel("Marcar OK")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("duo:fail")
        .setLabel("Marcar fail")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("duo:remove")
        .setLabel("Remover")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("duo:clear")
        .setLabel("Limpar")
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

function createTextInput(id, label, placeholder, required = true) {
  return new TextInputBuilder()
    .setCustomId(id)
    .setLabel(label)
    .setPlaceholder(placeholder)
    .setStyle(TextInputStyle.Short)
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

function parsePosition(value) {
  const position = Number.parseInt(value, 10);
  return Number.isInteger(position) && position > 0 ? position : null;
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
  if (interaction.isButton()) {
    console.log(`Botao recebido: ${interaction.customId}`);

    try {
      const [, action] = interaction.customId.split(":");

      if (action === "view") {
        await interaction.reply({
          content: trimDiscord(formatDailyDuos(getDailyDuos())),
          components: createDuoPanelComponents(),
          ephemeral: true
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

      await interaction.showModal(createDuoModal(action));
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "Deu erro ao usar esse botao.",
        ephemeral: true
      }).catch((replyError) => console.error(replyError));
    }
    return;
  }

  if (interaction.isModalSubmit()) {
    console.log(`Formulario recebido: ${interaction.customId}`);

    try {
      const [, action] = interaction.customId.split(":");
      let duos = null;

      if (action === "add") {
        duos = addDailyDuo(
          interaction.fields.getTextInputValue("p1"),
          interaction.fields.getTextInputValue("p2")
        );
        await interaction.reply({
          content: trimDiscord(`Duo adicionado.\n\n${formatDailyDuos(duos)}`),
          components: createDuoPanelComponents()
        });
        return;
      }

      const position = parsePosition(interaction.fields.getTextInputValue("n"));

      if (!position) {
        await interaction.reply({
          content: "Digite um numero valido da lista.",
          ephemeral: true
        });
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
        await interaction.reply({
          content: "Nao encontrei esse numero na lista.",
          ephemeral: true
        });
        return;
      }

      const labels = {
        edit: `Duo ${position} editado.`,
        remove: `Duo ${position} removido.`,
        done: `Duo ${position} marcado como OK. Cooldown de 20h iniciado.`,
        fail: `Duo ${position} marcado como fail. Cooldown de 20h iniciado.`
      };
      await interaction.reply({
        content: trimDiscord(`${labels[action]}\n\n${formatDailyDuos(duos)}`),
        components: createDuoPanelComponents()
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "Deu erro ao salvar esse formulario.",
        ephemeral: true
      }).catch((replyError) => console.error(replyError));
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
            ephemeral: true
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
          ephemeral: true
        });
        return;
      }

      await interaction.reply(
        `Drop salvo: **${drop.player}** pegou **${drop.quantity}x ${drop.item}** no boss **#${drop.bossId}**. Total: **${formatGold(drop.quantity * drop.value)}**`
      );
      return;
    }

    if (interaction.commandName === "loot") {
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
        content: "**Painel de duos**\nUse os botoes abaixo para mexer na lista sem digitar comandos longos.",
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
            ephemeral: true
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
            ephemeral: true
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
            ephemeral: true
          });
          return;
        }

        const label = subcommand === "done" ? "concluido" : "marcado como fail";
        await interaction.reply({
          content: trimDiscord(`Duo ${position} ${label}. Cooldown de 20h iniciado.\n\n${formatDailyDuos(duos)}`),
          components: createDuoPanelComponents()
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
    const response = {
      content: "Deu erro ao executar esse comando. Veja o log do bot para detalhes.",
      ephemeral: true
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(response).catch((followUpError) => console.error(followUpError));
    } else {
      await interaction.reply(response).catch((replyError) => console.error(replyError));
    }
  }
});

client.login(process.env.DISCORD_TOKEN).catch((error) => {
  explainLoginError(error);
  process.exit(1);
});
