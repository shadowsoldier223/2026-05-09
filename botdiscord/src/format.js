function formatGold(value) {
  return `${Math.round(value).toLocaleString("pt-BR")} gp`;
}

function formatDate(isoDate) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: "America/Sao_Paulo"
  }).format(new Date(isoDate));
}

function formatTime(isoDate) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Sao_Paulo"
  }).format(new Date(isoDate));
}

function trimDiscord(text, max = 1900) {
  if (text.length <= max) {
    return text;
  }

  return `${text.slice(0, max - 20)}\n...`;
}

function formatDailyDuos(duos) {
  const header = `**Duos diarios - ${formatDate(new Date().toISOString())}**`;

  if (!duos.length) {
    return `${header}\n\nNenhum duo cadastrado.`;
  }

  const lines = duos.map((duo, index) => {
    const status = {
      done: "✅",
      fail: "❌"
    }[duo.status] ?? "";
    const markedAt = duo.markedAt ? ` ${formatTime(duo.markedAt)}` : "";
    const cooldown = duo.cooldownUntil ? ` // ${formatTime(duo.cooldownUntil)}` : "";

    return `${index + 1}. **${duo.left}** + **${duo.right}** ${status}${markedAt}${cooldown}`.trim();
  });

  return `${header}\n\n${lines.join("\n")}`;
}

module.exports = {
  formatDailyDuos,
  formatDate,
  formatGold,
  formatTime,
  trimDiscord
};
