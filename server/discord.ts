function iterateUsers(client:any,iterFunc:any){
    let users=client.users    
    let ids=users.keys()
    let ida=Array.from(ids)
    for(let i=0;i<ida.length;i++){
        let id=ida[i]
        let user=users.get(id)
        iterFunc(user)
    }
}

function usersStats(client:any,args:string[],message:any){
    let CHUNK=50
    let pageArg=args[0]
    let dupes=(pageArg=="dupes")
    console.log("pageArg",pageArg,dupes)
    let page=parseInt(pageArg)    
    if(isNaN(page)) page=1
    page--
    if(page<0) page=0
    let start=page*CHUNK

    let users=client.users    
    let ids=users.keys()
    let ida=Array.from(ids)

    let content=`**Server users** ( total **${ida.length}** ) - Page **${page+1}** - Listing from **${start+1}** to **${start+CHUNK}**\n\n`
    let ucs=[]
    let allnames:{[id:string]:number}={}
    let nBots=0
    for(let i=0;i<(dupes?ida.length:start+CHUNK);i++){
      if(i<ida.length){
        let id=ida[i]
        let user=users.get(id)
        let username=user["username"]        
        if(allnames[username]!=undefined) allnames[username]++
        else allnames[username]=1
        if(user.bot) nBots++
        if(i>=start){
          ucs.push(`${i+1}. **${username}${user.bot?" [ Bot ]":""}**`)
        }        
      }
    }

    content+=ucs.join(" , ")

    if(dupes){
      let dupeList=[]
      let totalM=0
      for(let username in allnames){
        let m=allnames[username]
        if(m>1){
          totalM+=(m-1)
          dupeList.push(`**${username}** [ multiplicity: ${m} ]`)
        }
      }
      let corrUsers=ida.length-totalM
      content=`dupes: ${dupeList.join(" , ")}
      
__total dupes__ : **${totalM}**
__unique users__ : **${corrUsers}**
__total bots__ : **${nBots}**
__unique users minus bots__ : **${corrUsers-nBots}**
`
    }
    
    console.log(content)
    message.channel.send(content)
}

function lichessStats(message:any){
    try{
        db.execCommand(
            new DatabaseCommand("getcollaslist").
            setCollName("listats"),
            (dr:DatabaseResult)=>{
                if(dr.ok){
                    let documents=dr.docs.slice()
                    console.log(`listats has ${documents.length} records`)
                    documents.sort((a:any,b:any)=>b.d-a.d)                
                    let docsContent=documents.slice(0,Math.min(10,documents.length)).map(doc=>`__${new Date(doc.time).toLocaleString()}__ players **${doc.d}** games **${doc.r}**`).join("\n")                    
                    let data=dr.docs.map(doc=>doc.d)
                    data.reverse()
                    createChart({
                        name:"lichessstats",
                        data:data,
                        MOVING_AVERAGE:96,
                        MOVING_AVERAGE_FRONT:true
                    },function(){
                        console.log(`chart created ok`)
                        let msg=`${docsContent}\n\n${hostRndUrl(`images/charts/lichessstats.png`)}`
                        console.log(msg)
                        message.channel.send(msg)
                    },(err:any)=>{
                        logErr(err)
                    })
                }else{
                    logErr(`database error`)
                }
        })
    }catch(err){
        logErr(err)
    }
}

function databaseStartup(){

    console.log(`db startup`)

}

function discordStartup(){

    db.setStartupCallback(databaseStartup).connect()

    new DevBot().login()

}