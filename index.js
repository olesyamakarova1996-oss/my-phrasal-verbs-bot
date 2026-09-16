const { Telegraf, Markup } = require('telegraf');
const path = require('path');
const fs = require('fs');

const bot = new Telegraf(process.env.BOT_TOKEN); 
const CHANNEL_ID = '@phrasal_verbs_ok'; 

// Функция для отправки уведомления вам в личку
async function sendAdminNotification(ctx, statusText) {
  try {
    // Получаем ID вашего чата, чтобы бот знал, кому слать отчеты
    const adminId = ctx.from.id; 
    const date = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
    const username = ctx.from.username ? `@${ctx.from.username}` : 'нет';
    const name = `${ctx.from.first_name || ''} ${ctx.from.last_name || ''}`.trim();

    const message = `🔔 *Новый пользователь в боте!*\n\n📅 *Дата:* ${date}\n👤 *Имя:* ${name}\n🔗 *Юзернейм:* ${username}\n🆔 *ID:* \`${ctx.from.id}\`\n📊 *Статус:* ${statusText}`;

    // Бот отправляет сообщение тому пользователю, который его настраивал (вам)
    // Если хотите получать уведомления на другой аккаунт, замените adminId на ваш числовой ID
    await bot.telegram.sendMessage(adminId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Не удалось отправить уведомление админу:', error.message);
  }
}

// Функция для проверки подписки на канал
async function checkSubscription(ctx) {
  try {
    const member = await ctx.telegram.getChatMember(CHANNEL_ID, ctx.from.id);
    const activeStatuses = ['creator', 'administrator', 'member'];
    return activeStatuses.includes(member.status);
  } catch (error) {
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
      await sendAdminNotification(ctx, 'Получил файл (был подписан)');
    } else {
      await ctx.reply(
        "Hello, I'm Phrasal Verbs O&K bot and I'll send you the PDF \"10 Phrasal Verbs for Crafts\". Looks like you need to subscribe to our Telegram channel.",
        Markup.inlineKeyboard([
          [Markup.button.url('Subscribe 📢', 'https://t.me')],
          [Markup.button.callback('I subscribed ✅', 'check_sub')]
        ])
      );
      await sendAdminNotification(ctx, 'Нажал /start (не подписан)');
    }
  } catch (e) {
    console.error(e);
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
      await sendAdminNotification(ctx, 'Подписался и получил файл');
    } else {
      await ctx.reply('You are not subscribed yet. Please subscribe to the channel to unlock the PDF file.');
      await sendAdminNotification(ctx, 'Нажал проверку (все еще не подписан)');
    }
  } catch (e) {
    console.error(e);
  }
});

// Функция отправки PDF
async function sendFile(ctx) {
  try {
    const files = fs.readdirSync(__dirname);
    const pdfFile = files.find(file => file.toLowerCase().includes('crafts') || file.toLowerCase().includes('pdf'));
    if (!pdfFile) throw new Error('Файл не найден');
    await ctx.replyWithDocument({ source: path.join(__dirname, pdfFile) });
  } catch (err) {
    await ctx.reply('Sorry, an error occurred while sending the file.');
  }
}

require('http').createServer((req, res) => res.end('Bot is running!')).listen(process.env.PORT || 3000);
bot.launch().then(() => console.log('Бот запущен с уведомлениями!'));
