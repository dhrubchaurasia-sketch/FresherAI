import { z } from "zod";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import llm from "../config/llm.js";
import { searchVideo } from "../config/youtube.js";

// Array root pe kuch providers structured output reject karte hain, isliye object me wrap kiya
const docsSchema = z.object({
  docs: z.array(
    z.object({
      index: z.number().int().describe("Same number as in the module list"),
      article: z
        .string()
        .describe("Official docs URL, or empty string if you are not sure it exists"),
      practice: z
        .string()
        .describe(
          "URL of a free hands-on practice page (exercises, challenges or interactive tutorial) for this topic, or empty string if you are not sure it exists"
        ),
      course: z
        .string()
        .describe(
          "URL of a free structured course or learning path for this topic, or empty string if you are not sure it exists"
        ),
    })
  ),
});

// LLM ke diye URLs fake ho sakte hain, isliye live check karte hain
const isLive = async (url) => {
  try {
    if (!url || new URL(url).protocol !== "https:") return false;
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    res.body?.cancel();
    return res.ok;
  } catch {
    return false;
  }
};

const searchLink = (query) =>
  `https://www.google.com/search?q=${encodeURIComponent(query)}`;

// URL live ho to wahi, warna search link
const resolveLink = async (url, fallbackQuery) =>
  (await isLive(url)) ? url : searchLink(fallbackQuery);

const resourceAgent = async (state) => {
  const roadmap = state.roadmap;
  const modules = roadmap.modules;

  // 1) LLM se docs / practice / course URLs (index se match, title se nahi)
  const linksByIndex = new Map();
  try {
    const structured = llm.withStructuredOutput(docsSchema, { name: "module_links" });
    const res = await structured.invoke([
      new SystemMessage(`You are an expert software engineer and mentor.
For every numbered module, give three URLs:

1. article: the official documentation URL.
2. practice: a free hands-on practice page. Prefer well-known sources such as
   freeCodeCamp, roadmap.sh, MDN, Exercism, LeetCode, HackerRank, W3Schools exercises
   or the official interactive tutorial of the technology.
3. course: a free structured course or learning path. Prefer freeCodeCamp,
   MDN Learn, official tutorials or university open courses.

Rules:
1. Only return a URL you are highly confident exists (a site root or a well-known page).
2. If you are not sure, return an empty string. Never guess or invent a URL.
3. Do NOT return YouTube links.
4. Keep the same index numbers.`),
      new HumanMessage(`Modules:\n${modules.map((m, i) => `${i}. ${m.title}`).join("\n")}`),
    ]);
    res.docs.forEach((d) => linksByIndex.set(d.index, d));
  } catch (err) {
    console.error("Links agent failed:", err.message);
  }

  // 2) YouTube + article/practice/course validate, sab modules parallel me
  const enriched = await Promise.all(
    modules.map(async (m, i) => {
      const links = linksByIndex.get(i) || {};

      const [youtube, article, practice, course] = await Promise.all([
        searchVideo(m.title).catch((err) => {
          console.error("YouTube error:", err.message);
          return null;
        }),
        resolveLink(links.article, `${m.title} official documentation`),
        resolveLink(links.practice, `${m.title} hands-on practice exercises`),
        resolveLink(links.course, `${m.title} free course`),
      ]);

      return { ...m, youtube, article, practice, course };
    })
  );

  return { roadmap: { ...roadmap, modules: enriched } };
};

export default resourceAgent;
