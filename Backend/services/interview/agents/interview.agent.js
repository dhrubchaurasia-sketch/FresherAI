import llm  from "../config/llm.js";

import hrInterviewPrompt from "../prompts/hrInterviewPrompt.js";

import technicalInterviewPrompt from "../prompts/technicalInterviewPrompt.js";
export const interviewAgent = async (data) => {

    try {
        const prompt = data.type?.toLowerCase() === "hr"
            ? hrInterviewPrompt(data)
            : data.type?.toLowerCase() === "technical"
                ? technicalInterviewPrompt(data)
                : null;

        if (!prompt) {
            throw new Error("Invalid interview type");
        }

        const response = await llm.invoke(prompt);
        const cleanedResponse = response.content.replace(/^\d+\.\s*/, '').trim();

        return JSON.parse(cleanedResponse);

    } catch (error) {
        console.error("INTERVIEW AGENT ERROR:", error);
        throw error;
    }

};