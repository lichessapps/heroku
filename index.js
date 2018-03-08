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
        //console.log(`creating perf from json`,json)
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
            //console.log(`creating profile for ${this.username} from json`,json)
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
class LichessClock {
    constructor() {
        this.initial = 180;
        this.increment = 0;
        this.totalTime = 180;
    }
    fromJson(json) {
        if (json == undefined)
            return this;
        if (json.initial != undefined)
            this.initial = json.initial;
        if (json.increment != undefined)
            this.increment = json.increment;
        if (json.totalTime != undefined)
            this.totalTime = json.totalTime;
        return this;
    }
}
class LichessPlayer {
    constructor() {
        this.userId = "";
        this.rating = 1500;
        this.ratingDiff = 0;
    }
    userIdLower() {
        return this.userId.toLowerCase();
    }
    fromJson(json) {
        if (json == undefined)
            return this;
        if (json.userId != undefined)
            this.userId = json.userId;
        if (json.rating != undefined)
            this.rating = json.rating;
        if (json.ratingDiff != undefined)
            this.ratingDiff = json.ratingDiff;
        return this;
    }
}
class LichessPlayers {
    constructor() {
        this.white = new LichessPlayer();
        this.black = new LichessPlayer();
    }
    fromJson(json) {
        if (json == undefined)
            return this;
        if (json.white != undefined)
            this.white.fromJson(json.white);
        if (json.black != undefined)
            this.black.fromJson(json.black);
        return this;
    }
}
class LichessGame {
    constructor() {
        this.id = "";
        this.rated = true;
        this.variant = "atomic";
        this.speed = "blitz";
        this.perf = "atomic";
        this.createdAt = new Date().getTime();
        this.createdAtF = new Date(this.createdAt).toLocaleString();
        this.lastMoveAt = new Date().getTime();
        this.lastMoveAtF = new Date(this.lastMoveAt).toLocaleString();
        this.turns = 0;
        this.color = "white";
        this.status = "resign";
        this.clock = new LichessClock();
        this.players = new LichessPlayers();
        this.winner = "";
        this.url = "";
    }
    isUserWhite(userId) {
        return this.players.white.userIdLower() == userId.toLowerCase();
    }
    isUserBlack(userId) {
        return this.players.black.userIdLower() == userId.toLowerCase();
    }
    resultF() {
        if (this.winner == "white")
            return "1-0";
        if (this.winner == "black")
            return "0-1";
        return "1/2-1/2";
    }
    result() {
        if (this.winner == "white")
            return 1;
        if (this.winner == "black")
            return 0;
        return 0.5;
    }
    resultForUser(userId) {
        let result = this.result();
        if (this.isUserWhite(userId))
            return result;
        if (this.isUserBlack(userId))
            return 1 - result;
        return result;
    }
    ratingForUser(userId) {
        if (this.isUserWhite(userId))
            return this.players.white.rating;
        if (this.isUserBlack(userId))
            return this.players.black.rating;
        return 1500;
    }
    ratingDiffForUser(userId) {
        if (this.isUserWhite(userId))
            return this.players.white.ratingDiff;
        if (this.isUserBlack(userId))
            return this.players.black.ratingDiff;
        return 0;
    }
    fromJson(json) {
        if (json == undefined)
            return this;
        if (json.id != undefined)
            this.id = json.id;
        if (json.rated != undefined)
            this.rated = json.rated;
        if (json.variant != undefined)
            this.variant = json.variant;
        if (json.speed != undefined)
            this.speed = json.speed;
        if (json.perf != undefined)
            this.perf = json.perf;
        if (json.createdAt != undefined)
            this.createdAt = json.createdAt;
        this.createdAtF = new Date(this.createdAt).toLocaleString();
        if (json.lastMoveAt != undefined)
            this.lastMoveAt = json.lastMoveAt;
        this.lastMoveAtF = new Date(this.lastMoveAt).toLocaleString();
        if (json.turns != undefined)
            this.turns = json.turns;
        if (json.color != undefined)
            this.color = json.color;
        if (json.status != undefined)
            this.status = json.status;
        if (json.clock != undefined)
            this.clock = new LichessClock().fromJson(json.clock);
        if (json.players != undefined)
            this.players = new LichessPlayers().fromJson(json.players);
        this.winner = "";
        if (json.winner != undefined)
            this.winner = json.winner;
        if (json.url != undefined)
            this.url = json.url;
        return this;
    }
    shortUrl() {
        return this.url.replace(/\/white$|\/black$/, "");
    }
    asDiscordStringForUser(userId) {
        let prefWhite = this.isUserWhite(userId) ? "**" : "";
        let prefBlack = this.isUserBlack(userId) ? "**" : "";
        return `${prefWhite}${this.players.white.userId}${prefWhite} ( ${this.players.white.rating} ) - ${prefBlack}${this.players.black.userId}${prefBlack} ( ${this.players.black.rating} )  **${this.resultF()}**  *${this.lastMoveAtF}*  <${this.shortUrl()}>`;
    }
}
class LichessGames {
    constructor(username, nb, page) {
        this.username = "";
        this.invalid = true;
        // request
        this.nb = 10;
        this.page = 1;
        this.with_analysis = 0;
        this.with_moves = 0;
        this.with_opening = 0;
        this.with_movetimes = 0;
        this.rated = 1;
        this.playing = 0;
        // response
        this.currentPage = 1;
        this.maxPerPage = this.nb;
        this.currentPageResults = [];
        this.nbResults = 0;
        this.previousPage = null;
        this.nextPage = null;
        this.nbPages = 0;
        // games
        this.games = [];
        this.wins = 0;
        this.losses = 0;
        this.draws = 0;
        this.minRating = 1500;
        this.maxRating = 1500;
        this.avgRating = 1500;
        this.numGames = 0;
        this.username = username;
        this.nb = nb;
        this.page = page;
    }
    fetch(callback) {
        this.invalid = true;
        try {
            let url = `https://lichess.org/api/user/${this.username}/games?nb=${this.nb}&page=${this.page}&with_analysis=${this.with_analysis}&with_moves=${this.with_moves}&with_opening=${this.with_opening}&with_movetimes=${this.with_movetimes}&rated=${this.rated}&playing=${this.playing}`;
            console.log(`fetching url ${url}`);
            fetch_(url).then((response) => {
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
    fromJson(json) {
        try {
            //console.log(`creating lichess games for ${this.username} nb ${this.nb} page ${this.page} from json`,json)
            this.invalid = true;
            if (json == undefined)
                return this;
            if (json.maxPerPage != undefined)
                this.maxPerPage = json.maxPerPage;
            this.currentPageResults = json.currentPageResults;
            if (json.nbResults != undefined)
                this.nbResults = json.nbResults;
            if (json.previousPage != undefined)
                this.previousPage = json.previousPage;
            if (json.nextPage != undefined)
                this.nextPage = json.nextPage;
            if (json.nbPages != undefined)
                this.nbPages = json.nbPages;
            this.games = this.currentPageResults.map((gameJson) => new LichessGame().fromJson(gameJson));
            this.invalid = false;
            return this;
        }
        catch (err) {
            logErr(err);
        }
        return this;
    }
    createStats(variant) {
        this.wins = 0;
        this.losses = 0;
        this.draws = 0;
        this.minRating = 4000;
        this.maxRating = 0;
        this.numGames = 0;
        let cumRating = 0;
        for (let game of this.games) {
            if (game.variant == variant) {
                let resultForUser = game.resultForUser(this.username);
                if (resultForUser == 1)
                    this.wins++;
                else if (resultForUser == 0)
                    this.losses++;
                else
                    this.draws++;
                let rating = game.ratingForUser(this.username);
                if (rating < this.minRating)
                    this.minRating = rating;
                if (rating > this.maxRating)
                    this.maxRating = rating;
                cumRating += rating;
                this.numGames++;
            }
        }
        if (this.numGames > 0) {
            this.avgRating = cumRating / this.numGames;
        }
    }
    statsAsDiscordString(variant, showing = 10) {
        this.createStats(variant);
        if (this.numGames < 10)
            showing = this.numGames;
        let content = `out of last ${this.nb} lichess games **${this.username}** played **${this.numGames}** ${variant} games\n` +
            `won **${this.wins}** game(s), lost **${this.losses}** game(s), drawn **${this.draws}** game(s)\n` +
            `min rating **${this.minRating}** , max rating **${this.maxRating}** , average rating **${this.avgRating.toLocaleString()}**\n` +
            `showing last ${showing} games\n\n`;
        let gamesContent = this.games.slice(0, showing).map((game) => game.asDiscordStringForUser(this.username)).join("\n");
        content += gamesContent;
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
        if (command == "perf") {
            let username = args[0] || "";
            let variant = args[1] || "atomic";
            new LichessGames(username, 100, 1).fetch((lg) => {
                let msg = lg.statsAsDiscordString(variant);
                console.log(msg);
                message.channel.send(msg);
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
