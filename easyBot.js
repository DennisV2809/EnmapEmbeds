const EnmapEmbeds = require('./index.js');
const { Client } = require('discord.js');
const config = require('./config.json');
const client = new Client();

const enmapEmbeds = new EnmapEmbeds();
enmapEmbeds.canLoad().then(c => c ? enmapEmbeds.load() : enmapEmbeds.update());

client.on('ready', () => console.log(`Logged in as ${client.user.tag}!`));

client.on('message', async message => {
  if(message.author.bot || !message.content.startsWith(config.prefix)) return;
  const query = message.content.slice(config.prefix.length).trim();
  const embed = enmapEmbeds.find(query);
  message.channel.send(embed ? ({ embed }) : 'Not found!');
})

client.login(config.token);
