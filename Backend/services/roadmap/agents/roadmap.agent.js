import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import llm from "../config/llm.js";
import roadmapPrompt from "../config/roadmap.prompt.js";

// ---------- helpers ----------

const capitalize = (value = "") =>
  String(value).charAt(0).toUpperCase() + String(value).slice(1).toLowerCase();

// "2 weeks" -> 14, "10 days" -> 10, "2-3 weeks" -> 17.5, "1 month" -> 30
const parseDays = (text = "") => {
  const match = String(text).match(
    /(\d+(?:\.\d+)?)(?:\s*(?:-|–|to)\s*(\d+(?:\.\d+)?))?\s*(month|week|wk|day)/i
  );
  if (!match) return 0;

  const a = parseFloat(match[1]);
  const b = match[2] ? parseFloat(match[2]) : a;
  const n = (a + b) / 2;
  const unit = match[3].toLowerCase();

  if (unit.startsWith("month")) return n * 30;
  if (unit === "week" || unit === "wk") return n * 7;
  return n;
};

const formatDuration = (days) => {
  if (days % 7 === 0) {
    const w = days / 7;
    return `${w} ${w === 1 ? "week" : "weeks"}`;
  }
  return `${days} ${days === 1 ? "day" : "days"}`;
};

// Scale module durations so they add up to exactly weeks * 7 days
const fitDurations = (modules, weeks) => {
  const targetDays = weeks * 7;
  const count = modules.length;

  let raw = modules.map((m) => parseDays(m.duration));
  let sum = raw.reduce((a, b) => a + b, 0);

  // LLM gave nothing parseable -> split equally
  if (sum <= 0) {
    raw = modules.map(() => targetDays / count);
    sum = targetDays;
  }

  const factor = targetDays / sum;
  const days = raw.map((d) => Math.max(1, Math.round(d * factor)));

  // fix rounding drift on the longest module
  let diff = targetDays - days.reduce((a, b) => a + b, 0);
  if (diff !== 0) {
    const idx = days.indexOf(Math.max(...days));
    days[idx] = Math.max(1, days[idx] + diff);
  }

  return modules.map((m, i) => ({ ...m, duration: formatDuration(days[i]) }));
};

// ---------- agent ----------

const roadmapAgent = async (state) => {
  try {
    // Resume validation
    if (state.useResume && !state.resume) {
      throw new Error("Resume data is missing");
    }

    const weeks = Number(state.weeks) || 8;
    const hoursPerDay = Number(state.hoursPerDay) || 2;
    const level = capitalize(state.level || "beginner");

    // Module count range depends on available time
   
    const maxModules = Math.min(10, Math.max(3, weeks));  
    const minModules = Math.min(maxModules, Math.max(3, Math.ceil(weeks / 2)));
    const totalHours = weeks * 7 * hoursPerDay;

    // Resume extraction
    const resume = state.useResume
      ? {
          skills: state.resume.skills,
          missingSkills: state.resume.missingSkills,
          projects: state.resume.projects,
          experience: state.resume.experience,
          score: state.resume.score,
          suggestedRole: state.resume.suggestedRole,
          recommendations: state.resume.recommendations,
        }
      : null;

    // LLM invocation
    const response = await llm.invoke([
      new SystemMessage(roadmapPrompt),

      new HumanMessage(`
Target Role:
${state.role}

Target Package:
${state.targetPackage}

Learner Level:
${level}

Total Duration:
${weeks} weeks (${weeks * 7} days)

Study time per day:
${hoursPerDay} hours (about ${totalHours} hours in total)

Module Count:
between ${minModules} and ${maxModules} modules

Resume:
${JSON.stringify(resume, null, 2)}
`),
    ]);

    // JSON parsing
    const content = response.content
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const roadmap = JSON.parse(content);

    // Normalize modules
    let modules = (roadmap.modules || []).map((module) => ({
      ...module,
      difficulty: capitalize(module.difficulty),
    }));

    // Guarantee: total duration == user's weeks
    if (modules.length) {
      modules = fitDurations(modules, weeks);
    }

    roadmap.modules = modules;

    // User inputs always win over whatever the LLM wrote
    roadmap.level = level;
    roadmap.duration = `${weeks} ${weeks === 1 ? "week" : "weeks"}`;
    roadmap.targetPackage = state.targetPackage;

    return {
      ...state,
      roadmap,
    };
  } catch (error) {
    console.error("Roadmap Agent Error:", error.message);
    throw error;
  }
};

export default roadmapAgent;
