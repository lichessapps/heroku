"use strict";

// system
const express = require('express')
const morgan = require('morgan')
const path = require('path')
const Discord = require("discord.js")
const fetch_ = require("node-fetch")
const pimg = require("pureimage")
const fs = require("fs")

const PORT = process.env.PORT || 5000

let HOST_URL=`https://rocky-cove-85948.herokuapp.com`

let DISCORDDEVBOT_TOKEN:string = process.env.DISCORDDEVBOT_TOKEN||""

const COMMAND_PREFIX = "+"

const DEFAULT_VARIANT = "atomic"

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
    return `Info: ${infomsg}`
}
