import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import useAuthStore from "../store/authStore.js";
import useSocket from "../hooks/useSocket.js";
import toast from "react-hot-toast";

// ─── MESSAGE BUBBLE ───────────────────────────────────────────────
const MessageBubble = ({ message, isOwn }) => {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {!isOwn && (
        <img
          src={message.sender?.avatar}
          alt={message.sender?.username}
          className="w-7 h-7 rounded-full object-cover flex-shrink-0 mb-1"
        />
      )}
      <div className={`max-w-[70%] space-y-1 flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
        {!isOwn && (
          <span className="text-xs text-gray-500 px-1">{message.sender?.fullName}</span>
        )}
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isOwn
            ? "bg-indigo-600 text-white rounded-br-sm"
            : "bg-gray-800 text-gray-100 rounded-bl-sm"
        }`}>
          {message.content}
        </div>
        <span className="text-xs text-gray-600 px-1">{time}</span>
      </div>
    </div>
  );
};

// ─── TYPING INDICATOR ─────────────────────────────────────────────
const TypingIndicator = ({ username }) => (
  <div className="flex items-center gap-2">
    <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-2.5">
      <div className="flex gap-1 items-center">
        <span className="text-xs text-gray-400">{username} is typing</span>
        <span className="flex gap-0.5 ml-1">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </span>
      </div>
    </div>
  </div>
);

// ─── MEMBERS SIDEBAR ──────────────────────────────────────────────
const MembersSidebar = ({ group }) => (
  <div className="w-60 bg-gray-900 border-l border-gray-800 flex flex-col flex-shrink-0">
    <div className="px-4 py-3 border-b border-gray-800">
      <h3 className="text-white text-sm font-semibold">
        Members ({group?.members?.length})
      </h3>
      {group?.description && (
        <p className="text-gray-500 text-xs mt-1">{group.description}</p>
      )}
    </div>
    <div className="flex-1 overflow-y-auto p-3 space-y-1">
      {group?.members?.map((m) => {
        const isAdmin =
          group.admin?._id === m._id || group.admin === m._id;
        return (
          <div
            key={m._id}
            className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
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
);

// ─── MAIN CHAT PAGE ───────────────────────────────────────────────
const ChatPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    joinGroup,
    sendMessage,
    onMessage,
    onTyping,
    onStopTyping,
    emitTyping,
    emitStopTyping,
  } = useSocket();

  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState(null);
  const [showMembers, setShowMembers] = useState(false);

  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  // ─── LOAD GROUP + MESSAGES ─────────────────────────────────
  useEffect(() => {
    if (!groupId) return;
    fetchData();
  }, [groupId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [groupRes, msgRes] = await Promise.all([
        api.get("/match/groups"),
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
    } catch {
      toast.error("Failed to load chat");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  // ─── JOIN SOCKET ROOM ──────────────────────────────────────
  useEffect(() => {
    if (!groupId || !user) return;

    const timer = setTimeout(() => {
      joinGroup(groupId);
    }, 500);

    const cleanupMsg = onMessage((msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    const cleanupTyping = onTyping(({ username }) => {
      if (username !== user.username) setTypingUser(username);
    });

    const cleanupStop = onStopTyping(() => {
      setTypingUser(null);
    });

    return () => {
      clearTimeout(timer);
      cleanupMsg?.();
      cleanupTyping?.();
      cleanupStop?.();
    };
  }, [groupId, user]);

  // ─── AUTO SCROLL ───────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  // ─── SEND ──────────────────────────────────────────────────
  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(groupId, input.trim());
    setInput("");
    emitStopTyping(groupId);
  };

  // ─── TYPING ────────────────────────────────────────────────
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
    <div className="h-screen bg-gray-950 flex flex-col overflow-hidden">

      {/* HEADER */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-gray-400 hover:text-white transition-colors text-lg leading-none"
        >
          ←
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-semibold text-sm truncate">{group?.name}</h2>
          <p className="text-gray-500 text-xs">
            {group?.members?.length} members
          </p>
        </div>
        <button
          onClick={() => setShowMembers((v) => !v)}
          className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
            showMembers
              ? "bg-indigo-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          Members
        </button>
      </div>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">

        {/* MESSAGES AREA */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full space-y-2 text-center">
                <div className="text-5xl">💬</div>
                <p className="text-gray-400 text-sm font-medium">No messages yet</p>
                <p className="text-gray-600 text-xs">Be the first to say something!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <MessageBubble
                  key={msg._id}
                  message={msg}
                  isOwn={
                    msg.sender?._id === user?._id ||
                    msg.sender === user?._id
                  }
                />
              ))
            )}

            {typingUser && <TypingIndicator username={typingUser} />}
            <div ref={bottomRef} />
          </div>

          {/* INPUT */}
          <div className="px-4 py-3 bg-gray-900 border-t border-gray-800 flex-shrink-0">
            <form onSubmit={handleSend} className="flex gap-2 items-center">
              <input
                value={input}
                onChange={handleTyping}
                placeholder="Type a message..."
                autoFocus
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

        {/* MEMBERS SIDEBAR */}
        {showMembers && <MembersSidebar group={group} />}
      </div>
    </div>
  );
};

export default ChatPage;