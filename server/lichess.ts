class Perf{
    games:number=0
    rating:number=1500
    rd:number=350
    prog:number=0

    fromJson(json:any):Perf{
        console.log(`creating perf from json`,json)
        if(json.games!=undefined) this.games=json.games
        if(json.rating!=undefined) this.rating=json.rating
        if(json.rd!=undefined) this.rd=json.rd
        if(json.prog!=undefined) this.prog=json.prog
        return this
    }
}

class LichessProfile{
    username:string=""

    invalid:boolean=true

    nbFollowers:number=0
    createdAt:number=new Date().getTime()
    createdAtF:string=this.createdAt.toLocaleString()
    perfs:{[id:string]:Perf}={}

    constructor(username:string){
        this.username=username
    }

    fromJson(json:any):LichessProfile{
        try{
            console.log(`creating profile for ${this.username} from json`,json)
            this.invalid=true
            if(json==undefined) return this            
            if(json.nbFollowers!=undefined) this.nbFollowers=json.nbFollowers
            if(json.createdAt!=undefined) this.createdAt=json.createdAt
            this.createdAtF=new Date(this.createdAt).toLocaleString()
            if(json.perfs!=undefined){
                for(let variant in json.perfs){
                    let perfJson=json.perfs[variant]
                    this.perfs[variant]=new Perf().fromJson(perfJson)
                }
            }
            this.invalid=false
            return this
        }catch(err){
            logErr(err)
        }
        return this
    }

    fetch(callback:any){
        this.invalid=true

        try{
            fetch_(`https://lichess.org/api/user/${this.username}`).then(
                (response:any)=>{
                    response.text().then(
                        (content:any)=>{
                            try{
                                let json=JSON.parse(content)
                                this.fromJson(json)
                                callback(this)
                            }catch(err){
                                logErr(err)
                                callback(this)
                            }
                        }
                    )
                },
                (err:any)=>{
                    logErr(err)
                    callback(this)
                }
            )
        }catch(err){
            logErr(err)
        }
    }

    asDiscordString():string{
        let content=
            `__lichess profile__ of **${this.username}**\n\n`+
            `__member since__ : **${this.createdAtF}**\n`+
            `__followers__ : **${this.nbFollowers}**\n\n`+
            `__perfs__ :\n\n`

        let perfsContent:string=Object.keys(this.perfs).map((variant:string)=>{
            let perf=this.perfs[variant]
            if(perf.games<=0) return ""
            let vpref=variant=="atomic"?"**":"*"
            return `${vpref}${variant}${vpref} : rating : **${perf.rating}** , games : __${perf.games}__ , rd : ${perf.rd} , progress : ${perf.prog}\n`
        }).join("")

        content+=perfsContent

        return content
    }
}