const { Telegraf, Markup } = require('telegraf');
const path = require('path');
const fs = require('fs');

// Создаем экземпляр бота с вашим токеном
const bot = new Telegraf('7922896296:AAEJF0KBh0nOqkdL2HQFWFXB4A4NpXshfRY'); 

// ID вашего канала для системной проверки подписки
const CHANNEL_ID = '@phrasal_verbs_ok'; 

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
      // СЦЕНАРИЙ 1: Пользователь УЖЕ подписан
      await ctx.reply("Hello, I'm Phrasal Verbs O&K bot and here's your PDF \"10 Phrasal Verbs for Crafts\":\nEnjoy! ✨");
      await sendFile(ctx);
    } else {
      // СЦЕНАРИЙ 2: Пользователь НЕ подписан (Кнопка ведет по вашей инвайт-ссылке)
      await ctx.reply(
        "Hello, I'm Phrasal Verbs O&K bot and I'll send you the PDF \"10 Phrasal Verbs for Crafts\". Looks like you need to subscribe to our Telegram channel.",
        Markup.inlineKeyboard([
          [Markup.button.url('Subscribe 📢', 'https://t.me/+XyfTm424fMA0MjYy')],
          [Markup.button.callback('I subscribed ✅', 'check_sub')]
        ])
      );
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
      // Пользователь подписался и нажал кнопку
      await ctx.reply("You've subscribed to the channel, here's your file:\nEnjoy! ✨");
      await sendFile(ctx);
    } else {
      // Пользователь всё еще не подписан
      await ctx.reply('You are not subscribed yet. Please subscribe to the channel to unlock the PDF file.');
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

// Запуск бота
bot.launch().then(() => console.log('Бот успешно запущен с приватной инвайт-ссылкой!'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

require('http').createServer((req, res) => res.end('Bot is running!')).listen(process.env.PORT || 3000);