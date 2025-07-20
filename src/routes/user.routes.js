import {Router}  from "express"
import { changeCurrentPassword, 
    getCurrentUser, 
    getUserChannelProfile, 
    getWatchHistory, 
    loginUser, 
    logoutUser, 
    refreshTheAccessToken, 
    registerUser, 
    updateAvatar, 
    updateCoverImage, 
    updateUserDetails } from "../controllers/user.controller.js"

import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router=Router()

router.route("/register").post( upload.fields([
    {
        name:"avatar",
        maxCount:1
    },
    {
        name:"coverImage",
        maxCount:1
    }
]),registerUser) 

// post request aayegi to registerUser call kar dega , get request par nhi karega
//yaha ek aur baat hai ki jis order me middlewares daloge use order me execute honge
// ye jo middleware humne dala hai ye multer aapne aap files add karke hume request me req.files ka access de dega


router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshTheAccessToken)
router.route("/change-password").patch(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser) // yaha user koi aapna data bhej to nhi raha to get likh lete hai
router.route("/update-user-details").patch(verifyJWT,updateUserDetails) // yaha agar post kar diya to sari chize change ho jayengi
router.route("/update-avatar").patch(verifyJWT,upload.single("avatar"),updateAvatar)
router.route("/update-cover").patch(verifyJWT,upload.single("coverImage"),updateCoverImage)

router.route("/channel/:username").get(verifyJWT,getUserChannelProfile)

router.route("/watch-history").get(verifyJWT,getWatchHistory)


export default router