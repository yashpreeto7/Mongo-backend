import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary,deleteFromCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, username, password } = req.body;

  if (
    [fullname, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    throw new ApiError(409, "user with email already exists");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(404, "Avatar file is missing");
  }
  // const avatar = await uploadOnCloudinary(avatarLocalPath);
  // let coverImage = "";
  // if (coverLocalPath) {
  //   coverImage = await uploadOnCloudinary(coverLocalPath);
  // }
  let avatar;
  try {
    avatar = await uploadOnCloudinary(avatarLocalPath);
    console.log("Uploaded avatar", avatar);
  } catch (error) {
    console.log("Error uploading avatar", error);
    throw new ApiError(500, "Failed to upload avatar");
  }

  let coverImage;
  if (coverLocalPath) {
    try {
      coverImage = await uploadOnCloudinary(coverLocalPath);
      console.log("Uploaded coverImage", coverImage);
    } catch (error) {
      console.log("Error uploading coverImage", error);
      throw new ApiError(500, "Failed to upload coverimage");
    }
  }

  try {
    const user = await User.create({
      fullname,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase(),
    });
  
    const createdUser = await User
      .findById(user._id)
      .select("-password -refreshToken");
    if (!createdUser) {
      throw new ApiError(500, "something went wrong");
    }
    return res
      .status(202)
      .json(new ApiResponse(200, createdUser, "user has been registered"));
  } catch (error) {
    console.log("User creation failed:", error);

    if(avatar){
      await deleteFromCloudinary(avatar.public_id)
    }
    if(coverImage){
      await deleteFromCloudinary(coverImage.public_id)
    }
    throw new ApiError(500,"Something went wrong and images were deleted")
  }
});

export { registerUser };
