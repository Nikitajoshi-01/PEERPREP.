import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import useAuthStore from "../store/authStore.js";
import useAuth from "../hooks/useAuth.js";
import toast from "react-hot-toast";

const DashboardPage = () => {
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [matching, setMatching] = useState(false);

  // fetch current group on mount
  useEffect(() => {
    fetchGroup();
  }, []);

  const fetchGroup = async () => {
    setLoading(true);
    try {
      const res = await api.get("/match/my-group");
      setGroup(res.data.data);
    } catch (err) {
      // 404 means no group yet — that's fine
      setGroup(null);
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = async () => {
    setMatching(true);
    try {
      const res = await api.post("/match/request");
      setGroup(res.data.data);
      toast.success("Study group found!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Matching failed");
    } finally {
      setMatching(false);
    }
  };

  const handleLeave = async () => {
    try {
      await api.post("/match/leave");
      setGroup(null);
      toast.success("Left the group");
    } catch (err) {
      toast.error("Failed to leave group");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">PeerPrep</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/profile")}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            Edit Profile
          </button>
          <button
            onClick={logout}
            className="text-gray-400 hover:text-red-400 text-sm transition-colors"
          >
            Logout
          </button>
          {user?.avatar && (
            <img
              src={user.avatar}
              alt="avatar"
              className="w-8 h-8 rounded-full object-cover"
            />
          )}
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">

        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-bold">
            Hey, {user?.fullName || "there"} 👋
          </h2>
          <p className="text-gray-400 mt-1 text-sm">
            {user?.subjects?.length
              ? `Studying: ${user.subjects.join(", ")}`
              : "Set up your profile to get matched"}
          </p>
        </div>

        {/* Profile incomplete warning */}
        {!user?.subjects?.length && (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-4 flex items-center justify-between">
            <p className="text-yellow-400 text-sm">
              Complete your study profile to get matched with peers
            </p>
            <button
              onClick={() => navigate("/profile")}
              className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm px-4 py-2 rounded-lg"
            >
              Setup Profile
            </button>
          </div>
        )}

        {/* Group section */}
        {loading ? (
          <div className="text-gray-400 text-sm">Loading your group...</div>
        ) : group ? (
          <div className="bg-gray-900 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{group.name}</h3>
                <p className="text-gray-400 text-sm">
                  {group.members?.length} members · {group.subjects?.join(", ")}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate("/chat")}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg"
                >
                  Open Chat
                </button>
                <button
                  onClick={handleLeave}
                  className="bg-gray-800 hover:bg-red-900 text-gray-400 hover:text-red-400 text-sm px-4 py-2 rounded-lg transition-colors"
                >
                  Leave
                </button>
              </div>
            </div>

            {/* Members */}
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">Members</p>
              <div className="flex flex-wrap gap-3">
                {group.members?.map((member) => (
                  <div key={member._id} className="flex items-center gap-2 bg-gray-800 rounded-full px-3 py-1.5">
                    <img
                      src={member.avatar}
                      alt={member.username}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-sm text-gray-300">{member.fullName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // No group yet
          <div className="bg-gray-900 rounded-2xl p-10 text-center space-y-4">
            <div className="text-5xl">🎯</div>
            <h3 className="text-lg font-semibold">No study group yet</h3>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">
              Click the button below and we'll find the best study partners for you based on your subjects and interests.
            </p>
            <button
              onClick={handleMatch}
              disabled={matching || !user?.subjects?.length}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              {matching ? "Finding your group..." : "Find My Study Group"}
            </button>
          </div>
        )}

        {/* Your study profile chips */}
        {user?.subjects?.length > 0 && (
          <div className="bg-gray-900 rounded-2xl p-6 space-y-4">
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
    </div>
  );
};

export default DashboardPage;