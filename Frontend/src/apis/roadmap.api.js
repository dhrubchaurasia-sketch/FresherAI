import api from "../utils/axios.js";

export const generateRoadmap = async (data = {}) => {
  const role = (
    data.targetRole ||
    data.target_role ||
    data.role ||
    data.goal ||
    ""
  ).trim();

  const targetPackage = (
    data.targetPackage ||
    data.target_package ||
    data.package ||
    ""
  ).trim();

  const level = data.level || data.currentLevel || data.current_level || "beginner";
  const weeks = Number(data.weeks) || 8;
  const hoursPerDay = Number(data.hoursPerDay ?? data.hours_per_day ?? data.hours ?? 2);

  const payload = {
    role,
    targetRole: role,
    target_role: role,
    goal: role,
    package: targetPackage,
    targetPackage,
    target_package: targetPackage,
    level,
    currentLevel: level,
    current_level: level,
    weeks,
    hoursPerDay,
    hours_per_day: hoursPerDay,
  };

  try {
    const response = await api.post("/api/roadmap/generate", payload);
    console.log("ROADMAP API RESPONSE:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Generate Roadmap Error:",
      error.response?.data || error.message,
    );
    throw error;
  }
};
export const updateRoadmapProgress = async (id, completedModules) => {
  try {
    const response = await api.patch(`/api/roadmap/${id}/progress`, {
      completedModules,
    });
    return response.data;
  } catch (error) {
    console.error(
      "Update Progress Error:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

// Abhi use nahi ho rahe, par purane roadmaps kholne ke liye chahiye honge
export const getMyRoadmaps = async () => {
  const response = await api.get("/api/roadmap");
  return response.data;
};

export const getRoadmapById = async (id) => {
  const response = await api.get(`/api/roadmap/${id}`);
  return response.data;
};