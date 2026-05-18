import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import toast from "react-hot-toast";

const SUBJECTS = ["Math", "Physics", "Chemistry", "Biology", "DSA", "Web Dev", "Machine Learning", "Database", "OS", "Networking"];
const INTERESTS = ["Competitive Programming", "Open Source", "Web Dev", "App Dev", "AI/ML", "Cybersecurity", "Game Dev", "Data Science"];
const GOALS = ["Exam Prep", "Project Work", "Skill Building", "Interview Prep", "Research"];
const AVAILABILITY = ["Weekday Mornings", "Weekday Evenings", "Weekends", "Late Night"];

const ProfilePage = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState({
    subjects: [],
    interests: [],
    studyGoals: [],
    availability: [],
  });
  const [loading, setLoading] = useState(false);

  const toggle = (key, value) => {
    setSelected((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected.subjects.length || !selected.interests.length) {
      return toast.error("Please select at least one subject and interest");
    }
    setLoading(true);
    try {
      await api.patch("/users/study-profile", selected);
      toast.success("Profile updated!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const ChipGroup = ({ label, items, keyName }) => (
    <div>
      <p className="text-gray-400 text-sm font-medium mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const active = selected[keyName].includes(item);
          return (
            <button
              key={item}
              type="button"
              onClick={() => toggle(keyName, item)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10">
      <div className="max-w-2xl mx-auto bg-gray-900 rounded-2xl p-8 shadow-xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Setup your study profile</h1>
          <p className="text-gray-400 text-sm mt-1">
            This helps us match you with the right study group
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <ChipGroup label="Subjects" items={SUBJECTS} keyName="subjects" />
          <ChipGroup label="Interests" items={INTERESTS} keyName="interests" />
          <ChipGroup label="Study Goals" items={GOALS} keyName="studyGoals" />
          <ChipGroup label="Availability" items={AVAILABILITY} keyName="availability" />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {loading ? "Saving..." : "Save & Find My Group"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;