let variantPlayers:{[id:string]:number}={}

function getVariantPlayers(){
    for(let i=0;i<ALL_VARIANTS.length;i++){
        let variant=ALL_VARIANTS[i]
        setTimeout(function(){
            fetch_(`https://lichess.org/stat/rating/distribution/${variant}`).
            then((response:any)=>{
                response.text().then((content:any)=>{             
                    try{
                        let parts=content.split(`class="desc"`)
                        parts=parts[1].split(/<strong>|<\/strong>/)
                        let num=parts[1].replace(/[^0-9]/g,"")
                        variantPlayers[variant]=parseInt(num)                        
                    }catch(err){
                        console.log(err)
                    }
                },(err:any)=>logErr(err))
            },(err:any)=>logErr(err))
        },i*3000)
    }
}

////////////////////////////////////////
// Scheduling

/*if(isProd())*/{

    getVariantPlayers()

    setInterval(getVariantPlayers,ONE_HOUR)

}