import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import useAuthStore from "../store/authStore.js";
import useAuth from "../hooks/useAuth.js";
import toast from "react-hot-toast";

// ─── NAVBAR ───────────────────────────────────────────────────────
const Navbar = ({ user, onLogout, onProfile }) => (
  <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
    <h1 className="text-xl font-bold text-white">PeerPrep</h1>
    <div className="flex items-center gap-4">
      <button onClick={onProfile} className="text-gray-400 hover:text-white text-sm transition-colors">
        Edit Profile
      </button>
      <button onClick={onLogout} className="text-gray-400 hover:text-red-400 text-sm transition-colors">
        Logout
      </button>
      {user?.avatar && (
        <img src={user.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover border-2 border-gray-700" />
      )}
    </div>
  </nav>
);

// ─── GROUP CARD ───────────────────────────────────────────────────
const GroupCard = ({ group, currentUserId, onLeave, onChat, onUpdate }) => {
  const isAdmin = group.admin?._id === currentUserId || group.admin === currentUserId;
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ name: group.name, description: group.description || "" });
  const [saving, setSaving] = useState(false);

  const handleUpdate = async () => {
    setSaving(true);
    await onUpdate(group._id, editData);
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="bg-gray-900 rounded-2xl p-5 space-y-4 border border-gray-800">
      {editing ? (
        <div className="space-y-3">
          <input
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Group name"
          />
          <input
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Description (optional)"
          />
          <div className="flex gap-2">
            <button onClick={handleUpdate} disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 rounded-lg disabled:opacity-50">
              {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={() => setEditing(false)}
              className="bg-gray-800 text-gray-400 text-xs px-4 py-2 rounded-lg hover:bg-gray-700">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white">{group.name}</h3>
              {isAdmin && (
                <span className="bg-indigo-900/50 text-indigo-300 text-xs px-2 py-0.5 rounded-full">Admin</span>
              )}
            </div>
            {group.description && (
              <p className="text-gray-500 text-xs mt-0.5">{group.description}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              {group.members?.length} members · {group.subjects?.slice(0, 3).join(", ")}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {isAdmin && (
              <button onClick={() => setEditing(true)}
                className="text-gray-500 hover:text-white text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
                Edit
              </button>
            )}
            <button onClick={() => onChat(group._id)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
              Chat
            </button>
            <button onClick={() => onLeave(group._id)}
              className="bg-gray-800 hover:bg-red-900/50 text-gray-400 hover:text-red-400 text-xs px-3 py-1.5 rounded-lg transition-colors">
              Leave
            </button>
          </div>
        </div>
      )}

      {/* Members row */}
      <div className="flex flex-wrap gap-2">
        {group.members?.map((m) => (
          <div key={m._id} className="flex items-center gap-1.5 bg-gray-800 rounded-full px-2.5 py-1">
            <img src={m.avatar} alt={m.username} className="w-5 h-5 rounded-full object-cover" />
            <span className="text-xs text-gray-300">{m.fullName}</span>
            {(group.admin?._id === m._id || group.admin === m._id) && (
              <span className="text-indigo-400 text-xs">👑</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── SUGGESTION CARD ──────────────────────────────────────────────
const SuggestionCard = ({ group, onJoin, joining }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between gap-4">
    <div className="min-w-0">
      <p className="text-white text-sm font-medium truncate">{group.name}</p>
      {group.description && (
        <p className="text-gray-500 text-xs truncate">{group.description}</p>
      )}
      <p className="text-gray-500 text-xs mt-0.5">
        {group.members?.length} members · {group.subjects?.slice(0, 2).join(", ")}
      </p>
    </div>
    <button
      onClick={() => onJoin(group._id)}
      disabled={joining === group._id}
      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs px-4 py-2 rounded-lg flex-shrink-0 transition-colors"
    >
      {joining === group._id ? "Joining..." : "Join"}
    </button>
  </div>
);

// ─── MAIN DASHBOARD ───────────────────────────────────────────────
const DashboardPage = () => {
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [myGroups, setMyGroups] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [joining, setJoining] = useState(null);
  const [loading, setLoading] = useState(true);

  // create group modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchMyGroups();
    if (user?.subjects?.length) fetchSuggestions();
  }, []);

  const fetchMyGroups = async () => {
    setLoading(true);
    try {
      const res = await api.get("/match/groups");
      setMyGroups(res.data.data);
    } catch {
      setMyGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const res = await api.get("/match/suggestions");
      setSuggestions(res.data.data.suggestedGroups || []);
    } catch {
      setSuggestions([]);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await api.get(`/match/groups/search?q=${searchQuery}`);
      setSearchResults(res.data.data);
    } catch {
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleJoin = async (groupId) => {
    setJoining(groupId);
    try {
      await api.post(`/match/groups/${groupId}/join`);
      toast.success("Joined group!");
      fetchMyGroups();
      setSearchResults((prev) => prev.filter((g) => g._id !== groupId));
      setSuggestions((prev) => prev.filter((g) => g._id !== groupId));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to join");
    } finally {
      setJoining(null);
    }
  };

  const handleLeave = async (groupId) => {
    try {
      await api.post(`/match/groups/${groupId}/leave`);
      toast.success("Left the group");
      setMyGroups((prev) => prev.filter((g) => g._id !== groupId));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to leave");
    }
  };

  const handleUpdate = async (groupId, data) => {
    try {
      const res = await api.patch(`/match/groups/${groupId}/update`, data);
      setMyGroups((prev) => prev.map((g) => g._id === groupId ? res.data.data : g));
      toast.success("Group updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createData.name.trim()) return toast.error("Group name is required");
    setCreating(true);
    try {
      const res = await api.post("/match/groups/create", createData);
      setMyGroups((prev) => [...prev, res.data.data]);
      toast.success("Group created!");
      setShowCreate(false);
      setCreateData({ name: "", description: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  const handleChat = (groupId) => {
    navigate(`/chat/${groupId}`);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar
        user={user}
        onLogout={logout}
        onProfile={() => navigate("/profile")}
      />

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Welcome */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">Hey, {user?.fullName || "there"} 👋</h2>
            {/* <p className="text-gray-400 mt-1 text-sm">
              {user?.subjects?.length
                ? `Studying: ${user.subjects.join(", ")}`
                : "Set up your profile to get matched"}
            </p> */}



          <p className="text-gray-400 mt-1 text-sm">
            {user?.subjects?.length || user?.interests?.length
              ? `Studying: ${user.subjects?.join(", ") || user.interests?.join(", ")}`
              : "Set up your profile to get matched"}
          </p>



          </div>
          {/* <button
            onClick={() => setShowCreate(true)}
            disabled={myGroups.length >= 5}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm px-4 py-2 rounded-lg transition-colors flex-shrink-0"
          >
            + Create Group
          </button> */}










          
                    <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => navigate("/recommendations")}
              className="bg-purple-700 hover:bg-purple-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              ✦ AI Picks
            </button>
            <button
              onClick={() => setShowCreate(true)}
              disabled={myGroups.length >= 5}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              + Create Group
            </button>
          </div>


















        </div>

        {/* Profile incomplete warning */}
        {/* {!user?.subjects?.length && (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-4 flex items-center justify-between">
            <p className="text-yellow-400 text-sm">Complete your study profile to get matched</p>
            <button onClick={() => navigate("/profile")}
              className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm px-4 py-2 rounded-lg">
              Setup Profile
            </button>
          </div>
        )} */}











        {/* Profile incomplete warning — only show if subjects AND interests are both empty */}
{!user?.subjects?.length && !user?.interests?.length && (
  <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-4 flex items-center justify-between">
    <p className="text-yellow-400 text-sm">Complete your study profile to get matched</p>
    <button onClick={() => navigate("/profile")}
      className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm px-4 py-2 rounded-lg">
      Setup Profile
    </button>
  </div>
)}

        {/* Group limit warning */}
        {myGroups.length >= 5 && (
          <div className="bg-red-900/20 border border-red-800 rounded-xl p-3">
            <p className="text-red-400 text-sm">You've reached the maximum of 5 groups.</p>
          </div>
        )}

        {/* My Groups */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
              My Groups ({myGroups.length}/5)
            </h3>
          </div>
          {loading ? (
            <p className="text-gray-500 text-sm">Loading...</p>
          ) : myGroups.length === 0 ? (
            <div className="bg-gray-900 rounded-2xl p-8 text-center space-y-3 border border-gray-800">
              <div className="text-4xl">🎯</div>
              <p className="text-gray-400 text-sm">You're not in any group yet.</p>
              <p className="text-gray-500 text-xs">Create one or join from suggestions below.</p>
            </div>
          ) : (
            myGroups.map((group) => (
              <GroupCard
                key={group._id}
                group={group}
                currentUserId={user?._id}
                onLeave={handleLeave}
                onChat={handleChat}
                onUpdate={handleUpdate}
              />
            ))
          )}
        </div>

        {/* Search */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Search Groups</h3>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by group name..."
              className="flex-1 bg-gray-900 border border-gray-800 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-600"
            />
            <button
              type="submit"
              disabled={searching}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm px-5 py-2.5 rounded-lg transition-colors"
            >
              {searching ? "..." : "Search"}
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((group) => (
                <SuggestionCard
                  key={group._id}
                  group={group}
                  onJoin={handleJoin}
                  joining={joining}
                />
              ))}
            </div>
          )}
        </div>

        {/* Suggested Groups */}
        {suggestions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
              Suggested Groups
            </h3>
            <div className="space-y-2">
              {suggestions
                .filter((g) => !myGroups.find((mg) => mg._id === g._id))
                .map((group) => (
                  <SuggestionCard
                    key={group._id}
                    group={group}
                    onJoin={handleJoin}
                    joining={joining}
                  />
                ))}
            </div>
          </div>
        )}

        {/* Study Profile */}
        {user?.subjects?.length > 0 && (
          <div className="bg-gray-900 rounded-2xl p-5 space-y-4 border border-gray-800">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Your Study Profile</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-2">Subjects</p>
                <div className="flex flex-wrap gap-2">
                  {user.subjects.map((s) => (
                    <span key={s} className="bg-indigo-900/40 text-indigo-300 text-xs px-3 py-1 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Interests</p>
                <div className="flex flex-wrap gap-2">
                  {user.interests.map((i) => (
                    <span key={i} className="bg-purple-900/40 text-purple-300 text-xs px-3 py-1 rounded-full">{i}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Create Group Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md space-y-4 border border-gray-800">
            <h3 className="text-lg font-semibold text-white">Create a Study Group</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-gray-400 text-sm block mb-1">Group Name *</label>
                <input
                  value={createData.name}
                  onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                  required
                  placeholder="e.g. DSA Warriors"
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-600"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Description</label>
                <input
                  value={createData.description}
                  onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
                  placeholder="What's this group about?"
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-600"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
                >
                  {creating ? "Creating..." : "Create Group"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-400 font-medium py-2.5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;