import mongoose from "mongoose";
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'

const videoSchema=new mongoose.Schema({

        videoFile:{
            type:String, //cloudnary url
            required:true
        },
        thumbnail:{
            type:String,
            required:true
        },
        title:{
            type:String,
            required:true,
            index:true
        },
        description:{
            type:String,
            required:true
        },
        duration:{
            type:Number, //ek bar cloudnary par chize upload ho jati hai to wo response me time,url wagera bhejta hai whi se lenge
            required:true
        },
        views:{
            type:Number,
            default:0
        },
        isPublished:{
            type:Boolean,
            default:true
        },
        owner:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            index:true
        }


},{timestamps:true})

videoSchema.plugin(mongooseAggregatePaginate) // jab bahut sari information hogi to uuse handle karne ke liye jaise limit,skip etc
//help karega ki kitni videos ek bari me de

export const Video=mongoose.model("Video",videoSchema)