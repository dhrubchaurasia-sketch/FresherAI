import dotenv from "dotenv";
dotenv.config();
import axios from "axios";

const BASE_URL = "https://www.googleapis.com/youtube/v3/search";

// Same topic dobara aaye to API quota na khaye (search call = 100 units)
const cache = new Map();

const fallbackUrl = (query) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

export const searchVideo = async (topic) => {
  const query = `${topic} tutorial`;

  if (cache.has(query)) return cache.get(query);

  if (!process.env.YOUTUBE_API_KEY) {
    console.warn("YOUTUBE_API_KEY missing, search link use ho raha hai");
    return fallbackUrl(query);
  }

  try {
    const { data } = await axios.get(BASE_URL, {
      params: {
        part: "snippet",
        q: query,
        type: "video",
        maxResults: 1,
        videoEmbeddable: "true",
        safeSearch: "strict",
        relevanceLanguage: "en",
        key: process.env.YOUTUBE_API_KEY,
      },
      timeout: 8000,
    });

    const videoId = data.items?.[0]?.id?.videoId;
    if (!videoId) return fallbackUrl(query);

    const url = `https://www.youtube.com/watch?v=${videoId}`;
    cache.set(query, url);
    return url;
  } catch (err) {
    // quota khatam / network issue pe bhi roadmap break nahi hona chahiye
    console.error(
      "Error searching YouTube videos:",
      err.response?.data?.error?.message || err.message
    );
    return fallbackUrl(query);
  }
};

// modules[] me har module ke liye youtube link fill karta hai
export const addYoutubeLinks = async (modules) =>
  Promise.all(
    modules.map(async (m) => ({
      ...m,
      youtube: await searchVideo(m.title),
    }))
  );