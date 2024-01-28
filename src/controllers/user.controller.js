import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

export { registerUser }