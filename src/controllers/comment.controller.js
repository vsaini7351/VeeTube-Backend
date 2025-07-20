import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(404, "Invalid or missing video ID.");
    }

    const skip = (page - 1) * limit;

    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId),
            },
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $skip: skip
        },
        {
            $limit: limit
        },
        {
            $lookup: {
                from: "users", // collection name in MongoDB
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $project: {
                _id: 1,
                content: 1,
                createdAt: 1,
                updatedAt: 1,
                "owner._id": 1,
                "owner.username": 1,
                "owner.avatar": 1,
                "video":1
            }
        }
    ]);

    

    // Also get total count (without pagination)
    const totalComments = await Comment.countDocuments({
        video: videoId
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                comments,
                totalComments,
                page,
                totalPages: Math.ceil(totalComments / limit)
            },
            "Comments fetched successfully!"
        )
    );
});


const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId}=req.params
    const {content}=req.body
    
    if(!videoId || !mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(404,"Unable to get Video");
    }
    
    if(!content){
        throw new ApiError(400,"Type the comment");

    }

    const owner=req.user._id;
    
    if(!owner){
        throw new ApiError(401,"Please login before comment")
    }

    

    const newComment=await Comment.create({
        content,
        video:videoId,
        owner
    })

    const [commentWithOwner] = await Comment.aggregate([
  { $match: { _id: newComment._id } },
  {
    $lookup: {
      from: "users", // collection name
      localField: "owner",
      foreignField: "_id",
      as: "owner"
    }
  },
  { $unwind: "$owner" }, // flatten the owner array
  {
    $project: {
      content: 1,
      video: 1,
      createdAt: 1,
      "owner._id": 1,
      "owner.username": 1,
      "owner.avatar": 1
    }
  }
]);

    return res.status(200)
    .json(new ApiResponse(200,commentWithOwner,"Comment created successfully!"));

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment

    const {commentId}=req.params
    const{content}=req.body

    

    if(!commentId){
        throw new ApiError(400,"Can't get comment id")
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
  throw new ApiError(400, "Invalid comment ID");
}

    if(!content){
        throw new ApiError(404,"Content is required")
    }

    let comment= await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(404,"No such comment exist!")
    }

    if(comment.owner.toString() !== req.user._id.toString()){
        throw new ApiError(401, "You are not authorised to change this comment");
    }

    comment.content=content

    comment=await comment.save()

    return res.status(200)
    .json(new ApiResponse(200,comment,"Comment updated Successfully!"))


})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    const {commentId}=req.params
    
    if(!commentId){
        throw new ApiError(400,"Can't get comment id")
    }

 if (!mongoose.Types.ObjectId.isValid(commentId)) {
  throw new ApiError(400, "Invalid comment ID");
}
    let comment= await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(404,"No such comment exist!")
    }
   

    if(comment.owner.toString() !== req.user._id.toString()){
        throw new ApiError(401, "You are not authorised to change this comment");
    }

    comment=await Comment.findByIdAndDelete(commentId)

    return res.status(200)
    .json(new ApiResponse(200,comment,"Comment deleted Successfully!"))

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }