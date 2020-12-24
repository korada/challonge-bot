const TelegramBotApi = require('node-telegram-bot-api');
const mainMenu = {
    "reply_keyboard": {
        "keyboard": [[{ 'text': '/table' }],
        [{ 'text': '/next' }],
        [{ 'text': '/results' }],
        [{ 'text': '/update' }]],
        "selective": true
    }
}



class BotMessages {
    constructor(bot) {
        this.bot = bot;
    }

    mainMenu(msg) {
        this.bot.sendMessage(msg.chat.id, "Challonge Menu", {
            reply_to_message_id: msg.id,
            reply_markup: mainMenu
        });
    }

    scoreKeyboard(msg, text) {
        this.bot.sendMessage(msg.chat.id, text, {
            reply_to_message_id: msg.id,
            "reply_markup": {
                "inline_keyboard": [[{ 'text': '1', 'callback_data': '1' }, { 'text': '2', 'callback_data': '2' }, { 'text': '3', 'callback_data': '3' },],
                [{ 'text': '4', 'callback_data': '4' }, { 'text': '5', 'callback_data': '5' }, { 'text': '6', 'callback_data': '6' }],
                [{ 'text': '7', 'callback_data': '7' }, { 'text': '8', 'callback_data': '8' }, { 'text': '9', 'callback_data': '9' }],
                [{ 'text': '0', 'callback_data': '0' }, { 'text': 'update', 'callback_data': 'update' }, { 'text': 'nvm', 'callback_data': 'nvm' }]]
            }
        });
    }

    homeScoreKeyboard(msg, game) {
        let player = game.split(':')[0];
        this.scoreKeyboard(msg, `Enter ${player} Game Score`);
    }

    awayScoreKeyboard(msg, game) {
        let player = game.split(':')[1];
        this.scoreKeyboard(msg, `Enter ${player} Game Score`);
    }

    updateScoreKeyboard(msg, formattedKeyboard) {
        formattedKeyboard.unshift([{ 'text': '/start' }]);
        this.bot.sendMessage(msg.chat.id, "Update Score", {
            "reply_markup": {
                "keyboard": formattedKeyboard
            }
        });
    }

    removeInlineKeyboard(msg) {
        this.bot.editMessageReplyMarkup({
            "reply_markup": {
                "inline_keyboard": []
            }
        }, {
            chat_id: msg.chat.id, message_id: msg.message_id
        });
    }

    updatedScoreMessage(msg) {
        this.bot.sendMessage(msg.chat.id, "Score Updated", {
            reply_to_message_id: msg.id,
            reply_markup: mainMenu,
            force_reply: true
        });
    }
}
module.exports = BotMessages