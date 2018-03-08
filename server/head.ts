"use strict";

// system
const express = require('express')
const morgan = require('morgan')
const path = require('path')
const Discord = require("discord.js")
const fetch_ = require("node-fetch")

const PORT = process.env.PORT || 5000

let DISCORDDEVBOT_TOKEN:string = process.env.DISCORDDEVBOT_TOKEN||""

const COMMAND_PREFIX = "+"

function logErr(err:any){
    console.log("***")
    let errContent=(""+err)
    let lines=errContent.split(/[\n\r]+/)
    console.log(lines.join(" \\ "))
    console.log("***")
}
