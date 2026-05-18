// ─── SCORING LOGIC ────────────────────────────────────────────────
// subjects overlap = 2 points each
// interests overlap = 1 point each
// higher score = better match

const scoreUsers = (currentUser, otherUser) => {
  let score = 0;

  
  const sharedSubjects = currentUser.subjects.filter((s) =>
    otherUser.subjects.includes(s)
  );
  const sharedInterests = currentUser.interests.filter((i) =>
    otherUser.interests.includes(i)
  );

  score += sharedSubjects.length * 2;
  score += sharedInterests.length * 1;

  return score;
};

// ─── MAIN MATCHING FUNCTION ───────────────────────────────────────
// finds best matched users for currentUser from a pool of unmatched users
// returns array of top N user objects (default group size: 4)

const findBestMatches = (currentUser, unmatchedUsers, groupSize = 4) => {
  const scored = unmatchedUsers
    .filter((u) => u._id.toString() !== currentUser._id.toString()) // exclude self
    .map((u) => ({
      user: u,
      score: scoreUsers(currentUser, u),
    }))
    .filter((entry) => entry.score > 0)         // only meaningful matches
    .sort((a, b) => b.score - a.score)          // highest score first
    .slice(0, groupSize - 1);                   // pick top N-1 (current user is the +1)

  return scored.map((entry) => entry.user);
};

export { findBestMatches };