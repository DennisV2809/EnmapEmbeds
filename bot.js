const EnmapEmbeds = require('./index.js');
const { Client } = require('discord.js');
const config = require('./config.json');
const client = new Client();
const responses = new Map();

const enmapEmbeds = new EnmapEmbeds();
enmapEmbeds.canLoad().then(c => c ? enmapEmbeds.load() : enmapEmbeds.update());

// Make sure responses don't build up until the bot crashes
const cachInterval = 2*60*60*1000;
let cache = [];
let bool = true;
setInterval(() => {
  if(bool) cache = [...responses.keys()];
  else cache.forEach(c => responses.delete(c));
  bool = !bool;
}, cachInterval)

client.on('ready', () => console.log(`Logged in as ${client.user.tag}!`));

client.on('message', async message => {
  if(message.author.bot || !message.content.startsWith(config.prefix)) return;
  const query = message.content.slice(config.prefix.length).trim();
  if(query === 'update') {
    const m = await message.channel.send(`Updating EnmapEmbeds...`);
    return enmapEmbeds.update()
      .then(() => m.edit('EnmapEmbeds updated!'))
      .catch(e => console.log(e) || m.edit('Failed to update EnmapEmbeds!'))
  }
  const embed = enmapEmbeds.find(query);
  const m = await message.channel.send(embed ? ({ embed }) : 'Not found!');
  responses.set(message.id, m.id);
})

client.on('messageUpdate', async (_, message) => {
  if(message.author.bot || !message.content.startsWith(config.prefix)) return;
  const embed = enmapEmbeds.find(message.content.slice(config.prefix.length).trim());
  if(responses.has(message.id)) {
    const msg = await message.channel.messages.fetch(responses.get(message.id)).catch(() => null);
    if(msg){
      const m = await msg.edit(embed ? ({ embed }) : 'Not found!');
      return responses.set(message.id, m.id);
    }
  }
  const m = await message.channel.send(embed ? ({ embed }) : 'Not found!')
  responses.set(message.id, m.id);
})

client.on('messageDelete', async message => {
  if(message.author.bot || !message.content.startsWith(config.prefix) || !responses.has(message.id)) return;
  const msg = await message.channel.messages.fetch(responses.get(message.id)).catch(() => null);
  if(msg) msg.delete().catch(() => null);
})

client.login(config.token);
