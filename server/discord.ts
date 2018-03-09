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