// server startup

const app = express()

app.use(morgan('combined'))
app.use(express.static('server/assets'))

app.get('/', (req:any, res:any) => res.sendFile(path.join(__dirname,'server/pages/index.html')))

discordStartup()

app.listen(PORT, () => console.log(`lichessapps server listening on ${PORT}`))

