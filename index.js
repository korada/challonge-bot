require('dotenv').config();

const express = require('express');
const expressApp = express();

const challonge = require('challonge');
const TelegramBotApi = require('node-telegram-bot-api');
const BotMessages = require('./helpers/messages');

const Matches = require('./helpers/matches')
const Players = require('./helpers/players')

const API_TOKEN = process.env.telegram_bot_key;
const PORT = process.env.PORT

const client = challonge.createClient({
  apiKey: process.env.challonge_api_key
});

const matchHelper = new Matches(client)
const playersHelper = new Players(client)

const bot = new TelegramBotApi(API_TOKEN, { polling: true });
const botMessages = new BotMessages(bot);

bot.onText(/\/start/, (msg) => {
  botMessages.mainMenu(msg);
});

bot.onText(/\/table/, async (msg) => {
  // implement me
  // step 1 - get players
  const players = await playersHelper.getPlayers();
  const playerDetails = playersHelper.buildPlayerDetails(players);
  // step 2 - get matches
  const matches = await matchHelper.getMatches();
  // step 3 - mashup info
  const table = matchHelper.getTable(matches, playerDetails);
  const sortedTable = matchHelper.sortTable(table);
  const longestNameLength = playersHelper.findLongestNameLength(sortedTable);
  const formattedTable = matchHelper.formatTable(sortedTable, longestNameLength);
  bot.sendMessage(msg.chat.id, formattedTable)
});

bot.onText(/\/results/, async (msg) => {
  // implement me
  const tournament = await matchHelper.getTournament();
  let result = "";
  if (!matchHelper.isTournamentCompleted(tournament)) {
    result = "``` " + process.env.incomplete_msg + " ```";
  }
  else {
    // step 1 - get players
    const players = await playersHelper.getPlayers();
    const playerDetails = playersHelper.buildPlayerDetails(players);
    // step 2 - get matches
    const matches = await matchHelper.getMatches();

    // step 3 - mashup info
    const table = matchHelper.getTable(matches, playerDetails);
    const sortedTable = matchHelper.sortTable(table);
    //const longestNameLength = findLongestNameLength(sortedTable);
    result = matchHelper.getChampions(sortedTable);
  }
  bot.sendMessage(msg.chat.id, result);
});

bot.onText(/\/next/, async (msg) => {
  // implement me
  // step 1 - get players
  const players = await playersHelper.getPlayers();
  const matches = await matchHelper.getMatches();

  // step 3 - mashup info
  const upcomingGames = matchHelper.getFixtures(players, matches);
  const formattedFixtures = matchHelper.formatFixtures(upcomingGames);
  bot.sendMessage(msg.chat.id, formattedFixtures);
});

bot.onText(/\/update/, async (msg) => {
  const fixturesForUpdate = await matchHelper.getFixturesForUpdate();
  const formattedKeyboard = fixturesForUpdate.map(a => {
    return [{ 'text': a.key }]
  });
  botMessages.updateScoreKeyboard(msg, formattedKeyboard)
});

const scores = {}

bot.onText(/(\(H\))/, (msg) => {
  if (!scores[msg.chat.id]) {
    scores[msg.chat.id] = { home: "", away: "", step: "home", game: msg.text };
    botMessages.homeScoreKeyboard(msg, msg.text);
  } else {
  }
});


bot.on('callback_query', async (msg) => {
  try {
    bot.answerCallbackQuery(msg.id);
    let score = scores[msg.message.chat.id];
    if (msg.data === 'nvm') {
      scores[msg.message.chat.id] = null;
      botMessages.removeInlineKeyboard(msg.message);
      botMessages.mainMenu(msg.message);
      return;
    }
    if (msg.data != 'update') {
      if (score.step === "home") {
        score.home = score.home + msg.data;
      } else {
        score.away = score.away + msg.data;
      }
    }
    else {
      if (score.step === "home") {
        score.step = "away";
        botMessages.removeInlineKeyboard(msg.message);
        botMessages.awayScoreKeyboard(msg.message, score.game);
      }
      else if (score.step === "away") {
        let games = await (await matchHelper.getFixturesForUpdate()).map(a => {
          if (a.key === score.game) {
            return a
          }
        });
        await matchHelper.updateScore(games[0].value, score.home, score.away, games[0].homeId, games[0].awayId);
        delete scores[msg.message.chat.id];
        botMessages.removeInlineKeyboard(msg.message);
        botMessages.updatedScoreMessage(msg.message);
      }
    }
  }
  catch (ex) {
    console.log(ex)
  }
})

// and at the end just start server on PORT
expressApp.get('/', (req, res) => {
  res.send('Hello World!');
});
expressApp.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
