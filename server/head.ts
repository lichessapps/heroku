"use strict";

// system
const express = require('express')
const morgan = require('morgan')
const path = require('path')
const Discord = require("discord.js")
const fetch_ = require("node-fetch")
const pimg = require("pureimage")
const fs = require("fs")
const mongodb = require("mongodb")

let ONE_SECOND = 1000 //ms
let ONE_MINUTE = 60 * ONE_SECOND
let ONE_HOUR = 60 * ONE_MINUTE

function isProd(){
    return ( process.env.DISCORD_LOCAL == undefined );
}

function isDev(){
    return !isProd();
}

console.log(`application started in ${isProd()?"production":"development"} mode`)

const DATABASE_NAME=`mychessdb`

const LOCAL_MONGO_URI=`mongodb://localhost:27017/${DATABASE_NAME}`

const MONGODB_URI = ((isProd()||true)?process.env.MONGODB_URI:LOCAL_MONGO_URI)||LOCAL_MONGO_URI

const PORT = process.env.PORT || 5000

let HOST_URL=`https://rocky-cove-85948.herokuapp.com`

let DISCORDDEVBOT_TOKEN:string = process.env.DISCORDDEVBOT_TOKEN||""

const COMMAND_PREFIX = "+"

const DEFAULT_VARIANT = "atomic"

const ALL_VARIANTS=[
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
]

const VARIANT_DISPLAY_NAMES:{[id:string]:string}={
    bullet:"Bullet",
    blitz:"Blitz",
    rapid:"Rapid",
    classical:"Classical",
    ultraBullet:"Ultra Bullet",
    crazyhouse:"Crazyhouse",
    chess960:"Chess960",
    kingOfTheHill:"King of the Hill",
    threeCheck:"Three Check",
    antichess:"Antichess",
    atomic:"Atomic",
    horde:"Horde",
    racingKings:"Racing Kings"
}

function logErr(err:any){
    console.log("***")
    let errContent=(""+err)
    let lines=errContent.split(/[\n\r]+/)
    console.log(lines.join(" \\ "))
    console.log("***")
}

function rndUrl(url:string){
    let rnd=Math.floor(Math.random()*1e9)
    return `${url}?rnd=${rnd}`
}

function hostRndUrl(path:string){
    return rndUrl(`${HOST_URL}/${path}`)
}

function errorMessage(errmsg:string){
    return `:triangular_flag_on_post: Error: ${errmsg}`
}

function successMessage(succmsg:string){
    return `:white_check_mark: Success: ${succmsg}`
}

function infoMessage(infomsg:string){
    return `:cyclone: Info: ${infomsg}`
}

function commandNotImplementedMessage(command:string){
    return infoMessage(`Command **${command}** is not yet implemented in DevBot.`)
}

function unknownCommandMessage(command:string){
    return errorMessage(`Unknown command **${command}**.`)
}

