import {v2 as cloudinary} from 'cloudinary'

import dotenv from 'dotenv'
 dotenv.config({
    path: './.env'
})

import fs from "fs" // alag se install karne ki jarurat nhi phele se hi hota hai node me
import { ApiError } from './ApiError.js';



   
    
    cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});
    const uploadOnCloudinary= async (localFilePath)=>{
        try{
            
           
            if(!localFilePath) return null
            

            //upload file on cloudinary
            const response= await cloudinary.uploader.upload(localFilePath,{
                resource_type:"auto" // matlab khud decide kar lena
            })
            //isme kon konsi chize pass kar sakte hai cloudinary ki website se jakar dekh sakte hai
             fs.unlinkSync(localFilePath) 
            
             console.log("✅ Uploaded to Cloudinary:", response.secure_url);

            return response //isi me url hoga

        }catch(error){
            fs.unlinkSync(localFilePath) 
             console.error("❌ Cloudinary Upload Error:", error);
           throw new ApiError(500, "Upload failed");
            //unlink hi hai bs synchronously hta dega lag nhi karega time ka
            // as agar ye upload nhi ho rhi to sayad corrupted file hai to jitna jaldi ho sakte hatao sale ko
        }
    }

    const deleteImageOnCloudinary = async (url) => {
  try {

      if (!url.includes("res.cloudinary.com")) {
      throw new ApiError(400, "Invalid Cloudinary URL");
    }

    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.(\w+)(?:\?.*)?$/);

    if (!match) {
      console.error("❌ Failed to extract publicId from URL:", url);
      throw new ApiError(400, "Invalid URL format");
    }

    const publicId = match[1]; // Safe now

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });

    console.log("✅ Cloudinary deletion result:", result);
    return result;
  } catch (error) {
    console.error("❌ Cloudinary deletion error:", error);
    throw new ApiError(500, "Unable to perform delete operation from Cloudinary");
  }
}

const deleteVideoOnCloudinary = async (url) => {
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.(\w+)(?:\?.*)?$/);

    if (!match) {
      console.error("❌ Failed to extract publicId from URL:", url);
      throw new ApiError(400, "Invalid Cloudinary URL format");
    }

    const publicId = match[1]; // Safe now

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "video",
    });

    console.log("✅ Cloudinary deletion result:", result);
    return result;
  } catch (error) {
    console.error("❌ Cloudinary deletion error:", error);
    throw new ApiError(500, "Unable to perform delete operation from Cloudinary");
  }
}
    export {uploadOnCloudinary,deleteImageOnCloudinary,deleteVideoOnCloudinary}