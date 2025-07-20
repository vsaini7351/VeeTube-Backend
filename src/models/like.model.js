import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
  likeable: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'onModel', 
    index:true,//name of the field of current schema, uske ander hum konsa model use kare wo de sakte hai
  }, //iske ander id de denge
  onModel: {
    type: String,
    required: true,
    enum: ['Video', 'Comment', 'Tweet'], 
  }, // iske ander bata denge konsa model ka like hai
  likedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index:true,
  }, // jisne like kiya hai uski id
}, { timestamps: true });


export const Like=mongoose.model("Like",likeSchema)