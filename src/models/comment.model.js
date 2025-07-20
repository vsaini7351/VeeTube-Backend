import mongoose from "mongoose";
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'

const commentSchema= new mongoose.Schema({

    content:{
        type:String,
        required:true,
         trim: true,
         maxlength: 1000
    },
    video:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video",
        index:true
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps:true})

commentSchema.plugin(mongooseAggregatePaginate) // as hum aggregate use karene video ke comments ke liye to pagination ke liye hum ye use karenge

export const Comment=mongoose.model("Comment",commentSchema)