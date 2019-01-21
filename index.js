const { writeFile, mkdir, unlink, stat } = require('fs');
const { exec } = require('child_process');
const Discord = require('discord.js');
const { resolve } = require('path');
const fetch = require('node-fetch');

class EnmapEmbeds {
  constructor(dir = undefined, debug = false) {
    this.dir = dir || resolve(__dirname, './EnmapDocsData');
    this.debug = debug;
    this.Embed = Discord.version.startsWith('12') ? Discord.MessageEmbed : Discord.RichEmbed;
  }

  canLoad() {
    return this.fileExists(resolve(this.dir, './embeds.json'));
  }

  load() {
    this.embeds = require(resolve(this.dir, './embeds.json'));
  }

  fileExists(path) {
    return new Promise((res, rej) => 
      stat(path, err => {
        if(err == null) {
          res(true);
        } else if(err.code === 'ENOENT') {
          res(false);
        } else {
          rej(err);
        }
      })
    )
  }

  async fetch() {
    if(!await this.fileExists(this.dir)) {
      await new Promise((res, rej) =>
        mkdir(this.dir, (err) => err ? rej(err) : res())
      )
    }
    return fetch('https://raw.githubusercontent.com/eslachance/enmap/master/src/index.js')
      .then(res => res.text())
      .then(content => new Promise((res, rej) => 
        writeFile(resolve(this.dir, './enmap.js'), content, err => err ? rej(err) : res())
      ))
  }

  jsdoc() {
    return new Promise((res, rej) =>
      exec(`jsdoc -X "${resolve(this.dir, './enmap.js')}" > "${resolve(this.dir, './apidocs.json')}"`, (err, stdout, stderr) => {
        if(this.debug && stdout) console.log(stdout);
        if(this.debug && stderr) console.error(stderr);
        if(err) return rej(err);
        res();
      })
    )
  }

  update() {
    return this.fetch()
      .then(() => this.jsdoc())
      .then(() => this.parse());
  }

  async clean() {
    for(const f of ['./apidocs.json', './embeds.json', './enmap.js']) {
      const path = resolve(this.dir, f);
      if(await this.fileExists(path)) {
        await new Promise((res, rej) =>
          unlink(path, (err) => err ? rej(err) : res())
        )
      }
    }
  }

  find(query) {
    query = query.toLowerCase();
    const found = this.embeds.find(e => e.lname === query);
    if(found) return found.embed;
    const search = this.embeds.find(e => e.lname.includes(query) || query.includes(e.lname)) || this.embeds.find(e => this.similarity(e.lname, query) > 0.8);
    if(!search) return null;
    const embed = new this.Embed()
      .setAuthor('Enmap Docs', 'https://images-ext-1.discordapp.net/external/K8C97Vif-rsViQ7RXSCrzydUrFsxauKQ0DOhhf61xVI/%3Fgeneration%3D1529879273639085%26alt%3Dmedia/https/blobscdn.gitbook.com/v0/b/gitbook-28427.appspot.com/o/spaces%252F-LFnuGgkksxzZuqQoImA%252Favatar.png', 'https://enmap.evie.codes/api')
      .setDescription(`Search better next time!\nDid you mean **${search.name}**?`)
    return embed;
  }
    
  similarity(a, b) {
    const minLength = Math.min(a.length, b.length);
    let x = 0;
    for(let i = 0; i < a.length; i++){
      if(a.charAt(i) === b.charAt(i)) x++;
    }
    return x / minLength;
  }

  parse() {
    const data = require(resolve(this.dir, './apidocs.json'));
    const embeds = [
      ...this.parseMethods(data),
      ...this.parseConstructor(data),
      ...this.parseInherited()
    ]
    this.embeds = this.addWarnings(embeds);
    return new Promise((res, rej) => 
      writeFile(resolve(this.dir, './embeds.json'), JSON.stringify(this.embeds, null, 2), err => err ? rej(err) : res())
    )
  }

  parseMethods(data) {
    return data.filter(x => !x.undocumented && x.scope !== 'global' && x.kind !== 'package').map(x => {
      const title = x.longname.replace('#', '.').replace(/\n/g, ' ');
      const params = (x.params || []).map(p => `\`${p.optional ? `[${p.name}]` : p.name}\` ${p.type ? `**${p.type.names.join(' | ')}**` : ''}\n${p.description}`).join('\n\n');
      let returns = x.returns && x.returns[0] ? x.returns[0].type.names.join(' | ') : 'void';
      returns = `\`${returns}\``;
      if(x.returns && x.returns[0] && x.returns[0].description) returns += `  ${x.returns[0].description.replace(/\n/g, ' ')}`;
      const examples = (x.examples || []).map(e => '```js\n' + e + '\n```').join('\n');
      const desc = x.description.replace(/\n/g, ' ').replace('<warn>', '\n\n').replace('</warn>', '')

      const embed = new this.Embed()
        .setAuthor('Enmap Docs', 'https://images-ext-1.discordapp.net/external/K8C97Vif-rsViQ7RXSCrzydUrFsxauKQ0DOhhf61xVI/%3Fgeneration%3D1529879273639085%26alt%3Dmedia/https/blobscdn.gitbook.com/v0/b/gitbook-28427.appspot.com/o/spaces%252F-LFnuGgkksxzZuqQoImA%252Favatar.png', 'https://enmap.evie.codes/api')
        .setTitle(title)
        .setDescription(desc || 'No description provided')
        .setColor('BLUE');
      if(params) embed.addField('Params', params);
      if(returns) embed.addField('Returns', returns);
      if(examples) embed.addField('Examples', examples);
  
      return {
        name: x.name,
        lname: x.name.toLowerCase(),
        embed: embed._apiTransform()
      }
    })
  }

  parseConstructor(data) {
    const options = data.find(e => e.kind === 'class' && e.classdesc)
      .params.filter(p => p.name.startsWith('options.'))
    const optionsEmbed = new this.Embed()
      .setAuthor('Enmap Docs', 'https://images-ext-1.discordapp.net/external/K8C97Vif-rsViQ7RXSCrzydUrFsxauKQ0DOhhf61xVI/%3Fgeneration%3D1529879273639085%26alt%3Dmedia/https/blobscdn.gitbook.com/v0/b/gitbook-28427.appspot.com/o/spaces%252F-LFnuGgkksxzZuqQoImA%252Favatar.png', 'https://enmap.evie.codes/api')
      .setTitle('Constructor Options')
      .setDescription(options.map(o => `${o.name} (${o.type.names.join(' | ')})`).join('\n'))
      .setColor('BLUE')

    const embeds = [{ name: 'options', lname: 'options', embed: optionsEmbed._apiTransform() }];

    for(const opt of options) {
      const embed = new this.Embed()
        .setAuthor('Enmap Docs', 'https://images-ext-1.discordapp.net/external/K8C97Vif-rsViQ7RXSCrzydUrFsxauKQ0DOhhf61xVI/%3Fgeneration%3D1529879273639085%26alt%3Dmedia/https/blobscdn.gitbook.com/v0/b/gitbook-28427.appspot.com/o/spaces%252F-LFnuGgkksxzZuqQoImA%252Favatar.png', 'https://enmap.evie.codes/api')
        .setTitle(opt.name)
        .setDescription(opt.description)
        .addField('Type', `\`${opt.type.names.join(' | ')}\``)
        .setColor('BLUE')

      embeds.push({ name: opt.name, lname: opt.name.toLowerCase(), embed: embed._apiTransform() })
    }
    return embeds;
  }

  parseInherited() {
    return [
      {
        name: 'size',
        desc: 'Returns the number of key/value pairs that are **cached**. If you would like the number of key/value pairs in the database, use enmap.count instead.',
        returns: 'number'
      },
      {
        name: 'keys',
        desc: 'Returns a new Iterator object that contains the keys for each element in the Enmap object in insertion order.',
        returns: 'Iterator'
      },
      {
        name: 'values',
        desc: 'Returns a new Iterator object that contains the values for each element in the Enmap object in insertion order.',
        returns: 'Iterator'
      },
      {
        name: 'entries',
        desc: 'Returns a new Iterator object that contains an array of [key, value] for each element in the Enmap object in insertion order.',
        returns: 'Iterator'
      },
      {
        name: 'forEach',
        params: '`callbackFn` **(value, key, Enmap) => void**\nThe callback function that will be executed.\n\n`thisArg` *****\nOptional argument that will be used as `this` in the callback function.',
        desc: 'Calls callbackFn once for each key-value pair present in the Enmap object, in insertion order. If a thisArg parameter is provided to forEach, it will be used as the this value for each callback.'
      }
    ].map(x => {
      const embed = new this.Embed()
        .setAuthor('Enmap Docs', 'https://images-ext-1.discordapp.net/external/K8C97Vif-rsViQ7RXSCrzydUrFsxauKQ0DOhhf61xVI/%3Fgeneration%3D1529879273639085%26alt%3Dmedia/https/blobscdn.gitbook.com/v0/b/gitbook-28427.appspot.com/o/spaces%252F-LFnuGgkksxzZuqQoImA%252Favatar.png', 'https://enmap.evie.codes/api')
        .setTitle(`Enmap.${x.name}`)
        .setDescription(x.desc || 'No description provided')
        .setColor('BLUE');
      if(x.params) embed.addField('Params', x.params);
      if(x.returns) embed.addField('Returns', x.returns);
  
      return { name: x.name, lname: x.name.toLowerCase(), embed: embed._apiTransform() }
    })
  }

  addWarnings(embeds) {
    const toWarn = [
      'size',
      'keys',
      'values',
      'entries',
      'forEach',
  
      'array',
      'keyArray',
      'random',
      'randomKey',
      'findAll',
      'find',
      'findKey',
      'exists',
      'sweep',
      'filter',
      'filterArray',
      'partition',
      'map',
      'some',
      'every',
      'reduce',
      'clone',
      'equals'
    ]
    return embeds.map(e => {
      if(toWarn.includes(e.name)){
        e.embed.description += '\n\n**Warning:** Depends on cache.'
      }
      return e;
    })
  }
}

module.exports = EnmapEmbeds;

if(process.argv[1] === resolve(__dirname, './index.js') && process.argv.length > 2) {
  (async () => {
    const debug = process.argv.includes('--debug');
    const dir = process.argv.includes('--dir') && process.argv[process.argv.indexOf('--dir') + 1];
    const docs = new EnmapEmbeds(dir, debug);
    if(process.argv.includes('--clean')) await docs.clean();
    if(process.argv.includes('--fetch')) await docs.fetch();
    if(process.argv.includes('--jsdoc')) await docs.jsdoc();
    if(process.argv.includes('--parse')) await docs.parse();
    if(process.argv.includes('--update')) await docs.update();
  })()
}
