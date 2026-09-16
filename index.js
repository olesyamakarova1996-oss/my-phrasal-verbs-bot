const { Telegraf, Markup } = require('telegraf');
const path = require('path');
const fs = require('fs');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

const bot = new Telegraf(process.env.BOT_TOKEN); 
const CHANNEL_ID = '@phrasal_verbs_ok'; 

// !!! СЮДА ВСТАВЬТЕ ID ВАШЕЙ GOOGLE ТАБЛИЦЫ !!!
const SPREADSHEET_ID = '11_n-tZZ1uEG_j_pt7wMEpCNp0SQJDMl-wKJfk0kflgs';

// Функция для записи пользователя в Google Таблицу
async function logToGoogleSheet(ctx, statusText) {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/\\u003d/g, '='),
 // Исправление переносов строк для Render
      scopes: ['https://googleapis.com'],
    });

    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
    await doc.loadInfo(); 
    const sheet = doc.sheetsByIndex[0]; // Берем самый первый лист

    // Добавляем строчку со статистикой
    await sheet.addRow({
      'Дата': new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }),
      'Telegram ID': String(ctx.from.id),
      'Username': ctx.from.username ? `@${ctx.from.username}` : 'нет',
      'Имя': `${ctx.from.first_name || ''} ${ctx.from.last_name || ''}`.trim(),
      'Статус': statusText
    });
    console.log(`[Успех] Пользователь ${ctx.from.id} записан в таблицу со статусом: ${statusText}`);
  } catch (error) {
    console.error('Ошибка записи в Google Таблицу:', error.message);
  }
}

// Функция для проверки подписки на канал
async function checkSubscription(ctx) {
  try {
    const member = await ctx.telegram.getChatMember(CHANNEL_ID, ctx.from.id);
    const activeStatuses = ['creator', 'administrator', 'member'];
    return activeStatuses.includes(member.status);
  } catch (error) {
    console.error('Ошибка проверки подписки:', error);
    return false;
  }
}

// Обработка команды /start
bot.start(async (ctx) => {
  try {
    const isSubscribed = await checkSubscription(ctx);

    if (isSubscribed) {
      await ctx.reply("Hello, I'm Phrasal Verbs O&K bot and here's your PDF \"10 Phrasal Verbs for Crafts\":\nEnjoy! ✨");
      await sendFile(ctx);
      await logToGoogleSheet(ctx, 'Получил файл (был подписан)');
    } else {
      await ctx.reply(
        "Hello, I'm Phrasal Verbs O&K bot and I'll send you the PDF \"10 Phrasal Verbs for Crafts\". Looks like you need to subscribe to our Telegram channel.",
        Markup.inlineKeyboard([
          [Markup.button.url('Subscribe 📢', 'https://t.me')],
          [Markup.button.callback('I subscribed ✅', 'check_sub')]
        ])
      );
      await logToGoogleSheet(ctx, 'Нажал /start (не подписан)');
    }
  } catch (e) {
    console.error('Ошибка в блоке /start:', e);
  }
});

// Обработка нажатия на кнопку "I subscribed"
bot.action('check_sub', async (ctx) => {
  try {
    await ctx.answerCbQuery().catch(() => {});
    const isSubscribed = await checkSubscription(ctx);

    if (isSubscribed) {
      await ctx.reply("You've subscribed to the channel, here's your file:\nEnjoy! ✨");
      await sendFile(ctx);
      await logToGoogleSheet(ctx, 'Подписался и получил файл');
    } else {
      await ctx.reply('You are not subscribed yet. Please subscribe to the channel to unlock the PDF file.');
      await logToGoogleSheet(ctx, 'Нажал проверку (все еще не подписан)');
    }
  } catch (e) {
    console.error('Ошибка при нажатии кнопки:', e);
  }
});

// Умная функция отправки PDF-файла из папки проекта
async function sendFile(ctx) {
  try {
    const files = fs.readdirSync(__dirname);
    const pdfFile = files.find(file => file.toLowerCase().includes('crafts') || file.toLowerCase().includes('pdf'));

    if (!pdfFile) {
      throw new Error('PDF файл не найден в папке проекта!');
    }

    const filePath = path.join(__dirname, pdfFile);
    await ctx.replyWithDocument({ source: filePath });
  } catch (err) {
    console.error('Ошибка отправки файла:', err.message);
    await ctx.reply('Sorry, an error occurred while sending the file.');
  }
}

// Заглушка для веб-интерфейса Render
require('http').createServer((req, res) => res.end('Bot is running!')).listen(process.env.PORT || 3000);

bot.launch().then(() => console.log('Бот успешно перезапущен с поддержкой Google Таблиц!'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
