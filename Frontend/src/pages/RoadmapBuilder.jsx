import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { GiArtificialHive } from "react-icons/gi";
import { FaMap, FaCoins, FaArrowLeft } from "react-icons/fa";
import {
  generateRoadmap,
  updateRoadmapProgress,
} from "../apis/roadmap.api.js";
import { getCurrentUser } from "../apis/user.api.js";

const inputClass =
  "h-10 w-full min-w-0 rounded-xl border border-[#F0E8E3] bg-white px-3.5 text-sm outline-none focus:border-[#111111]";

// ==========================================
// NAVBAR (same as ResumeBuilder)
// ==========================================

const Navbar = ({ label = "Roadmap Builder", onDashboardClick }) => {
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
            <span className="h-1.5 w-1.5 rounded-full bg-black"></span>
            {label}
          </span>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onDashboardClick}
            className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-black hover:bg-black/80 px-4 py-2.5 rounded-xl transition-all duration-200 hover:shadow-lg cursor-pointer"
          >
            <FaArrowLeft size={11} />
            Dashboard
          </button>
        </div>
      </div>
    </motion.nav>
  );
};

// ==========================================
// ROADMAP BUILDER
// ==========================================

function RoadmapBuilder({ onBack, user, setUser }) {
  const [goal, setGoal] = useState("Full Stack Engineer");
  const [targetPackage, setTargetPackage] = useState("12LPA");
  const [level, setLevel] = useState("beginner");
  const [weeks, setWeeks] = useState(8);
  const [hours, setHours] = useState(2);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [roadmap, setRoadmap] = useState(null);
  const [showCoinModal, setShowCoinModal] = useState(false);

  // Progress tracking (indexes of completed modules, saved in DB)
  const [completed, setCompleted] = useState([]);

  // Refresh latest coin balance from database
  const refreshUserCoins = async () => {
    try {
      const response = await getCurrentUser();

      console.log("FRESH USER RESPONSE:", response);

      if (!response) return;

      const latestUser =
        response.user ||
        response.data?.user ||
        response.data ||
        response;

      const updatedCoins = Number(latestUser.interviewCoin);

      if (!Number.isFinite(updatedCoins)) {
        console.error("Invalid coin balance:", latestUser);
        return;
      }

      setUser((prev) => ({
        ...prev,
        ...latestUser,
        interviewCoin: updatedCoins,
      }));

      const savedUser = localStorage.getItem("user");

      if (savedUser) {
        const parsed = JSON.parse(savedUser);

        localStorage.setItem(
          "user",
          JSON.stringify({
            ...parsed,
            ...latestUser,
            interviewCoin: updatedCoins,
          })
        );
      }

      console.log("FINAL UPDATED COINS:", updatedCoins);
    } catch (error) {
      console.error("Coin refresh failed:", error);
    }
  };

  // Generate Roadmap
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setRoadmap(null);

    const trimmedGoal = goal.trim();
    const trimmedPackage = targetPackage.trim();

    if (!trimmedGoal || !trimmedPackage) {
      setError("Role and Target Package are required");
      return;
    }

    setLoading(true);

    try {
      const res = await generateRoadmap({
        goal: trimmedGoal,
        targetRole: trimmedGoal,
        target_role: trimmedGoal,

        targetPackage: trimmedPackage,
        target_package: trimmedPackage,

        level,
        weeks: Number(weeks),

        hoursPerDay: Number(hours),
        hours_per_day: Number(hours),
      });

      if (res?.success === false) {
        throw new Error(res.message || "Roadmap generation failed");
      }

      // Set generated roadmap
      const roadmapData = res?.data || res?.roadmap || res;

      setRoadmap(roadmapData);

      // Update balance directly from roadmap response
      const responseCoins = Number(res?.interviewCoin);

      if (Number.isFinite(responseCoins)) {
        setUser((prev) => ({
          ...prev,
          interviewCoin: responseCoins,
        }));

        // Update localStorage
        const savedUser = localStorage.getItem("user");

        if (savedUser) {
          const parsed = JSON.parse(savedUser);

          localStorage.setItem(
            "user",
            JSON.stringify({
              ...parsed,
              interviewCoin: responseCoins,
            })
          );
        }
      }
    } catch (err) {
      console.error("Roadmap Error:", err);

      if (err.response?.status === 402) {
        refreshUserCoins(); // latest balance laao
        setShowCoinModal(true);
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Could not generate the roadmap. Try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Roadmap Modules
  const modules = Array.isArray(roadmap?.modules)
    ? roadmap.modules
    : Array.isArray(roadmap?.weeks)
      ? roadmap.weeks
      : Array.isArray(roadmap?.steps)
        ? roadmap.steps
        : null;

  // ==========================================
  // PROGRESS LOGIC (saved in DB)
  // ==========================================

  const roadmapId = roadmap?._id || null;

  // Roadmap badalne pe DB se aaya progress load karo
  useEffect(() => {
    setCompleted(
      Array.isArray(roadmap?.completedModules) ? roadmap.completedModules : []
    );
  }, [roadmapId]);

  const toggleModule = async (i) => {
    if (!roadmapId) return;

    const prev = completed;
    const next = prev.includes(i)
      ? prev.filter((x) => x !== i)
      : [...prev, i];

    setCompleted(next); // turant UI update

    try {
      const res = await updateRoadmapProgress(roadmapId, next);

      if (Array.isArray(res?.data?.completedModules)) {
        setCompleted(res.data.completedModules);
      }
    } catch (err) {
      setCompleted(prev); // save fail hua to wapas purani state
      setError("Could not save progress. Try again.");
    }
  };

  const total = modules?.length || 0;
  const percent = total ? Math.round((completed.length / total) * 100) : 0;

  return (
    <>
      <style>{`
        .roadmap-form {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 14px;
          align-items: end;
        }

        @media (min-width: 640px) {
          .roadmap-form {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (min-width: 1200px) {
          .roadmap-form {
            grid-template-columns:
              minmax(0, 1.6fr)
              minmax(0, 1.6fr)
              minmax(0, 1.6fr)
              minmax(75px, 0.65fr)
              minmax(110px, 1fr)
              max-content;
            gap: 12px;
          }
        }

        .roadmap-form-button {
          height: 40px;
          padding: 0 18px;
          white-space: nowrap;
        }
      `}</style>

      {/* INSUFFICIENT COINS MODAL */}
      {showCoinModal && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={() => setShowCoinModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl"
          >
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-50 text-5xl">
              😢
            </div>

            <h2 className="mt-5 text-2xl font-extrabold text-[#111111]">
              Insufficient Coins Balance!
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Oops! You don't have enough coins to build this roadmap. Please
              recharge your wallet to continue.
            </p>

            <div className="mt-6 rounded-2xl bg-red-50 py-4">
              <p className="text-sm text-gray-600">Your Available Balance</p>
              <div className="mt-1 flex items-center justify-center gap-2 text-red-600">
                <FaCoins size={26} className="text-yellow-500" />
                <span className="text-3xl font-extrabold">
                  {Number(user?.interviewCoin) || 0} Coins
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCoinModal(false)}
              className="mt-6 w-full rounded-2xl bg-black py-4 text-base font-bold text-white hover:bg-black/80 transition cursor-pointer"
            >
              Okay, Got it
            </button>
          </motion.div>
        </div>
      )}

      {/* NAVBAR */}
      <Navbar label="Roadmap Builder" onDashboardClick={onBack} />

      {/* pt-24 / sm:pt-28 because navbar is fixed (h-16) */}
      <div className="min-h-screen w-full min-w-0 bg-[#FFF9F6] px-4 pb-5 pt-24 text-[#111111] sm:px-8 sm:pb-7 sm:pt-28">
        <div className="mx-auto w-full max-w-6xl min-w-0">
          {/* Main Card */}

          <div className="w-full min-w-0 rounded-2xl border border-[#F0E8E3] bg-white p-5 shadow-sm sm:p-7">
            {/* Header */}

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#111111] text-white">
                <FaMap size={15} />
              </div>

              <div className="min-w-0">
                <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                  Roadmap Builder
                </h1>

                <p className="text-xs text-gray-500 sm:text-sm">
                  Build a personalized learning roadmap for your career goals.
                </p>
              </div>
            </div>

            {/* Roadmap Form */}

            <form onSubmit={handleSubmit} className="roadmap-form mt-6">
              {/* Target Role */}

              <div className="min-w-0">
                <label
                  htmlFor="goal"
                  className="mb-1 block text-xs font-semibold"
                >
                  Target role
                </label>

                <input
                  id="goal"
                  className={inputClass}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  required
                />
              </div>

              {/* Target Package */}

              <div className="min-w-0">
                <label
                  htmlFor="targetPackage"
                  className="mb-1 block text-xs font-semibold"
                >
                  Target package
                </label>

                <input
                  id="targetPackage"
                  placeholder="e.g. 12LPA"
                  className={inputClass}
                  value={targetPackage}
                  onChange={(e) => setTargetPackage(e.target.value)}
                  required
                />
              </div>

              {/* Current Level */}

              <div className="min-w-0">
                <label
                  htmlFor="level"
                  className="mb-1 block text-xs font-semibold"
                >
                  Current level
                </label>

                <select
                  id="level"
                  className={inputClass}
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              {/* Weeks */}

              <div className="min-w-0">
                <label
                  htmlFor="weeks"
                  className="mb-1 block text-xs font-semibold"
                >
                  Weeks
                </label>

                <input
                  id="weeks"
                  type="number"
                  min="1"
                  max="52"
                  className={inputClass}
                  value={weeks}
                  onChange={(e) => setWeeks(e.target.value)}
                  required
                />
              </div>

              {/* Hours Per Day */}

              <div className="min-w-0">
                <label
                  htmlFor="hours"
                  className="mb-1 block text-xs font-semibold"
                >
                  Hours per day
                </label>

                <input
                  id="hours"
                  type="number"
                  min="1"
                  max="12"
                  className={inputClass}
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  required
                />
              </div>

              {/* Build Roadmap Button */}

              <div className="flex min-w-0 items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="roadmap-form-button inline-flex w-fit items-center justify-center rounded-xl bg-[#111111] text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Building..." : "Build roadmap"}
                </button>
              </div>
            </form>

            {/* Error Message */}

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-xl bg-red-50 p-2.5 text-sm text-red-600"
              >
                {error}
              </p>
            )}

            {/* Roadmap Header */}

            {roadmap?.title && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#F0E8E3] bg-[#FFF9F6] px-4 py-3">
                <h2 className="text-base font-bold sm:text-lg">
                  {roadmap.title}
                </h2>

                <div className="flex flex-wrap gap-2 text-xs font-medium text-[#111111]">
                  {roadmap.targetPackage && (
                    <span className="rounded-full border border-[#E8E0DA] bg-white px-2.5 py-0.5">
                      Package: {roadmap.targetPackage}
                    </span>
                  )}

                  {roadmap.duration && (
                    <span className="rounded-full border border-[#E8E0DA] bg-white px-2.5 py-0.5">
                      Duration: {roadmap.duration}
                    </span>
                  )}

                  {roadmap.level && (
                    <span className="rounded-full border border-[#E8E0DA] bg-white px-2.5 py-0.5">
                      Level: {roadmap.level}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Progress Bar */}

            {modules && (
              <div className="mt-4 rounded-xl border border-[#F0E8E3] bg-white p-4">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                  <span>
                    Progress: {completed.length}/{total} modules
                  </span>
                  <span>{percent}%</span>
                </div>

                <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#F0E8E3]">
                  <div
                    className="h-full rounded-full bg-[#111111] transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                {percent === 100 && (
                  <p className="mt-2 text-xs font-medium text-green-600">
                    🎉 Roadmap complete! Ab capstone project pe lag jao.
                  </p>
                )}
              </div>
            )}

            {/* Roadmap Modules */}

            {modules && (
              <ol className="mt-3 grid gap-2.5">
                {modules.map((mod, i) => (
                  <li
                    key={mod._id || i}
                    className="rounded-xl border border-[#F0E8E3] bg-[#FFF9F6] p-3.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="flex items-center gap-2 text-sm font-bold sm:text-base">
                        <input
                          type="checkbox"
                          checked={completed.includes(i)}
                          disabled={!roadmapId}
                          onChange={() => toggleModule(i)}
                          className="h-4 w-4 cursor-pointer accent-black"
                        />
                        <span
                          className={
                            completed.includes(i)
                              ? "line-through opacity-50"
                              : ""
                          }
                        >
                          {i + 1}. {mod.title || mod.week || `Module ${i + 1}`}
                        </span>
                      </h3>

                      <div className="flex gap-1.5 text-xs text-[#111111]">
                        {mod.duration && (
                          <span className="rounded-full border border-[#E8E0DA] bg-white px-2.5 py-0.5">
                            {mod.duration}
                          </span>
                        )}

                        {mod.difficulty && (
                          <span className="rounded-full border border-[#E8E0DA] bg-white px-2.5 py-0.5">
                            {mod.difficulty}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description */}

                    {mod.description && (
                      <p className="mt-1 text-xs leading-relaxed text-[#111111] sm:text-sm">
                        {mod.description}
                      </p>
                    )}

                    {/* Topics */}

                    {Array.isArray(mod.topics) && (
                      <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-[#111111] sm:text-sm">
                        {mod.topics.map((t, j) => (
                          <li key={j}>{typeof t === "string" ? t : t.title}</li>
                        ))}
                      </ul>
                    )}

                    {/* Outcome */}

                    {mod.outcome && (
                      <p className="mt-2 text-xs text-[#111111] sm:text-sm">
                        <span className="font-semibold">Outcome: </span>
                        {mod.outcome}
                      </p>
                    )}

                    {/* Practice Task */}

                    {mod.practiceTask && (
                      <div className="mt-2 rounded-lg border border-[#E8E0DA] bg-white p-2.5 text-xs text-[#111111] sm:text-sm">
                        <span className="font-semibold">Practice: </span>
                        {mod.practiceTask}
                      </div>
                    )}

                    {/* Study Material */}

                    {Array.isArray(mod.interviewQuestions) &&
                      mod.interviewQuestions.length > 0 && (
                        <details className="mt-2 text-xs text-[#111111] sm:text-sm">
                          <summary className="cursor-pointer font-semibold">
                            Study Material
                          </summary>
                          <ul className="mt-1 list-disc space-y-0.5 pl-5">
                            {mod.interviewQuestions.map((q, k) => (
                              <li key={k}>{q}</li>
                            ))}
                          </ul>
                        </details>
                      )}

                    {/* Resources */}

                    {(mod.youtube ||
                      mod.article ||
                      mod.practice ||
                      mod.course ||
                      Array.isArray(mod.resources)) && (
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {mod.youtube && (
                          <a
                            href={mod.youtube}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-[#E8E0DA] bg-white px-3 py-1 text-xs font-medium text-[#111111] hover:bg-[#F5EDE8]"
                          >
                            YouTube Video
                          </a>
                        )}

                        {mod.article && (
                          <a
                            href={mod.article}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-[#E8E0DA] bg-white px-3 py-1 text-xs font-medium text-[#111111] hover:bg-[#F5EDE8]"
                          >
                            Article / Docs
                          </a>
                        )}

                        {mod.practice && (
                          <a
                            href={mod.practice}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-[#E8E0DA] bg-white px-3 py-1 text-xs font-medium text-[#111111] hover:bg-[#F5EDE8]"
                          >
                            Practice
                          </a>
                        )}

                        {mod.course && (
                          <a
                            href={mod.course}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-[#E8E0DA] bg-white px-3 py-1 text-xs font-medium text-[#111111] hover:bg-[#F5EDE8]"
                          >
                            Free Course
                          </a>
                        )}

                        {Array.isArray(mod.resources) &&
                          mod.resources.map((r, j) =>
                            r.url ? (
                              <a
                                key={j}
                                href={r.url}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full border border-[#E8E0DA] bg-white px-3 py-1 text-xs font-medium text-[#111111] hover:bg-[#F5EDE8]"
                              >
                                {r.title || r.url}
                              </a>
                            ) : (
                              <span
                                key={j}
                                className="rounded-full border border-[#E8E0DA] bg-white px-3 py-1 text-xs text-[#111111]"
                              >
                                {r.title || String(r)}
                              </span>
                            )
                          )}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}

            {/* Capstone Project */}

            {roadmap?.capstoneProject?.title && (
              <div className="mt-4 rounded-xl border border-[#111111] bg-white p-4">
                <p className="text-xs font-semibold">Capstone Project</p>

                <h3 className="mt-1 text-base font-bold">
                  {roadmap.capstoneProject.title}
                </h3>

                {roadmap.capstoneProject.description && (
                  <p className="mt-1 text-sm text-[#111111]">
                    {roadmap.capstoneProject.description}
                  </p>
                )}
              </div>
            )}

            {/* Fallback Roadmap Output */}

            {roadmap && !modules && (
              <pre className="mt-5 whitespace-pre-wrap rounded-xl border border-[#F0E8E3] bg-[#FFF9F6] p-4 text-sm text-[#111111]">
                {typeof roadmap === "string"
                  ? roadmap
                  : JSON.stringify(roadmap, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default RoadmapBuilder;
