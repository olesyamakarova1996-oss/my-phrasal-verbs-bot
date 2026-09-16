const { Telegraf, Markup } = require('telegraf');
const path = require('path');
const fs = require('fs');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

const bot = new Telegraf(process.env.BOT_TOKEN); 
const CHANNEL_ID = '@phrasal_verbs_ok'; 
const SPREADSHEET_ID = '11_n-tZZ1uEG_j_pt7wMEpCNp0SQJDM1-wKJfK0kflgs';

// Железобетонный вшитый ключ, который Node.js расшифрует без ошибок декодера
const ABSOLUTE_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCuG9cp1nOUE4GA
Cb+u/2YCykOXRfNDoOspKrAZYw1zOONQ62ChdozibwfPrkd0PNZWRLsIME8DS0vc
M8Ur3BDQXcUNOMpbGsldkowqBp1Hbof7obBzPsyVt7CzN7x2wUpNp9EpjeqSlpDK
4Rvlurf9bWgUjIoqfayaA9Y4rM7zRb/4evSIQcgkPak4zjqWrqwdww5qoiRPoCQ5
M8LsRmIw3XjY9rt1VsAdxYL+FU8WkndPVOOxGEKGlBS5smrNIKR1dsdAH3FjaSDw
6rt29kBRUKP1B1dAdSFZeeKClopp/aKv9XDvSBV74aDRLqePQaRgihegsf/iERLD
VDgSpmP1AgMBAAECggEAUCRLhZwLZnkWDnAuVeiEtbsRorOVlqcfJ7tZBM6F1eg1
Jj26JIhTsDTIZS3FATmxtVL8vneyHwONPyZrV1V8PdUzy3K9HnN1hgdbUkrqIYO8
vzR9aobZF/9OLCh3LTiqsZUSH60N8PyyWFiHBVdNsq8mDfNk88sWZGxosnzE49AQ
gL24Mnv3Wb3Q8NvcKbrBJZZv9qT7MZ8lQW0SQlJpudGfP7KjkRZjkdxPws83AekI
Vu3LZzKvqgTrnVQGhlsg2fo3kaCv6vjelpBzZKomnIFYzPAujmCzvatS3KoDW4Ii
ouzRCBUVPtu5E2lAC/ErIqPnnLiX/o/Hz+FeWI8+bwKBgQDUjNkKaQvwoVVmxuig
SRf7iJ1jPASZEZkPBl2we2I3jTiR3pmAOpxSmIfRO/hUnkJUd1iOr0vw8TNQ0354
P72P4AjzT/oF3LykOdiZrDkUg/N8iCRtamNxB3eYib/bRS99GIlDT6OPBnyzwZJ7
zChfcuYzACOdp/kzgKGXZ2rnRwKBgQDRs0eloLaO5sAqL35o8kXwp69Cgx4YQuzz
Uz4MTVY0ROafknSXezlXpSRKL92qBg3UvsWdPwReAFm6oDuT7XMtUfeUjkJwNYjR
qslja1UDUTpDtjdRS66PXpBTuQpHwGVs7AoKHjjuAhM3hJ+8SzUlWBmExRRGABmo
11hpq5Iw4wKBgQCgtEmZzGjhrCnVBol2Py2p2dYd5JAZZ6vRJ2AJApD1LYpbB/IJ
eMce0ALImU4eNHY0RPQpFbMWXlgNQYs6wf7CXIKH7K0+Z3IdvTrenc+eilG7k3fv
XmQHXrz3EReFYx8Pt1B5GyqwBhidFLt7bJYN7OLOJsnG9uy9GwGSZvf2GwKBgB9Z
1E5Y1rJKoVQtQZLjFb3C9BrXi3pJFy/RtCcWsNqjqm8U8EVtcMc/s0s8GMHAofS6
iMTXlQmQt9mE9yNIjr2p0X/uPNSVzFy8UduBQnZ6gGF7Lo4C6JgapS0/LuBHTWKZ
b27P0ecTfFgChfcar1lj8Hy/EibdAPkTKO6zbenNAoGAIcOFz2i0CjdeVVrHEUKv
3X/VhL8HClsfTNYbYs18/uLJCjXSBeGi7AivKq3303+qV8u3lNiRkeYUw6A6C0Hg
lSMaLnFBZA3gqD1Rxlo1AZCiVAvBz9LhHxYDUocQMlLmtcd47RposGn03gbAT0ZG
R0pjdhtWpp4Bkj3r35/n9Ko=
-----END PRIVATE KEY-----`;

async function logToGoogleSheet(ctx, statusText) {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: ABSOLUTE_PRIVATE_KEY, // Используем прямой чистый ключ
      scopes: ['https://googleapis.com'],
    });

    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
    await doc.loadInfo(); 
    const sheet = doc.sheetsByIndex[0];

    await sheet.addRow({
      'Дата': new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }),
      'Telegram ID': String(ctx.from.id),
      'Username': ctx.from.username ? `@${ctx.from.username}` : 'нет',
      'Имя': `${ctx.from.first_name || ''} ${ctx.from.last_name || ''}`.trim(),
      'Статус': statusText
    });
    console.log(`[Успех] Данные записаны в таблицу!`);
  } catch (error) {
    console.error('Ошибка записи в Google Таблицу:', error.message);
  }
}

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
    console.error(e);
  }
});

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
    console.error(e);
  }
});

async function checkSubscription(ctx) {
  try {
    const member = await ctx.telegram.getChatMember(CHANNEL_ID, ctx.from.id);
    const activeStatuses = ['creator', 'administrator', 'member'];
    return activeStatuses.includes(member.status);
  } catch (error) {
    return false;
  }
}

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
bot.launch().then(() => console.log('Бот запущен!'));
