import mongoose, {Schema} from "mongoose";

const subscriptionSchema=new Schema({

    subscriber:{
        type: Schema.Types.ObjectId, // one who is subscribing
        ref:"User",
        index:true,
    },
    channel:{
        type:Schema.Types.ObjectId, // one to whom user is subscribing
        ref:"User",
        index:true
    }
},{timestamps:true})

export const Subscription=mongoose.model("Subscription",subscriptionSchema)