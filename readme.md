# EnmapEmbeds
[Enhanced Maps](https://github.com/eslachance/enmap) are a data structure made by [Evie](https://evie.codes/) that can be used to store data in memory that can also be saved in a database behind the scenes. These operations are fast, safe, and painless.
This small repository brings the [documentation](https://enmap.evie.codes/api) of Enmap to Discord.

# Dependencies
Make sure you have jsdoc installed globally on your system: `npm i -g jsdoc`. `node-fetch` is used to download the Enmap source code from Github. You also need Discord.js. If you would like to start `bot.js`, you'll need D.JS master, otherwise both stable and master will work fine.

# Run complete Discord bot
Clone this repository and create a config.json file based on config.example.json. Now you can start the bot with `node bot.js`. This bot has support for editing and removing messages, and you can just run `prefix update` to parse the Enmap sourcecode again.

# Examples
There are 3 examples:
- `server.js`: A sample webserver to host the embed docs.
- `easyBot.js`: Easy D.JS Discord bot example. If you'd like to implement the docs feature in your own bot, I'd recommend starting here.
- `bot.js`: A complete D.JS Discord bot example, that has support for editing and removing messages.

# Commandline
You can also generate the embeds from the commandline, for full flexibility:
```
node index.js --clean // Clean the cache directory
node index.js --fetch // Fetch the Enmap source code from github, and cache it
node index.js --jsdoc // Parse the fetched Enmap source code with jsdoc
node index.js --parse // Parse the jsdoc generated json file to embeds
node index.js --update // Perform the above 3 tasks in order
// Additional flags --debug and --dir can be used, as well as multiple options:
node index.js --clean --fetch --debug --dir /path/to/some/location
```
