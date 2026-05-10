# Bot de Boss e Drops para Discord

Esse bot registra bosses feitos com seus amigos, marca drops por jogador e calcula o lucro geral.

## Como usar

1. Instale o Node.js 22 LTS.
2. Copie `.env.example` para `.env`.
3. Preencha:
   - `DISCORD_TOKEN`: token secreto do bot.
   - `CLIENT_ID`: ID da aplicacao no Discord Developer Portal.
   - `GUILD_ID`: ID do seu servidor.
4. Instale as dependencias:

```bash
npm install
```

5. Registre os comandos no servidor:

```bash
npm run deploy
```

6. Ligue o bot:

```bash
npm start
```

Deixe essa janela aberta. Se voce fechar, o bot desliga.

## Link de convite

Antes de rodar `npm run deploy`, o bot precisa estar no servidor. Use este modelo de link, trocando `CLIENT_ID` pelo ID da sua aplicacao:

```text
https://discord.com/oauth2/authorize?client_id=CLIENT_ID&permissions=2048&integration_type=0&scope=bot+applications.commands
```

Para este projeto, com o `CLIENT_ID` atual:

```text
https://discord.com/oauth2/authorize?client_id=1502842729124597820&permissions=2048&integration_type=0&scope=bot+applications.commands
```

## Comandos

- `/boss novo nome n` cria um boss.
- `/boss lista` mostra os bosses recentes.
- `/boss ver id` mostra os drops e lucro de um boss.
- `/drop add id jogador item qtd valor tipo` adiciona um drop.
- `/loot` mostra o total de drops por item.
- `/stacks` mostra quantos drops cada jogador pegou.

Esses comandos sao usados dentro do Discord, no chat do servidor onde o bot foi adicionado. Eles nao rodam no bash/terminal.

Exemplos:

```text
/boss novo nome:Necrolune n:1
/drop add id:1 jogador:Andre item:Sanguine Cudgel qtd:1 valor:5000000 tipo:Bag
/boss ver id:1
/loot
/stacks
```

No `/drop add`, `qtd`, `valor` e `tipo` sao opcionais. Se voce nao preencher `qtd`, o bot usa `1`. Se nao preencher `valor`, ele usa `0`.

## Duos

Use o painel com menu:

```text
/painel
```

Ele abre um menu para ver, enviar, adicionar, editar, remover, limpar, marcar OK e marcar fail.

Tambem da para usar os comandos manuais:

```text
/duo lista ver
/duo lista enviar
/duo editar add p1:Andre p2:Max
/duo editar alterar n:2 p1:Eligos p2:Malvadinho
/duo editar remover n:3
/duo status done n:2
/duo status fail n:2
/duo editar limpar
```

Quando voce usa `/duo status done` ou `/duo status fail`, o bot mostra o horario marcado e o horario em que o cooldown de 20h acaba:

```text
1. Wanius Zack + Magic Max
2. Eligos + Malvadinho OK 22:53 // 18:53
3. Durg Tyre + billy jhin FAIL 22:55 // 18:55
```

A lista cadastrada atualmente e:

```text
1. Wanius Zack + Magic Max
2. Eligos + Malvadinho
3. Durg Tyre + billy jhin
4. mr ice + imfellel ///// obelisk
5. Brezzley + Hunting
6. Dente + Mr ice
7. Sodreh Indignado + Ze Elite
8. Jonas Rushful + hekate
9. Doutor + Nino rox
10. Larvae + Dantas Ishigo
```

Quando voce usa `/duo lista enviar`, o bot limpa as marcacoes antigas antes de enviar a lista.

## Como editar os comandos

Os nomes e campos dos comandos ficam em `src/commands.js`.

O que cada comando faz fica em `src/index.js`.

Depois de editar qualquer comando, rode:

```bash
npm run deploy
```

Depois ligue o bot de novo:

```bash
npm start
```

## Problemas comuns

Se aparecer um erro parecido com `Assertion failed` usando Node.js 24 no Windows, instale o Node.js 22 LTS e tente de novo. O Node 24 pode dar incompatibilidade nesse ambiente.

Se aparecer `TokenInvalid`, o valor em `DISCORD_TOKEN` nao e o token correto do bot. No Discord Developer Portal, abra sua aplicacao, va em `Bot`, clique em `Reset Token` ou `Copy Token`, e cole esse valor no `.env`. Nao use `Client Secret`, `Public Key`, `Application ID`, nem coloque `Bot ` antes do token.

Se aparecer `Missing Access`, o token esta funcionando, mas o bot ainda nao esta no servidor informado em `GUILD_ID`, ou foi convidado sem o escopo `applications.commands`. Convide o bot de novo usando o link acima.
