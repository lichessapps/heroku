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
const pimg = require("pureimage");
const fs = require("fs");
const mongodb = require("mongodb");
let ONE_SECOND = 1000; //ms
let ONE_MINUTE = 60 * ONE_SECOND;
let ONE_HOUR = 60 * ONE_MINUTE;
function isProd() {
    return (process.env.DISCORD_LOCAL == undefined);
}
function isDev() {
    return !isProd();
}
console.log(`application started in ${isProd() ? "production" : "development"} mode`);
const DATABASE_NAME = `mychessdb`;
const LOCAL_MONGO_URI = `mongodb://localhost:27017/${DATABASE_NAME}`;
const MONGODB_URI = ((isProd() || true) ? process.env.MONGODB_URI : LOCAL_MONGO_URI) || LOCAL_MONGO_URI;
const PORT = process.env.PORT || 5000;
let HOST_URL = `https://rocky-cove-85948.herokuapp.com`;
let DISCORDDEVBOT_TOKEN = process.env.DISCORDDEVBOT_TOKEN || "";
const COMMAND_PREFIX = "+";
const DEFAULT_VARIANT = "atomic";
const ALL_VARIANTS = [
    "bullet",
    "blitz",
    "rapid",
    "classical",
    "ultraBullet",
    "crazyhouse",
    "chess960",
    "kingOfTheHill",
    "threeCheck",
    "antichess",
    "atomic",
    "horde",
    "racingKings"
];
const VARIANT_DISPLAY_NAMES = {
    bullet: "Bullet",
    blitz: "Blitz",
    rapid: "Rapid",
    classical: "Classical",
    ultraBullet: "Ultra Bullet",
    crazyhouse: "Crazyhouse",
    chess960: "Chess960",
    kingOfTheHill: "King of the Hill",
    threeCheck: "Three Check",
    antichess: "Antichess",
    atomic: "Atomic",
    horde: "Horde",
    racingKings: "Racing Kings"
};
function logErr(err) {
    console.log("***");
    let errContent = ("" + err);
    let lines = errContent.split(/[\n\r]+/);
    console.log(lines.join(" \\ "));
    console.log("***");
}
function rndUrl(url) {
    let rnd = Math.floor(Math.random() * 1e9);
    return `${url}?rnd=${rnd}`;
}
function hostRndUrl(path) {
    return rndUrl(`${HOST_URL}/${path}`);
}
function errorMessage(errmsg) {
    return `:triangular_flag_on_post: Error: ${errmsg}`;
}
function successMessage(succmsg) {
    return `:white_check_mark: Success: ${succmsg}`;
}
function infoMessage(infomsg) {
    return `:cyclone: Info: ${infomsg}`;
}
function commandNotImplementedMessage(command) {
    return infoMessage(`Command **${command}** is not yet implemented in DevBot.`);
}
function unknownCommandMessage(command) {
    return errorMessage(`Unknown command **${command}**.`);
}
const COLL_COMMANDS = [
    "getcollaslist"
];
class DatabaseCommand {
    constructor(t) {
        this.t = "getcollaslist";
        this.collName = "";
        this.query = {};
        this.update = {};
        this.options = {};
        this.sort = null;
        this.limit = null;
        this.t = t;
    }
    setCollName(collName) {
        this.collName = collName;
        return this;
    }
    setSort(sort) {
        this.sort = sort;
        return this;
    }
    setLimit(limit) {
        this.limit = limit;
        return this;
    }
}
class DatabaseResult {
    constructor() {
        this.ok = true;
        this.status = "ok";
        this.error = "";
        this.doc = {};
        this.docs = [];
    }
    setStatus(status) {
        this.status = status;
        this.ok = this.status == "ok";
        return this;
    }
    setError(error) {
        this.error = error;
        return this;
    }
    setDocs(docs) {
        this.docs = docs;
        return this;
    }
}
class Database {
    constructor(uri) {
        this.uri = "";
        this.startupCallback = function () { };
        this.db = null;
        this.uri = uri;
    }
    setStartupCallback(startupCallback) {
        this.startupCallback = startupCallback;
        return this;
    }
    connect() {
        try {
            console.log(`connecting to ${MONGODB_URI}`);
            const database = this;
            mongodb.connect(MONGODB_URI, function (err, conn) {
                if (err) {
                    logErr(err);
                }
                else {
                    database.db = conn.db(DATABASE_NAME);
                    console.log(`connected to MongoDB database < ${database.db.databaseName} >`);
                    database.startupCallback();
                }
            });
        }
        catch (err) {
            console.log(logErr(err));
        }
    }
    execCommand(dc, drc) {
        if (this.db == null) {
            drc(new DatabaseResult().setStatus("no db"));
            return this;
        }
        if (COLL_COMMANDS.indexOf(dc.t) >= 0) {
            console.log(`db command <${dc.t}> coll <${dc.collName}>`);
            // coll command
            let collection = this.db.collection(dc.collName);
            if (dc.t == "getcollaslist") {
                let find = collection.find(dc.query);
                if (dc.sort != null)
                    find = find.sort(dc.sort);
                if (dc.limit != null)
                    find = find.limit(dc.limit);
                find.toArray((error, docs) => {
                    if (error) {
                        logErr(error);
                        drc(new DatabaseResult().setError(error).setStatus("getcollaslist failed"));
                    }
                    else {
                        drc(new DatabaseResult().setDocs(docs));
                    }
                });
            }
        }
        return this;
    }
}
const db = new Database(MONGODB_URI);
function autoGenerateData() {
    let magN = Math.floor(Math.random() * 4) + 1;
    let mag = Math.pow(10, magN);
    let n = Math.floor(Math.random() * 100);
    let data = [];
    let y = (Math.random() + 5) * mag;
    for (let i = 0; i < n; i++) {
        y = y + (Math.random() - 0.5) * mag / 5;
        data[i] = y;
    }
    return data;
}
function createChart(blob = undefined, callback = undefined, errcallback = undefined) {
    var fnt = pimg.registerFont(`${__dirname}/server/assets/fonts/timesbd.ttf`, 'Times Bold');
    fnt.load(() => {
        createChartInner(blob, callback, errcallback);
    });
}
function createChartInner(blob, callback, errcallback) {
    if (blob == undefined)
        blob = {};
    let name = blob.name || "chart";
    let ext = blob.ext || "png";
    let CHART_WIDTH = blob.CHART_WIDTH || 600;
    let CHART_HEIGHT = blob.CHART_HEIGHT || 300;
    let MARGIN_TOP = blob.MARGIN_TOP || 30;
    let MARGIN_LEFT = blob.MARGIN_LEFT || 80;
    let TEXT_MARGIN_LEFT = blob.TEXT_MARGIN_LEFT || 5;
    let MARGIN_RIGHT = blob.MARGIN_RIGHT || 20;
    let MARGIN_BOTTON = blob.MARGIN_BOTTON || 20;
    let data = blob.data;
    if (data == undefined)
        data = autoGenerateData();
    let TOTAL_CHART_WIDTH = MARGIN_LEFT + CHART_WIDTH + MARGIN_RIGHT;
    let TOTAL_CHART_HEIGHT = MARGIN_TOP + CHART_HEIGHT + MARGIN_BOTTON;
    let LINE_WIDTH = blob.LINE_WIDTH == undefined ? 2 : blob.LINE_WIDTH;
    let BCKG_COLOR = blob.BCKG_COLOR || '#3f3f3f';
    let PLOT_COLOR = blob.PLOT_COLOR || '#ffff00';
    let MOVING_AVERAGE_COLOR = blob.MOVING_AVERAGE_COLOR || '#ff0000';
    let GRID_COLOR = blob.GRID_COLOR || '#7f7fff';
    let FONT_COLOR = blob.FONT_COLOR || '#00ff00';
    let MOVING_AVERAGE = blob.MOVING_AVERAGE;
    let MOVING_AVERAGE_FRONT = blob.MOVING_AVERAGE_FRONT;
    let FOLDER = blob.FOLDER || "charts";
    let img = pimg.make(TOTAL_CHART_WIDTH, TOTAL_CHART_HEIGHT);
    var ctx = img.getContext('2d');
    ctx.fillStyle = BCKG_COLOR;
    ctx.fillRect(0, 0, TOTAL_CHART_WIDTH, TOTAL_CHART_HEIGHT);
    if (data.length > 1) {
        data.reverse();
        let MAX_Y = Math.max.apply(null, data);
        let MIN_Y = Math.min.apply(null, data);
        let MAX_ABS = Math.max(Math.abs(MIN_Y), Math.abs(MAX_Y));
        if (MAX_ABS > 0) {
            let magN = Math.floor(Math.log10(MAX_ABS)) - 1;
            let mag = Math.pow(10, magN);
            let MIN_Y_J = Math.floor(MIN_Y / mag);
            let MAX_Y_J = Math.floor(MAX_Y / mag) + 1;
            MIN_Y = MIN_Y_J * mag;
            MAX_Y = MAX_Y_J * mag;
            let Y_RANGE = MAX_Y - MIN_Y;
            let NUM_LINES = Math.round(Y_RANGE / mag);
            let MOD_LINE = Math.max(Math.floor(NUM_LINES / 5), 1);
            let Y_SCALE = CHART_HEIGHT / Y_RANGE;
            let X_SCALE = CHART_WIDTH / (data.length - 1);
            function y2c(y) { return MARGIN_TOP + CHART_HEIGHT - (y - MIN_Y) * Y_SCALE; }
            function x2c(x) { return MARGIN_LEFT + x * X_SCALE; }
            ctx.strokeStyle = GRID_COLOR;
            ctx.font = "25pt 'Times Bold'";
            ctx.fillStyle = FONT_COLOR;
            for (let j = MIN_Y_J; j < MAX_Y_J; j++) {
                if ((j % MOD_LINE) == 0) {
                    let y = j * mag;
                    let yc = y2c(y);
                    ctx.beginPath();
                    ctx.moveTo(MARGIN_LEFT, yc);
                    ctx.lineTo(MARGIN_LEFT + CHART_WIDTH, yc);
                    ctx.stroke();
                    ctx.fillText("" + y.toLocaleString(), TEXT_MARGIN_LEFT, yc);
                }
            }
            function drawLine(cx0, cy0, cx1, cy1) {
                for (let jx = -LINE_WIDTH; jx <= LINE_WIDTH; jx++)
                    for (let jy = -LINE_WIDTH; jy <= LINE_WIDTH; jy++) {
                        ctx.beginPath();
                        ctx.moveTo(cx0 + jx, cy0 + jy);
                        ctx.lineTo(cx1 + jx, cy1 + jy);
                        ctx.stroke();
                    }
            }
            for (let i = 1; i < data.length; i++) {
                let cx0 = x2c(i - 1);
                let cx1 = x2c(i);
                function drawData() {
                    let cy0 = y2c(data[i - 1]);
                    let cy1 = y2c(data[i]);
                    ctx.strokeStyle = PLOT_COLOR;
                    drawLine(cx0, cy0, cx1, cy1);
                }
                function drawMovingAverage() {
                    if (MOVING_AVERAGE == undefined)
                        return;
                    if (i < MOVING_AVERAGE)
                        return;
                    let sumPrev = data.slice(i - MOVING_AVERAGE, i).reduce((a, b) => a + b);
                    let sumCurr = data.slice(i + 1 - MOVING_AVERAGE, i + 1).reduce((a, b) => a + b);
                    let avgPrev = sumPrev / MOVING_AVERAGE;
                    let avgCurr = sumCurr / MOVING_AVERAGE;
                    let cy0 = y2c(avgPrev);
                    let cy1 = y2c(avgCurr);
                    ctx.strokeStyle = MOVING_AVERAGE_COLOR;
                    drawLine(cx0, cy0, cx1, cy1);
                }
                if (MOVING_AVERAGE_FRONT) {
                    drawData();
                    drawMovingAverage();
                }
                else {
                    drawMovingAverage();
                    drawData();
                }
            }
        }
    }
    pimg.encodePNGToStream(img, fs.createWriteStream(`${__dirname}/server/assets/images/${FOLDER}/${name}.${ext}`)).then(() => {
        console.log(`wrote out the png file to ${name}.${ext}`);
        if (callback != undefined)
            callback();
    }).catch((err) => {
        logErr(err);
        if (errcallback != undefined)
            errcallback();
    });
}
//createChart() 
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
            let vpref = variant == DEFAULT_VARIANT ? "**" : "*";
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
        this.variant = DEFAULT_VARIANT;
        this.speed = "blitz";
        this.perf = DEFAULT_VARIANT;
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
        let gamesContent = this.games.filter((game) => game.variant == variant).slice(0, showing).map((game) => game.asDiscordStringForUser(this.username)).join("\n");
        content += gamesContent;
        return content;
    }
    ratingData(variant) {
        let filtered = this.games.filter((game) => game.variant == variant);
        let ratings = filtered.map((game) => game.ratingForUser(this.username));
        if (filtered.length > 0) {
            let lastgame = filtered[0];
            let lastrating = lastgame.ratingForUser(this.username);
            let lastratingdiff = lastgame.ratingDiffForUser(this.username);
            ratings.unshift(lastrating + lastratingdiff);
        }
        return ratings;
    }
}
let variantPlayers = {};
function getVariantPlayers() {
    for (let i = 0; i < ALL_VARIANTS.length; i++) {
        let variant = ALL_VARIANTS[i];
        setTimeout(function () {
            fetch_(`https://lichess.org/stat/rating/distribution/${variant}`).
                then((response) => {
                response.text().then((content) => {
                    try {
                        let parts = content.split(`class="desc"`);
                        parts = parts[1].split(/<strong>|<\/strong>/);
                        let num = parts[1].replace(/[^0-9]/g, "");
                        variantPlayers[variant] = parseInt(num);
                    }
                    catch (err) {
                        console.log(err);
                    }
                }, (err) => logErr(err));
            }, (err) => logErr(err));
        }, i * 3000);
    }
}
////////////////////////////////////////
// Scheduling
/*if(isProd())*/ {
    getVariantPlayers();
    setInterval(getVariantPlayers, ONE_HOUR);
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
        let hasMainBot = false;
        iterateUsers(this.client, (user) => {
            if (user.bot && (user.username == "TestBot"))
                hasMainBot = true;
        });
        if (hasMainBot) {
            message.channel.send(`Detected main bot. Not servicing command.`);
        }
        else if (command == "test") {
            message.channel.send(`test ${args}`);
        }
        else if (command == "p") {
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
        else if (command == "perf") {
            let username = args[0] || "";
            let variant = args[1] || DEFAULT_VARIANT;
            new LichessGames(username, 100, 1).fetch((lg) => {
                if (lg.invalid) {
                    message.channel.send(errorMessage(`There was a problem finding **${variant}** games for **${username}**.`));
                }
                else {
                    let msg = lg.statsAsDiscordString(variant);
                    console.log(msg);
                    message.channel.send(msg);
                    let ratings = lg.ratingData(variant);
                    createChart({
                        name: username,
                        data: ratings,
                        FOLDER: "perfs",
                        MOVING_AVERAGE: 10
                    }, function () {
                        setTimeout((e) => {
                            message.channel.send(hostRndUrl(`images/perfs/${username}.png`));
                        }, 2000);
                    }, function () {
                        message.channel.send(errorMessage("Could not create chart."));
                    });
                }
            });
        }
        else if (command == "vp") {
            let vp = variantPlayers;
            let variants = Object.keys(vp);
            variants.sort((a, b) => vp[b] - vp[a]);
            let content = "";
            for (let variant of variants) {
                let num = vp[variant];
                let pref = variant == DEFAULT_VARIANT ? "**" : "*";
                let disp = VARIANT_DISPLAY_NAMES[variant];
                content +=
                    `${pref}${disp}${pref} , players this week: **${num}**\n`;
            }
            message.channel.send(content);
        }
        else if (command == "cmp") {
            message.channel.send(commandNotImplementedMessage(command));
        }
        else if (command == "ls") {
            lichessStats(message);
        }
        else if (command == "reset") {
            message.channel.send(commandNotImplementedMessage(command));
        }
        else if (command == "fen") {
            message.channel.send(commandNotImplementedMessage(command));
        }
        else if ((command == "show") || (command == "s") || (command == "board") || (command == "b") || (command == "+")) {
            message.channel.send(commandNotImplementedMessage(command));
        }
        else if (command == "del") {
            message.channel.send(commandNotImplementedMessage(command));
        }
        else if (command == "ver") {
            message.channel.send(commandNotImplementedMessage(command));
        }
        else if (command == "check") {
            message.channel.send(commandNotImplementedMessage(command));
        }
        else if (command == "unver") {
            message.channel.send(commandNotImplementedMessage(command));
        }
        else if (command == "say") {
            message.channel.send(commandNotImplementedMessage(command));
        }
        else if (command == "top") {
            message.channel.send(commandNotImplementedMessage(command));
        }
        else if (command == "users") {
            usersStats(this.client, args, message);
        }
        else {
            message.channel.send(unknownCommandMessage(command));
        }
    }
}
function iterateUsers(client, iterFunc) {
    let users = client.users;
    let ids = users.keys();
    let ida = Array.from(ids);
    for (let i = 0; i < ida.length; i++) {
        let id = ida[i];
        let user = users.get(id);
        iterFunc(user);
    }
}
function usersStats(client, args, message) {
    let CHUNK = 50;
    let pageArg = args[0];
    let dupes = (pageArg == "dupes");
    console.log("pageArg", pageArg, dupes);
    let page = parseInt(pageArg);
    if (isNaN(page))
        page = 1;
    page--;
    if (page < 0)
        page = 0;
    let start = page * CHUNK;
    let users = client.users;
    let ids = users.keys();
    let ida = Array.from(ids);
    let content = `**Server users** ( total **${ida.length}** ) - Page **${page + 1}** - Listing from **${start + 1}** to **${start + CHUNK}**\n\n`;
    let ucs = [];
    let allnames = {};
    let nBots = 0;
    for (let i = 0; i < (dupes ? ida.length : start + CHUNK); i++) {
        if (i < ida.length) {
            let id = ida[i];
            let user = users.get(id);
            let username = user["username"];
            if (allnames[username] != undefined)
                allnames[username]++;
            else
                allnames[username] = 1;
            if (user.bot)
                nBots++;
            if (i >= start) {
                ucs.push(`${i + 1}. **${username}${user.bot ? " [ Bot ]" : ""}**`);
            }
        }
    }
    content += ucs.join(" , ");
    if (dupes) {
        let dupeList = [];
        let totalM = 0;
        for (let username in allnames) {
            let m = allnames[username];
            if (m > 1) {
                totalM += (m - 1);
                dupeList.push(`**${username}** [ multiplicity: ${m} ]`);
            }
        }
        let corrUsers = ida.length - totalM;
        content = `dupes: ${dupeList.join(" , ")}
      
__total dupes__ : **${totalM}**
__unique users__ : **${corrUsers}**
__total bots__ : **${nBots}**
__unique users minus bots__ : **${corrUsers - nBots}**
`;
    }
    console.log(content);
    message.channel.send(content);
}
function lichessStats(message) {
    try {
        db.execCommand(new DatabaseCommand("getcollaslist").
            setCollName("listats"), (dr) => {
            if (dr.ok) {
                let documents = dr.docs.slice();
                console.log(`listats has ${documents.length} records`);
                documents.sort((a, b) => b.d - a.d);
                let docsContent = documents.slice(0, Math.min(10, documents.length)).map(doc => `__${new Date(doc.time).toLocaleString()}__ players **${doc.d}** games **${doc.r}**`).join("\n");
                let data = dr.docs.map(doc => doc.d);
                data.reverse();
                createChart({
                    name: "lichessstats",
                    data: data,
                    MOVING_AVERAGE: 96,
                    MOVING_AVERAGE_FRONT: true
                }, function () {
                    console.log(`chart created ok`);
                    let msg = `${docsContent}\n\n${hostRndUrl(`images/charts/lichessstats.png`)}`;
                    console.log(msg);
                    message.channel.send(msg);
                }, (err) => {
                    logErr(err);
                });
            }
            else {
                logErr(`database error`);
            }
        });
    }
    catch (err) {
        logErr(err);
    }
}
function databaseStartup() {
    console.log(`db startup`);
}
function discordStartup() {
    db.setStartupCallback(databaseStartup).connect();
    new DevBot().login();
}
// server startup
const app = express();
app.use(morgan('combined'));
app.use(express.static('server/assets'));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'server/pages/index.html')));
discordStartup();
app.listen(PORT, () => console.log(`lichessapps server listening on ${PORT}`));
