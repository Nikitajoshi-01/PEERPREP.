import { Message } from "../models/Message.js";
import { Group } from "../models/Group.js";

const chatSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // ─── JOIN GROUP ROOM ─────────────────────────────────────
    socket.on("joinGroup", async ({ groupId, userId }) => {
      // verify user is a member before letting them join the room
      const group = await Group.findById(groupId);
      if (!group) return socket.emit("error", "Group not found");

      const isMember = group.members.some((m) => m.toString() === userId);
      if (!isMember) return socket.emit("error", "Not a group member");

      socket.join(groupId);
      console.log(`User ${userId} joined room ${groupId}`);
      socket.to(groupId).emit("userJoined", { userId });
    });

    // ─── SEND MESSAGE ─────────────────────────────────────────
    socket.on("sendMessage", async ({ groupId, senderId, content }) => {
      if (!content?.trim()) return;

      try {
        // save message to DB
        const message = await Message.create({
          groupId,
          sender: senderId,
          content: content.trim(),
        });

        // populate sender info before emitting
        const populated = await message.populate(
          "sender",
          "fullName username avatar"
        );

        // emit to everyone in the room including sender
        io.to(groupId).emit("newMessage", populated);
      } catch (error) {
        socket.emit("error", "Failed to send message");
      }
    });

    // ─── TYPING INDICATOR ────────────────────────────────────
    socket.on("typing", ({ groupId, username }) => {
      socket.to(groupId).emit("userTyping", { username });
    });

    socket.on("stopTyping", ({ groupId }) => {
      socket.to(groupId).emit("userStoppedTyping");
    });

    // ─── DISCONNECT ──────────────────────────────────────────
    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

export { chatSocket };