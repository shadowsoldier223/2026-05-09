require("dotenv").config();

const { REST, Routes } = require("discord.js");
const commands = require("../src/commands");
const { explainLoginError, requireEnv, warnUnsupportedNode } = require("../src/env");

warnUnsupportedNode();
requireEnv(["DISCORD_TOKEN", "CLIENT_ID", "GUILD_ID"]);

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

async function main() {
  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands.map((command) => command.toJSON()) }
  );

  console.log("Comandos registrados no servidor.");
}

main().catch((error) => {
  explainLoginError(error);
  process.exitCode = 1;
});
