import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        /** turn validation off while saving to DB to prevent Mongoose model kick-in() */
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token")
    }
}


const registerUser = asyncHandler( async (req, res) => {
    // get details from frontend
    // validation - chechk data is empty or not
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload to Cloudinary, chech avatar 
    // create user object - create entry in DB
    // remove password and refresh token fields from reponse
    // check for user creation
    // return response

    const { fullName, email, username, password } = req.body
    // console.log(req.body)
    // console.log({
    //     fullName,
    //     email,
    //     username,
    //     password
    // })

    /** It checks if any of the fields are empty, then returns an error */
    if (
        [fullName, email, username, password].some((field) => 
        field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }    

    /** It finds a user with username or email received from frontend */
    const existingUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    /** If user already exists, then it returns an error */
    if (existingUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    // console.log(req.files)

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && 
    req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) {
        throw new ApiError(400, "Avatar is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"  // remove password and refreshToken field from response 
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while creating user")   
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered successfully")
    )
    
} )

const loginUser = asyncHandler( async (req, res) => {
    // req.body -> fetch data from frontend
    // username or email
    // find user in DB
    // check password
    // generate access token and refresh token
    // send cookies

    const { email, username, password } = req.body

    // console.log(req.body)

    /** checks if username or email is empty, then returns an error */
    if (!username && !email) {
        throw new ApiError(400, "either username or email is required")
    }

    if(!password) {
        throw new ApiError(400, "Password is required")
    }

    /** finds a user with username or email */
    const user = await User.findOne({
        $or: [{ username },{ email }]
    })

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken")

    /** set OPTIONS for configuring cookies 
     * (can be modifiable in server side only) 
     */
    const options = {
        httpOnly: true, // Flags the cookie to be accessible only by the web server.
        secure: true, // Marks the cookie to be used with HTTPS only.

        // path: "/", // Path for the cookie. Defaults to “/”.

        // signed: true, // Indicates if the cookie should be signed.

        // maxAge: 24 * 60 * 60 * 1000 // 24 hours 
        //Convenient option for setting the expiry time relative to the current time in milliseconds.
    }

    /** send response with cookies and statusCode */
    return res
    .status(200)
    .cookie("accessToken", options)
    .cookie("refreshToken", options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in Successfully !"
        )
    )
})


const logoutUser = asyncHandler( async (req, res) => {
    // clear the cookies 
    // reset the refresh token
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    /**  set OPTIONS for configuring cookies */
    const options = {
        httpOnly: true, // Flags the cookie to be accessible only by the web server.
        secure: true, // Marks the cookie to be used with HTTPS only.

        // path: "/", // Path for the cookie. Defaults to “/”.

        // signed: true, // Indicates if the cookie should be signed.

        // maxAge: 24 * 60 * 60 * 1000 // 24 hours 
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User logged out Successfully !")
    )
})

export { 
    registerUser,
    loginUser,
    logoutUser
}