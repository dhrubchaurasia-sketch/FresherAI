import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getInterview } from "../../apis/interview.api.js";
import { FaExclamationCircle } from "react-icons/fa";
import "./Step3report.css";

const getGrade = (score) => {
  if (score >= 90)
    return { grade: "Outstanding", label: "Excellent Performance" };
  if (score >= 80) return { grade: "Excellent", label: "Strong Performance" };
  if (score >= 70) return { grade: "Good", label: "Good Performance" };
  if (score >= 60) return { grade: "Average", label: "Room for Improvement" };
  if (score >= 40)
    return { grade: "Below Average", label: "Needs More Practice" };
  return { grade: "Needs Improvement", label: "Keep Practicing" };
};

const getScoreColor = (score) => {
  if (score >= 80) return "#22c55e"; // green
  if (score >= 60) return "#f59e0b"; // amber
  if (score >= 40) return "#f97316"; // orange
  return "#ef4444"; // red
};
const formatDate = (date) => {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

function Step3report({ user, setUser }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedQuestion, setExpandedQuestion] = useState(0);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getInterview(id);

        if (!response.success) {
          throw new Error(response.message || "Unable to fetch report");
        }

        setInterview(response.interview);
      } catch (err) {
        console.error("Report Fetch Error:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load interview report.",
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchReport();
  }, [id]);

  const handleDownload = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="report-loading">
        <div className="report-loader"></div>
        <h2>Generating Your Report</h2>
        <p>Analyzing your interview performance...</p>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="report-error">
        <div className="error-icon">!</div>
        <h2>Report Not Available</h2>
        <p>{error || "We couldn't find your interview report."}</p>

        <button onClick={() => navigate("/dashboard")}>Go to Dashboard</button>
      </div>
    );
  }

  const {
    role,
    type,
    questions = [],
    overallScore = 0,
    summary,
    strengths = [],
    weaknesses = [],
    recommendations = [],
    status,
    createdAt,
  } = interview;

  const score = Math.max(0, Math.min(100, Number(overallScore) || 0));
  const grade = getGrade(score);

  const evaluatedQuestions = questions.filter(
    (q) => q.feedback && typeof q.feedback.score === "number",
  );

  const skillMetrics = [
    {
      key: "correctness",
      label: "Correctness",
      description: "Accuracy of your answers",
    },
    {
      key: "clarity",
      label: "Clarity",
      description: "How clearly you explained",
    },
    {
      key: "relevance",
      label: "Relevance",
      description: "How relevant your answers were",
    },
    {
      key: "detail",
      label: "Depth & Detail",
      description: "Depth of your explanations",
    },
    {
      key: "efficiency",
      label: "Efficiency",
      description: "How effectively you answered",
    },
    {
      key: "communication",
      label: "Communication",
      description: "Your communication skills",
    },
    {
      key: "problemSolving",
      label: "Problem Solving",
      description: "Your logical thinking",
    },
    {
      key: "creativity",
      label: "Creativity",
      description: "Your independent thinking",
    },
  ];

  const getAverage = (key) => {
    const validQuestions = evaluatedQuestions.filter(
      (q) => typeof q.feedback[key] === "number",
    );

    if (!validQuestions.length) return null;

    return Math.round(
      validQuestions.reduce((sum, q) => sum + q.feedback[key], 0) /
        validQuestions.length,
    );
  };

  return (
    <div className="report-page">
      {/* Header */}
      <header className="report-header no-print">
        <div className="report-brand">
          <div className="hive-logo">
            <svg
              className="hive-svg"
              viewBox="0 0 32 32"
              fill="none"
              stroke="#fff"
              strokeWidth="1.4"
              strokeLinejoin="round"
            >
              {/* Outer hexagon */}
              <polygon points="16,3.5 26.8,9.75 26.8,22.25 16,28.5 5.2,22.25 5.2,9.75" />

              {/* 6 petals */}
              {[0, 60, 120, 180, 240, 300].map((angle) => (
                <ellipse
                  key={angle}
                  cx="16"
                  cy="10.2"
                  rx="2.1"
                  ry="3.3"
                  transform={`rotate(${angle} 16 16)`}
                />
              ))}

              {/* Center dot */}
              <circle cx="16" cy="16" r="2.2" fill="#fff" stroke="none" />
            </svg>
          </div>

          <span className="brand-name">
            Fresher<span>AI</span>
          </span>
        </div>

        <button
          className="report-dashboard-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← Dashboard
        </button>
      </header>

      <main className="report-container">
        {/* Title */}
        <section className="report-title-section">
          <div>
            

            <h1>Your Interview Report</h1>
            <p>Here's a detailed analysis of your interview performance.</p>
          </div>

          <button
            className="download-report-btn no-print"
            onClick={handleDownload}
          >
            Download Report 
          </button>
        </section>
 
        {/* Overall Score */}
        <section className="report-overview">
          <div className="overall-score-card">
            <div className="score-card-heading">
              <div>
                <span className="section-eyebrow">YOUR PERFORMANCE</span>
                <h2>Overall Score</h2>
              </div>

              <span className="score-icon">✦</span>
            </div>

            <div className="score-circle-wrapper">
              <svg className="score-circle" viewBox="0 0 180 180">
                <circle className="score-circle-bg" cx="90" cy="90" r="76" />

                <circle
                  className="score-circle-progress"
                  cx="90"
                  cy="90"
                  r="76"
                  style={{
                    strokeDasharray: `${(score / 100) * 477.5} 477.5`,
                    stroke: getScoreColor(score),
                  }}
                />
              </svg>

              <div className="score-circle-content">
                <h2>{score}</h2>
                <span>/ 100</span>
              </div>
            </div>

            <div className="score-grade">
              <h3>{grade.grade}</h3>
              <p>{grade.label}</p>
            </div>

            {/* <div className="score-bottom-text">
              Based on {evaluatedQuestions.length} evaluated answers
            </div> */}
          </div>

          {/* Interview Details */}
          <div className="interview-details-card">
            <div className="details-heading">
              <div>
                <span className="section-eyebrow">INTERVIEW OVERVIEW</span>
                <h2>Interview Details</h2>
              </div>

              <span className="details-icon">▤</span>
            </div>

            <div className="interview-role-box">
              <span>POSITION</span>
              <h3>{role || "Not specified"}</h3>
            </div>

            <div className="details-grid">
              <div className="detail-item">
                <span>Interview Type</span>
                <strong>{type?.toUpperCase() || "N/A"}</strong>
              </div>

              <div className="detail-item">
                <span>Total Questions</span>
                <strong>{questions.length}</strong>
              </div>

              <div className="detail-item">
                <span>Evaluated Answers</span>
                <strong>{evaluatedQuestions.length}</strong>
              </div>

              <div className="detail-item">
                <span>Date</span>
                <strong>{formatDate(createdAt)}</strong>
              </div>

              <div className="detail-item">
                <span>Status</span>
                <strong className="completed-status">
                  {status === "completed" ? "Completed" : status}
                </strong>
              </div>

              <div className="detail-item">
                <span>Resume Based</span>
                <strong>{interview.useResume ? "Yes" : "No"}</strong>
              </div>
            </div>
          </div>
        </section>

        {/* Skill Evaluation */}
        <section className="report-section">
          <div className="section-heading">
            <div>
              {/* <span className="section-eyebrow">DETAILED ANALYSIS</span> */}
              <h2>Skill-wise Performance</h2>
              <p>
                Understand your performance across eight evaluation criteria.
              </p>
            </div>
          </div>

          <div className="skill-grid">
            {skillMetrics.map((skill) => {
              const value = getAverage(skill.key);

              return (
                <div className="skill-card" key={skill.key}>
                  <div className="skill-card-top">
                    <div>
                      <h3>{skill.label}</h3>
                      <p>{skill.description}</p>
                    </div>

                    <span className="skill-score">
                      {value === null ? "N/A" : `${value}%`}
                    </span>
                  </div>

                  <div className="skill-progress-bg">
                    <div
                      className="skill-progress-fill"
                      style={{ width: `${value ?? 0}%` }}
                    ></div>
                  </div>

                  <div className="skill-progress-label">
                    <span>Performance</span>
                    <span>
                      {value === null ? "Not evaluated" : `${value}/100`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Strengths and Weaknesses */}
        <section className="report-section">
          <div className="section-heading">
            <div>
              {/* <span className="section-eyebrow">PERFORMANCE INSIGHTS</span> */}
              <h2>Your Strengths & Weaknesses</h2>
              <p>What went well and where you can improve.</p>
            </div>
          </div>

          <div className="insights-grid">
            <div className="insight-card strengths-card">
              <div className="insight-heading">
                <div className="insight-icon strength-icon">✓</div>
                <div>
                  <h3>Strengths</h3>
                  <p>Your strongest demonstrated areas</p>
                </div>
              </div>

              {strengths.length > 0 ? (
                <ul>
                  {strengths.map((item, index) => (
                    <li key={index}>
                      <span>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-report-text">No strengths available.</p>
              )}
            </div>

            <div className="insight-card weaknesses-card">
              <div className="insight-heading">
                {/* <div className="insight-icon weakness-icon">↗</div> */}
                <div className="insight-icon weakness-icon">
  <FaExclamationCircle />
</div>
                <div>
                  <h3>Areas to Improve</h3>
                  <p>Focus areas for your next interview</p>
                </div>
              </div>

              {weaknesses.length > 0 ? (
                <ul>
                  {weaknesses.map((item, index) => (
                    <li key={index}>
                      <span>!</span>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-report-text">No weaknesses available.</p>
              )}
            </div>
          </div>
        </section>

        {/* Recommendations */}
        <section className="report-section">
          <div className="section-heading">
            <div>
              {/* <span className="section-eyebrow">YOUR NEXT STEPS</span> */}
              <h2>Personalized Recommendations</h2>
              <p>Actionable suggestions to improve your interview readiness.</p>
            </div>
          </div>

          <div className="recommendation-card">
            {recommendations.length > 0 ? (
              recommendations.map((item, index) => (
                <div className="recommendation-item" key={index}>
                  <div className="recommendation-number">
                    {String(index + 1)}
                  </div>

                  <p>{item}</p>

                  <span className="recommendation-arrow">→</span>
                </div>
              ))
            ) : (
              <p className="empty-report-text">No recommendations available.</p>
            )}
          </div>
        </section>

        {/* Question-wise Review */}
        <section className="report-section">
          <div className="section-heading">
            <div>
              {/* <span className="section-eyebrow">ANSWER-BY-ANSWER ANALYSIS</span> */}
              <h2>Question-wise Review</h2>
              <p>Review your answers and understand the feedback.</p>
            </div>

            <span className="question-count">{questions.length} Questions</span>
          </div>

          <div className="question-review-list">
            {questions.map((question, index) => {
              const isExpanded = expandedQuestion === index;
              const feedback = question.feedback;

              return (
                <div
                  className={`question-review-card ${isExpanded ? "expanded" : ""}`}
                  key={index}
                >
                  <button
                    className="question-review-header"
                    onClick={() =>
                      setExpandedQuestion(isExpanded ? null : index)
                    }
                  >
                    <div className="question-number">
                      Q{String(index + 1)}
                    </div>

                    <div className="question-header-content">
                      <div className="question-meta">
                        <span
                          className={`difficulty-tag ${question.difficulty}`}
                        >
                          {question.difficulty || "N/A"}
                        </span>

                        <span className="question-score-tag">
                          {feedback ? `${feedback.score}/100` : "Not evaluated"}
                        </span>
                      </div>

                      <h3>{question.question}</h3>
                    </div>

                    <span className="expand-arrow">
                      {isExpanded ? "−" : "+"}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="question-review-body">
                      <div className="answer-block">
                        <h4>Your Answer</h4>
                        <p>
                          {question.userAnswer?.trim()
                            ? question.userAnswer
                            : "No answer submitted."}
                        </p>
                      </div>

                      {feedback ? (
                        <>
                          <div className="question-feedback">
                            <div className="feedback-heading">
                              <span>✦</span>
                              <h4>AI Interviewer Feedback</h4>
                            </div>

                            <p>
                              {feedback.feedback || "No feedback available."}
                            </p>
                          </div>

                          <div className="question-metrics">
                            <h4>Evaluation Breakdown</h4>

                            <div className="question-metrics-grid">
                              {skillMetrics.map((skill) => (
                                <div
                                  className="question-metric"
                                  key={skill.key}
                                >
                                  <span>{skill.label}</span>
                                  <strong>
                                    {typeof feedback[skill.key] === "number"
                                      ? `${feedback[skill.key]}/100`
                                      : "N/A"}
                                  </strong>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="improvements-block">
                            <h4>Areas for Improvement</h4>

                            {feedback.improvements?.length > 0 ? (
                              <ul>
                                {feedback.improvements.map((item, i) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </ul>
                            ) : (
                              <p>No specific improvements available.</p>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="empty-report-text">
                          This question has not been evaluated.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Final Summary */}
        <section className="report-section">
          <div className="final-summary-card">
            <div className="summary-title">
              <div className="summary-icon">✦</div>

              <div>
                <span className="section-eyebrow">FINAL ASSESSMENT</span>
                <h2>Interviewer's Summary</h2>
              </div>
            </div>

            <p>
              {summary || "No final summary is available for this interview."}
            </p>

            {/* <div className="summary-footer">
              <span>FresherAI Interview Evaluation</span>
              <span>{formatDate(createdAt)}</span>
            </div> */}
          </div>
        </section>

        {/* Bottom Action */}
        <section className="report-bottom-action no-print">
          <div className="bottom-action-text">
            <span className="section-eyebrow">WHAT'S NEXT</span>
            <h2>Ek interview se pehchaan nahi banti, practice se banti hai.</h2>
            <p>
              Apni weak areas pe kaam karo, recommendations follow karo, aur ek
              aur mock interview do. Har attempt tumhe pehle se better banata
              hai.
            </p>
          </div>

          <div className="bottom-action-buttons">
            <button
              className="bottom-primary-btn"
              onClick={() => navigate("/interview/setup")}
            >
              Start New Interview →
            </button>
           
          </div>
        </section>
      </main>
    </div>
  );
}

export default Step3report;
