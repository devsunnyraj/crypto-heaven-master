"use server";

import { FilterQuery, SortOrder } from "mongoose";

import Community from "../models/community.model";
import Thread from "../models/thread.model";
import User from "../models/user.model";

import { connectToDB } from "../mongoose";

export async function createCommunity(
  id: string,
  name: string,
  username: string,
  image: string,
  bio: string,
  createdById: string,
  isPrivate: boolean = false
) {
  try {
    connectToDB();

    // Check if username already exists
    const existingCommunity = await Community.findOne({ username });
    if (existingCommunity) {
      throw new Error("Username already taken. Please choose another one.");
    }

    // Find the user with the provided unique id
    const user = await User.findOne({ id: createdById });

    if (!user) {
      throw new Error("User not found");
    }

    const newCommunity = new Community({
      id,
      name,
      username,
      image,
      bio,
      createdBy: user._id,
      admins: [user._id],
      members: [user._id],
      isPrivate,
    });

    const createdCommunity = await newCommunity.save();

    // Update User model
    user.communities.push(createdCommunity._id);
    await user.save();

    return createdCommunity;
  } catch (error) {
    // Handle any errors
    console.error("Error creating community:", error);
    throw error;
  }
}

export async function fetchCommunityDetails(id: string) {
  try {
    connectToDB();

    const communityDetails = await Community.findOne({ id }).populate([
      "createdBy",
      {
        path: "members",
        model: User,
        select: "name username image _id id",
      },
    ]).lean();

    if (!communityDetails) return null;

    // Serialize ObjectIds to strings
    return {
      _id: communityDetails._id.toString(),
      id: communityDetails.id,
      name: communityDetails.name,
      username: communityDetails.username,
      image: communityDetails.image,
      bio: communityDetails.bio,
      isPrivate: communityDetails.isPrivate,
      createdBy: communityDetails.createdBy ? {
        _id: (communityDetails.createdBy as any)._id?.toString(),
        id: (communityDetails.createdBy as any).id,
        name: (communityDetails.createdBy as any).name,
        username: (communityDetails.createdBy as any).username,
        image: (communityDetails.createdBy as any).image,
      } : null,
      members: (communityDetails.members as any[])?.map((member: any) => ({
        _id: member._id?.toString(),
        id: member.id,
        name: member.name,
        username: member.username,
        image: member.image,
      })) || [],
    };
  } catch (error) {
    // Handle any errors
    console.error("Error fetching community details:", error);
    throw error;
  }
}

export async function fetchCommunityPosts(id: string) {
  try {
    connectToDB();

    const communityPosts = await Community.findById(id).populate({
      path: "threads",
      model: Thread,
      populate: [
        {
          path: "author",
          model: User,
          select: "name image id", // Select the "name" and "_id" fields from the "User" model
        },
        {
          path: "children",
          model: Thread,
          populate: {
            path: "author",
            model: User,
            select: "image _id", // Select the "name" and "_id" fields from the "User" model
          },
        },
      ],
    });

    return communityPosts;
  } catch (error) {
    // Handle any errors
    console.error("Error fetching community posts:", error);
    throw error;
  }
}

export async function fetchCommunities({
  searchString = "",
  pageNumber = 1,
  pageSize = 20,
  sortBy = "desc",
}: {
  searchString?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: SortOrder;
}) {
  try {
    connectToDB();

    // Calculate the number of communities to skip based on the page number and page size.
    const skipAmount = (pageNumber - 1) * pageSize;

    // Create a case-insensitive regular expression for the provided search string.
    const regex = new RegExp(searchString, "i");

    // Create an initial query object to filter communities.
    const query: FilterQuery<typeof Community> = {};

    // If the search string is not empty, add the $or operator to match either username or name fields.
    if (searchString.trim() !== "") {
      query.$or = [
        { username: { $regex: regex } },
        { name: { $regex: regex } },
      ];
    }

    // Define the sort options for the fetched communities based on createdAt field and provided sort order.
    const sortOptions = { createdAt: sortBy };

    // Create a query to fetch the communities based on the search and sort criteria.
    const communitiesQuery = Community.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize)
      .populate("members");

    // Count the total number of communities that match the search criteria (without pagination).
    const totalCommunitiesCount = await Community.countDocuments(query);

    const communities = await communitiesQuery.exec();

    // Check if there are more communities beyond the current page.
    const isNext = totalCommunitiesCount > skipAmount + communities.length;

    return { communities, isNext };
  } catch (error) {
    console.error("Error fetching communities:", error);
    throw error;
  }
}

export async function addMemberToCommunity(
  communityId: string,
  memberId: string
) {
  try {
    connectToDB();

    // Find the community by its unique id
    const community = await Community.findOne({ id: communityId });

    if (!community) {
      throw new Error("Community not found");
    }

    // Find the user by their unique id
    const user = await User.findOne({ id: memberId });

    if (!user) {
      throw new Error("User not found");
    }

    // Check if the user is already a member of the community
    if (community.members.includes(user._id)) {
      throw new Error("User is already a member of the community");
    }

    // Add the user's _id to the members array in the community
    community.members.push(user._id);
    await community.save();

    // Add the community's _id to the communities array in the user
    user.communities.push(community._id);
    await user.save();

    return community;
  } catch (error) {
    // Handle any errors
    console.error("Error adding member to community:", error);
    throw error;
  }
}

export async function removeUserFromCommunity(
  userId: string,
  communityId: string
) {
  try {
    connectToDB();

    const userIdObject = await User.findOne({ id: userId }, { _id: 1 });
    const communityIdObject = await Community.findOne(
      { id: communityId },
      { _id: 1 }
    );

    if (!userIdObject) {
      throw new Error("User not found");
    }

    if (!communityIdObject) {
      throw new Error("Community not found");
    }

    // Remove the user's _id from the members array in the community
    await Community.updateOne(
      { _id: communityIdObject._id },
      { $pull: { members: userIdObject._id } }
    );

    // Remove the community's _id from the communities array in the user
    await User.updateOne(
      { _id: userIdObject._id },
      { $pull: { communities: communityIdObject._id } }
    );

    return { success: true };
  } catch (error) {
    // Handle any errors
    console.error("Error removing user from community:", error);
    throw error;
  }
}

export async function updateCommunityInfo(
  communityId: string,
  name: string,
  username: string,
  image: string
) {
  try {
    connectToDB();

    // Find the community by its _id and update the information
    const updatedCommunity = await Community.findOneAndUpdate(
      { id: communityId },
      { name, username, image }
    );

    if (!updatedCommunity) {
      throw new Error("Community not found");
    }

    return updatedCommunity;
  } catch (error) {
    // Handle any errors
    console.error("Error updating community information:", error);
    throw error;
  }
}

export async function deleteCommunity(communityId: string) {
  try {
    connectToDB();

    // Find the community by its ID and delete it
    const deletedCommunity = await Community.findOneAndDelete({
      id: communityId,
    });

    if (!deletedCommunity) {
      throw new Error("Community not found");
    }

    // Delete all threads associated with the community
    await Thread.deleteMany({ community: communityId });

    // Find all users who are part of the community
    const communityUsers = await User.find({ communities: communityId });

    // Remove the community from the 'communities' array for each user
    const updateUserPromises = communityUsers.map((user) => {
      user.communities.pull(communityId);
      return user.save();
    });

    await Promise.all(updateUserPromises);

    return deletedCommunity;
  } catch (error) {
    console.error("Error deleting community: ", error);
    throw error;
  }
}

export async function joinCommunity(
  communityId: string,
  userId: string,
  path: string
) {
  try {
    connectToDB();

    const community = await Community.findOne({ id: communityId });
    const user = await User.findOne({ id: userId });

    if (!community || !user) {
      throw new Error("Community or User not found");
    }

    // If private, add to join requests instead
    if (community.isPrivate) {
      if (!community.joinRequests.includes(user._id)) {
        community.joinRequests.push(user._id);
        await community.save();
      }
      return { status: "requested" };
    }

    // If public, add directly to members
    if (!community.members.includes(user._id)) {
      community.members.push(user._id);
      user.communities.push(community._id);
      
      await community.save();
      await user.save();
    }

    return { status: "joined" };
  } catch (error) {
    console.error("Error joining community:", error);
    throw error;
  }
}

export async function leaveCommunity(
  communityId: string,
  userId: string,
  path: string
) {
  try {
    connectToDB();

    const community = await Community.findOne({ id: communityId });
    const user = await User.findOne({ id: userId });

    if (!community || !user) {
      throw new Error("Community or User not found");
    }

    community.members.pull(user._id);
    user.communities.pull(community._id);

    await community.save();
    await user.save();

    return { status: "left" };
  } catch (error) {
    console.error("Error leaving community:", error);
    throw error;
  }
}

export async function approveJoinRequest(
  communityId: string,
  userId: string,
  approverId: string
) {
  try {
    connectToDB();

    const community = await Community.findOne({ id: communityId });
    const user = await User.findOne({ id: userId });
    const approver = await User.findOne({ id: approverId });

    if (!community || !user || !approver) {
      throw new Error("Community, User, or Approver not found");
    }

    // Check if approver is admin
    if (!community.admins.includes(approver._id) && !community.createdBy.equals(approver._id)) {
      throw new Error("Not authorized to approve requests");
    }

    // Remove from join requests and add to members
    community.joinRequests.pull(user._id);
    community.members.push(user._id);
    user.communities.push(community._id);

    await community.save();
    await user.save();

    return { status: "approved" };
  } catch (error) {
    console.error("Error approving join request:", error);
    throw error;
  }
}

export async function rejectJoinRequest(
  communityId: string,
  userId: string,
  rejecterId: string
) {
  try {
    connectToDB();

    const community = await Community.findOne({ id: communityId });
    const rejecter = await User.findOne({ id: rejecterId });

    if (!community || !rejecter) {
      throw new Error("Community or Rejecter not found");
    }

    // Check if rejecter is admin
    if (!community.admins.includes(rejecter._id) && !community.createdBy.equals(rejecter._id)) {
      throw new Error("Not authorized to reject requests");
    }

    const userObjectId = await User.findOne({ id: userId }).select("_id");
    if (userObjectId) {
      community.joinRequests.pull(userObjectId._id);
      await community.save();
    }

    return { status: "rejected" };
  } catch (error) {
    console.error("Error rejecting join request:", error);
    throw error;
  }
}

export async function addCommunityAdmin(
  communityId: string,
  userId: string,
  adminId: string
) {
  try {
    connectToDB();

    const community = await Community.findOne({ id: communityId });
    const user = await User.findOne({ id: userId });
    const admin = await User.findOne({ id: adminId });

    if (!community || !user || !admin) {
      throw new Error("Community, User, or Admin not found");
    }

    // Check if requester is creator
    if (!community.createdBy.equals(admin._id)) {
      throw new Error("Only creator can add admins");
    }

    if (!community.admins.includes(user._id)) {
      community.admins.push(user._id);
      await community.save();
    }

    return { status: "added" };
  } catch (error) {
    console.error("Error adding admin:", error);
    throw error;
  }
}
