import multer from 'multer'

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp") // callback ki short form hai aur kuch ni
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName ) // file ko console log karakar dekhenge kya kya chize hai
  }
})
//dekho phele hume req to mil rhi thi lekin file ka option nhi tha whi file ke option ko handle karne ke liye multer hai
export const upload = multer({ storage: storage,
  limits:{ fileSize: 20 * 1024 * 1024 }
 }) // multer accept cb(error,acceptFile), system me predefined hai uske

// const videoFilter = (req, file, cb) => {
//   const allowedTypes = ['video/mp4', 'video/mkv', 'video/avi', 'video/mov',];
//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only video files are allowed!'), false);
//   }
// };


// export const uploadVideo = multer({
//   storage: storage,
//   limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
//   fileFilter: videoFilter
// });



//ab jab bhi use karna hua controllers wagera me to- 
// app.post('/profile', upload.single('avatar'), function (req, res, next) {
//   // req.file is the `avatar` file
//   // req.body will hold the text fields, if there were any
// }) // ese kar lenge