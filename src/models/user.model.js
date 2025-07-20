import mongoose,{Schema} from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const userSchema=new Schema(
    {   
        username:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true // jo field tumhe lag rhi hai bhut searching me use hogi usme index true kar dena
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
             match: [/.+@.+\..+/, 'Please enter a valid email address']
        },
        fullName:{
            type:String,
            required:true,
            trim:true,
            index:true // jo field tumhe lag rhi hai bhut searching me use hogi usme index true kar dena
        },
        avatar:{
            type:String,// cloudnary ki service use karenge iske liye
            required:true
        },
        coverImage:{
            type:String,
        },
        watchHistory:[
            {
                type:Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        password:{
            type:String,
            required:[true,"Password is required"]
        },
        
        refreshToken:{
            type:String
        }


    }
,{timestamps:true})

userSchema.pre("save",async function(next){
    
    if(!this.isModified("password")) return next(); // as kyoki hum ni chahte user kuch bhi change kare to password change ho jaye wo sirf tab change ho jab password change kara ho

    this.password= await bcrypt.hash(this.password,10)// ye number rounds hai ki kitne rounds lagau, kuch ni ese smjh lo ki number dena hota hai
    //ye password ko encrypt karake store karayega
    next();
}) // arrow function ni banate as usme humare pass this ka access nhi hota 

// ab dekho save to inbuilt middleware hai par man lo hum aapna custom banana chahte ho to uske liye

userSchema.methods.isPasswordCorrect= async function(password){
    return await bcrypt.compare(password,this.password)
} // humne ek method bana liya passwordCorrect check karne ka , login me use kar lenge

userSchema.methods.accessTokenGenerator=function(){
    return jwt.sign({
        _id:this._id,
        username:this.username,
        email:this.email,
        fullName:this.fullName
    },// this is payload(data given)
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
)
} // yaha time ni lagta hai isliye async ni likha

userSchema.methods.refreshTokenGenerator=function(){
    return jwt.sign({
        _id:this._id,
        
    },// yaha bs information kam lag rhi hai
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
)
}

export const User=mongoose.model("User",userSchema)  // ye jo user hai ye mongoose  se bana hai to directly contact me hai mongo db ke