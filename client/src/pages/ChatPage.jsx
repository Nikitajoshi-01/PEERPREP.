import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import useAuthStore from "../store/authStore.js";
import useSocket from "../hooks/useSocket.js";
import toast from "react-hot-toast";

// ─── SINGLE MESSAGE BUBBLE ────────────────────────────────────────
const MessageBubble = ({ message, isOwn }) => {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      {!isOwn && (
        <img
          src={message.sender?.avatar}
          alt={message.sender?.username}
          className="w-7 h-7 rounded-full object-cover flex-shrink-0 mb-1"
        />
      )}

      <div className={`max-w-[70%] space-y-1 ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
        {/* Sender name — only for others */}
        {!isOwn && (
          <span className="text-xs text-gray-500 px-1">{message.sender?.fullName}</span>
        )}

        {/* Bubble */}
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isOwn
              ? "bg-indigo-600 text-white rounded-br-sm"
              : "bg-gray-800 text-gray-100 rounded-bl-sm"
          }`}
        >
          {message.content}
        </div>

        {/* Time */}
        <span className="text-xs text-gray-600 px-1">{time}</span>
      </div>
    </div>
  );
};

// ─── MAIN CHAT PAGE ───────────────────────────────────────────────
const ChatPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { joinGroup, sendMessage, onMessage, emitTyping, emitStopTyping } = useSocket();

  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState(null);
  const [showMembers, setShowMembers] = useState(false);

  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  // ─── LOAD GROUP + MESSAGES ───────────────────────────────────
  useEffect(() => {
    if (!groupId) return;
    fetchGroupAndMessages();
  }, [groupId]);

  const fetchGroupAndMessages = async () => {
    setLoading(true);
    try {
      const [groupRes, msgRes] = await Promise.all([
        api.get(`/match/groups`),
        api.get(`/groups/${groupId}/messages`),
      ]);

      const found = groupRes.data.data.find((g) => g._id === groupId);
      if (!found) {
        toast.error("Group not found or you're not a member");
        navigate("/dashboard");
        return;
      }

      setGroup(found);
      setMessages(msgRes.data.data);
    } catch (err) {
      toast.error("Failed to load chat");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  // ─── JOIN SOCKET ROOM ────────────────────────────────────────
  useEffect(() => {
    if (!groupId || !user) return;

    // small delay to ensure socket is connected
    const timer = setTimeout(() => {
      joinGroup(groupId);
    }, 500);

    // listen for new messages
    const cleanup = onMessage((msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      clearTimeout(timer);
      cleanup?.();
    };
  }, [groupId, user]);

  // ─── TYPING INDICATOR ────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const socket = window._socket;
    // listen for typing events via the hook indirectly
  }, []);

  // ─── AUTO SCROLL ─────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  // ─── SEND MESSAGE ────────────────────────────────────────────
  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    sendMessage(groupId, input.trim());
    setInput("");
    emitStopTyping(groupId);
  };

  // ─── TYPING HANDLER ──────────────────────────────────────────
  const handleTyping = (e) => {
    setInput(e.target.value);
    emitTyping(groupId);

    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      emitStopTyping(groupId);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-950 flex flex-col">

      {/* ── HEADER ── */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-gray-400 hover:text-white transition-colors p-1"
        >
          ←
        </button>

        <div className="flex-1 min-w-0">
          <h2 className="text-white font-semibold text-sm truncate">{group?.name}</h2>
          <p className="text-gray-500 text-xs">{group?.members?.length} members</p>
        </div>

        <button
          onClick={() => setShowMembers((v) => !v)}
          className="text-gray-400 hover:text-white text-xs bg-gray-800 px-3 py-1.5 rounded-lg transition-colors"
        >
          Members
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── MESSAGES ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full space-y-2">
                <div className="text-4xl">💬</div>
                <p className="text-gray-500 text-sm">No messages yet. Say hello!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <MessageBubble
                  key={msg._id}
                  message={msg}
                  isOwn={msg.sender?._id === user?._id || msg.sender === user?._id}
                />
              ))
            )}

            {/* Typing indicator */}
            {typingUser && (
              <div className="flex items-center gap-2">
                <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-2.5">
                  <div className="flex gap-1 items-center">
                    <span className="text-xs text-gray-400">{typingUser} is typing</span>
                    <span className="flex gap-0.5 ml-1">
                      <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ── INPUT ── */}
          <div className="px-4 py-3 bg-gray-900 border-t border-gray-800 flex-shrink-0">
            <form onSubmit={handleSend} className="flex gap-2 items-center">
              <input
                value={input}
                onChange={handleTyping}
                placeholder="Type a message..."
                className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-600"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        </div>

        {/* ── MEMBERS SIDEBAR ── */}
        {showMembers && (
          <div className="w-60 bg-gray-900 border-l border-gray-800 flex flex-col flex-shrink-0">
            <div className="px-4 py-3 border-b border-gray-800">
              <h3 className="text-white text-sm font-semibold">Members</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {group?.members?.map((m) => {
                const isAdmin = group.admin?._id === m._id || group.admin === m._id;
                return (
                  <div key={m._id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-800 transition-colors">
                    <img
                      src={m.avatar}
                      alt={m.username}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-xs font-medium truncate">{m.fullName}</p>
                      <p className="text-gray-500 text-xs truncate">@{m.username}</p>
                    </div>
                    {isAdmin && <span className="text-base">👑</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;