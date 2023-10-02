const express = require('express')
const cors = require('cors')
const router = require('./router/mainRouter')
const mongoose = require('mongoose')
const {createServer} = require('node:http')


app = express()
require("dotenv").config()


const server = createServer(app)
require('./modules/sockets')(server)


server.listen(3001, () => {
    console.log("server running at http://localhost:3001")
})


mongoose.connect(process.env.DBKEY)
    .then(() => {
        console.log('CONNECTION SUCCESS')
    }).catch(e => {
    console.log('ERROR', e)
})


app.use(cors())
app.use(express.json())
app.use(express.static('public'));
app.use("/", router)


const port = 8000
app.listen(port)