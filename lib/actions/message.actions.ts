"use server";

import { revalidatePath } from "next/cache";
import { connectToDB } from "../mongoose";
import Message from "../models/message.model";
import User from "../models/user.model";
import Community from "../models/community.model";

export async function sendMessage(
  text: string,
  authorId: string,
  communityId: string,
  path: string,
  image?: string,
  replyToId?: string
) {
  try {
    connectToDB();

    const user = await User.findOne({ id: authorId });
    const community = await Community.findOne({ id: communityId });

    if (!user || !community) {
      throw new Error("User or Community not found");
    }

    // Check if user is a member
    if (!community.members.includes(user._id)) {
      throw new Error("Only members can send messages");
    }

    const messageData: any = {
      author: user._id,
      community: community._id,
    };

    if (text) messageData.text = text;
    if (image) messageData.image = image;
    if (replyToId) {
      const replyMessage = await Message.findById(replyToId);
      if (replyMessage) {
        messageData.replyTo = replyMessage._id;
      }
    }

    const message = await Message.create(messageData);

    revalidatePath(path);
    return { success: true, message };
  } catch (error: any) {
    console.error("Error sending message:", error);
    throw new Error(`Failed to send message: ${error.message}`);
  }
}

export async function likeMessage(
  messageId: string,
  userId: string,
  path: string
) {
  try {
    connectToDB();

    const message = await Message.findById(messageId);
    const user = await User.findOne({ id: userId });

    if (!message || !user) {
      throw new Error("Message or User not found");
    }

    const likeIndex = message.likes.findIndex((id: any) => id.toString() === user._id.toString());

    if (likeIndex > -1) {
      message.likes.splice(likeIndex, 1);
    } else {
      message.likes.push(user._id);
    }

    await message.save();
    revalidatePath(path);
    
    return { liked: likeIndex === -1, likeCount: message.likes.length };
  } catch (error: any) {
    console.error("Error liking message:", error);
    throw new Error(`Failed to like message: ${error.message}`);
  }
}

export async function deleteMessage(
  messageId: string,
  path: string
) {
  try {
    connectToDB();

    const message = await Message.findById(messageId);

    if (!message) {
      throw new Error("Message not found");
    }

    await Message.findByIdAndDelete(messageId);
    revalidatePath(path);
    
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting message:", error);
    throw new Error(`Failed to delete message: ${error.message}`);
  }
}

export async function fetchCommunityMessages(communityId: string, pageSize = 50) {
  try {
    connectToDB();

    const community = await Community.findOne({ id: communityId });
    
    if (!community) {
      throw new Error("Community not found");
    }

    const messages = await Message.find({ community: community._id })
      .sort({ createdAt: 1 })
      .limit(pageSize)
      .populate({
        path: "author",
        model: User,
        select: "name image id",
      })
      .populate({
        path: "likes",
        model: User,
        select: "id",
      })
      .lean();

    // Manually populate replyTo to avoid strictPopulate issues
    const messagesWithReplies = await Promise.all(
      messages.map(async (msg: any) => {
        if (msg.replyTo) {
          const replyMsg = await Message.findById(msg.replyTo)
            .populate({
              path: "author",
              model: User,
              select: "name id",
            })
            .lean();
          msg.replyTo = replyMsg;
        }
        return msg;
      })
    );

    const messagesWithLikes = messagesWithReplies.map((msg: any) => ({
      _id: msg._id.toString(),
      text: msg.text || "",
      image: msg.image || null,
      author: msg.author ? {
        _id: msg.author._id?.toString(),
        name: msg.author.name,
        image: msg.author.image,
        id: msg.author.id,
      } : null,
      community: msg.community?.toString() || null,
      createdAt: msg.createdAt?.toISOString() || new Date().toISOString(),
      replyTo: msg.replyTo ? {
        _id: msg.replyTo._id?.toString(),
        text: msg.replyTo.text || "",
        author: msg.replyTo.author ? {
          _id: msg.replyTo.author._id?.toString(),
          name: msg.replyTo.author.name,
          id: msg.replyTo.author.id,
        } : null,
      } : null,
      likes: Array.isArray(msg.likes) ? msg.likes.map((like: any) => 
        typeof like === 'string' ? like : (like?.id || like?._id?.toString())
      ) : [],
    }));

    return messagesWithLikes;
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    throw new Error(`Failed to fetch messages: ${error.message}`);
  }
}
