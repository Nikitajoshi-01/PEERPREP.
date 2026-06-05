import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import useAuthStore from "../store/authStore.js";
import toast from "react-hot-toast";

const ScoreBar = ({ label, value, color = "bg-indigo-500" }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs text-gray-400">
      <span>{label}</span>
      <span>{Math.round(value * 100)}%</span>
    </div>
    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  </div>
);

const MatchBadge = ({ score }) => {
  const pct = Math.round(score * 100);
  const cls = pct >= 75
    ? "bg-green-900/50 text-green-400 border-green-800"
    : pct >= 50
    ? "bg-indigo-900/50 text-indigo-400 border-indigo-800"
    : "bg-gray-800 text-gray-400 border-gray-700";
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${cls}`}>
      {pct}% Match
    </span>
  );
};

const RecCard = ({ rec, onJoin, onDismiss, actionLoading }) => {
  const [expanded, setExpanded] = useState(false);
  const { group, score, keywordScore, embeddingScore, clusterScore,
          availabilityScore, matchedTags, aiReasoning } = rec;
  const busy = actionLoading === group._id;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-white font-semibold text-base">{group.name}</h3>
            <MatchBadge score={score} />
            {group.category && (
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full capitalize">
                {group.category}
              </span>
            )}
          </div>
          {group.description && (
            <p className="text-gray-500 text-sm line-clamp-2">{group.description}</p>
          )}
          <p className="text-gray-600 text-xs">
            {group.members?.length} member{group.members?.length !== 1 ? "s" : ""}
            {group.maxMembers ? ` · max ${group.maxMembers}` : ""}
          </p>
        </div>
      </div>

      {aiReasoning && (
        <div className="flex gap-2.5 items-start bg-indigo-950/50 border border-indigo-900/50 rounded-xl p-3">
          <span className="text-indigo-400 flex-shrink-0 mt-0.5">✦</span>
          <p className="text-indigo-200 text-sm leading-relaxed">{aiReasoning}</p>
        </div>
      )}

      {matchedTags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {matchedTags.slice(0, 6).map((tag) => (
            <span key={tag} className="text-xs bg-gray-800 text-gray-300 px-2.5 py-0.5 rounded-full border border-gray-700">
              {tag}
            </span>
          ))}
          {matchedTags.length > 6 && (
            <span className="text-xs text-gray-500">+{matchedTags.length - 6} more</span>
          )}
        </div>
      )}

      <button
        onClick={() => setExpanded((p) => !p)}
        className="text-xs text-gray-500 hover:text-gray-400 flex items-center gap-1"
      >
        {expanded ? "▲ Hide" : "▼ Show"} score breakdown
      </button>

      {expanded && (
        <div className="space-y-2">
          <ScoreBar label="Subject & interest overlap" value={keywordScore}      color="bg-indigo-500" />
          <ScoreBar label="Semantic similarity"        value={embeddingScore}    color="bg-purple-500" />
          <ScoreBar label="Skill level match"          value={clusterScore}      color="bg-teal-500" />
          <ScoreBar label="Availability overlap"       value={availabilityScore} color="bg-amber-500" />
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => onJoin(rec)}
          disabled={busy}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
        >
          {busy ? "Joining..." : "Join Group"}
        </button>
        <button
          onClick={() => onDismiss(rec)}
          disabled={busy}
          className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

const RecommendationsPage = () => {
  const { user }   = useAuthStore();
  const navigate   = useNavigate();
  const [recs,          setRecs]          = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter,        setFilter]        = useState("all");

  const hasProfile = user?.subjects?.length > 0 || user?.interests?.length > 0;

  const fetchRecs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/match/ai-recommendations");
      setRecs(res.data.data ?? []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load recommendations");
      setRecs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasProfile) fetchRecs();
    else setLoading(false);
  }, []);

  const handleJoin = async (rec) => {
    setActionLoading(rec.group._id);
    try {
      await api.post(`/match/groups/${rec.group._id}/join`);
      toast.success(`Joined "${rec.group.name}"!`);
      setRecs((prev) => prev.filter((r) => r.group._id !== rec.group._id));
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not join group");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDismiss = async (rec) => {
    setRecs((prev) => prev.filter((r) => r.group._id !== rec.group._id));
    try {
      if (rec._id) await api.post(`/match/recommendations/${rec._id}/action`, { action: "dismiss" });
    } catch { /* silent */ }
  };

  const filtered = filter === "high" ? recs.filter((r) => r.score >= 0.6) : recs;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <button onClick={() => navigate("/dashboard")} className="text-gray-400 hover:text-white text-sm">
          ← Dashboard
        </button>
        <h1 className="text-base font-semibold">AI Group Recommendations</h1>
        <button onClick={fetchRecs} disabled={loading} className="text-indigo-400 hover:text-indigo-300 text-sm disabled:opacity-40">
          Refresh
        </button>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold">Groups picked for you</h2>
          <p className="text-gray-400 text-sm mt-1">
            Ranked by subject overlap, semantic similarity, skill level, and availability.
          </p>
        </div>

        {!hasProfile && !loading && (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-4 flex items-center justify-between">
            <p className="text-yellow-300 text-sm">Add subjects or interests to get recommendations</p>
            <button onClick={() => navigate("/profile")} className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm px-4 py-2 rounded-lg">
              Edit Profile
            </button>
          </div>
        )}

        {recs.length > 0 && (
          <div className="flex gap-2">
            {[{ key: "all", label: `All (${recs.length})` }, { key: "high", label: "Strong matches" }].map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`text-xs px-4 py-2 rounded-full border transition-colors ${
                  filter === f.key
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 animate-pulse space-y-3">
                <div className="h-5 bg-gray-800 rounded w-40" />
                <div className="h-3 bg-gray-800 rounded w-3/4" />
                <div className="h-12 bg-gray-800/50 rounded-xl" />
                <div className="flex gap-3">
                  <div className="flex-1 h-10 bg-gray-800 rounded-xl" />
                  <div className="w-20 h-10 bg-gray-800 rounded-xl" />
                </div>
              </div>
            ))}
            <p className="text-center text-gray-500 text-sm animate-pulse">✦ AI is analyzing your profile...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center space-y-4 py-16">
            <div className="text-5xl">🎯</div>
            <p className="text-gray-400">
              {filter === "high" ? "No strong matches right now." : "No recommendations available."}
            </p>
            <button onClick={filter === "high" ? () => setFilter("all") : fetchRecs}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-5 py-2.5 rounded-xl">
              {filter === "high" ? "Show all" : "Refresh"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((rec) => (
              <RecCard key={rec.group._id} rec={rec} onJoin={handleJoin} onDismiss={handleDismiss} actionLoading={actionLoading} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationsPage;