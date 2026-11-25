// import llm  from "../config/llm.js";

// import summaryPrompt from "../prompts/summaryPrompt.js";
// export const summaryAgent = async (data) => {

//     try {
//         const prompt = summaryPrompt(data);
//         if (!prompt) {
//             throw new Error("Invalid interview type");
//         }

//         const response = await llm.invoke(prompt);
//         const cleanedResponse = response.content.replace(/^\d+\.\s*/, '').trim();
//         console.log("SUMMARY PROMPT LENGTH:", prompt.length);

//         return JSON.parse(cleanedResponse);

//     } catch (error) {
//         console.error("SUMMARY AGENT ERROR:", error);
//         throw error;
//     }

// };

import llm from "../config/llm.js";
import summaryPrompt from "../prompts/summaryPrompt.js";

export const summaryAgent = async (data) => {
  try {
    // Send only the necessary interview information
    const compactQuestions = data.questions.map((q) => ({
      question: q.question,
      answer: q.userAnswer,
      difficulty: q.difficulty,
      score: q.feedback?.score ?? 0,
      correctness: q.feedback?.correctness ?? 0,
      clarity: q.feedback?.clarity ?? 0,
      relevance: q.feedback?.relevance ?? 0,
      detail: q.feedback?.detail ?? 0,
      efficiency: q.feedback?.efficiency ?? 0,
      communication: q.feedback?.communication ?? 0,
      problemSolving: q.feedback?.problemSolving ?? 0,
      creativity: q.feedback?.creativity ?? 0,
      feedback: q.feedback?.feedback ?? "",
      improvements: q.feedback?.improvements ?? [],
    }));

    const prompt = summaryPrompt({
      role: data.role,
      type: data.type,
      questions: compactQuestions,
    });

    console.log("SUMMARY PROMPT LENGTH:", prompt.length);

    const response = await llm.invoke(prompt);

    const cleanedResponse = response.content
      .replace(/```json|```/g, "")
      .trim();

    return JSON.parse(cleanedResponse);

  } catch (error) {
    console.error("SUMMARY AGENT ERROR:", error);
    throw error;
  }
};