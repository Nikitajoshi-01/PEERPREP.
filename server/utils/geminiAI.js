import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

// ── Build system prompt from group context ─────────────────────────
const buildSystemPrompt = (group) => {
  const subjects   = group.subjects?.join(", ")   || "general topics";
  const interests  = group.interests?.join(", ")  || "various interests";
  const goals      = group.studyGoals?.join(", ") || "learning";

  return `You are an AI study assistant inside a group chat called "${group.name}".

GROUP CONTEXT:
- Subjects this group studies: ${subjects}
- Interests: ${interests}  
- Study goals: ${goals}

YOUR RULES:
1. Only answer questions related to the group's subjects, interests, and goals listed above.
2. If a question is completely unrelated to the group context, politely decline and remind the user what topics you can help with.
3. Keep answers concise, clear, and helpful — no long essays unless asked.
4. You can explain concepts, solve problems, give examples, or suggest resources related to the group topics.
5. Never answer questions about harmful, illegal, or inappropriate content.
6. Address the user by name if provided.
7. If a question is vague, ask for clarification rather than guessing.

You are friendly, to the point, and focused on helping this study group succeed.`;
};

// ── Main AI reply function ─────────────────────────────────────────
export const getAIReply = async ({ question, group, username, history = [] }) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: buildSystemPrompt(group),
  });

  // build chat history for context
  const chat = model.startChat({
    history: history.map((h) => ({
      role:  h.role,   // "user" or "model"
      parts: [{ text: h.text }],
    })),
  });

  const prompt = `${username ? `[${username}]: ` : ""}${question}`;

  const result = await chat.sendMessage(prompt);
  const text   = result.response.text();
  return text;
};