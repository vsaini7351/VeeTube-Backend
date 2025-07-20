class ApiError extends Error{
    constructor(statusCode,message="Something wents wrong",errors=[],stack=""){
        super(message)//calling parent class constructor with message as parameter
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false; //as handling errors
        this.errors = errors

         if (stack) {
            this.stack = stack
        } else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export {ApiError}


// super(message) is similar to 

// const err = new Error(message);
// this.name = "ApiError";
// this.message = message;
// this.stack = err.stack;

// If you forget super(message), the message and stack will not be properly set.

