import mongoose,{isValidObjectId, mongo} from 'mongoose'
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteImageOnCloudinary, deleteVideoOnCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"



const getAllVideos = asyncHandler(async (req, res) => {
  let {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId = ""
  } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  // Build filter
  const matchStage = {};

  if (query) {
    matchStage.title = { $regex: query, $options: "i" };
  }

  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    matchStage.owner = new mongoose.Types.ObjectId(userId);
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortType === "asc" ? 1 : -1;

  const skip = (page - 1) * limit;

  // Aggregation pipeline
  const videosAggregation = await Video.aggregate([
    { $match: matchStage },
    { $sort: sort },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner"
      }
    },
    { $unwind: "$owner" },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        isPublished: 1,
        createdAt: 1,
        updatedAt: 1,
        "owner._id": 1,
        "owner.username": 1,
        "owner.avatar": 1 // assuming avatar exists
      }
    }
  ]);

  // Total video count (without pagination)
  const totalVideos = await Video.countDocuments(matchStage);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videos: videosAggregation,
        totalVideos,
        page,
        totalPages: Math.ceil(totalVideos / limit)
      },
      "Videos fetched successfully!"
    )
  );
});



const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body

    if(!title|| !description){
        throw new ApiError(401,"title and description are required")
    }
    // TODO: get video, upload to cloudinary, create video

    const thumbnailLocalPath=req.files?.thumbnail?.[0].path
    
    if(!thumbnailLocalPath){
        throw new ApiError(401,"Upload the thumbnail!")
    }

    const videoFileLocalPath= req.files?.videoFile?.[0].path

    if(!videoFileLocalPath){
        throw new ApiError(401,"Upload the Video!")
    }

    const videoFile= await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail=await uploadOnCloudinary(thumbnailLocalPath)
    

    if(!videoFile){
        throw new ApiError(501,"Video not uploaded!")
    }

    if(!thumbnail){
        throw new ApiError(501,"Thumbnail can't be uploaded")
    }

    const video=await Video.create({
        videoFile:videoFile.url,
        thumbnail:thumbnail.url,
        title,
        description,
        duration:videoFile.duration,
        owner:req.user._id
        

    })

    return res.status(200)
    .json(new ApiResponse(200,video,"Video published successfully!"))


})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if(!videoId){
        throw new ApiError(404,"No VideoId");
    }

    await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });

    const video = await Video.aggregate([
  {
    $match: { _id: new mongoose.Types.ObjectId(videoId) }
  },
  {
    $lookup: {
      from: "users",
      localField: "owner",
      foreignField: "_id",
      as: "owner"
    }
  },
  { $unwind: "$owner" },
  {
    $project: {
      videoFile: 1,
      thumbnail: 1,
      title: 1,
      description: 1,
      duration: 1,
      views: 1,
      createdAt: 1,
      "owner._id": 1,
      "owner.username": 1,
      "owner.avatar": 1,
      "owner.fullName": 1
    }
  }
]);

    if(!video){
        throw new ApiError(404,"Invalid Video id");
    }

    return res.status(200)
    .json(new ApiResponse(200,video,"Video find successfully!"))
})



const updateVideo = asyncHandler(async (req, res) => {

    //TODO: update video details like title, description, thumbnail
    const { videoId } = req.params
    
// checking authorisation
     
  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(404, "Invalid or missing Video ID");
  }
    
    const video=await Video.findById(videoId)

    if(!video){
        throw new ApiError(404,"Invalid Video id");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(401, "You are not authorised to change this video");
  }


    const {title,description} = req.body
    const thumbnailLocalPath=req.file?.path

    if(!title && !description && !thumbnailLocalPath){
        throw new ApiError(401,"Atleast one field is required!")
    }
    
    if(title) video.title=title
    if(description) video.description=description

    if(thumbnailLocalPath){
    const thumbnail=await uploadOnCloudinary(thumbnailLocalPath)

    

    if(thumbnail){
        await deleteImageOnCloudinary(video.thumbnail)
        video.thumbnail=thumbnail.url
        
    }
    }

await video.save()

return res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"));
    

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

     if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(404, "Invalid or missing Video ID");
  }
    
    const video=await Video.findById(videoId)

    if(!video){
        throw new ApiError(404,"Invalid Video id");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(401, "You are not authorised to change this video");
  }
    //TODO: delete video

    if(video.videoFile)
    await deleteVideoOnCloudinary(video.videoFile)

    if(video.thumbnail)
    await deleteImageOnCloudinary(video.thumbnail)

    const deletedVideo= await Video.findByIdAndDelete(videoId)

    return res.status(200).json(new ApiResponse(200,deletedVideo,"Video Deleted successfully!"))



})

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(404, "Invalid or missing Video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(401, "You are not authorised to change this video");
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { $set: { isPublished: !video.isPublished } },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Toggle operation successful!"));
});

const addVideoToWatchHistory = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid or missing Video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const userId = req.user._id;

  // Remove existing occurrence (to prevent duplicates)
  await User.findByIdAndUpdate(userId, {
    $pull: { watchHistory: videoId }
  });

  // Add to beginning of watch history
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $push: {
        watchHistory: {
          $each: [videoId],
          $position: 0
        }
      }
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser.watchHistory, "Watch history updated successfully"));
});


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    addVideoToWatchHistory
}