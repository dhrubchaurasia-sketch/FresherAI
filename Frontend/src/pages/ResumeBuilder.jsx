import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GiArtificialHive } from "react-icons/gi";
import {
  FiEye,
  FiPlus,
  FiTrash2,
  FiArrowLeft,
  FiArrowRight,
  FiX,
  FiDownload,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useCoins } from "../apis/user.api";
// ==========================================
// INITIAL DATA
// ==========================================

const initialData = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  github: "",
  portfolio: "",
  summary: "",
  skills: "",
  experience: [],
  projects: [],
  education: [],
};

const steps = [
  {
    title: "Personal Information",
    subtitle: "Let's start with your basic information.",
  },
  {
    title: "Professional Summary",
    subtitle: "Write a short introduction about yourself.",
  },
  {
    title: "Skills",
    subtitle: "Highlight your technical and professional skills.",
  },
  {
    title: "Work Experience",
    subtitle: "Add your internships and work experience.",
  },
  {
    title: "Projects",
    subtitle: "Showcase the projects you have worked on.",
  },
  {
    title: "Education",
    subtitle: "Add your academic qualifications.",
  },
];

// ==========================================
// REUSABLE INPUT COMPONENT
// IMPORTANT: KEEP OUTSIDE ResumeBuilder
// ==========================================

const InputField = ({ label, value, onChange, placeholder, type = "text" }) => {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-bold uppercase tracking-wide text-[#555]">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 rounded-xl border border-gray-300 bg-white px-3.5 text-sm text-black outline-none transition-all focus:border-black focus:ring-1 focus:ring-black/10"
      />
    </div>
  );
};

// ==========================================
// REUSABLE TEXTAREA COMPONENT
// ==========================================

const TextAreaField = ({ label, value, onChange, placeholder, rows = 4 }) => {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-bold uppercase tracking-wide text-[#555]">
        {label}
      </label>

      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-none rounded-xl border border-gray-300 bg-white p-3.5 text-sm text-black outline-none transition-all focus:border-black focus:ring-1 focus:ring-black/10"
      />
    </div>
  );
};

// ==========================================
// REUSABLE ENTRY CARD
// ==========================================

const EntryCard = ({ children, onDelete }) => {
  return (
    <div className="rounded-2xl border border-gray-300 bg-white p-4 sm:p-5 space-y-4 shadow-sm">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
          aria-label="Delete entry"
        >
          <FiTrash2 size={17} />
        </button>
      </div>

      {children}
    </div>
  );
};

// ==========================================
// ADD BUTTON
// ==========================================

const AddButton = ({ label, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white py-3.5 text-sm font-medium text-gray-500 transition-all hover:border-black hover:bg-gray-50 hover:text-black"
    >
      <FiPlus size={17} />

      {label}
    </button>
  );
};

const Navbar = ({ label = "Resume Builder", onDashboardClick }) => {
  const navigate = useNavigate();

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
            <FiArrowLeft size={13} />
            Dashboard
          </button>
        </div>
      </div>
    </motion.nav>
  );
};

// ==========================================
// MAIN RESUME BUILDER
// ==========================================

function ResumeBuilder({ onBack, setUser }) {
  const [step, setStep] = useState(0);

  const [data, setData] = useState(initialData);

  const [showPreview, setShowPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showCoinModal, setShowCoinModal] = useState(false);
  const [availableCoins, setAvailableCoins] = useState(0);

  // ==========================================
  // PROGRESS
  // ==========================================

  const progress = Math.round((step / 5) * 100);

  // ==========================================
  // UPDATE NORMAL FIELDS
  // ==========================================

  const updateField = (field, value) => {
    setData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ==========================================
  // ADD DYNAMIC ENTRY
  // ==========================================

  const addEntry = (field, initialValue) => {
    setData((prev) => ({
      ...prev,

      [field]: [
        ...prev[field],

        {
          ...initialValue,
          id: crypto.randomUUID(),
        },
      ],
    }));
  };

  // ==========================================
  // UPDATE DYNAMIC ENTRY
  // ==========================================

  const updateEntry = (field, id, key, value) => {
    setData((prev) => ({
      ...prev,

      [field]: prev[field].map((item) =>
        item.id === id ? { ...item, [key]: value } : item,
      ),
    }));
  };

  // ==========================================
  // DELETE DYNAMIC ENTRY
  // ==========================================

  const deleteEntry = (field, id) => {
    setData((prev) => ({
      ...prev,

      [field]: prev[field].filter((item) => item.id !== id),
    }));
  };

  // ==========================================
  // EXPERIENCE
  // ==========================================

  const addExperience = () => {
    addEntry("experience", {
      company: "",
      role: "",
      duration: "",
      description: "",
    });
  };

  // ==========================================
  // PROJECTS
  // ==========================================

  const addProject = () => {
    addEntry("projects", {
      name: "",
      techStack: "",
      github: "",
      liveDemo: "",
      description: "",
    });
  };

  // ==========================================
  // EDUCATION
  // ==========================================

  const addEducation = () => {
    addEntry("education", {
      college: "",
      degree: "",
      branch: "",
      cgpa: "",
      year: "",
    });
  };

  // ==========================================
  // NEXT STEP
  // ==========================================

  const nextStep = () => {
    if (step < 5) {
      setStep((prev) => prev + 1);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  // ==========================================
  // PREVIOUS STEP
  // ==========================================

  const previousStep = () => {
    if (step > 0) {
      setStep((prev) => prev - 1);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  // ==========================================
  // PDF DOWNLOAD
  // ==========================================

  const downloadPDF = async () => {
    if (downloading) return;

    try {
      setDownloading(true);
      setShowCoinModal(false);

      // Coins are deducted only when the user clicks Download PDF.
      const result = await useCoins("resume-builder");

      if (!result?.success) {
        setAvailableCoins(
          Number.isFinite(result?.interviewCoin) ? result.interviewCoin : 0,
        );
        setShowCoinModal(true);
        return;
      }

      // Update dashboard coin balance after successful deduction.
      setUser?.((prev) => ({
        ...prev,
        interviewCoin: result.interviewCoin,
      }));

      // Open PDF print/save dialog only after successful deduction.
      const handleAfterPrint = () => {
        window.removeEventListener("afterprint", handleAfterPrint);
        setShowPreview(false);
        onBack?.(); // dashboard pe wapis
      };

      window.addEventListener("afterprint", handleAfterPrint);
      window.print();
    } catch (error) {
      console.error("PDF Download Error:", error);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Insufficient coins or deduction failed.";

      // Show the coin popup for coin-related failures.
      if (/coin|insufficient|not enough/i.test(message)) {
        const balance = error?.response?.data?.interviewCoin;
        setAvailableCoins(Number.isFinite(balance) ? balance : 0);
        setShowCoinModal(true);
      } else {
        alert("Unable to download PDF. Please try again.");
      }
    } finally {
      setDownloading(false);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="min-h-screen bg-[#FFF9F6] text-[#0A0A0A]">
      {/* ======================================
          NAVBAR
      ====================================== */}

      <Navbar label="Resume Builder" onDashboardClick={onBack} />

      {/* ======================================
          MAIN CONTENT
      ====================================== */}

      {/* <main className="mx-auto w-full max-w-4xl px-4 pb-10 pt-10 sm:px-6 sm:pt-12"> */}
      <main className="mx-auto w-full max-w-4xl px-4 pb-10 pt-24 sm:px-6 sm:pt-28">
        {/* ======================================
            PROGRESS BAR
        ====================================== */}

        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Step {step + 1} of 6
            </p>

            <p className="text-xs font-medium text-gray-400">
              {progress}% complete
            </p>
          </div>

          <div className="h-1.25 w-full overflow-hidden rounded-full bg-gray-200">
            <motion.div
              className="h-full rounded-full bg-black"
              animate={{
                width: `${progress}%`,
              }}
              transition={{
                duration: 0.45,
                ease: "easeInOut",
              }}
            />
          </div>
        </div>

        {/* ======================================
            STEP HEADING
        ====================================== */}

        <div className="mb-6 border-b border-black/10 pb-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                {steps[step].title}
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                {steps[step].subtitle}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ======================================
            FORM CONTENT
        ====================================== */}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.2 }}
            className="min-h-75 space-y-5"
          >
            {/* ==================================
                STEP 1 - PERSONAL INFORMATION
            ================================== */}

            {step === 0 && (
              <div className="space-y-5">
                <InputField
                  label="Full Name"
                  placeholder="Your full name"
                  value={data.fullName}
                  onChange={(v) => updateField("fullName", v)}
                />

                <InputField
                  label="Email"
                  type="email"
                  placeholder="your@email.com"
                  value={data.email}
                  onChange={(v) => updateField("email", v)}
                />

                <InputField
                  label="Phone"
                  placeholder="+91 9876543210"
                  value={data.phone}
                  onChange={(v) => updateField("phone", v)}
                />

                <InputField
                  label="Location"
                  placeholder="City, State"
                  value={data.location}
                  onChange={(v) => updateField("location", v)}
                />

                <InputField
                  label="LinkedIn URL"
                  placeholder="https://linkedin.com/in/username"
                  value={data.linkedin}
                  onChange={(v) => updateField("linkedin", v)}
                />

                <InputField
                  label="GitHub URL"
                  placeholder="https://github.com/username"
                  value={data.github}
                  onChange={(v) => updateField("github", v)}
                />

                <InputField
                  label="Portfolio URL"
                  placeholder="https://yourportfolio.com"
                  value={data.portfolio}
                  onChange={(v) => updateField("portfolio", v)}
                />
              </div>
            )}

            {/* ==================================
                STEP 2 - SUMMARY
            ================================== */}

            {step === 1 && (
              <div className="space-y-4">
                <TextAreaField
                  label="Professional Summary"
                  rows={6}
                  placeholder="Write a short professional introduction about yourself..."
                  value={data.summary}
                  onChange={(v) => updateField("summary", v)}
                />

                <p className="text-xs text-gray-400">
                  Briefly describe your experience, strengths and career goals.
                </p>
              </div>
            )}

            {/* ==================================
                STEP 3 - SKILLS
            ================================== */}

            {step === 2 && (
              <div className="space-y-4">
                <TextAreaField
                  label="Technical Skills"
                  rows={5}
                  placeholder="JavaScript, React, Node.js, Express, MongoDB, Java, Python..."
                  value={data.skills}
                  onChange={(v) => updateField("skills", v)}
                />

                <p className="text-xs text-gray-400">
                  Separate each skill using a comma.
                </p>
              </div>
            )}

            {/* ==================================
                STEP 4 - EXPERIENCE
            ================================== */}

            {step === 3 && (
              <div className="space-y-4">
                {data.experience.length === 0 && (
                  <div className="py-10 text-center">
                    <p className="text-sm font-medium text-gray-600">
                      No experience added yet.
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Click below to add your experience.
                    </p>
                  </div>
                )}

                {data.experience.map((item, index) => (
                  <EntryCard
                    key={item.id}
                    onDelete={() => deleteEntry("experience", item.id)}
                  >
                    <p className="text-sm font-bold text-black">
                      Experience {index + 1}
                    </p>

                    <InputField
                      label="Company"
                      placeholder="Company Name"
                      value={item.company}
                      onChange={(v) =>
                        updateEntry("experience", item.id, "company", v)
                      }
                    />

                    <InputField
                      label="Role"
                      placeholder="Software Developer Intern"
                      value={item.role}
                      onChange={(v) =>
                        updateEntry("experience", item.id, "role", v)
                      }
                    />

                    <InputField
                      label="Duration"
                      placeholder="Jan 2025 - June 2025"
                      value={item.duration}
                      onChange={(v) =>
                        updateEntry("experience", item.id, "duration", v)
                      }
                    />

                    <TextAreaField
                      label="Description"
                      rows={4}
                      placeholder="Describe your responsibilities and achievements..."
                      value={item.description}
                      onChange={(v) =>
                        updateEntry("experience", item.id, "description", v)
                      }
                    />
                  </EntryCard>
                ))}

                <AddButton label="Add Experience" onClick={addExperience} />
              </div>
            )}

            {/* ==================================
                STEP 5 - PROJECTS
            ================================== */}

            {step === 4 && (
              <div className="space-y-4">
                {data.projects.length === 0 && (
                  <div className="py-10 text-center">
                    <p className="text-sm font-medium text-gray-600">
                      No projects added yet.
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Click below to add your projects.
                    </p>
                  </div>
                )}

                {data.projects.map((item, index) => (
                  <EntryCard
                    key={item.id}
                    onDelete={() => deleteEntry("projects", item.id)}
                  >
                    <p className="text-sm font-bold text-black">
                      Project {index + 1}
                    </p>

                    <InputField
                      label="Project Name"
                      placeholder="Project Name"
                      value={item.name}
                      onChange={(v) =>
                        updateEntry("projects", item.id, "name", v)
                      }
                    />

                    <InputField
                      label="Tech Stack"
                      placeholder="React, Node.js, MongoDB"
                      value={item.techStack}
                      onChange={(v) =>
                        updateEntry("projects", item.id, "techStack", v)
                      }
                    />

                    <InputField
                      label="GitHub Link"
                      placeholder="https://github.com/username/project"
                      value={item.github}
                      onChange={(v) =>
                        updateEntry("projects", item.id, "github", v)
                      }
                    />

                    <InputField
                      label="Live Demo Link"
                      placeholder="https://your-project-demo.com"
                      value={item.liveDemo}
                      onChange={(v) =>
                        updateEntry("projects", item.id, "liveDemo", v)
                      }
                    />

                    <TextAreaField
                      label="Description"
                      rows={4}
                      placeholder="Describe your project and its features..."
                      value={item.description}
                      onChange={(v) =>
                        updateEntry("projects", item.id, "description", v)
                      }
                    />
                  </EntryCard>
                ))}

                <AddButton label="Add Project" onClick={addProject} />
              </div>
            )}

            {/* ==================================
                STEP 6 - EDUCATION
            ================================== */}

            {step === 5 && (
              <div className="space-y-4">
                {data.education.length === 0 && (
                  <div className="py-10 text-center">
                    <p className="text-sm font-medium text-gray-600">
                      No education added yet.
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Click below to add your education.
                    </p>
                  </div>
                )}

                {data.education.map((item, index) => (
                  <EntryCard
                    key={item.id}
                    onDelete={() => deleteEntry("education", item.id)}
                  >
                    <p className="text-sm font-bold text-black">
                      Education {index + 1}
                    </p>

                    <InputField
                      label="College / University"
                      placeholder="University Name"
                      value={item.college}
                      onChange={(v) =>
                        updateEntry("education", item.id, "college", v)
                      }
                    />

                    <InputField
                      label="Degree"
                      placeholder="B.Tech"
                      value={item.degree}
                      onChange={(v) =>
                        updateEntry("education", item.id, "degree", v)
                      }
                    />

                    <InputField
                      label="Branch"
                      placeholder="Computer Science Engineering"
                      value={item.branch}
                      onChange={(v) =>
                        updateEntry("education", item.id, "branch", v)
                      }
                    />

                    <InputField
                      label="CGPA / Percentage"
                      placeholder="8.5"
                      value={item.cgpa}
                      onChange={(v) =>
                        updateEntry("education", item.id, "cgpa", v)
                      }
                    />

                    <InputField
                      label="Year"
                      placeholder="2023 - 2027"
                      value={item.year}
                      onChange={(v) =>
                        updateEntry("education", item.id, "year", v)
                      }
                    />
                  </EntryCard>
                ))}

                <AddButton label="Add Education" onClick={addEducation} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ======================================
            FOOTER NAVIGATION
        ====================================== */}

        <div className="mt-8 flex items-center justify-between border-t border-black/10 pt-6">
          {/* PREVIOUS */}

          <button
            type="button"
            onClick={previousStep}
            disabled={step === 0}
            className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiArrowLeft size={15} />
            Previous
          </button>

          {/* STEP INDICATORS */}

          <div className="hidden items-center gap-1.5 sm:flex">
            {steps.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setStep(index)}
                aria-label={`Go to step ${index + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  step === index
                    ? "w-5 bg-black"
                    : "w-2 bg-gray-300 hover:bg-gray-500"
                }`}
              />
            ))}
          </div>

          {/* NEXT / PREVIEW */}

          {/* {step < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-gray-800"
            >
              Next
              <FiArrowRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-gray-800"
            >
              <FiEye size={16} />
              Preview Resume
            </button>
          )} */}

          {step < 5 ? (
            <div className="flex items-center gap-2">
              {/* PREVIEW BUTTON */}
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
              >
                <FiEye size={16} />
                Preview
              </button>

              {/* NEXT BUTTON */}
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-gray-800"
              >
                Next
                <FiArrowRight size={15} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-gray-800"
            >
              <FiEye size={16} />
              Preview Resume
            </button>
          )}
        </div>
      </main>

      {/* ==========================================
          RESUME PREVIEW
      ========================================== */}

      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:p-6"
          >
            <div className="mx-auto max-w-5xl">
              {/* PREVIEW HEADER */}

              <div className="mb-4 flex items-center justify-between rounded-xl bg-white p-4 shadow-lg">
                <div>
                  <h2 className="text-base font-bold">Resume Preview</h2>

                  <p className="text-xs text-gray-500">
                    Your professional resume
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={downloadPDF}
                    disabled={downloading}
                    className="flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiDownload size={14} />
                    {downloading ? "Processing..." : "Download PDF"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPreview(false)}
                    className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-100"
                    aria-label="Close preview"
                  >
                    <FiX size={18} />
                  </button>
                </div>
              </div>

              {/* A4 RESUME */}

              <div
                id="resume-print"
                className="resume-document mx-auto min-h-[297mm] w-full max-w-[210mm] bg-white px-[15mm] py-[14mm] text-[#111111] shadow-2xl"
              >
                {/* PERSONAL INFORMATION */}

                <div className="border-b border-[#777777] pb-3">
                  <h1 className="mb-1 text-center text-[21px] font-bold uppercase leading-tight tracking-[0.04em] text-black">
                    {data.fullName || "Your Name"}
                  </h1>
                  {/* <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 text-center text-[9px] leading-[1.4] text-[#333333]">
                    {data.email && <span>{data.email}</span>}

                    {data.phone && (
                      <>
                        {data.email && <span>|</span>}
                        <span>{data.phone}</span>
                      </>
                    )}

                    {data.location && (
                      <>
                        {(data.email || data.phone) && <span>|</span>}
                        <span>{data.location}</span>
                      </>
                    )}

                    {data.linkedin && (
                      <>
                        {(data.email || data.phone || data.location) && (
                          <span>|</span>
                        )}
                        <a
                          href={
                            data.linkedin.startsWith("http")
                              ? data.linkedin
                              : `https://${data.linkedin}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-blue-600 underline"
                        >
                          LinkedIn
                        </a>
                      </>
                    )}

                    {data.github && (
                      <>
                        {(data.email ||
                          data.phone ||
                          data.location ||
                          data.linkedin) && <span>|</span>}
                        <a
                          href={
                            data.github.startsWith("http")
                              ? data.github
                              : `https://${data.github}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-blue-600 underline"
                        >
                          GitHub
                        </a>
                      </>
                    )}

                    {data.portfolio && (
                      <>
                        {(data.email ||
                          data.phone ||
                          data.location ||
                          data.linkedin ||
                          data.github) && <span>|</span>}
                        <a
                          href={
                            data.portfolio.startsWith("http")
                              ? data.portfolio
                              : `https://${data.portfolio}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-blue-600 underline"
                        >
                          Portfolio
                        </a>
                      </>
                    )}
                  </div> */}
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 text-center text-[9px] leading-[1.4] text-[#333333]">
                    {data.location && <span>{data.location}</span>}

                    {data.email && (
                      <>
                        {data.location && <span>|</span>}
                        <span>{data.email}</span>
                      </>
                    )}

                    {data.phone && (
                      <>
                        {(data.location || data.email) && <span>|</span>}
                        <span>{data.phone}</span>
                      </>
                    )}

                    {data.linkedin && (
                      <>
                        {(data.location || data.email || data.phone) && (
                          <span>|</span>
                        )}
                        <a
                          href={
                            data.linkedin.startsWith("http")
                              ? data.linkedin
                              : `https://${data.linkedin}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-blue-600 underline"
                        >
                          LinkedIn
                        </a>
                      </>
                    )}

                    {data.github && (
                      <>
                        {(data.location ||
                          data.email ||
                          data.phone ||
                          data.linkedin) && <span>|</span>}
                        <a
                          href={
                            data.github.startsWith("http")
                              ? data.github
                              : `https://${data.github}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-blue-600 underline"
                        >
                          GitHub
                        </a>
                      </>
                    )}

                    {data.portfolio && (
                      <>
                        {(data.location ||
                          data.email ||
                          data.phone ||
                          data.linkedin ||
                          data.github) && <span>|</span>}
                        <a
                          href={
                            data.portfolio.startsWith("http")
                              ? data.portfolio
                              : `https://${data.portfolio}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-blue-600 underline"
                        >
                          Portfolio
                        </a>
                      </>
                    )}
                  </div>
                </div>

                {/* SUMMARY */}

                {data.summary && (
                  <section className="mt-4">
                    <h2 className="mb-2 border-b border-[#B8B8B8] pb-1 text-[11px] font-bold uppercase leading-tight tracking-[0.04em] text-black">
                      Profile Summary
                    </h2>

                    <p className="whitespace-pre-line text-[10px] leading-[1.45] text-[#222222]">
                      {data.summary}
                    </p>
                  </section>
                )}

                {/* SKILLS */}

                {data.skills && (
                  <section className="mt-4">
                    <h2 className="mb-2 border-b border-[#B8B8B8] pb-1 text-[11px] font-bold uppercase leading-tight tracking-[0.04em] text-black">
                      Skills
                    </h2>

                    <p className="text-[10px] leading-[1.45] text-[#222222]">
                      {data.skills}
                    </p>
                  </section>
                )}

                {/* EXPERIENCE */}

                {data.experience.length > 0 && (
                  <section className="mt-4">
                    <h2 className="mb-2 border-b border-[#B8B8B8] pb-1 text-[11px] font-bold uppercase leading-tight tracking-[0.04em] text-black">
                      Work Experience
                    </h2>

                    {data.experience.map((item) => (
                      <div key={item.id} className="resume-entry mb-3">
                        <div className="flex flex-wrap justify-between gap-2">
                          <h3 className="text-[10.5px] font-bold">
                            {item.company}
                          </h3>

                          <span className="text-[9px] text-[#555555]">
                            {item.duration}
                          </span>
                        </div>

                        <p className="mt-1 text-[9.5px] font-semibold text-gray-600">
                          {item.role}
                        </p>

                        <p className="mt-1 whitespace-pre-line text-[10px] leading-[1.4] text-[#222222]">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </section>
                )}

                {/* PROJECTS */}

                {data.projects.length > 0 && (
                  <section className="mt-4">
                    <h2 className="mb-2 border-b border-[#B8B8B8] pb-1 text-[11px] font-bold uppercase leading-tight tracking-[0.04em] text-black">
                      Projects
                    </h2>

                    {/* {data.projects.map((item) => (
                      <div key={item.id} className="resume-entry mb-3">
                        <h3 className="text-[10.5px] font-bold">{item.name}</h3>

                        <p className="mt-1 text-[9.5px] text-[#333333]">
                          {item.techStack}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                          {item.github && (
                            <a
                              href={
                                item.github.startsWith("http")
                                  ? item.github
                                  : `https://${item.github}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="break-all font-medium text-blue-600 underline hover:text-blue-800"
                            >
                              GitHub
                            </a>
                          )}

                          {item.liveDemo && (
                            <a
                              href={
                                item.liveDemo.startsWith("http")
                                  ? item.liveDemo
                                  : `https://${item.liveDemo}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="break-all font-medium text-blue-600 underline hover:text-blue-800"
                            >
                              Live Demo
                            </a>
                          )}
                        </div>

                        <p className="mt-1 whitespace-pre-line text-[10px] leading-[1.4] text-[#222222]">
                          {item.description}
                        </p>
                      </div>
                    ))} */}
                    {data.projects.map((item) => (
                      <div key={item.id} className="resume-entry mb-3">
                        {/* PROJECT NAME LEFT + LINKS RIGHT */}
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-[10.5px] font-bold">
                            {item.name}
                          </h3>

                          <div className="flex shrink-0 items-center gap-3 text-[9.5px]">
                            {item.github && (
                              <a
                                href={
                                  item.github.startsWith("http")
                                    ? item.github
                                    : `https://${item.github}`
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-blue-600 underline"
                              >
                                GitHub
                              </a>
                            )}

                            {item.liveDemo && (
                              <a
                                href={
                                  item.liveDemo.startsWith("http")
                                    ? item.liveDemo
                                    : `https://${item.liveDemo}`
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-blue-600 underline"
                              >
                                Live Demo
                              </a>
                            )}
                          </div>
                        </div>

                        {/* TECH STACK */}
                        {item.techStack && (
                          <p className="mt-1 text-[9.5px] text-[#333333]">
                            {item.techStack}
                          </p>
                        )}

                        {/* DESCRIPTION */}
                        <p className="mt-1 whitespace-pre-line text-[10px] leading-[1.4] text-[#222222]">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </section>
                )}

                {/* EDUCATION */}

                {data.education.length > 0 && (
                  <section className="mt-4">
                    <h2 className="mb-2 border-b border-[#B8B8B8] pb-1 text-[11px] font-bold uppercase leading-tight tracking-[0.04em] text-black">
                      Education
                    </h2>

                    {data.education.map((item) => (
                      <div key={item.id} className="resume-entry mb-3">
                        <div className="flex flex-wrap justify-between gap-2">
                          <h3 className="text-[10.5px] font-bold">
                            {item.college}
                          </h3>

                          <span className="text-[9px] text-[#555555]">
                            {item.year}
                          </span>
                        </div>

                        <p className="mt-1 text-[9.5px] text-[#333333]">
                          {item.degree}

                          {item.branch && ` - ${item.branch}`}
                        </p>

                        {item.cgpa && (
                          <p className="mt-1 text-[9.5px] text-[#333333]">
                            CGPA: {item.cgpa}
                          </p>
                        )}
                      </div>
                    ))}
                  </section>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==========================================
          INSUFFICIENT COINS POPUP
          Opens only after clicking Download PDF
      ========================================== */}
      <AnimatePresence>
        {showCoinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setShowCoinModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ duration: 0.2 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="insufficient-coins-title"
              className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-7 text-center shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-5xl">
                😢
              </div>

              <h2
                id="insufficient-coins-title"
                className="mt-5 text-2xl font-extrabold text-[#111111]"
              >
                Insufficient Coins Balance!
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-500">
                Oops! You don't have enough coins to download your resume.
                Please recharge your wallet and try again.
              </p>

              <div className="mt-5 rounded-2xl bg-red-50 p-4">
                <p className="text-sm text-gray-600">Your Available Balance</p>
                <p className="mt-1 text-2xl font-bold text-red-600">
                  🪙 {availableCoins} Coins
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCoinModal(false)}
                className="mt-6 w-full rounded-xl bg-black py-3 font-semibold text-white transition hover:bg-gray-800"
              >
                Okay, Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==========================================
          PRINT CSS
      ========================================== */}

      <style>{`
        .resume-document {
          box-sizing: border-box;
          font-family: Arial, Helvetica, sans-serif;
          color: #111111;
          background: #ffffff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .resume-document a {
          color: #1d4ed8;
          text-decoration: underline;
        }

        @media print {
          html,
          body {
            width: 210mm;
            min-height: 297mm;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          body * {
            visibility: hidden !important;
          }

          #resume-print,
          #resume-print * {
            visibility: visible !important;
          }

          #resume-print {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            max-width: none !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 14mm 15mm !important;
            box-shadow: none !important;
            background: #ffffff !important;
            font-family: Arial, Helvetica, sans-serif !important;
            color: #111111 !important;
          }

          #resume-print a {
            color: #1d4ed8 !important;
            text-decoration: underline !important;
          }

          .resume-entry {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default ResumeBuilder;
