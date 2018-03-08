class DiscordBot{

    TOKEN:string=""

    client:any=new Discord.Client()

    constructor(TOKEN:string){

        this.TOKEN=TOKEN

        this.client.on("ready", () => {

            console.log(`Bot has started, with ${this.client.users.size} users, in ${this.client.channels.size} channels of ${this.client.guilds.size} guilds.`);

        })

        this.client.on("message", async (message:any) => {

            try{

                if(message.author.bot) return
                if(message.content.indexOf(COMMAND_PREFIX) !== 0) return

                const args:string[] = message.content.slice(COMMAND_PREFIX.length).trim().split(/ +/g)||[]
                
                const command:string = (args.shift()||"").toLowerCase()

                console.log(`bot command ${command} args ${args}`)

                this.execCommand(message,command,args)

            }catch(err){

                logErr(err)

            }

        })

    }

    execCommand(message:any,command:string,args:string[]){

        console.log(`unknown command`)

    }

    login(){

        this.client.login(this.TOKEN).catch((err:any)=>logErr(err))

    }

}

class DevBot extends DiscordBot{

    constructor(){

        super(DISCORDDEVBOT_TOKEN)

    }

    execCommand(message:any,command:string,args:string[]){

        if(command=="test"){
            message.channel.send(`test ${args}`)
        }

        if(command=="p"){
            let username=args[0]||""
            new LichessProfile(username).fetch((p:LichessProfile)=>{
                console.log(p)
                if(!p.invalid){
                    let msg=p.asDiscordString()
                    console.log(msg)
                    message.channel.send(msg)
                }
            })
        }

    }

}