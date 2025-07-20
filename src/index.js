 import dotenv from 'dotenv'
 dotenv.config({
    path: './.env'
}) // ese bhi kar sakte hai lekin bahut new feature hai


 //or 
 // require('dotenv').config({path:"./env"}) // path me dala hai ki home directory ke ander hi env hai

import {app} from './app.js'
import connectDB from './db/index.js'

connectDB()
.then(()=>{
    app.on("error",(err)=>{
        console.log("Err: ",err);
        throw err;
    })
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running at port : ${process.env.PORT}`);
    }) //hum chahte hai connect hote hi server bhi on ho jaye
})
.catch((err)=>{
    console.log("MongoDb connection failed: ",err);
})

// as async await tha to promise return karta to acche se handle kar liya