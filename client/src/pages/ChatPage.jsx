// import { useEffect, useRef, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import api from "../api/axios.js";
// import useAuthStore from "../store/authStore.js";
// import useSocket from "../hooks/useSocket.js";
// import toast from "react-hot-toast";

// // ─── MESSAGE BUBBLE ───────────────────────────────────────────────
// const MessageBubble = ({ message, isOwn }) => {
//   const time = new Date(message.createdAt).toLocaleTimeString([], {
//     hour: "2-digit",
//     minute: "2-digit",
//   });

//   return (
//     <div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
//       {!isOwn && (
//         <img
//           src={message.sender?.avatar}
//           alt={message.sender?.username}
//           className="w-7 h-7 rounded-full object-cover flex-shrink-0 mb-1"
//         />
//       )}
//       <div className={`max-w-[70%] space-y-1 flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
//         {!isOwn && (
//           <span className="text-xs text-gray-500 px-1">{message.sender?.fullName}</span>
//         )}
//         <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
//           isOwn
//             ? "bg-indigo-600 text-white rounded-br-sm"
//             : "bg-gray-800 text-gray-100 rounded-bl-sm"
//         }`}>
//           {message.content}
//         </div>
//         <span className="text-xs text-gray-600 px-1">{time}</span>
//       </div>
//     </div>
//   );
// };

// // ─── TYPING INDICATOR ─────────────────────────────────────────────
// const TypingIndicator = ({ username }) => (
//   <div className="flex items-center gap-2">
//     <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-2.5">
//       <div className="flex gap-1 items-center">
//         <span className="text-xs text-gray-400">{username} is typing</span>
//         <span className="flex gap-0.5 ml-1">
//           {[0, 150, 300].map((delay) => (
//             <span
//               key={delay}
//               className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
//               style={{ animationDelay: `${delay}ms` }}
//             />
//           ))}
//         </span>
//       </div>
//     </div>
//   </div>
// );

// // ─── MEMBERS SIDEBAR ──────────────────────────────────────────────
// const MembersSidebar = ({ group }) => (
//   <div className="w-60 bg-gray-900 border-l border-gray-800 flex flex-col flex-shrink-0">
//     <div className="px-4 py-3 border-b border-gray-800">
//       <h3 className="text-white text-sm font-semibold">
//         Members ({group?.members?.length})
//       </h3>
//       {group?.description && (
//         <p className="text-gray-500 text-xs mt-1">{group.description}</p>
//       )}
//     </div>
//     <div className="flex-1 overflow-y-auto p-3 space-y-1">
//       {group?.members?.map((m) => {
//         const isAdmin =
//           group.admin?._id === m._id || group.admin === m._id;
//         return (
//           <div
//             key={m._id}
//             className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-800 transition-colors"
//           >
//             <img
//               src={m.avatar}
//               alt={m.username}
//               className="w-8 h-8 rounded-full object-cover flex-shrink-0"
//             />
//             <div className="min-w-0 flex-1">
//               <p className="text-white text-xs font-medium truncate">{m.fullName}</p>
//               <p className="text-gray-500 text-xs truncate">@{m.username}</p>
//             </div>
//             {isAdmin && <span className="text-base">👑</span>}
//           </div>
//         );
//       })}
//     </div>
//   </div>
// );

// // ─── MAIN CHAT PAGE ───────────────────────────────────────────────
// const ChatPage = () => {
//   const { groupId } = useParams();
//   const navigate = useNavigate();
//   const { user } = useAuthStore();
//   const {
//     joinGroup,
//     sendMessage,
//     onMessage,
//     onTyping,
//     onStopTyping,
//     emitTyping,
//     emitStopTyping,
//   } = useSocket();

//   const [group, setGroup] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [typingUser, setTypingUser] = useState(null);
//   const [showMembers, setShowMembers] = useState(false);

//   const bottomRef = useRef(null);
//   const typingTimeout = useRef(null);

//   // ─── LOAD GROUP + MESSAGES ─────────────────────────────────
//   useEffect(() => {
//     if (!groupId) return;
//     fetchData();
//   }, [groupId]);

//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       const [groupRes, msgRes] = await Promise.all([
//         api.get("/match/groups"),
//         api.get(`/groups/${groupId}/messages`),
//       ]);

//       const found = groupRes.data.data.find((g) => g._id === groupId);
//       if (!found) {
//         toast.error("Group not found or you're not a member");
//         navigate("/dashboard");
//         return;
//       }

//       setGroup(found);
//       setMessages(msgRes.data.data);
//     } catch {
//       toast.error("Failed to load chat");
//       navigate("/dashboard");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ─── JOIN SOCKET ROOM ──────────────────────────────────────
//   useEffect(() => {
//     if (!groupId || !user) return;

//     const timer = setTimeout(() => {
//       joinGroup(groupId);
//     }, 500);

//     const cleanupMsg = onMessage((msg) => {
//       setMessages((prev) => [...prev, msg]);
//     });

//     const cleanupTyping = onTyping(({ username }) => {
//       if (username !== user.username) setTypingUser(username);
//     });

//     const cleanupStop = onStopTyping(() => {
//       setTypingUser(null);
//     });

//     return () => {
//       clearTimeout(timer);
//       cleanupMsg?.();
//       cleanupTyping?.();
//       cleanupStop?.();
//     };
//   }, [groupId, user]);

//   // ─── AUTO SCROLL ───────────────────────────────────────────
//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages, typingUser]);

//   // ─── SEND ──────────────────────────────────────────────────
//   const handleSend = (e) => {
//     e.preventDefault();
//     if (!input.trim()) return;
//     sendMessage(groupId, input.trim());
//     setInput("");
//     emitStopTyping(groupId);
//   };

//   // ─── TYPING ────────────────────────────────────────────────
//   const handleTyping = (e) => {
//     setInput(e.target.value);
//     emitTyping(groupId);
//     clearTimeout(typingTimeout.current);
//     typingTimeout.current = setTimeout(() => {
//       emitStopTyping(groupId);
//     }, 1500);
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-950 flex items-center justify-center">
//         <p className="text-gray-400 text-sm">Loading chat...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="h-screen bg-gray-950 flex flex-col overflow-hidden">

//       {/* HEADER */}
//       <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3 flex-shrink-0">
//         <button
//           onClick={() => navigate("/dashboard")}
//           className="text-gray-400 hover:text-white transition-colors text-lg leading-none"
//         >
//           ←
//         </button>
//         <div className="flex-1 min-w-0">
//           <h2 className="text-white font-semibold text-sm truncate">{group?.name}</h2>
//           <p className="text-gray-500 text-xs">
//             {group?.members?.length} members
//           </p>
//         </div>
//         <button
//           onClick={() => setShowMembers((v) => !v)}
//           className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
//             showMembers
//               ? "bg-indigo-600 text-white"
//               : "bg-gray-800 text-gray-400 hover:text-white"
//           }`}
//         >
//           Members
//         </button>
//       </div>

//       {/* BODY */}
//       <div className="flex flex-1 overflow-hidden">

//         {/* MESSAGES AREA */}
//         <div className="flex-1 flex flex-col overflow-hidden">
//           <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
//             {messages.length === 0 ? (
//               <div className="flex flex-col items-center justify-center h-full space-y-2 text-center">
//                 <div className="text-5xl">💬</div>
//                 <p className="text-gray-400 text-sm font-medium">No messages yet</p>
//                 <p className="text-gray-600 text-xs">Be the first to say something!</p>
//               </div>
//             ) : (
//               messages.map((msg) => (
//                 <MessageBubble
//                   key={msg._id}
//                   message={msg}
//                   isOwn={
//                     msg.sender?._id === user?._id ||
//                     msg.sender === user?._id
//                   }
//                 />
//               ))
//             )}

//             {typingUser && <TypingIndicator username={typingUser} />}
//             <div ref={bottomRef} />
//           </div>

//           {/* INPUT */}
//           <div className="px-4 py-3 bg-gray-900 border-t border-gray-800 flex-shrink-0">
//             <form onSubmit={handleSend} className="flex gap-2 items-center">
//               <input
//                 value={input}
//                 onChange={handleTyping}
//                 placeholder="Type a message..."
//                 autoFocus
//                 className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-600"
//               />
//               <button
//                 type="submit"
//                 disabled={!input.trim()}
//                 className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
//               >
//                 Send
//               </button>
//             </form>
//           </div>
//         </div>

//         {/* MEMBERS SIDEBAR */}
//         {showMembers && <MembersSidebar group={group} />}
//       </div>
//     </div>
//   );
// };

// export default ChatPage;













import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import useAuthStore from "../store/authStore.js";
import useSocket from "../hooks/useSocket.js";
import toast from "react-hot-toast";

// ─── AI SHARE MODAL ───────────────────────────────────────────────
const AIShareModal = ({ question, answer, onShare, onKeepPrivate, onClose }) => (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🤖</span>
        <h3 className="text-white font-semibold text-base">AI Reply Ready</h3>
      </div>

      {/* Question */}
      <div className="bg-gray-800 rounded-xl px-4 py-3">
        <p className="text-xs text-gray-500 mb-1">Your question</p>
        <p className="text-gray-200 text-sm">{question}</p>
      </div>

      {/* Answer */}
      <div className="bg-indigo-950/60 border border-indigo-800/50 rounded-xl px-4 py-3 max-h-52 overflow-y-auto">
        <p className="text-xs text-indigo-400 mb-1">AI Answer</p>
        <p className="text-indigo-100 text-sm leading-relaxed whitespace-pre-wrap">{answer}</p>
      </div>

      {/* Actions */}
      <p className="text-gray-400 text-xs text-center">
        Share this answer with the group or keep it just for you?
      </p>
      <div className="flex gap-3">
        <button
          onClick={onShare}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
        >
          Share with Group
        </button>
        <button
          onClick={onKeepPrivate}
          className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium py-2.5 rounded-xl transition-colors"
        >
          Keep Private
        </button>
      </div>
      <button
        onClick={onClose}
        className="w-full text-gray-600 hover:text-gray-400 text-xs py-1"
      >
        Dismiss
      </button>
    </div>
  </div>
);

// ─── AI PANEL ─────────────────────────────────────────────────────
const AIPanel = ({ group, onAskAI, aiLoading }) => {
  const [panelInput, setPanelInput] = useState("");

  const handleAsk = (e) => {
    e.preventDefault();
    if (!panelInput.trim()) return;
    onAskAI(panelInput.trim());
    setPanelInput("");
  };

  return (
    <div className="w-72 bg-gray-900 border-l border-gray-800 flex flex-col flex-shrink-0">
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <div>
            <h3 className="text-white text-sm font-semibold">AI Assistant</h3>
            <p className="text-gray-500 text-xs">
              Ask about {group?.subjects?.slice(0, 2).join(", ") || "group topics"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">
        <div className="bg-gray-800/60 rounded-xl p-3 space-y-1.5">
          <p className="text-xs text-gray-400 font-medium">Group Context</p>
          {group?.subjects?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {group.subjects.map((s) => (
                <span key={s} className="text-xs bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded-full">{s}</span>
              ))}
            </div>
          )}
          {group?.interests?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {group.interests.map((i) => (
                <span key={i} className="text-xs bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded-full">{i}</span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <p className="text-xs text-gray-500 font-medium">Try asking:</p>
          {[
            `Explain ${group?.subjects?.[0] || "this topic"} briefly`,
            `Best resources for ${group?.interests?.[0] || "our interest"}`,
            `Give me practice problems`,
          ].map((hint) => (
            <button
              key={hint}
              onClick={() => onAskAI(hint)}
              disabled={aiLoading}
              className="w-full text-left text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors disabled:opacity-40"
            >
              {hint}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 border-t border-gray-800">
        <form onSubmit={handleAsk} className="flex flex-col gap-2">
          <textarea
            value={panelInput}
            onChange={(e) => setPanelInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAsk(e); }
            }}
            placeholder="Ask the AI anything about your group topics..."
            rows={3}
            className="w-full bg-gray-800 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-600 resize-none"
          />
          <button
            type="submit"
            disabled={!panelInput.trim() || aiLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-medium py-2 rounded-lg transition-colors"
          >
            {aiLoading ? "Thinking..." : "Ask AI ✦"}
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── MESSAGE BUBBLE ───────────────────────────────────────────────
const MessageBubble = ({ message, isOwn }) => {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit", minute: "2-digit",
  });

  // AI message style
  if (message.isAI) {
    return (
      <div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mb-1 text-xs">
          🤖
        </div>
        <div className="max-w-[75%] space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-indigo-400 font-medium">AI Assistant</span>
            {message.isPrivate && (
              <span className="text-xs text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded-full">only you</span>
            )}
          </div>
          <div className="bg-indigo-950/70 border border-indigo-800/50 text-indigo-100 px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
          <span className="text-xs text-gray-600 px-1">{time}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {!isOwn && (
        <img src={message.sender?.avatar} alt={message.sender?.username}
          className="w-7 h-7 rounded-full object-cover flex-shrink-0 mb-1" />
      )}
      <div className={`max-w-[70%] space-y-1 flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
        {!isOwn && (
          <span className="text-xs text-gray-500 px-1">{message.sender?.fullName}</span>
        )}
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isOwn ? "bg-indigo-600 text-white rounded-br-sm" : "bg-gray-800 text-gray-100 rounded-bl-sm"
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
            <span key={delay} className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: `${delay}ms` }} />
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
      <h3 className="text-white text-sm font-semibold">Members ({group?.members?.length})</h3>
      {group?.description && <p className="text-gray-500 text-xs mt-1">{group.description}</p>}
    </div>
    <div className="flex-1 overflow-y-auto p-3 space-y-1">
      {group?.members?.map((m) => {
        const isAdmin = group.admin?._id === m._id || group.admin === m._id;
        return (
          <div key={m._id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-800 transition-colors">
            <img src={m.avatar} alt={m.username} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
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
  const { groupId }  = useParams();
  const navigate     = useNavigate();
  const { user }     = useAuthStore();
  const {
    joinGroup, sendMessage, onMessage, onTyping,
    onStopTyping, emitTyping, emitStopTyping, socket,
  } = useSocket();

  const [group,       setGroup]       = useState(null);
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(true);
  const [typingUser,  setTypingUser]  = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);

  // AI state
  const [aiLoading,   setAILoading]   = useState(false);
  const [aiModal,     setAIModal]     = useState(null); // { question, answer }
  const [aiHistory,   setAIHistory]   = useState([]);  // conversation history

  const bottomRef      = useRef(null);
  const typingTimeout  = useRef(null);

  // ─── LOAD DATA ──────────────────────────────────────────────────
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
      if (!found) { toast.error("Group not found"); navigate("/dashboard"); return; }
      setGroup(found);
      setMessages(msgRes.data.data);
    } catch {
      toast.error("Failed to load chat");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  // ─── SOCKET SETUP ───────────────────────────────────────────────
  useEffect(() => {
    if (!groupId || !user) return;

    const timer = setTimeout(() => {
      joinGroup(groupId);
      // register username on socket for AI broadcast attribution
      socket?.emit("registerUser", { username: user.username });
    }, 500);

    const cleanupMsg    = onMessage((msg) => setMessages((prev) => [...prev, msg]));
    const cleanupTyping = onTyping(({ username }) => {
      if (username !== user.username) setTypingUser(username);
    });
    const cleanupStop   = onStopTyping(() => setTypingUser(null));

    return () => {
      clearTimeout(timer);
      cleanupMsg?.();
      cleanupTyping?.();
      cleanupStop?.();
    };
  }, [groupId, user]);

  // ─── AUTO SCROLL ────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  // ─── SEND NORMAL MESSAGE ────────────────────────────────────────
  const handleSend = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    // detect @AI mention — trigger AI panel with pre-filled question
    if (text.toLowerCase().startsWith("@ai ")) {
      const question = text.slice(4).trim();
      if (question) {
        setInput("");
        emitStopTyping(groupId);
        handleAskAI(question);
        return;
      }
    }

    sendMessage(groupId, text);
    setInput("");
    emitStopTyping(groupId);
  };

  // ─── ASK AI ─────────────────────────────────────────────────────
  const handleAskAI = async (question) => {
    if (aiLoading) return;
    setAILoading(true);

    try {
      const res = await api.post("/ai/ask", {
        groupId,
        question,
        history: aiHistory,
      });

      const answer = res.data.data.answer;

      // update conversation history for context carry-over
      setAIHistory((prev) => [
        ...prev,
        { role: "user",  text: question },
        { role: "model", text: answer   },
      ]);

      // show modal asking user whether to share or keep private
      setAIModal({ question, answer });
    } catch (err) {
      toast.error(err.response?.data?.message || "AI failed to respond");
    } finally {
      setAILoading(false);
    }
  };

  // ─── SHARE AI REPLY WITH GROUP ──────────────────────────────────
  const handleShareAI = () => {
    if (!aiModal) return;
    socket?.emit("sendAIMessage", {
      groupId,
      senderId:     user._id,
      question:     aiModal.question,
      answer:       aiModal.answer,
      shareWithAll: true,
    });
    setAIModal(null);
  };

  // ─── KEEP AI REPLY PRIVATE ──────────────────────────────────────
  const handlePrivateAI = () => {
    if (!aiModal) return;
    socket?.emit("sendAIMessage", {
      groupId,
      senderId:     user._id,
      question:     aiModal.question,
      answer:       aiModal.answer,
      shareWithAll: false,
    });
    setAIModal(null);
  };

  // ─── TYPING ─────────────────────────────────────────────────────
  const handleTyping = (e) => {
    setInput(e.target.value);
    emitTyping(groupId);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => emitStopTyping(groupId), 1500);
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
        <button onClick={() => navigate("/dashboard")}
          className="text-gray-400 hover:text-white transition-colors text-lg leading-none">
          ←
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-semibold text-sm truncate">{group?.name}</h2>
          <p className="text-gray-500 text-xs">{group?.members?.length} members</p>
        </div>

        {/* AI hint */}
        <span className="text-xs text-gray-600 hidden sm:block">
          type <span className="text-indigo-400 font-mono">@AI</span> to ask
        </span>

        <button
          onClick={() => { setShowAIPanel((v) => !v); setShowMembers(false); }}
          className={`text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            showAIPanel ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          🤖 AI
        </button>

        <button
          onClick={() => { setShowMembers((v) => !v); setShowAIPanel(false); }}
          className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
            showMembers ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          Members
        </button>
      </div>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">

        {/* MESSAGES */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full space-y-2 text-center">
                <div className="text-5xl">💬</div>
                <p className="text-gray-400 text-sm font-medium">No messages yet</p>
                <p className="text-gray-600 text-xs">
                  Say hi or type <span className="text-indigo-400 font-mono">@AI your question</span> to ask the AI
                </p>
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

            {/* AI thinking indicator */}
            {aiLoading && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs flex-shrink-0">🤖</div>
                <div className="bg-indigo-950/60 border border-indigo-800/50 rounded-2xl rounded-bl-sm px-4 py-2.5">
                  <div className="flex gap-1 items-center">
                    <span className="text-xs text-indigo-400">AI is thinking</span>
                    <span className="flex gap-0.5 ml-1">
                      {[0, 150, 300].map((delay) => (
                        <span key={delay} className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${delay}ms` }} />
                      ))}
                    </span>
                  </div>
                </div>
              </div>
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
                placeholder='Type a message or "@AI your question"...'
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

        {/* AI PANEL */}
        {showAIPanel && (
          <AIPanel
            group={group}
            onAskAI={handleAskAI}
            aiLoading={aiLoading}
          />
        )}

        {/* MEMBERS SIDEBAR */}
        {showMembers && <MembersSidebar group={group} />}
      </div>

      {/* AI SHARE MODAL */}
      {aiModal && (
        <AIShareModal
          question={aiModal.question}
          answer={aiModal.answer}
          onShare={handleShareAI}
          onKeepPrivate={handlePrivateAI}
          onClose={() => setAIModal(null)}
        />
      )}
    </div>
  );
};

export default ChatPage;