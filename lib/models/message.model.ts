import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  text: {
    type: String,
    required: false,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Community",
    required: true,
  },
  image: {
    type: String,
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Delete the cached model to ensure we use the updated schema
if (mongoose.models.Message) {
  delete mongoose.models.Message;
}

const Message = mongoose.model("Message", messageSchema);

export default Message;
