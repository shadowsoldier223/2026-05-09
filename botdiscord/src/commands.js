const { SlashCommandBuilder } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("boss")
    .setDescription("Gerencia bosses.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("novo")
        .setDescription("Cria um boss.")
        .addStringOption((option) =>
          option
            .setName("nome")
            .setDescription("Nome do boss.")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("n")
            .setDescription("Numero da run.")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("lista")
        .setDescription("Mostra os ultimos bosses.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("ver")
        .setDescription("Mostra drops e lucro de um boss.")
        .addIntegerOption((option) =>
          option
            .setName("id")
            .setDescription("ID do boss.")
            .setRequired(true)
        )
    ),

  new SlashCommandBuilder()
    .setName("drop")
    .setDescription("Registra drops.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Adiciona um drop.")
        .addIntegerOption((option) =>
          option
            .setName("id")
            .setDescription("ID do boss.")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("jogador")
            .setDescription("Quem pegou.")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("item")
            .setDescription("Nome do item.")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("qtd")
            .setDescription("Quantidade.")
            .setRequired(false)
            .setMinValue(1)
        )
        .addNumberOption((option) =>
          option
            .setName("valor")
            .setDescription("Valor unitario em gold.")
            .setRequired(false)
            .setMinValue(0)
        )
        .addStringOption((option) =>
          option
            .setName("tipo")
            .setDescription("Bag, Scroll 3, Scroll 5, Loot...")
            .setRequired(false)
            .addChoices(
              { name: "Bag", value: "Bag You Covet" },
              { name: "Scroll 3", value: "Scroll 3pts" },
              { name: "Scroll 5", value: "Scroll 5pts" },
              { name: "Scroll 9", value: "Scroll 9pts" },
              { name: "Scroll 13", value: "Scroll 13pts" },
              { name: "Scroll 20", value: "Scroll 20pts" },
              { name: "Loot", value: "Loot" }
            )
        )
    ),

  new SlashCommandBuilder()
    .setName("loot")
    .setDescription("Consulta e corrige loots.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("geral")
        .setDescription("Mostra o total de drops por item.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("item")
        .setDescription("Mostra quem dropou mais um item.")
        .addStringOption((option) =>
          option
            .setName("nome")
            .setDescription("Nome do item.")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("chars")
        .setDescription("Mostra o total de loot por character.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("desfazer")
        .setDescription("Remove o ultimo loot salvo.")
    ),

  new SlashCommandBuilder()
    .setName("stacks")
    .setDescription("Mostra drops por jogador."),

  new SlashCommandBuilder()
    .setName("painel")
    .setDescription("Abre o painel de menu dos duos."),

  new SlashCommandBuilder()
    .setName("duo")
    .setDescription("Gerencia a lista diaria de duos.")
    .addSubcommandGroup((group) =>
      group
        .setName("lista")
        .setDescription("Ver, enviar e configurar a lista.")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("ver")
            .setDescription("Mostra a lista diaria de duos.")
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("enviar")
            .setDescription("Envia a lista diaria agora.")
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("prontos")
            .setDescription("Mostra os duos que ja sairam do cooldown.")
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("cooldown")
            .setDescription("Mostra os duos ainda em cooldown.")
        )
    )
    .addSubcommandGroup((group) =>
      group
        .setName("editar")
        .setDescription("Adicionar, alterar ou remover duos.")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("add")
            .setDescription("Adiciona um duo.")
            .addStringOption((option) =>
              option
                .setName("p1")
                .setDescription("Primeiro jogador.")
                .setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("p2")
                .setDescription("Segundo jogador.")
                .setRequired(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("alterar")
            .setDescription("Edita um duo pelo numero da lista.")
            .addIntegerOption((option) =>
              option
                .setName("n")
                .setDescription("Numero do duo.")
                .setRequired(true)
                .setMinValue(1)
            )
            .addStringOption((option) =>
              option
                .setName("p1")
                .setDescription("Primeiro jogador.")
                .setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("p2")
                .setDescription("Segundo jogador.")
                .setRequired(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("remover")
            .setDescription("Remove um duo pelo numero da lista.")
            .addIntegerOption((option) =>
              option
                .setName("n")
                .setDescription("Numero do duo.")
                .setRequired(true)
                .setMinValue(1)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("limpar")
            .setDescription("Remove todos os duos.")
        )
    )
    .addSubcommandGroup((group) =>
      group
        .setName("status")
        .setDescription("Marcar duos como feitos ou falhados.")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("done")
            .setDescription("Marca um duo como concluido.")
            .addIntegerOption((option) =>
              option
                .setName("n")
                .setDescription("Numero do duo.")
                .setRequired(true)
                .setMinValue(1)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("fail")
            .setDescription("Marca um duo como falhou.")
            .addIntegerOption((option) =>
              option
                .setName("n")
                .setDescription("Numero do duo.")
                .setRequired(true)
                .setMinValue(1)
            )
        )
    )
];

module.exports = commands;
