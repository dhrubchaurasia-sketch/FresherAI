import llm from "../config/llm.js";
import feedbackPrompt from "../prompts/feedbackPrompt.js";

export const feedbackAgent = async (data) => {

    try {
        const prompt = feedbackPrompt(data);
        if (!prompt) {
            throw new Error("Invalid interview type");
        }

        const response = await llm.invoke(prompt);
        const cleanedResponse = response.content.replace(/^\d+\.\s*/, '').trim();
        console.log("FEEDBACK PROMPT LENGTH:", prompt.length);

        return JSON.parse(cleanedResponse);


    } catch (error) {
        console.error("FEEDBACK AGENT ERROR:", error);
        throw error;
    }

};