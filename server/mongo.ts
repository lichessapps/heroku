type DATABASE_COMMAND=
    "getcollaslist"

const COLL_COMMANDS:DATABASE_COMMAND[]=[
    "getcollaslist"
]

type VoidDatabaseCallback=()=>void

type DatabaseResultCallback=(dr:DatabaseResult)=>void

class DatabaseCommand{
    t:DATABASE_COMMAND="getcollaslist"

    collName:string=""

    query:any={}
    update:any={}
    options:any={}

    sort:any|null=null
    limit:number|null=null

    constructor(t:DATABASE_COMMAND){
        this.t=t
    }

    setCollName(collName:string):DatabaseCommand{
        this.collName=collName
        return this
    }

    setSort(sort:any):DatabaseCommand{
        this.sort=sort
        return this
    }

    setLimit(limit:number):DatabaseCommand{
        this.limit=limit
        return this
    }
}

class DatabaseResult{
    ok:boolean=true
    status:string="ok"

    error:any=""

    doc:any={}
    docs:any[]=[]

    setStatus(status:string):DatabaseResult{
        this.status=status
        this.ok=this.status=="ok"
        return this
    }

    setError(error:any):DatabaseResult{
        this.error=error
        return this
    }

    setDocs(docs:any[]):DatabaseResult{
        this.docs=docs
        return this
    }
}

class Database{
    uri:string=""
    startupCallback:VoidDatabaseCallback=function(){}

    db:any=null

    constructor(uri:string){
        this.uri=uri
    }

    setStartupCallback(startupCallback:VoidDatabaseCallback):Database{
        this.startupCallback=startupCallback
        return this
    }

    connect(){
        try{
            console.log(`connecting to ${MONGODB_URI}`)
            const database=this
            mongodb.connect(MONGODB_URI, function(err:any, conn:any){
                if (err){
                    logErr(err)
                }else{
                    database.db = conn.db(DATABASE_NAME)
                    console.log(`connected to MongoDB database < ${database.db.databaseName} >`)            
                    database.startupCallback()
                }
            })
        }catch(err){
            console.log(logErr(err))
        }
    }

    execCommand(dc:DatabaseCommand,drc:DatabaseResultCallback):Database{
        if(this.db==null){
            drc(new DatabaseResult().setStatus("no db"))
            return this
        }

        if(COLL_COMMANDS.indexOf(dc.t)>=0){
            console.log(`db command <${dc.t}> coll <${dc.collName}>`)
            // coll command
            let collection=this.db.collection(dc.collName)

            if(dc.t=="getcollaslist"){
                let find=collection.find(dc.query)

                if(dc.sort!=null) find=find.sort(dc.sort)
                if(dc.limit!=null) find=find.limit(dc.limit)

                find.toArray((error:any,docs:any)=>{
                    if(error){
                        logErr(error)
                        drc(new DatabaseResult().setError(error).setStatus("getcollaslist failed"))
                    }else{
                        drc(new DatabaseResult().setDocs(docs))
                    }
                })
            }
        }

        return this
    }
}

const db=new Database(MONGODB_URI)