import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import RoadmapBuilder from "./RoadmapBuilder.jsx";
import {
  FaBars,
  FaTimes,
  FaPlus,
  FaHome,
  FaFileAlt,
  FaMap,
  FaStar,
  FaChevronLeft,
  FaChevronRight,
  FaSignOutAlt,
  FaArrowRight,
  FaCode,
  FaUsers,
  FaCheckCircle,
  FaCoins,
  FaPlay,
  FaClock,
} from "react-icons/fa";
import { GiArtificialHive } from "react-icons/gi";
import ResumeBuilder from "./ResumeBuilder.jsx";
import {
  useCoins,
  createPaymentOrder,
  verifyPayment,
} from "../apis/user.api.js";
import { useNavigate } from "react-router-dom";
import { getDashboardStats } from "../apis/interview.api.js";

const navigationItems = [
  { label: "Overview", icon: FaHome },
  { label: "Resume Builder", icon: FaFileAlt },
  { label: "Resume Scorer", icon: FaStar },
  { label: "Roadmap Builder", icon: FaMap },
];
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

// const interviewHistory = dashboardData?.interviewHistory ?? [];

// RADAR CHART
function RadarChart({ performanceMetrics = [] }) {
  const [hoveredMetric, setHoveredMetric] = useState(null);

  const metrics = [
    "Correctness",
    "Clarity",
    "Relevance",
    "Detail",
    "Efficiency",
    "Communication",
    "Problem Solving",
    "Creativity",
  ];

  const chartData = metrics.map((label) => {
    const metric = performanceMetrics.find(
      (item) => item?.label?.toLowerCase() === label.toLowerCase(),
    );

    return {
      label,
      value: Math.max(0, Math.min(100, Number(metric?.value) || 0)),
    };
  });

  const centerX = 180;
  const centerY = 145;
  const radius = 78;

  const getPoint = (index, value) => {
    const angle = (Math.PI * 2 * index) / metrics.length - Math.PI / 2;
    const distance = (value / 100) * radius;

    return {
      x: centerX + Math.cos(angle) * distance,
      y: centerY + Math.sin(angle) * distance,
    };
  };

  const polygonPoints = chartData
    .map((metric, index) => {
      const point = getPoint(index, metric.value);
      return `${point.x},${point.y}`;
    })
    .join(" ");

  const showMetric = (metric, point) => {
    setHoveredMetric({ ...metric, point });
  };

  return (
    <div className="relative flex min-h-67.5 w-full items-center justify-center py-2">
      <svg
        viewBox="0 0 360 290"
        role="img"
        aria-label="Interview performance radar chart. Hover over or tap a metric point to view its score."
        className="w-full max-w-97.5 overflow-visible"
      >
        {/* Circular grid */}
        {[20, 40, 60, 80, 100].map((level) => (
          <circle
            key={level}
            cx={centerX}
            cy={centerY}
            r={(level / 100) * radius}
            fill="none"
            stroke="#454545"
            strokeWidth="0.9"
          />
        ))}

        {/* Axis lines */}
        {chartData.map((metric, index) => {
          const point = getPoint(index, 100);

          return (
            <line
              key={metric.label}
              x1={centerX}
              y1={centerY}
              x2={point.x}
              y2={point.y}
              stroke="#454545"
              strokeWidth="0.9"
            />
          );
        })}

        {/* Performance polygon */}
        <polygon
          points={polygonPoints}
          fill="rgba(255,255,255,0.13)"
          stroke="#F5F5F5"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Labels and interactive data points */}
        {chartData.map((metric, index) => {
          const labelPoint = getPoint(index, 125);
          const point = getPoint(index, metric.value);
          const isActive = hoveredMetric?.label === metric.label;

          return (
            <g key={metric.label}>
              <text
                x={labelPoint.x}
                y={labelPoint.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#A3A3A3"
                fontSize="10"
              >
                {metric.label}
              </text>

              <circle
                cx={point.x}
                cy={point.y}
                r="11"
                fill="transparent"
                className="cursor-pointer"
                tabIndex={0}
                role="button"
                aria-label={`${metric.label}: ${metric.value} out of 100`}
                onMouseEnter={() => showMetric(metric, point)}
                onMouseLeave={() => setHoveredMetric(null)}
                onFocus={() => showMetric(metric, point)}
                onBlur={() => setHoveredMetric(null)}
                onClick={() =>
                  setHoveredMetric((current) =>
                    current?.label === metric.label
                      ? null
                      : { ...metric, point },
                  )
                }
              />

              <circle
                cx={point.x}
                cy={point.y}
                r={isActive ? 4 : 2.8}
                fill="#FFFFFF"
                pointerEvents="none"
              />
            </g>
          );
        })}
      </svg>

      {/* Hover / tap tooltip */}
      {hoveredMetric && (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-lg border border-[#414141] bg-black px-3 py-2 text-center shadow-xl"
          style={{
            left: `${(hoveredMetric.point.x / 360) * 100}%`,
            top: `${(hoveredMetric.point.y / 290) * 100}%`,
          }}
        >
          <p className="whitespace-nowrap text-xs text-gray-400">
            {hoveredMetric.label}
          </p>
          <p className="mt-1 text-lg font-bold text-white">
            {hoveredMetric.value}/100
          </p>
        </div>
      )}
    </div>
  );
}

function Dashboard({ user, setUser }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState("Overview");
  const navigate = useNavigate();
  // const [showInterviewModal, setShowInterviewModal] = useState(false);
  // const [interviewType, setInterviewType] = useState("Technical");
  // const [targetRole, setTargetRole] = useState("Software Engineer");
  const [notice, setNotice] = useState("");
  const [dashboardData, setDashboardData] = useState(null);

  const [dashboardLoading, setDashboardLoading] = useState(true);
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await getDashboardStats();

        if (response.success) {
          setDashboardData(response);
        }
      } catch (error) {
        console.error("Dashboard Fetch Error:", error);
      } finally {
        setDashboardLoading(false);
      }
    };

    fetchDashboard();
  }, []);
  const stats = [
    {
      label: "TOTAL INTERVIEWS",
      value: dashboardData?.stats?.totalInterviews ?? 0,
      note: "Interviews created",
      icon: FaUsers,
    },
    {
      label: "QUESTIONS SOLVED",
      value: dashboardData?.stats?.questionsSolved ?? 0,
      note: "Questions answered",
      icon: FaCode,
    },
    {
      label: "COMPLETED",
      value: dashboardData?.stats?.completed ?? 0,
      note: "Interviews finished",
      icon: FaCheckCircle,
    },
    {
      label: "AVERAGE SCORE",
      value: `${dashboardData?.stats?.averageScore ?? 0}/100`,
      note: "Across completed interviews",
      icon: FaStar,
    },
  ];
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");

  const interviewHistory = dashboardData?.interviewHistory ?? [];

  const userName =
    user?.fullName || user?.name || user?.username || "Your Profile";

  const initials =
    userName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "U";

  const selectPage = (page) => {
    if (page === "Resume Scorer") {
      setMobileSidebarOpen(false);
      navigate("/scorer");
      return;
    }
    setActivePage(page);
    setMobileSidebarOpen(false);
    setNotice("");
  };

  const handleLogout = () => {
    // Connect the backend logout API here.
    // This clears the current frontend user state.
    setUser(null);
  };

  const handleCreateInterview = async (event) => {
    event.preventDefault();

    try {
      const result = await useCoins("interview");

      if (!result || !result.success) {
        setNotice(result?.message || "Unable to deduct interview coins.");
        return;
      }

      // Update frontend user balance
      setUser((prev) => ({
        ...prev,
        interviewCoin: result.interviewCoin,
      }));

      // setShowInterviewModal(false);
      setActivePage("Overview");

      setNotice(
        `${interviewType} interview selected for ${targetRole}. ${result.interviewCoin} coins remaining.`,
      );
    } catch (error) {
      console.error("Interview coin deduction error:", error);
      setNotice("Something went wrong. Please try again.");
    }
  };

  const handleRecharge = async (packageId) => {
    try {
      setPaymentLoading(true);
      setPaymentMessage("");

      // Load Razorpay Checkout script
      if (!window.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;

        document.body.appendChild(script);

        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }

      // Create order
      const orderResult = await createPaymentOrder(packageId);

      if (!orderResult?.success) {
        throw new Error(orderResult?.message || "Order creation failed");
      }

      // Razorpay options
      const options = {
        key: orderResult.key,
        amount: orderResult.order.amount,
        currency: orderResult.order.currency,
        name: "FresherAI",
        description: "Interview Coins Recharge",
        order_id: orderResult.order.id,

        prefill: {
          name: user?.name || user?.fullName || "",
          email: user?.email || "",
        },

        theme: {
          color: "#111111",
        },

        handler: async (response) => {
          try {
            const verification = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (!verification?.success) {
              throw new Error(
                verification?.message || "Payment verification failed",
              );
            }

            setUser((prev) => ({
              ...prev,
              interviewCoin: verification.interviewCoin,
            }));

            setShowRechargeModal(false);

            setNotice(
              `Payment successful! ${verification.coinsAdded} coins added.`,
            );
          } catch (error) {
            console.error("Payment Verification Error:", error);
            setPaymentMessage(error.message || "Payment verification failed.");
          } finally {
            setPaymentLoading(false);
          }
        },

        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response) => {
        console.error("Payment Failed:", response.error);
        setPaymentMessage(
          response.error?.description || "Payment failed. Please try again.",
        );
        setPaymentLoading(false);
      });

      razorpay.open();
    } catch (error) {
      console.error("Recharge Error:", error);
      setPaymentMessage(error.message || "Unable to start payment.");
      setPaymentLoading(false);
    }
  };
  // SIDEBAR CONTENT
  const SidebarContent = ({ mobile = false }) => (
    <div className="flex h-full flex-col">
      {/* BRAND */}{" "}
      <div className="flex h-19 shrink-0 items-center justify-between border-b border-[#F0E8E3] px-5">
        {sidebarOpen || mobile ? (
          <div className="flex min-w-0 items-center gap-2.5">
            {" "}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#111111]">
              {" "}
              <GiArtificialHive size={22} color="white" />{" "}
            </div>
            <span className="whitespace-nowrap text-lg font-extrabold tracking-tight text-[#111111]">
              Fresher<span className="text-gray-400">AI</span>
            </span>
          </div>
        ) : (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-[#111111]">
            <GiArtificialHive size={22} color="white" />
          </div>
        )}

        {mobile ? (
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="rounded-lg p-2 text-gray-500 hover:bg-[#F5EDE8] hover:text-black"
            aria-label="Close sidebar"
          >
            <FaTimes size={16} />
          </button>
        ) : (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden rounded-lg p-2 text-gray-400 transition-colors hover:bg-[#F5EDE8] hover:text-black lg:block"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? (
              <FaChevronLeft size={12} />
            ) : (
              <FaChevronRight size={12} />
            )}
          </button>
        )}
      </div>
      {/* NAVIGATION */}
      <div className="mt-2 px-3">
        <div className="space-y-1.5">
          {/* OVERVIEW */}
          <button
            onClick={() => selectPage("Overview")}
            className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm transition-colors duration-200 hover:bg-[#111111] hover:text-white ${
              activePage === "Overview"
                ? "bg-[#F5EDE8] font-semibold text-[#111111]"
                : "text-gray-500"
            }`}
          >
            <FaHome size={16} />
            {(sidebarOpen || mobile) && <span>Overview</span>}
          </button>

          {/* CREATE INTERVIEW */}
          <button
            onClick={() => {
              navigate("/interview/setup");
              setMobileSidebarOpen(false);
            }}
            className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-gray-500 transition-colors duration-200 hover:bg-[#111111] hover:text-white"
          >
            <FaPlus size={16} />
            {(sidebarOpen || mobile) && <span>Create Interview</span>}
          </button>

          {/* OTHER NAVIGATION ITEMS */}
          {navigationItems.slice(1).map((item) => {
            const Icon = item.icon;
            const active = activePage === item.label;

            return (
              <button
                key={item.label}
                onClick={() => selectPage(item.label)}
                className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm transition-colors duration-200 hover:bg-[#111111] hover:text-white ${
                  active
                    ? "bg-[#F5EDE8] font-semibold text-[#111111]"
                    : "text-gray-500"
                }`}
              >
                <Icon size={16} />
                {(sidebarOpen || mobile) && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>
      </div>
      {/* SPACER */}
      <div className="flex-1" />
      {/* INTERVIEW COINS */}
      <div className="px-3 pb-3">
        <button
          onClick={() => setShowRechargeModal(true)}
          title="Interview Coins"
          className={`flex min-h-13.5 w-full items-center gap-3 rounded-xl border border-[#F0E8E3] bg-[#0A0A0A] px-3 py-2.5 transition-colors  ${
            !sidebarOpen && !mobile ? "lg:justify-center lg:px-0" : ""
          }`}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#111111] shadow-sm">
            <FaCoins size={15} />
          </div>

          {(sidebarOpen || mobile) && (
            <div className="min-w-0 flex-1 text-left">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                Interview Coins
              </p>

              {/* <p className="mt-1 text-sm font-extrabold text-white">150</p> */}
              <p className="mt-1 text-sm font-extrabold text-white">
                {user?.interviewCoin ?? 0}
              </p>
            </div>
          )}

          {(sidebarOpen || mobile) && (
            <FaPlus size={12} className="text-gray-400" />
          )}
        </button>
      </div>
      {/* BOTTOM USER PROFILE */}
      <div className="border-t border-[#F0E8E3] p-3">
        <div
          className={`flex items-center gap-3 rounded-xl px-2 py-3 ${
            !sidebarOpen && !mobile ? "lg:justify-center lg:px-0" : ""
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#111111] text-xs font-bold text-white">
            {initials}
          </div>

          {(sidebarOpen || mobile) && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-gray-900">
                  {userName}
                </p>

                {/* <p className="mt-1 truncate text-[10px] text-gray-400">
                  {userEmail}
                </p> */}
              </div>

              <button
                onClick={handleLogout}
                title="Log out"
                aria-label="Log out"
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-[#F5EDE8] hover:text-black"
              >
                <FaSignOutAlt size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // Open non-dashboard sections as standalone full-screen pages (without sidebar).
  if (activePage === "Resume Builder") {
    return (
      <ResumeBuilder onBack={() => selectPage("Overview")} setUser={setUser} />
    );
  }
  if (activePage === "Roadmap Builder") {
    return (
      <RoadmapBuilder
        onBack={() => selectPage("Overview")}
        user={user}
        setUser={setUser}
      />
    );
  }
  if (activePage !== "Overview") {
    const pageDescriptions = {
      "Resume Builder":
        "Create and customize a professional resume tailored to your target role.",
      "Resume Scorer":
        "Upload your resume to evaluate its quality and identify areas for improvement.",
      "Roadmap Builder":
        "Build a personalized learning roadmap for your career goals.",
    };

    return (
      <div className="min-h-screen bg-[#FFF9F6] px-4 py-6 text-[#111111] sm:px-8 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <button
            type="button"
            onClick={() => selectPage("Overview")}
            className="mb-8 inline-flex items-center gap-2 rounded-xl border border-[#F0E8E3] bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-[#F5EDE8] hover:text-black"
          >
            <FaChevronLeft size={12} />
            Back to Dashboard
          </button>

          <div className="rounded-2xl border border-[#F0E8E3] bg-white p-6 shadow-sm sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
              FresherAI Workspace
            </p>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
              {activePage}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
              {pageDescriptions[activePage] || "Your workspace is ready."}
            </p>
            <div className="mt-8 rounded-xl border border-dashed border-[#E8E0DA] bg-[#FFF9F6] p-6 text-sm text-gray-500">
              {activePage} page content yahan render hoga. Is page ki existing
              JSX/component file share kar de, main usko yahin integrate kar
              dunga — bina sidebar ke.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F6] text-[#111111]">
      {" "}
      <div className="flex min-h-screen">
        {/* DESKTOP SIDEBAR */}
        <aside
          className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-[#F0E8E3] bg-white transition-[width] duration-300 lg:flex ${
            sidebarOpen ? "w-65" : "w-19.5"
          }`}
        >
          {" "}
          <SidebarContent />{" "}
        </aside>

        {/* MOBILE SIDEBAR */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <>
              <motion.button
                type="button"
                aria-label="Close sidebar overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileSidebarOpen(false)}
                className="fixed inset-0 z-60 cursor-pointer bg-black/40 lg:hidden"
              />

              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ duration: 0.25 }}
                className="fixed bottom-0 left-0 top-0 z-70 w-70 bg-white shadow-2xl lg:hidden"
              >
                <SidebarContent mobile />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* MAIN CONTENT */}
        <main className="min-w-0 flex-1">
          {/* TOP NAVBAR */}
          <header className="sticky top-0 z-40 flex h-19 items-center justify-between border-b border-[#F0E8E3] bg-white/95 px-4 backdrop-blur-xl sm:px-7 lg:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="rounded-xl border border-[#F0E8E3] p-2.5 text-gray-600 transition-colors hover:bg-[#FFF9F6] lg:hidden"
                aria-label="Open sidebar"
              >
                <FaBars size={16} />
              </button>

              <div className="min-w-0">
                <h1 className="mt-1 truncate text-lg font-bold tracking-tight sm:text-xl">
                  {activePage === "Overview"
                    ? `Great to see you, ${userName.split(" ")[0]} ✨`
                    : activePage}
                </h1>

                {activePage === "Overview" && (
                  <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                    Your journey to career success continues. Let's make today
                    count!!
                  </p>
                )}
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-375 px-4 py-7 sm:px-7 sm:py-9 lg:px-10">
            {/* NOTIFICATION */}
            <AnimatePresence>
              {notice && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-[#F0E8E3] bg-white p-4 text-sm text-gray-800 shadow-sm"
                  role="status"
                >
                  <p>{notice}</p>

                  <button
                    onClick={() => setNotice("")}
                    aria-label="Dismiss notification"
                    className="shrink-0 text-gray-500 hover:text-black"
                  >
                    <FaTimes size={13} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {activePage === "Overview" ? (
              <>
                {/* STATISTICS */}
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {stats.map((stat, index) => {
                    const Icon = stat.icon;

                    return (
                      <motion.article
                        key={stat.label}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.4,
                          delay: index * 0.08,
                        }}
                        className="group relative overflow-hidden rounded-2xl bg-[#111111] p-5 text-white shadow-[0_8px_25px_rgba(0,0,0,0.08)] transition-transform duration-200 hover:-translate-y-1 sm:p-6"
                      >
                        <div className="relative flex items-center justify-between gap-2">
                          <p className="text-[10px] font-bold tracking-[0.12em] text-gray-400">
                            {stat.label}
                          </p>

                          <Icon size={16} className="text-white" />
                        </div>

                        <h2 className="relative mt-5 text-3xl font-extrabold tracking-tight">
                          {stat.value}
                        </h2>

                        <div className="relative mt-4 flex flex-wrap items-center gap-2">
                          {/* <span className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-bold text-white">
                            All time
                          </span> */}

                          <span className="text-[10px] text-gray-400">
                            {stat.note}
                          </span>
                        </div>
                      </motion.article>
                    );
                  })}
                </section>

                {/* INTERVIEW HISTORY */}
                <section className="mt-10">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-gray-400">
                        Your Progress
                      </p>

                      <h2 className="mt-1.5 text-xl font-extrabold tracking-tight">
                        Interview History
                      </h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                    {interviewHistory.map((item, index) => (
                      <motion.article
                        key={item.title}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.5,
                          delay: 0.15 + index * 0.1,
                        }}
                        className="overflow-hidden rounded-2xl border border-[#292929] bg-[#171717] p-5 text-white shadow-[0_8px_25px_rgba(0,0,0,0.12)] sm:p-7"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-extrabold text-white">
                              {item.title}
                            </h3>

                            <p className="mt-1 text-xs text-gray-400">
                              {item.subtitle}
                            </p>
                          </div>

                          <span className="rounded-lg bg-[#F5EDE8] px-3 py-1.5 text-xs font-bold text-[#111111]">
                            {item.count} sessions
                          </span>
                        </div>
                        <div className="mt-4 grid grid-cols-1 items-center gap-6 lg:grid-cols-[minmax(0,1fr)_125px]">
                          <RadarChart performanceMetrics={item.metrics} />

                          <div className="rounded-xl border border-[#333333] bg-[#222222] p-4 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                              Average score
                            </p>

                            <p className="mt-2 text-3xl font-extrabold text-white">
                              {item.score}
                              <span className="text-sm font-semibold text-gray-400">
                                /100
                              </span>
                            </p>

                            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
                              <div
                                className="h-full rounded-full bg-white transition-all duration-700"
                                style={{ width: `${item.score}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.article>
                    ))}
                  </div>
                </section>
              </>
            ) : null}
          </div>
        </main>
      </div>
      {/* CREATE INTERVIEW MODAL */}
      <AnimatePresence></AnimatePresence>
      {/* COIN RECHARGE MODAL */}
      <AnimatePresence>
        {showRechargeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4"
            onClick={() => !paymentLoading && setShowRechargeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold">Recharge Coins</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Choose a package to continue your preparation.
                  </p>
                </div>

                <button
                  onClick={() => setShowRechargeModal(false)}
                  disabled={paymentLoading}
                  className="rounded-lg p-2 hover:bg-gray-100"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="mb-5 rounded-xl bg-[#111111] p-4 text-white">
                <p className="text-xs text-gray-400">Current Balance</p>
                <p className="mt-1 flex items-center gap-2 text-2xl font-bold">
                  <FaCoins />
                  {user?.interviewCoin ?? 0} Coins
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "basic", name: "Basic", price: 49, coins: 100 },
                  { id: "standard", name: "Standard", price: 99, coins: 250 },
                  { id: "premium", name: "Premium", price: 199, coins: 600 },
                  { id: "pro", name: "Pro", price: 499, coins: 1800 },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-gray-200 p-4 transition hover:border-black"
                  >
                    <h3 className="font-bold">{item.name}</h3>

                    <p className="mt-2 text-2xl font-extrabold">
                      ₹{item.price}
                    </p>

                    <p className="mb-4 mt-1 text-sm text-gray-500">
                      {item.coins} Coins
                    </p>

                    <button
                      disabled={paymentLoading}
                      onClick={() => handleRecharge(item.id)}
                      className="w-full rounded-lg bg-[#111111] px-3 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-50"
                    >
                      {paymentLoading ? "Processing..." : "Buy Now"}
                    </button>
                  </div>
                ))}
              </div>

              {paymentMessage && (
                <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {paymentMessage}
                </p>
              )}

              <p className="mt-5 text-center text-xs text-gray-400">
                Secure payments powered by Razorpay.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Dashboard;
