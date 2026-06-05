// // ─── SCORING LOGIC ────────────────────────────────────────────────
// // subjects overlap = 2 points each
// // interests overlap = 1 point each
// // higher score = better match

// const scoreUsers = (currentUser, otherUser) => {
//   let score = 0;

  
//   const sharedSubjects = currentUser.subjects.filter((s) =>
//     otherUser.subjects.includes(s)
//   );
//   const sharedInterests = currentUser.interests.filter((i) =>
//     otherUser.interests.includes(i)
//   );

//   score += sharedSubjects.length * 2;
//   score += sharedInterests.length * 1;

//   return score;
// };

// // ─── MAIN MATCHING FUNCTION ───────────────────────────────────────
// // finds best matched users for currentUser from a pool of unmatched users
// // returns array of top N user objects (default group size: 4)

// const findBestMatches = (currentUser, unmatchedUsers, groupSize = 4) => {
//   const scored = unmatchedUsers
//     .filter((u) => u._id.toString() !== currentUser._id.toString()) // exclude self
//     .map((u) => ({
//       user: u,
//       score: scoreUsers(currentUser, u),
//     }))
//     .filter((entry) => entry.score > 0)         // only meaningful matches
//     .sort((a, b) => b.score - a.score)          // highest score first
//     .slice(0, groupSize - 1);                   // pick top N-1 (current user is the +1)

//   return scored.map((entry) => entry.user);
// };

// export { findBestMatches };




import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const WEIGHTS = {
  keyword:      0.35,
  embedding:    0.40,
  cluster:      0.15,
  availability: 0.10,
};

// ── Jaccard similarity ─────────────────────────────────────────────
export const jaccardScore = (setA = [], setB = []) => {
  const a = new Set(setA.map((s) => s.toLowerCase().trim()));
  const b = new Set(setB.map((s) => s.toLowerCase().trim()));
  if (a.size === 0 && b.size === 0) return 0;
  const intersection = [...a].filter((x) => b.has(x));
  const union = new Set([...a, ...b]);
  return intersection.length / union.size;
};

// ── Keyword layer (Layer 1) ────────────────────────────────────────
export const keywordScore = (user, group) => {
  const subjectJ  = jaccardScore(user.subjects,   group.subjects);
  const interestJ = jaccardScore(user.interests,  group.interests);
  const goalJ     = jaccardScore(user.studyGoals, group.studyGoals ?? []);
  return subjectJ * 0.5 + interestJ * 0.3 + goalJ * 0.2;
};

export const matchedTags = (user, group) => {
  const userSet = new Set([
    ...(user.subjects   ?? []),
    ...(user.interests  ?? []),
    ...(user.studyGoals ?? []),
  ].map((s) => s.toLowerCase()));
  return [
    ...(group.subjects   ?? []),
    ...(group.interests  ?? []),
    ...(group.studyGoals ?? []),
  ].filter((t) => userSet.has(t.toLowerCase()));
};

// ── Embedding helpers (Layer 2) ────────────────────────────────────
export const buildProfileText = (entity) => {
  const parts = [];
  if (entity.fullName || entity.name) parts.push(`Name: ${entity.fullName || entity.name}`);
  if (entity.subjects?.length)    parts.push(`Subjects: ${entity.subjects.join(", ")}`);
  if (entity.interests?.length)   parts.push(`Interests: ${entity.interests.join(", ")}`);
  if (entity.studyGoals?.length)  parts.push(`Goals: ${entity.studyGoals.join(", ")}`);
  if (entity.skillLevel)          parts.push(`Skill level: ${entity.skillLevel}`);
  if (entity.description)         parts.push(`Description: ${entity.description}`);
  return parts.join(". ");
};

export const getEmbedding = async (text) => {
  if (!process.env.VOYAGE_API_KEY) return null;
  try {
    const resp = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({ input: [text], model: "voyage-2" }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data?.data?.[0]?.embedding ?? null;
  } catch {
    return null;
  }
};

export const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot  += vecA[i] * vecB[i];
    magA += vecA[i] ** 2;
    magB += vecB[i] ** 2;
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
};

// ── Cluster layer (Layer 3) ────────────────────────────────────────
const SKILL_LEVELS = { beginner: 0, intermediate: 1, advanced: 2 };

export const clusterScore = (user, group) => {
  const u = SKILL_LEVELS[user.skillLevel  ?? "intermediate"];
  const g = SKILL_LEVELS[group.skillLevel ?? "intermediate"];
  const diff = Math.abs(u - g);
  return diff === 0 ? 1.0 : diff === 1 ? 0.5 : 0.0;
};

// ── Availability overlap ───────────────────────────────────────────
export const availabilityScore = (user, group) => {
  if (!user.availability?.length || !group.availability?.length) return 0.5;
  return jaccardScore(user.availability, group.availability);
};

// ── Composite scorer ──────────────────────────────────────────────
export const scoreUserGroup = async (user, group) => {
  const kw = keywordScore(user, group);
  const cl = clusterScore(user, group);
  const av = availabilityScore(user, group);

  let emb = 0;
  if (user.embedding?.length && group.embedding?.length) {
    const raw = cosineSimilarity(user.embedding, group.embedding);
    emb = Math.max(0, (raw - 0.5) / 0.5);
  }

  const composite =
    kw  * WEIGHTS.keyword +
    emb * WEIGHTS.embedding +
    cl  * WEIGHTS.cluster +
    av  * WEIGHTS.availability;

  return {
    score:             parseFloat(composite.toFixed(4)),
    keywordScore:      parseFloat(kw.toFixed(4)),
    embeddingScore:    parseFloat(emb.toFixed(4)),
    clusterScore:      parseFloat(cl.toFixed(4)),
    availabilityScore: parseFloat(av.toFixed(4)),
    matchedTags:       matchedTags(user, group),
  };
};

// ── AI reasoning via Claude ────────────────────────────────────────
export const generateReasonings = async (user, scoredGroups) => {
  if (!scoredGroups.length) return [];

  const systemPrompt = `You are a study group recommendation assistant.
Given a user profile and a list of scored groups, write a one-sentence reason
for each group explaining WHY it is a good match for this user.
Reply ONLY with valid JSON: an array of objects with keys "groupId" and "reason".
No markdown, no preamble.`;

  const userPrompt = `User: ${JSON.stringify({
    subjects:   user.subjects,
    interests:  user.interests,
    studyGoals: user.studyGoals,
    skillLevel: user.skillLevel,
  })}

Groups:
${JSON.stringify(scoredGroups.map((sg) => ({
  groupId: sg.group._id.toString(),
  name:    sg.group.name,
  score:   sg.score,
  tags:    sg.matchedTags,
})))}`;

  try {
    const response = await client.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 800,
      messages:   [{ role: "user", content: userPrompt }],
      system:     systemPrompt,
    });
    return JSON.parse(response.content[0].text.trim());
  } catch {
    return scoredGroups.map((sg) => ({
      groupId: sg.group._id.toString(),
      reason:  "Strong overlap with your subjects and interests.",
    }));
  }
};

// ── Legacy compat (kept so nothing breaks) ────────────────────────
export const findBestMatches = (currentUser, unmatchedUsers, groupSize = 4) => {
  return unmatchedUsers
    .filter((u) => u._id.toString() !== currentUser._id.toString())
    .map((u) => ({
      user: u,
      score:
        currentUser.subjects.filter((s) => u.subjects.includes(s)).length * 2 +
        currentUser.interests.filter((i) => u.interests.includes(i)).length,
    }))
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, groupSize - 1)
    .map((e) => e.user);
};