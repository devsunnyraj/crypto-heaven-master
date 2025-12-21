"use server";

import { revalidatePath } from "next/cache";

import { connectToDB } from "../mongoose";

import User from "../models/user.model";
import Thread from "../models/thread.model";
import Community from "../models/community.model";

export async function fetchPosts(pageNumber = 1, pageSize = 20) {
  connectToDB();

  // Calculate the number of posts to skip based on the page number and page size.
  const skipAmount = (pageNumber - 1) * pageSize;

  // Create a query to fetch the posts that have no parent (top-level threads) (a thread that is not a comment/reply).
  const postsQuery = Thread.find({ parentId: { $in: [null, undefined] } })
    .sort({ createdAt: "desc" })
    .skip(skipAmount)
    .limit(pageSize)
    .populate({
      path: "author",
      model: User,
      select: "_id id name image",
    })
    .populate({
      path: "community",
      model: Community,
      select: "_id id name image",
    })
    .populate({
      path: "likes",
      model: User,
      select: "id",
    })
    .populate({
      path: "children", // Populate the children field
      populate: {
        path: "author", // Populate the author field within children
        model: User,
        select: "_id name parentId image", // Select only _id and username fields of the author
      },
    });

  // Count the total number of top-level posts (threads) i.e., threads that are not comments.
  const totalPostsCount = await Thread.countDocuments({
    parentId: { $in: [null, undefined] },
  }); // Get the total count of posts

  const posts = await postsQuery.exec();

  // Serialize posts to plain objects
  const postsWithLikes = posts.map(post => {
    const postObj = post.toObject();
    
    // Debug logging
    if (!postObj.author?.id) {
      console.log("⚠️ Post missing author.id:", {
        postId: postObj._id,
        authorData: postObj.author
      });
    }
    
    return {
      _id: postObj._id.toString(),
      text: postObj.text,
      parentId: postObj.parentId?.toString() || null,
      author: postObj.author ? {
        _id: postObj.author._id?.toString() || "",
        id: postObj.author.id || "",
        name: postObj.author.name || "",
        image: postObj.author.image || "",
      } : {
        _id: "",
        id: "",
        name: "Unknown",
        image: "",
      },
      community: postObj.community ? {
        _id: postObj.community._id?.toString() || "",
        id: postObj.community.id || "",
        name: postObj.community.name || "",
        image: postObj.community.image || "",
      } : null,
      createdAt: postObj.createdAt.toISOString(),
      children: postObj.children?.map((child: any) => ({
        author: {
          image: child.author?.image,
        },
      })) || [],
      likes: postObj.likes?.map((like: any) => like.id) || [],
    };
  });

  const isNext = totalPostsCount > skipAmount + posts.length;

  return { posts: postsWithLikes, isNext };
}

interface Params {
  text: string,
  author: string,
  communityId: string | null,
  path: string,
}

export async function createThread({ text, author, communityId, path }: Params
) {
  try {
    connectToDB();

    const communityIdObject = await Community.findOne(
      { id: communityId },
      { _id: 1 }
    );

    const createdThread = await Thread.create({
      text,
      author,
      community: communityIdObject, // Assign communityId if provided, or leave it null for personal account
    });

    // Update User model
    await User.findByIdAndUpdate(author, {
      $push: { threads: createdThread._id },
    });

    if (communityIdObject) {
      // Update Community model
      await Community.findByIdAndUpdate(communityIdObject, {
        $push: { threads: createdThread._id },
      });
    }

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to create thread: ${error.message}`);
  }
}

async function fetchAllChildThreads(threadId: string): Promise<any[]> {
  const childThreads = await Thread.find({ parentId: threadId });

  const descendantThreads = [];
  for (const childThread of childThreads) {
    const descendants = await fetchAllChildThreads(childThread._id);
    descendantThreads.push(childThread, ...descendants);
  }

  return descendantThreads;
}

export async function deleteThread(id: string, path: string): Promise<void> {
  try {
    connectToDB();

    // Find the thread to be deleted (the main thread)
    const mainThread = await Thread.findById(id).populate("author community");

    if (!mainThread) {
      throw new Error("Thread not found");
    }

    // Fetch all child threads and their descendants recursively
    const descendantThreads = await fetchAllChildThreads(id);

    // Get all descendant thread IDs including the main thread ID and child thread IDs
    const descendantThreadIds = [
      id,
      ...descendantThreads.map((thread) => thread._id),
    ];

    // Extract the authorIds and communityIds to update User and Community models respectively
    const uniqueAuthorIds = new Set(
      [
        ...descendantThreads.map((thread) => thread.author?._id?.toString()), // Use optional chaining to handle possible undefined values
        mainThread.author?._id?.toString(),
      ].filter((id) => id !== undefined)
    );

    const uniqueCommunityIds = new Set(
      [
        ...descendantThreads.map((thread) => thread.community?._id?.toString()), // Use optional chaining to handle possible undefined values
        mainThread.community?._id?.toString(),
      ].filter((id) => id !== undefined)
    );

    // Recursively delete child threads and their descendants
    await Thread.deleteMany({ _id: { $in: descendantThreadIds } });

    // Update User model
    await User.updateMany(
      { _id: { $in: Array.from(uniqueAuthorIds) } },
      { $pull: { threads: { $in: descendantThreadIds } } }
    );

    // Update Community model
    await Community.updateMany(
      { _id: { $in: Array.from(uniqueCommunityIds) } },
      { $pull: { threads: { $in: descendantThreadIds } } }
    );

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to delete thread: ${error.message}`);
  }
}

export async function fetchThreadById(threadId: string) {
  connectToDB();

  try {
    const thread = await Thread.findById(threadId)
      .populate({
        path: "author",
        model: User,
        select: "_id id name image",
      }) // Populate the author field with _id and username
      .populate({
        path: "community",
        model: Community,
        select: "_id id name image",
      }) // Populate the community field with _id and name
      .populate({
        path: "children", // Populate the children field
        populate: [
          {
            path: "author", // Populate the author field within children
            model: User,
            select: "_id id name parentId image", // Select only _id and username fields of the author
          },
          {
            path: "children", // Populate the children field within children
            model: Thread, // The model of the nested children (assuming it's the same "Thread" model)
            populate: {
              path: "author", // Populate the author field within nested children
              model: User,
              select: "_id id name parentId image", // Select only _id and username fields of the author
            },
          },
        ],
      })
      .populate({
        path: "likes",
        model: User,
        select: "id",
      })
      .lean();

    if (!thread) return null;

    // Serialize to plain object
    const serializedThread = {
      _id: thread._id.toString(),
      text: thread.text,
      parentId: thread.parentId?.toString() || null,
      author: {
        _id: thread.author._id.toString(),
        id: thread.author.id,
        name: thread.author.name,
        image: thread.author.image,
      },
      community: thread.community ? {
        _id: thread.community._id.toString(),
        id: thread.community.id,
        name: thread.community.name,
        image: thread.community.image,
      } : null,
      createdAt: thread.createdAt,
      children: thread.children?.map((child: any) => ({
        _id: child._id.toString(),
        text: child.text,
        parentId: child.parentId?.toString(),
        author: {
          _id: child.author._id.toString(),
          id: child.author.id,
          name: child.author.name,
          image: child.author.image,
        },
        createdAt: child.createdAt,
        children: child.children || [],
      })) || [],
      likes: thread.likes?.map((like: any) => like.id) || [],
    };

    return serializedThread;
  } catch (err) {
    console.error("Error while fetching thread:", err);
    throw new Error("Unable to fetch thread");
  }
}

export async function addCommentToThread(
  threadId: string,
  commentText: string,
  userId: string,
  path: string
) {
  connectToDB();

  try {
    // Find the original thread by its ID
    const originalThread = await Thread.findById(threadId);

    if (!originalThread) {
      throw new Error("Thread not found");
    }

    // Create the new comment thread
    const commentThread = new Thread({
      text: commentText,
      author: userId,
      parentId: threadId, // Set the parentId to the original thread's ID
    });

    // Save the comment thread to the database
    const savedCommentThread = await commentThread.save();

    // Add the comment thread's ID to the original thread's children array
    originalThread.children.push(savedCommentThread._id);

    // Save the updated original thread to the database
    await originalThread.save();

    revalidatePath(path);
  } catch (err) {
    console.error("Error while adding comment:", err);
    throw new Error("Unable to add comment");
  }
}

export async function likeThread(
  threadId: string,
  userId: string,
  path: string
) {
  try {
    connectToDB();

    const thread = await Thread.findById(threadId);

    if (!thread) {
      throw new Error("Thread not found");
    }

    const user = await User.findOne({ id: userId }, { _id: 1 }).lean();
    
    if (!user) {
      throw new Error("User not found");
    }

    const likeIndex = thread.likes.findIndex((id: any) => id.toString() === user._id.toString());

    if (likeIndex > -1) {
      // User has already liked, so unlike
      thread.likes.splice(likeIndex, 1);
    } else {
      // User hasn't liked, so add like
      thread.likes.push(user._id);
    }

    await thread.save();
    revalidatePath(path);
    
    return { liked: likeIndex === -1, likeCount: thread.likes.length };
  } catch (err: any) {
    console.error("Error while liking thread:", err);
    throw new Error(`Unable to like thread: ${err.message}`);
  }
}
