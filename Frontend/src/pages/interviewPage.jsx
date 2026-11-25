import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import Step2interview from "../components/interview/Step2interview";
import { getInterview } from "../apis/interview.api";

function InterviewPage({ user, setUser }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [interview, setInterview] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        setLoading(true);

        const response = await getInterview(id);
        const data = response?.interview;

        if (!data) {
          throw new Error("Interview not found");
        }

        if (data.status === "completed") {
          navigate(`/interview/report/${id}`);
          return;
        }

        setInterview(data);
      } catch (error) {
        console.error("FETCH INTERVIEW ERROR:", error);
        setError(error.message || "Unable to load interview");
      } finally {
        setLoading(false);
      }
    };

    fetchInterview();
  }, [id, navigate]);

  if (loading) {
  return (
    <div className="min-h-screen bg-[#070700] flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-white animate-spin" />
    </div>
  );
}

  if (error) {
    return <div>{error}</div>;
  }

  if (!interview) {
    return <div>Interview not found.</div>;
  }

  return (
 <Step2interview
  interviewData={{
    interviewId: interview._id,
    currentQuestion: interview.currentQuestion,
    totalQuestions: interview.questions.length,
    question: interview.questions[interview.currentQuestion],
    questions: interview.questions,
  }}
  user={user}
  setUser={setUser}
/>
);
}

export default InterviewPage;