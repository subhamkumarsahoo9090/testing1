import dotenv from "dotenv"
dotenv.config()

import colors from 'colors'
import express from "express"
import cors from "cors"
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import mongoose from "mongoose"

import sendMail from "./router/sendmail.js"

const app=express()
const PORT =process.env.PORT ||8083

app.use(express.json())
app.use(cookieParser())
app.use(cors())
app.use(morgan("dev"))
// Serve uploaded files
app.use('/uploads', express.static('uploads'))




app.get('/', (req, res) => {
    res.status(200).json({ success: true, message: 'welcome to server' })
})

app.use("/api/v1",sendMail)



mongoose.connect(process.env.MONGO_URL).then(()=>{
    app.listen(PORT,()=>console.log(`database connection successfully \n || server is running on the port ${PORT} \n http://localhost:8089`.white.bgGreen))
}).catch((e)=>console.log(`error in connecting database`.white.bgRed))
