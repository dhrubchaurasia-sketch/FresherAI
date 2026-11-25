import Interview from "../models/interview.model.js";
import graph from "../graph/graph.js";
export const startInterview = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const { type, role, useResume = false, resume = {} } = req.body;

    if (!type || !role) {
      return res.status(400).json({
        success: false,
        message: "Interview type and role are required",
      });
    }
    const result = await graph.invoke({
      action: "start",
      role,
      type,
      useResume,
      resume,
    });

    const questions = result.questions;
    if (!questions || questions.length === 0) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate interview questions",
      });
    }

    const interview = await Interview.create({
      userId,
      type,
      role,
      useResume,
      questions,
      currentQuestion: 0,
      status: "in-progress",
    });

    return res.status(200).json({
      success: true,
      interviewId: interview._id,
      currentQuestion: 0,
      totalQuestions: interview.questions.length,
      question: interview.questions[0],
    });
  } catch (error) {
    console.error("Error in startInterview:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const submitAnswer = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const { interviewId, answer } = req.body;
    if (!interviewId || typeof answer !== "string" || !answer.trim()) {
      return res.status(400).json({
        success: false,
        message: "Interview ID and a valid answer are required",
      });
    }

    const interview = await Interview.findOne({ _id: interviewId, userId });
    if (!interview) {
      return res
        .status(404)
        .json({ success: false, message: "Interview not found" });
    }
    if (interview.status === "completed") {
      return res
        .status(400)
        .json({ success: false, message: "Interview already completed" });
    }

    const index = interview.currentQuestion;
    const currentQuestion = interview.questions[index];
    if (!currentQuestion) {
      return res
        .status(400)
        .json({ success: false, message: "No more questions available" });
    }
    currentQuestion.userAnswer = answer;
    const completed = index + 1 >= interview.questions.length;
    interview.currentQuestion = index + 1;

    const result = await graph.invoke({
      action: "feedback",
      question: currentQuestion.question,
      answer,
      difficulty: currentQuestion.difficulty,
      completed,
      role: interview.role,
      type: interview.type,
      questions: interview.questions,
      questionIndex: index,
    });
    currentQuestion.feedback = result.feedback;

    interview.currentQuestion = index + 1;
    if (completed) {
      if (!result.report) {
        return res.status(502).json({
          success: false,
          message: "AI report generation failed. Please retry.",
        });
      }
      interview.status = "completed";
      interview.overallScore = result.report.overallScore;
      interview.summary = result.report.summary;
      interview.strengths = result.report.strengths;
      interview.weaknesses = result.report.weaknesses;
      interview.recommendations = result.report.recommendations;

      await interview.save();
      return res.status(200).json({
        success: true,
        completed: true,
        interview,
      });
    }
    await interview.save();
    return res.status(200).json({
      success: true,
      completed: false,
      currentQuestion: interview.questions[interview.currentQuestion],
      totalQuestions: interview.questions.length,
      feedback: currentQuestion.feedback,
    });
  } catch (error) {
    console.error("Error in submitAnswer:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getInterview = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const { interviewId } = req.params;

    const interview = await Interview.findOne({ _id: interviewId, userId });
    if (!interview) {
      return res
        .status(404)
        .json({ success: false, message: "Interview not found" });
    }

    return res.status(200).json({
      success: true,
      interview,
    });
  } catch (error) {
    console.error("Error in getInterview:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Fetch all interviews of logged-in user
    const interviews = await Interview.find({ userId }).lean();

    const completedInterviews = interviews.filter(
      (item) => item.status === "completed",
    );

    // Total questions answered
    const answeredQuestions = interviews.flatMap((interview) =>
      interview.questions.filter((question) => question.userAnswer?.trim()),
    );

    // Average score of completed interviews
    const averageScore = completedInterviews.length
      ? Math.round(
          completedInterviews.reduce(
            (sum, item) => sum + (item.overallScore || 0),
            0,
          ) / completedInterviews.length,
        )
      : 0;

    // Skill-wise performance
    const metricKeys = [
      { label: "Correctness", key: "correctness" },
      { label: "Clarity", key: "clarity" },
      { label: "Relevance", key: "relevance" },
      { label: "Detail", key: "detail" },
      { label: "Efficiency", key: "efficiency" },
      { label: "Communication", key: "communication" },
      { label: "Problem Solving", key: "problemSolving" },
      { label: "Creativity", key: "creativity" },
    ];

    const getMetrics = (interviewList) => {
      const questions = interviewList.flatMap((interview) =>
        interview.questions.filter(
          (question) => question.userAnswer?.trim() && question.feedback,
        ),
      );

      return metricKeys.map((metric) => {
        const validScores = questions
          .map((question) => question.feedback?.[metric.key])
          .filter(
            (score) => typeof score === "number" && Number.isFinite(score),
          );

        const value = validScores.length
          ? Math.round(
              validScores.reduce((sum, score) => sum + score, 0) /
                validScores.length,
            )
          : 0;

        return {
          label: metric.label,
          value,
        };
      });
    };

    // Interview type-wise history
    const interviewHistory = [
      {
        type: "technical",
        title: "Technical Interviews",
        subtitle: "Your technical performance",
      },
      {
        type: "hr",
        title: "HR Interviews",
        subtitle: "Your communication performance",
      },
    ].map((category) => {
      const typeInterviews = interviews.filter(
        (item) => item.type === category.type,
      );

      const completedByType = typeInterviews.filter(
        (item) => item.status === "completed",
      );

      const score = completedByType.length
        ? Math.round(
            completedByType.reduce(
              (sum, item) => sum + (item.overallScore || 0),
              0,
            ) / completedByType.length,
          )
        : 0;

      return {
        title: category.title,
        subtitle: category.subtitle,
        count: typeInterviews.length,
        score,
        metrics: getMetrics(typeInterviews),
      };
    });

    return res.status(200).json({
      success: true,

      stats: {
        totalInterviews: interviews.length,
        questionsSolved: answeredQuestions.length,
        completed: completedInterviews.length,
        averageScore,
      },

      performanceMetrics: getMetrics(completedInterviews),

      interviewHistory,
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch dashboard statistics",
    });
  }
};
