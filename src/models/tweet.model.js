import mongoose from "mongoose";

const tweetSchema= new mongoose.Schema({
    content:{
        type:String,
        required:true,
        maxlength: 280, 
        trim: true
    },
    owner:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            index:true
        }
},{timestamps:true})


export const Tweet=mongoose.model("Tweet",tweetSchema)