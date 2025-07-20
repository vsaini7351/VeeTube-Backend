import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import dotenv from 'dotenv'
 dotenv.config({
    path: './.env'
})

const app=express();

if (!process.env.CORS_ORIGIN) {
   
    console.warn("⚠️  CORS_ORIGIN not defined in .env");
}//warning 

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
})) // ese likhne se mostly configure ho jata hai

app.use(express.json({limit:'20kb'})); // blob se json data ko read karne ke liye

app.use(express.urlencoded({extended:true,limit:'20kb'})) // blob se url ko read karne ke liye

app.use(express.static("public"))
 // hum chahte hai ki files sabse phele humare hi server me store ho jaye ,iske liye humne alag se pubic folder banaya hai
app.use(cookieParser())

// routes import
import userRouter from './routes/user.routes.js'

//routes declaration

app.use("/api/v1/user",userRouter)
// ab dekho /user ko fix ho gya ab iske aage jo bhi route likho url me add on hota jayega

// url- http://localhost:8000/api/v1/user/register , register aage se chud jayega as userRoute me dala hai dekho jake

import videoRouter from './routes/video.routes.js'
app.use("/api/v1/video",videoRouter)

import commentRouter from './routes/comment.routes.js'

app.use("/api/v1/comment",commentRouter)

import subscriptionRouter from './routes/subscription.routes.js'

app.use("/api/v1/subscription",subscriptionRouter)

import tweetRouter from './routes/tweet.routes.js'

app.use("/api/v1/tweet",tweetRouter)

import dashboardRouter from './routes/dashboard.routes.js'

app.use("/api/v1/dashboard",dashboardRouter)

import playlistRouter from './routes/playlist.routes.js'

app.use("/api/v1/playlist",playlistRouter)

import likeRouter from './routes/like.routes.js'

app.use("/api/v1/like",likeRouter)

app.get("/", (req, res) => {
    res.send("Veetube backend is live 🚀");
});

app.use((err, req, res, next) => {
    console.error("🔥 Global Error Handler: ", err);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
}); // sare errors ko handle karne ke liye




export {app}

