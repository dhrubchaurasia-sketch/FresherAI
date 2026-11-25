import api from "../utils/axios.js";

export const startInterview = async (data) => {
  try {
    const response = await api.post("/api/interview/start", data);

    console.log("Interview Started:", response.data);

    return response.data;
  } catch (error) {
    console.error(
      "Start Interview Error:",
      error.response?.data || error.message,
    );

    throw error;
  }
};

export const submitAnswer = async (data) => {
  try {
    const response = await api.post("/api/interview/submit", data);

    console.log("Answer Submitted:", response.data);

    return response.data;
  } catch (error) {
    console.error(
      "Submit Answer Error:",
      error.response?.data || error.message,
    );

    throw error;
  }
};

export const getInterview = async (id) => {
  try {
    const response = await api.get(`/api/interview/get/${id}`);

    console.log("Get Interview Response:", response.data);

    return response.data;
  } catch (error) {
    console.error(
      "Get Interview Error:",
      error.response?.data || error.message,
    );

    throw error;
  }
};


export const getDashboardStats = async () => {
  const response = await api.get("/api/interview/dashboard-stats", {
    headers: {
      "x-user-id": localStorage.getItem("userId"),
    },
  });

  return response.data;
};