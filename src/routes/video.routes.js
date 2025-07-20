import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";

import { addVideoToWatchHistory, deleteVideo, getAllVideos, getVideoById, publishAVideo, togglePublishStatus, updateVideo } from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router();

router.route("/publish-video").post(verifyJWT,upload.fields([
    {
        name:"videoFile",
        maxCount:1
    },
    {
        name:"thumbnail",
        maxCount:1
    }
]),publishAVideo)//inside single name of the field jisse video leni hai to postman me video upload karte hue ye nam dalna hoga field ka uski value me video hogi

router.route("/").get(getAllVideos)
router.route("/:videoId").get(getVideoById);

router.route("/:videoId/addtowatch").post(verifyJWT,addVideoToWatchHistory)

router.route("/update-video/:videoId").patch(verifyJWT,upload.single("thumbnail"),updateVideo)

router.route("/delete-video/:videoId").delete(verifyJWT,deleteVideo) // delete ke liye delete method

router.route("/toggle-publish/:videoId").patch(verifyJWT,togglePublishStatus)
export default router;
