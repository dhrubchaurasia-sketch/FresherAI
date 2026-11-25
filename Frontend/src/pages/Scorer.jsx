import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import {
  FiAlertCircle,
  FiUploadCloud,
  FiUser,
  FiArrowLeft,
} from "react-icons/fi";
import { GiMuscleUp } from "react-icons/gi";
import { FiTarget } from "react-icons/fi";
import { FiTrendingUp } from "react-icons/fi";
import { FiTrendingDown } from "react-icons/fi";
import api from "../utils/axios";
import { useDispatch, useSelector } from "react-redux";
import { setResume } from "../redux/resumeSlice.js";
import { GiArtificialHive } from "react-icons/gi";
import { PolarAngleAxis, RadialBar, RadialBarChart } from "recharts";
import { useCoins } from "../apis/user.api.js";

const ScoreRing = ({ score }) => {
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative flex items-center justify-center">
      <RadialBarChart
        width={110}
        height={110}
        cx={55}
        cy={55}
        innerRadius={40}
        outerRadius={53}
        startAngle={90}
        endAngle={-270}
        data={[{ value: score, fill: color }]}
        barSize={8}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <RadialBar
          background={{ fill: "#e5e7eb" }}
          dataKey="value"
          cornerRadius={8}
        />
      </RadialBarChart>
      <div className="absolute flex  items-center">
        <span className="text-lg font-bold text-white leading-none">
          {score}
        </span>
        <span className="text-[10px] text-gray-200 mt-0.5">/100</span>
      </div>
    </div>
  );
};

const Tag = ({ text, color }) => {
  const styles = {
    purple: "bg-gray-100 text-gray-800 border-gray-300", // neutral (Recommendations)
    red: "bg-red-50 text-red-700 border-red-200",
    green: "bg-green-50 text-green-700 border-green-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
  };
  return (
    <div
      className={`text-[10px] px-1.5 py-1 rounded-md border font-medium ${styles[color]}`}
    >
      {text}
    </div>
  );
};
const BREAKDOWN_ITEMS = [
  { key: "skills", label: "Skills", max: 25 },
  { key: "projects", label: "Projects", max: 25 },
  { key: "experience", label: "Experience", max: 20 },
  { key: "education", label: "Education", max: 10 },
  { key: "formatting", label: "Formatting", max: 10 },
  { key: "summary", label: "Summary", max: 10 },
];

const BreakdownRow = ({ label, value, max }) => {
  const pct = Math.round((value / max) * 100);
  const bar =
    pct >= 75 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-white/80">{label}</span>
        <span className="text-[11px] text-white/60">
          {value}/{max}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/10">
        <div
          className={`h-1.5 rounded-full ${bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
const Navbar = ({ label }) => {
  return (
    <motion.nav
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed inset-x-0 top-0 z-50 bg-[#FFF9F6]/95 backdrop-blur-xl border-b border-black/10 shadow-sm"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-2 sm:px-3 lg:px-4">
        {/* Logo & Brand */}
        <Link
          to="/dashboard"
          className="flex items-center gap-3 cursor-pointer group"
        >
          {/* Logo Icon */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#111111] transition-transform duration-200 group-hover:scale-105">
            <GiArtificialHive size={25} color="white" />
          </div>

          {/* FresherAI Text */}
          <span className="whitespace-nowrap text-xl font-extrabold tracking-tight text-[#111111]">
            Fresher<span className="text-gray-400">AI</span>
          </span>

          {/* Divider */}
          <div className="hidden sm:block h-7 w-px bg-black/10 mx-2" />

          {/* Resume Scorer Badge */}
          <span className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-black/10 bg-black/4 px-3.5 py-2 text-xs font-semibold tracking-wide text-[#222222]">
            <span className="h-1.5 w-1.5 rounded-full bg-black"></span>
            {label}
          </span>
        </Link>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-black hover:bg-black/80 px-4 py-2.5 rounded-xl transition-all duration-200 hover:shadow-lg cursor-pointer"
          >
            <FiArrowLeft size={13} />
            Dashboard
          </Link>
        </div>
      </div>
    </motion.nav>
  );
};

function Scorer({ user, setUser, onBack }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [changing, setChanging] = useState(false); // NEW
  const [showCoinModal, setShowCoinModal] = useState(false);
  const [availableCoins, setAvailableCoins] = useState(
    user?.interviewCoin ?? 0,
  );
  const dispatch = useDispatch();
  const { resume } = useSelector((state) => state.resume);

  // CHANGED: upload chalte time fetch skip + abort on cleanup
  useEffect(() => {
    if (loading) return; // upload chal raha ho to fetch mat karo

    const controller = new AbortController();

    api
      .get("/api/resume/get-resume", { signal: controller.signal })
      .then((r) => {
        if (r.data.success && r.data.data) {
          dispatch(setResume(r.data.data));
        }
      })
      .catch((e) => {
        if (e.name === "CanceledError" || e.code === "ERR_CANCELED") return;
        if (e.response?.status === 404) {
          console.log("No existing resume found.");
        } else {
          console.error("FETCH RESUME ERROR:", e.response?.data || e.message);
        }
      });

    return () => controller.abort();
  }, [dispatch, loading]);

  console.log("FULL RESUME:", resume);
  console.log("WEAKNESSES:", resume?.weaknesses);
  //    console.log("RESUME DATA:", resume);
  const uploadResume = async () => {
    if (!file) {
      alert("Please select a PDF");
      return;
    }

    if (file.type !== "application/pdf") {
      alert("Only PDF files are allowed");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert("File size should not exceed 20MB");
      return;
    }

    try {
      setLoading(true);
      setShowCoinModal(false);

      // Step 1: Deduct resume-scoring coins
      const coinResponse = await useCoins("resume");
      console.log("RESUME SCORER COIN RESPONSE:", coinResponse);

      if (!coinResponse?.success) {
        setAvailableCoins(
          coinResponse?.interviewCoin ??
            coinResponse?.user?.interviewCoin ??
            user?.interviewCoin ??
            0,
        );
        setShowCoinModal(true);
        return;
      }

      // Step 2: Update frontend balance
      setUser?.((prevUser) => ({
        ...prevUser,
        interviewCoin: coinResponse.interviewCoin,
      }));

      // Step 3: Upload resume
      const formData = new FormData();
      formData.append("resume", file);

      const response = await api.post("/api/resume/upload", formData);

      // Step 4: Store resume in Redux

      if (response.data.success && response.data.resume) {
        const newResume = response.data.resume;

        // Immediately update Redux
        dispatch(setResume(newResume));
        setChanging(false); // NEW

        // Clear selected file
        setFile(null);

        console.log("NEW SCORE:", newResume.score);
      }
    } catch (error) {
      console.error(
        "Resume Upload Error:",
        error.response?.data || error.message,
      );

      const message =
        error.response?.data?.message || error.message || "Upload Failed";

      // Show the same styled popup for coin-related failures.
      if (/coin|insufficient|not enough/i.test(message)) {
        setAvailableCoins(
          error.response?.data?.interviewCoin ?? user?.interviewCoin ?? 0,
        );
        setShowCoinModal(true);
      } else {
        alert(message);
      }
    } finally {
      setLoading(false);
    }
  };

  //   Scorer Section
  // CHANGED: changing / loading ho to scorer mat dikhao
  if (resume && !changing && !loading)
    return (
      <div className="min-h-screen bg-[#FFF9F6] text-[#0A0A0A]">
        <Navbar label="Resume Scorer" />
        <section className="max-w-7xl mx-auto px-3 pt-18 sm:pt-20 pb-8 space-y-3.5">
          {/* header */}
          <div className="w-full flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] text-black tracking-widest uppercase mb-0.5">
                Resume Analysis
              </p>
              <h2 className="text-lg font-bold">{resume?.name}</h2>
            </div>
            <button
              onClick={() => setChanging(true)} // CHANGED
              className="text-[10px] sm:text-xs  text-gray-600 hover:text-black border border-black/15 hover:border-black/35 px-2.5 py-1 rounded-lg transition-colors"
            >
              Change Resume
            </button>
          </div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="relative overflow-hidden bg-[#000000] backdrop-blur-2xl border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-4 sm:flex-row shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
          >
            <div className="absolute inset-0 bg-linear-to-br from-white/8 via-transparent to-transparent pointer-events-none" />
            <div className="relative">
              <ScoreRing score={resume?.score} />
            </div>
            <div className="relative">
              <p className="text-white/50 text-xs mb-0.5">Resume Score</p>
              <p className="text-lg sm:text-xl font-bold mb-1.5 text-white">
                {resume.score >= 75
                  ? "Strong"
                  : resume.score >= 50
                    ? "Average"
                    : "Needs Work"}
              </p>
              <div className="flex items-center gap-1.5">
                <FiUser className="text-white/60 text-xs" />
                <span className="text-xs text-white/70">
                  {resume?.suggestedRole}
                </span>
              </div>
            </div>
          </motion.div>
          {resume?.scoreBreakdown && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="relative overflow-hidden bg-[#000000] border border-white/10 rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
            >
              <div className="absolute inset-0 bg-linear-to-br from-white/8 via-transparent to-transparent pointer-events-none" />
              <div className="relative flex items-center gap-1.5 mb-3">
                <FiTarget className="text-white/70" size={14} />
                <span className="text-xs font-semibold text-white">
                  Score Breakdown
                </span>
              </div>
              <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-2">
                {BREAKDOWN_ITEMS.map(({ key, label, max }) => (
                  <BreakdownRow
                    key={key}
                    label={label}
                    value={resume.scoreBreakdown[key] ?? 0}
                    max={max}
                  />
                ))}
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {/* Strengths */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="relative overflow-hidden bg-[#000000] backdrop-blur-2xl border border-white/10 rounded-2xl p-4  gap-4 sm:flex-row shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
            >
              <div className="absolute inset-0 bg-linear-to-br from-white/8 via-transparent to-transparent pointer-events-none" />
              <div className="relative flex items-center gap-1.5 mb-2.5">
                <GiMuscleUp className="text-green-400" size={16} />
                <span className="text-xs font-semibold text-white">
                  Strengths
                </span>
              </div>
              <div className="relative flex flex-wrap gap-1.5">
                {Array.isArray(resume?.strengths) &&
                resume.strengths.length > 0 ? (
                  resume.strengths.map((s, index) => (
                    <Tag key={index} text={s} color="green" />
                  ))
                ) : (
                  <p className="text-xs text-white/50">
                    No strengths identified.
                  </p>
                )}
              </div>
            </motion.div>
            {/* Weaknesses */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative overflow-hidden bg-[#000000] backdrop-blur-2xl border border-white/10 rounded-2xl p-4 gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
            >
              <div className="absolute inset-0 bg-linear-to-br from-white/8 via-transparent to-transparent pointer-events-none" />

              <div className="relative flex items-center gap-1.5 mb-2.5">
                <FiTrendingDown className="text-red-400" size={14} />
                <span className="text-xs font-semibold text-white">
                  Weaknesses
                </span>
              </div>

              <div className="relative flex flex-wrap gap-1.5">
                {Array.isArray(resume?.weaknesses) &&
                resume.weaknesses.length > 0 ? (
                  resume.weaknesses.map((w, index) => (
                    <Tag key={index} text={w} color="red" />
                  ))
                ) : (
                  <p className="text-xs text-white/50">
                    No weaknesses identified.
                  </p>
                )}
              </div>
            </motion.div>
            {/* Missing Skills */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="relative overflow-hidden bg-[#000000] backdrop-blur-2xl border border-white/10 rounded-2xl p-4 gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
            >
              <div className="absolute inset-0 bg-linear-to-br from-white/8 via-transparent to-transparent pointer-events-none" />

              <div className="relative flex items-center gap-1.5 mb-2.5">
                <FiTarget className="text-yellow-400" size={14} />
                <span className="text-xs font-semibold text-white">
                  Missing Skills
                </span>
              </div>

              <div className="relative flex flex-wrap gap-1.5">
                {Array.isArray(resume?.missingSkills) &&
                resume.missingSkills.length > 0 ? (
                  resume.missingSkills.map((skill, index) => (
                    <Tag key={index} text={skill} color="yellow" />
                  ))
                ) : (
                  <p className="text-xs text-white/50">
                    No missing skills identified.
                  </p>
                )}
              </div>
            </motion.div>
            {/* Recommendations */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative overflow-hidden bg-[#000000] backdrop-blur-2xl border border-white/10 rounded-2xl p-4 gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
            >
              <div className="absolute inset-0 bg-linear-to-br from-white/8 via-transparent to-transparent pointer-events-none" />

              <div className="relative flex items-center gap-1.5 mb-2.5">
                <FiTrendingUp className="text-green-400" size={14} />

                <span className="text-xs font-semibold text-white">
                  Recommendations
                </span>
              </div>

              <div className="relative flex flex-wrap gap-1.5">
                {Array.isArray(resume?.recommendations) &&
                resume.recommendations.length > 0 ? (
                  resume.recommendations.map((recommendation, index) => (
                    <Tag key={index} text={recommendation} color="purple" />
                  ))
                ) : (
                  <p className="text-xs text-white/50">
                    No recommendations available.
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    );
  //    Upload Section
  return (
    <div className="min-h-screen bg-[#FFF9F6] text-[#0A0A0A]">
      <Navbar label="Resume Scorer" />

      {/* INSUFFICIENT COINS MODAL */}
      {showCoinModal && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowCoinModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="insufficient-coins-title"
            className="w-full max-w-sm rounded-3xl border border-black/10 bg-[#FFF9F6] p-7 text-center shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-5xl">
              😢
            </div>

            <h2
              id="insufficient-coins-title"
              className="mt-5 text-xl font-extrabold text-[#111111]"
            >
              Insufficient Coins Balance!
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-600">
              Oops! You don't have enough coins to analyze your resume. Please
              add coins to your wallet and try again.
            </p>

            <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4">
              <p className="text-xs font-medium text-gray-600">
                Your available balance
              </p>
              <p className="mt-1 text-2xl font-extrabold text-red-600">
                🪙 {availableCoins} Coins
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCoinModal(false)}
              className="mt-6 w-full rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-black/80"
            >
              Okay, Got it
            </button>
          </motion.div>
        </div>
      )}

      <section className="flex min-h-screen items-center justify-center px-3 pt-8 pb-6">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="relative w-full max-w-sm rounded-3xl overflow-hidden bg-[#000000]/90 backdrop-blur-2xl border border-white/0 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.25)] sm:p-6"
        >
          <div className="absolute inset-0 bg-linear-to-br from-white/8 via-transparent to-transparent pointer-events-none" />
          <p className="relative text-2.5 text-white/50 tracking-widest uppercase mb-1.5">
            Step 1 of 2
          </p>
          <div className="relative w-full h-1 bg-white/10 rounded-full mb-4">
            <div className="h-1 bg-white rounded-full w-1/2" />
          </div>
          <h2 className="relative text-lg font-bold mb-1 text-white">
            Upload Your Resume
          </h2>
          <p className="relative text-white/45 text-xs mb-4">
            We'll score it and give you actionable feedback.
          </p>

          <label
            className={`relative flex flex-col items-center justify-center w-full h-40 sm:h-48 rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${file ? "border-white/40 bg-white/6" : "border-white/5 bg-white/3 hover:border-white/30"}`}
          >
            <FiUploadCloud
              className={`text-4xl sm:text-5xl mb-2.5 ${file ? "text-white" : "text-white/30"}`}
            />
            <p className="text-xs font-medium text-white/80">
              {file ? file.name : "Click or drag Pdf here"}
            </p>
            <p className="text-[10px] text-white/35 mt-1">PDF only. Max 20MB</p>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </label>
          <motion.button
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.97 }}
            onClick={uploadResume}
            disabled={!file || loading}
            className="relative mt-4 w-full h-10 rounded-xl font-semibold text-xs bg-white text-[#0A0A0A] shadow-[0_4px_14px_rgba(255,255,255,0.15)] hover:bg-white/90 disabled:opacity-40"
          >
            {loading ? "Analyzing ..." : "Analyze Resume"}
          </motion.button>
        </motion.div>
      </section>
    </div>
  );
}

export default Scorer;
