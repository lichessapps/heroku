"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// system
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const Discord = require("discord.js");
const fetch_ = require("node-fetch");
const PORT = process.env.PORT || 5000;
let DISCORDDEVBOT_TOKEN = process.env.DISCORDDEVBOT_TOKEN || "";
const COMMAND_PREFIX = "+";
function logErr(err) {
    console.log("***");
    let errContent = ("" + err);
    let lines = errContent.split(/[\n\r]+/);
    console.log(lines.join(" \\ "));
    console.log("***");
}
class Perf {
    constructor() {
        this.games = 0;
        this.rating = 1500;
        this.rd = 350;
        this.prog = 0;
    }
    fromJson(json) {
        console.log(`creating perf from json`, json);
        if (json.games != undefined)
            this.games = json.games;
        if (json.rating != undefined)
            this.rating = json.rating;
        if (json.rd != undefined)
            this.rd = json.rd;
        if (json.prog != undefined)
            this.prog = json.prog;
        return this;
    }
}
class LichessProfile {
    constructor(username) {
        this.username = "";
        this.invalid = true;
        this.nbFollowers = 0;
        this.createdAt = new Date().getTime();
        this.createdAtF = this.createdAt.toLocaleString();
        this.perfs = {};
        this.username = username;
    }
    fromJson(json) {
        try {
            console.log(`creating profile for ${this.username} from json`, json);
            this.invalid = true;
            if (json == undefined)
                return this;
            if (json.nbFollowers != undefined)
                this.nbFollowers = json.nbFollowers;
            if (json.createdAt != undefined)
                this.createdAt = json.createdAt;
            this.createdAtF = new Date(this.createdAt).toLocaleString();
            if (json.perfs != undefined) {
                for (let variant in json.perfs) {
                    let perfJson = json.perfs[variant];
                    this.perfs[variant] = new Perf().fromJson(perfJson);
                }
            }
            this.invalid = false;
            return this;
        }
        catch (err) {
            logErr(err);
        }
        return this;
    }
    fetch(callback) {
        this.invalid = true;
        try {
            fetch_(`https://lichess.org/api/user/${this.username}`).then((response) => {
                response.text().then((content) => {
                    try {
                        let json = JSON.parse(content);
                        this.fromJson(json);
                        callback(this);
                    }
                    catch (err) {
                        logErr(err);
                        callback(this);
                    }
                });
            }, (err) => {
                logErr(err);
                callback(this);
            });
        }
        catch (err) {
            logErr(err);
        }
    }
    asDiscordString() {
        let content = `__lichess profile__ of **${this.username}**\n\n` +
            `__member since__ : **${this.createdAtF}**\n` +
            `__followers__ : **${this.nbFollowers}**\n\n` +
            `__perfs__ :\n\n`;
        let perfsContent = Object.keys(this.perfs).map((variant) => {
            let perf = this.perfs[variant];
            if (perf.games <= 0)
                return "";
            let vpref = variant == "atomic" ? "**" : "*";
            return `${vpref}${variant}${vpref} : rating : **${perf.rating}** , games : __${perf.games}__ , rd : ${perf.rd} , progress : ${perf.prog}\n`;
        }).join("");
        content += perfsContent;
        return content;
    }
}
class DiscordBot {
    constructor(TOKEN) {
        this.TOKEN = "";
        this.client = new Discord.Client();
        this.TOKEN = TOKEN;
        this.client.on("ready", () => {
            console.log(`Bot has started, with ${this.client.users.size} users, in ${this.client.channels.size} channels of ${this.client.guilds.size} guilds.`);
        });
        this.client.on("message", (message) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (message.author.bot)
                    return;
                if (message.content.indexOf(COMMAND_PREFIX) !== 0)
                    return;
                const args = message.content.slice(COMMAND_PREFIX.length).trim().split(/ +/g) || [];
                const command = (args.shift() || "").toLowerCase();
                console.log(`bot command ${command} args ${args}`);
                this.execCommand(message, command, args);
            }
            catch (err) {
                logErr(err);
            }
        }));
    }
    execCommand(message, command, args) {
        console.log(`unknown command`);
    }
    login() {
        this.client.login(this.TOKEN).catch((err) => logErr(err));
    }
}
class DevBot extends DiscordBot {
    constructor() {
        super(DISCORDDEVBOT_TOKEN);
    }
    execCommand(message, command, args) {
        if (command == "test") {
            message.channel.send(`test ${args}`);
        }
        if (command == "p") {
            let username = args[0] || "";
            new LichessProfile(username).fetch((p) => {
                console.log(p);
                if (!p.invalid) {
                    let msg = p.asDiscordString();
                    console.log(msg);
                    message.channel.send(msg);
                }
            });
        }
    }
}
function discordStartup() {
    new DevBot().login();
}
// server startup
const app = express();
app.use(morgan('combined'));
app.use(express.static('server/assets'));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'server/pages/index.html')));
discordStartup();
app.listen(PORT, () => console.log(`lichessapps server listening on ${PORT}`));
