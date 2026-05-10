function warnUnsupportedNode() {
  const major = Number(process.versions.node.split(".")[0]);

  if (major >= 24) {
    console.warn(
      "Aviso: voce esta usando Node.js 24. Para este bot, use Node.js 22 LTS para evitar erros no Windows."
    );
  }
}

function requireEnv(names) {
  const missing = names.filter((name) => !process.env[name]);

  if (missing.length) {
    throw new Error(`Configure no .env: ${missing.join(", ")}`);
  }
}

function explainLoginError(error) {
  if (error?.code === 50001 || error?.status === 403) {
    console.error(
      [
        "O Discord aceitou o token, mas o bot nao tem acesso a esse servidor.",
        "",
        "Convide o bot para o servidor usando um link com os escopos:",
        "- bot",
        "- applications.commands",
        "",
        "Depois rode npm run deploy novamente."
      ].join("\n")
    );
    return;
  }

  if (error?.code === "TokenInvalid" || error?.status === 401) {
    console.error(
      [
        "Token do Discord invalido ou nao autorizado.",
        "",
        "Confira o arquivo .env:",
        "- DISCORD_TOKEN precisa ser o token da aba Bot no Discord Developer Portal.",
        "- O token precisa ser da mesma aplicacao informada em CLIENT_ID.",
        "- Nao use Client Secret, Public Key, Application ID ou Guild ID nesse campo.",
        "- Nao coloque a palavra Bot antes do token.",
        "- Se voce resetou o token no portal, cole o token novo e salve o .env."
      ].join("\n")
    );
    return;
  }

  console.error(error);
}

module.exports = {
  explainLoginError,
  requireEnv,
  warnUnsupportedNode
};
