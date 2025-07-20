const asyncHandler= (requestHandler)=>{
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
            //ye hum ek promise bana rhe hai sara kam requestHandler khud kar lega to jo promise banaya use .then karne ki jarurat hi nhi bs error handle kar lo
               }
    }


export {asyncHandler}



//higher order function , functions ko as a perimeter accept karte hai aur return bhi kar sakte hai
// const asyncHandler = () => {}
// const asyncHandler = (func) => () => {}
// const asyncHandler = (func) => async () => {} // yaha hum ek async funtion return kar rahe hai bs return na likhna pade isliye bracket nhi lagaya


//if we want to write this function in try catch->


// const asyncHandler = (fn) => async (req, res, next) => {  // yaha ye function jo pass karenge uske sath aayenge
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         }) // status bhejenge, json me success flag bhejenge aur ek message bhejenge     
//     }
// }


