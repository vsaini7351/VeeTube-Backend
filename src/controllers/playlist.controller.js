import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  // Validate input
  if (!name || name.trim() === "") {
    throw new ApiError(400, "Playlist name is required");
  }

  const userId = req.user._id;

  // Create the playlist
  const playlist = await Playlist.create({
    name: name.trim(),
    description: description?.trim() || "",
    owner: userId,
    videos: []
  });

  return res.status(201).json(
    new ApiResponse(201, playlist, "Playlist created successfully!")
  );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const userId=req?.user._id


  let { page = 1, limit = 10 } = req.query;
page = parseInt(page);
limit = parseInt(limit);
const skip = (page - 1) * limit;

  // Validate userId
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  // Fetch playlists owned by the user
  const playlists = await Playlist.find({ owner: userId })
    .populate({
      path: "videos",
      select: "title thumbnail duration views"
    }) // isme $lookup jaise har ek chiz specify karne ki jarurat nhi aapne aap le lega bs hume playlist schema ki konsi field papulate karni hai usko path me batana hai
    .sort({ createdAt: -1 })
    .skip(skip)
  .limit(limit);

  const totalPlaylists = await Playlist.countDocuments({ owner: userId });

  return res.status(200).json(
    new ApiResponse(200, {
    playlists,
    page,
    totalPages: Math.ceil(totalPlaylists / limit),
    totalPlaylists
  }, "User playlists fetched successfully")
  )
});
const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const playlist = await Playlist.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(playlistId) }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        _id: 1,
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    { $unwind: "$owner" },
                    {
                        $project: {
                            _id: 1,
                            title: 1,
                            thumbnail: 1,
                            videoFile: 1,
                            duration: 1,
                            views: 1,
                            owner: 1
                        }
                    }
                ]
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                createdAt: 1,
                updatedAt: 1,
                videoCount: { $size: "$videos" },
                videos: "$videoDetails"
            }
        }
    ]);

    if (!playlist || playlist.length === 0) {
        throw new ApiError(404, "Playlist not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist[0], "Playlist fetched successfully!"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

   if (
    !playlistId || !mongoose.Types.ObjectId.isValid(playlistId) ||
    !videoId || !mongoose.Types.ObjectId.isValid(videoId)
  ) {
    throw new ApiError(400, "Invalid playlist or video ID");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  
  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You're not authorized to modify this playlist");
  }

  // Avoid duplicates
  if (playlist.videos.includes(videoId)) {
    throw new ApiError(400, "Video already exists in playlist");
  }

  // Add video and save
  // playlist.videos.push(videoId); -- this can also be used but leads to duplication of videos
  playlist.videos.addToSet(videoId);
  await playlist.save();

  return res.status(200).json(
    new ApiResponse(200, playlist, "Video added to playlist successfully")
  );
});


const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    if (
    !playlistId || !mongoose.Types.ObjectId.isValid(playlistId) ||
    !videoId || !mongoose.Types.ObjectId.isValid(videoId)
  ) {
    throw new ApiError(400, "Invalid playlist or video ID");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  
  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You're not authorized to modify this playlist");
  }

  playlist.videos = playlist.videos.filter( (video) => video.toString() !== videoId );

  await playlist.save();

  return res.status(200).json(
    new ApiResponse(200, playlist, "Video removed from playlist successfully")
  );
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    
    if (
    !playlistId || !mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid playlist Id");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  
  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You're not authorized to delete this playlist");
  }

  await Playlist.findByIdAndDelete(playlistId)

  return res.status(200)
  .json(new ApiResponse(200,null,"Playlist deleted!"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if (!name || name.trim() === "") {
    throw new ApiError(400, "Playlist name is required");
  }

    if (
    !playlistId || !mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid playlist Id");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  
  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You're not authorized to modify this playlist");
  }

  playlist.name=name.trim()
   playlist.description = description?.trim() || "";

  await playlist.save()

  return res.status(200)
  .json(new ApiResponse(200,playlist,"Playlist updated Successsfully!"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}