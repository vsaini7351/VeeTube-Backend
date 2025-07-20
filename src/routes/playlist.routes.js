import { Router } from 'express';
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
    updatePlaylist,
} from "../controllers/playlist.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

// router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(verifyJWT,createPlaylist).get(verifyJWT,getUserPlaylists)

router
    .route("/:playlistId")
    .get(verifyJWT,getPlaylistById)
    .patch(verifyJWT,updatePlaylist)
    .delete(verifyJWT,deletePlaylist);

router.route("/add/:videoId/:playlistId").patch(verifyJWT,addVideoToPlaylist);
router.route("/delete/:videoId/:playlistId").delete(verifyJWT,removeVideoFromPlaylist);



export default router