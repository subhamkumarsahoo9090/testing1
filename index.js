import dotenv from "dotenv"

import colors from 'colors'
import express from "express"
import cors from "cors"
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import mongoose from "mongoose"
import userRouter from "./router/userRouter.js"
dotenv.config()
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
app.use("/api/v1",userRouter)


mongoose.connect("mongodb://localhost:27017/mapdb").then(()=>{
    app.listen(PORT,()=>console.log(`database connection successfully || server is running on the port ${PORT}`.white.bgGreen))
}).catch((e)=>console.log(`error in connecting database`.white.bgRed))
