import React, { useRef, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { startInterview } from "../../apis/interview.api.js";
import { GiArtificialHive } from "react-icons/gi";

import {
  FaArrowRight,
  FaBriefcase,
  FaCheck,
  FaCheckCircle,
  FaCloudUploadAlt,
  FaFileAlt,
  FaTimes,
  FaCode,
  FaUsers,
  FaSpinner,
  FaTrash,
} from "react-icons/fa";

import { useDispatch, useSelector } from "react-redux";
import { setResume } from "../../redux/resumeSlice.js";

import api from "../../utils/axios";
import { useCoins } from "../../apis/user.api.js";

// Ek interview ka cost. Backend wale cost ke barabar rakhna.
const INTERVIEW_COIN_COST = 50;

const targetRoles = [
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Java Developer",
  "Python Developer",
  "C++ Developer",
  "AI/ML Engineer",
  "Data Scientist",
  "Data Analyst",
  "Data Engineer",
  "DevOps Engineer",
  "Cloud Engineer",
  "Cybersecurity Analyst",
  "QA Engineer",
  "Android Developer",
  "iOS Developer",
  "Product Manager",
  "Business Analyst",
  "UI/UX Designer",
  "HR / Human Resources",
  "Other",
];

const features = [
  "Personalized AI Questions",
  "Resume Based Interview",
  "Detailed Performance Report",
  "Real Interview Experience",
];

const howItWorks = [
  {
    title: "Set up your interview",
    desc: "Choose your role, interview type and optionally add your resume.",
  },
  {
    title: "Answer like a real interview",
    desc: "Respond using voice, text or the code editor within the timer.",
  },
  {
    title: "Get your performance report",
    desc: "See scores, strengths and areas to improve for every answer.",
  },
];

// ==========================================
// NAVBAR (same as ResumeBuilder / RoadmapBuilder)
// ==========================================

const Navbar = ({ label = "AI Interview", onDashboardClick }) => {
  return (
    <motion.nav
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed inset-x-0 top-0 z-50 bg-[#FFF9F6]/95 backdrop-blur-xl border-b border-black/10 shadow-sm"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-2 sm:px-3 lg:px-4">
        {/* Logo & Brand */}
        <div
          onClick={onDashboardClick}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#111111] transition-transform duration-200 group-hover:scale-105">
            <GiArtificialHive size={25} color="white" />
          </div>

          <span className="whitespace-nowrap text-xl font-extrabold tracking-tight text-[#111111]">
            Fresher<span className="text-gray-400">AI</span>
          </span>

          <div className="hidden sm:block h-7 w-px bg-black/10 mx-2" />

          <span className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-black/10 bg-black/4 px-3.5 py-2 text-xs font-semibold tracking-wide text-[#222222]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-black"></span>
            {label}
          </span>
           {/* <div className="mt-8 flex items-center gap-2 text-xs text-gray-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            AI-powered interview preparation
          </div> */}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onDashboardClick}
            className="text-xs font-semibold text-white bg-black hover:bg-black/80 px-4 py-2.5 rounded-xl transition-all duration-200 hover:shadow-lg cursor-pointer"
          >
            ← Dashboard
          </button>
        </div>
      </div>
    </motion.nav>
  );
};

function Step1setup({ user, setUser }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const { resume } = useSelector((state) => state.resume);

  const userName =
    user?.fullName || user?.name || user?.username || "Candidate";

  const [targetRole, setTargetRole] = useState("Backend Developer");
  const [interviewType, setInterviewType] = useState("Technical");
  const [useResumeForInterview, setUseResumeForInterview] = useState(true);

  const [selectedFile, setSelectedFile] = useState(null);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [showCoinModal, setShowCoinModal] = useState(false);
  const [availableCoins, setAvailableCoins] = useState(user?.interviewCoin ?? 0);

  // SELECT RESUME
  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");

    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError("Resume size should not exceed 20MB.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setResumeUploaded(false);
  };

  // UPLOAD RESUME
  const handleResumeUpload = async () => {
    if (!selectedFile) {
      setError("Please select a PDF resume first.");
      return;
    }

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("resume", selectedFile);

      const response = await api.post("/api/resume/upload", formData);

      if (!response.data?.resume) {
        throw new Error("Resume upload response is invalid.");
      }

      dispatch(
        setResume({
          ...response.data.resume,
          fileName: selectedFile.name,
        }),
      );
      setResumeUploaded(true);

      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("RESUME UPLOAD ERROR:", err);

      setError(
        err.response?.data?.message || err.message || "Resume upload failed.",
      );
    } finally {
      setUploading(false);
    }
  };

  // REMOVE RESUME
  const handleRemoveResume = () => {
    setResumeUploaded(false);
    setSelectedFile(null);
    setError("");

    dispatch(setResume(null));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // START INTERVIEW
  // Flow: balance check -> interview create -> SUCCESS ke baad hi coins deduct
  const handleStartInterview = async () => {
    if (!targetRole) {
      setError("Please select your target role.");
      return;
    }

    if (useResumeForInterview && (!resumeUploaded || !resume)) {
      setError("Please upload your resume or turn off Use Resume.");
      return;
    }

    const currentBalance = user?.interviewCoin ?? 0;
    setAvailableCoins(currentBalance);
    setShowCoinModal(false);

    if (currentBalance < INTERVIEW_COIN_COST) {
      setShowCoinModal(true);
      return;
    }

    try {
      setStarting(true);
      setError("");

      const response = await startInterview({
        role: targetRole,
        type: interviewType.toLowerCase(),
        useResume: useResumeForInterview,
        resume: useResumeForInterview ? resume : null,
      });

      console.log("INTERVIEW RESPONSE:", response);

      const interviewId =
        response?.interview?._id ||
        response?.interviewId ||
        response?._id;

      if (!interviewId) {
        throw new Error("Interview ID not found in API response.");
      }

      let coinResponse = null;

      try {
        coinResponse = await useCoins("interview");
      } catch (coinError) {
        console.error("COIN DEDUCTION ERROR:", coinError);

        const coinData = coinError?.response?.data;
        const balance =
          coinData?.interviewCoin ??
          coinData?.user?.interviewCoin ??
          user?.interviewCoin ??
          0;

        setAvailableCoins(balance);
        setShowCoinModal(true);
        return;
      }

      console.log("COIN RESPONSE:", coinResponse);

      if (!coinResponse?.success) {
        const balance =
          coinResponse?.interviewCoin ??
          coinResponse?.user?.interviewCoin ??
          user?.interviewCoin ??
          0;

        setAvailableCoins(balance);
        setShowCoinModal(true);
        return;
      }

      const updatedCoinBalance =
        coinResponse.interviewCoin ??
        coinResponse.user?.interviewCoin ??
        user?.interviewCoin ??
        0;

      setUser?.((prev) => ({
        ...prev,
        interviewCoin: updatedCoinBalance,
      }));

      navigate(`/interview/${interviewId}`);
    } catch (err) {
      console.error("START INTERVIEW ERROR:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to start interview.",
      );
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FFF9F6] text-[#171717]">
      {/* NAVBAR */}
      <Navbar
        label="AI  Interview"
        onDashboardClick={() => navigate("/dashboard")}
      />

      {/* pt-16 because navbar is fixed (h-16) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid min-h-screen w-full grid-cols-1 bg-[#FFF9F6] pt-16 lg:grid-cols-[0.85fr_1.15fr]"
      >
        {/* LEFT SECTION */}
        <section className="relative flex flex-col justify-start bg-[#FFF9F6] px-6 pb-10 pt-10 sm:px-10 lg:border-r lg:border-[#EAE5E1] lg:px-20 xl:px-32">
          {/* WELCOME */}
          <div>
            <h1 className="text-3xl font-extrabold leading-tight text-[#171717] sm:text-4xl">
              Welcome back,
              <br />
              <span className="text-gray-600">{userName}</span>
            </h1>

            <p className="mt-4 max-w-md text-sm leading-7 text-gray-600">
              Practice realistic AI interviews, receive instant feedback, and
              improve your confidence before your next job interview.
            </p>
          </div>

          {/* FEATURES */}
          <div className="mt-7 max-w-md space-y-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 rounded-xl border border-[#EAE5E1] bg-[#FFF9F6] p-3.5"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#171717] text-white">
                  <FaCheck size={11} />
                </div>

                <span className="text-sm text-gray-700">{feature}</span>
              </motion.div>
            ))}
          </div>

          {/* HOW IT WORKS */}
          <div className="mt-8 max-w-md">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
              How it works
            </p>

            <div className="mt-4 space-y-4">
              {howItWorks.map((step, index) => (
                <div key={step.title} className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#D8CEC5] bg-white text-xs font-bold text-[#171717]">
                    {index + 1}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[#171717]">
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-gray-500">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FOOTER */}
          <div className="mt-8 flex items-center gap-2 text-xs text-gray-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            AI-powered interview preparation
          </div>
        </section>

        {/* RIGHT SECTION */}
        <section className="flex flex-col justify-start bg-white px-5 pb-10 pt-10 sm:px-9 lg:px-14 xl:px-20">
          <div className="mb-7">
            <p className="text-2xl font-bold leading-tight">Start Interview</p>

            <p className="mt-2 text-xs text-gray-500">
              Configure your interview preferences.
            </p>
          </div>

          {/* TARGET ROLE */}
          <div className="mb-6">
            <label
              htmlFor="targetRole"
              className="mb-2 block text-xs font-medium text-gray-600"
            >
              Target Role
            </label>

            <div className="flex items-center gap-3 rounded-xl border border-[#EAE5E1] bg-[#FFF9F6] px-4">
              <FaBriefcase className="text-gray-500" />

              <select
                id="targetRole"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full bg-transparent py-3.5 text-sm text-[#171717] outline-none"
              >
                {targetRoles.map((role) => (
                  <option
                    key={role}
                    value={role}
                    className="bg-white text-[#171717]"
                  >
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* INTERVIEW TYPE */}
          <div className="mb-6">
            <label className="mb-2 block text-xs font-medium text-gray-600">
              Interview Type
            </label>

            <div className="grid grid-cols-2 gap-1 rounded-xl border border-[#EAE5E1] bg-[#FFF9F6] p-1">
              {["Technical", "HR"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setInterviewType(type)}
                  className={`flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition ${
                    interviewType === type
                      ? "bg-[#171717] text-white"
                      : "text-gray-600 hover:bg-white hover:text-[#171717]"
                  }`}
                >
                  {type === "Technical" ? (
                    <FaCode size={13} />
                  ) : (
                    <FaUsers size={13} />
                  )}

                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* USE RESUME TOGGLE */}
          <div className="mb-4 flex items-center justify-between rounded-xl border border-[#EAE5E1] bg-white p-4">
            <div>
              <p className="text-sm font-semibold text-[#171717]">Use Resume</p>

              <p className="mt-1 text-xs text-gray-600">
                AI will personalize questions using your resume.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={useResumeForInterview}
              onClick={() => setUseResumeForInterview((prev) => !prev)}
              className={`relative h-7 w-12 rounded-full transition ${
                useResumeForInterview ? "bg-[#171717]" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full transition-all ${
                  useResumeForInterview ? "left-6.5 bg-white" : "left-1 bg-white"
                }`}
              />
            </button>
          </div>

          {/* RESUME STATUS */}
          {useResumeForInterview && (
            <>
              {resumeUploaded && resume ? (
                <div className="mb-4 flex items-center gap-3 rounded-xl border border-green-200 bg-[#ECFDF3] p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-500 text-white">
                    <FaFileAlt />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-green-700">
                      Resume Ready
                    </p>

                    <p className="truncate text-xs text-gray-600">
                      {resume.fileName ||
                        resume.originalName ||
                        "Resume detected successfully."}
                    </p>
                  </div>

                  <FaCheckCircle className="shrink-0 text-green-500" />

                  <button
                    type="button"
                    onClick={handleRemoveResume}
                    title="Delete uploaded resume"
                    aria-label="Delete uploaded resume"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 transition hover:border-red-300 hover:bg-red-50"
                  >
                    <FaTrash size={13} />
                  </button>
                </div>
              ) : (
                <div className="mb-4 flex items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                  <FaFileAlt className="text-yellow-500" />

                  <div>
                    <p className="text-sm font-semibold text-yellow-700">
                      Resume Not Found
                    </p>

                    <p className="text-xs text-gray-500">
                      Upload your resume to personalize questions.
                    </p>
                  </div>
                </div>
              )}

              {/* UPLOAD BOX */}
              <div className="rounded-xl border border-dashed border-[#D8CEC5] bg-[#FFF9F6] p-5 text-center transition hover:border-gray-400">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#171717] text-white transition hover:scale-105"
                >
                  <FaCloudUploadAlt size={20} />
                </button>

                <p className="mt-3 text-sm font-semibold text-[#171717]">
                  {selectedFile
                    ? selectedFile.name
                    : resumeUploaded && resume
                      ? "Upload New Resume"
                      : "Upload Resume"}
                </p>

                <p className="mt-1 text-xs text-gray-600">
                  PDF only · Maximum 20MB
                </p>

                {selectedFile && (
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={handleResumeUpload}
                    className="mt-4 rounded-lg bg-[#171717] px-5 py-2 text-xs font-bold text-white transition hover:bg-gray-800 disabled:opacity-50"
                  >
                    {uploading ? (
                      <span className="flex items-center gap-2">
                        <FaSpinner className="animate-spin" />
                        Uploading...
                      </span>
                    ) : (
                      "Upload Resume"
                    )}
                  </button>
                )}
              </div>
            </>
          )}

          {/* ERROR */}
          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <FaTimes className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {/* START BUTTON */}
          <button
            type="button"
            onClick={handleStartInterview}
            disabled={
              starting ||
              uploading ||
              (useResumeForInterview && (!resumeUploaded || !resume))
            }
            className="mt-5 flex w-full items-center justify-center gap-3 rounded-xl bg-[#171717] px-5 py-4 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {starting ? (
              <>
                <FaSpinner className="animate-spin" />
                Starting Interview...
              </>
            ) : (
              <>
                Start Interview
                <FaArrowRight size={13} />
              </>
            )}
          </button>

          <p className="mt-3 text-center text-[11px] text-gray-600">
            Your AI interview session will begin after configuration.
          </p>
        </section>
      </motion.div>

      {/* INSUFFICIENT COINS MODAL */}
      {showCoinModal && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-5xl">
              😢
            </div>

            <h2 className="mt-5 text-2xl font-bold text-gray-900">
              Insufficient Coins Balance!
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              Oops! You don't have enough interview coins to start this
              interview. Please recharge your wallet to continue.
            </p>

            <div className="mt-6 rounded-2xl bg-red-50 p-4">
              <p className="text-sm text-gray-600">Your Available Balance</p>

              <p className="mt-2 text-3xl font-bold text-red-600">
                🪙 {availableCoins} Coins
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCoinModal(false)}
              className="mt-6 w-full rounded-xl bg-black py-3.5 font-semibold text-white transition hover:bg-gray-800"
            >
              Okay, Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Step1setup;
