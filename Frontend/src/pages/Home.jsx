import React, { useState } from "react";
import { motion } from "motion/react";
import {FaLongArrowAltRight,FaArrowRight,FaRegFileAlt,FaCode,FaComments,FaRoad,FaBars,FaTimes,} from "react-icons/fa";
import { GiArtificialHive } from "react-icons/gi";
import LoginModel from "../components/LoginModel";

const agents = [
{
icon: FaRegFileAlt,
title: "Resume Agent",
description:
"Create ATS-friendly resumes tailored to your dream job and stand out from other candidates.",

},
{
icon: FaComments,
title: "Interview Agent",
description:
"Practice realistic interviews with AI-powered questions tailored to your target role.",

},
{
icon: FaCode,
title: "Feedback Agent",
description:
"Get detailed feedback on your answers, communication, and technical performance.",

},
{
icon: FaRoad,
title: "Roadmap Agent",
description:
"Follow a personalized preparation roadmap built around your skills and career goals.",
},
];

const stats = [
{ value: "1", label: "Your AI workspace" },
{ value: "4", label: "Specialized AI agents" },
{ value: "∞", label: "Opportunities to practice" },
];

function Home({ setUser }) {
const [showLogin, setShowLogin] = useState(false);
const [menuOpen, setMenuOpen] = useState(false);

const openLogin = () => {
setShowLogin(true);
setMenuOpen(false);
};

return ( <div className="min-h-screen overflow-x-hidden bg-[#FFF9F6] font-sans text-[#111111] selection:bg-black selection:text-white">


 
 
{/* NAVBAR */}
<motion.nav
initial={{ y: -30, opacity: 0 }}
animate={{ y: 0, opacity: 1 }}
transition={{ duration: 0.6, ease: "easeOut" }}
className="fixed left-0 right-0 top-0 z-50 border-b border-black/6 bg-white/90 backdrop-blur-xl">
  <div className="mx-auto flex h-19 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
{/* LOGO */}
<a href="#home" className="flex shrink-0 items-center gap-2.5">
  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111111] shadow-lg shadow-black/10">
    <GiArtificialHive size={23} color="white" />
  </div>
  <span className="text-xl font-bold tracking-tight">
    Fresher<span className="text-black">AI</span>
  </span>
</a>
{/* DESKTOP NAVIGATION */}
<div className="hidden items-center gap-20 md:flex">
  <a href="#home" className="rounded-lg px-5 py-2.5 text-sm font-bold text-black transition-colors hover:bg-gray-100">  Home</a>
  <a href="#features" className="rounded-lg px-5 py-2.5 text-sm font-bold text-gray-500 transition-colors hover:bg-gray-100 hover:text-black"
  >
    Features
  </a>

</div>

{/* GET STARTED BUTTON */}
<motion.button
  onClick={openLogin}
  whileHover={{ scale: 1.04 }}
  whileTap={{ scale: 0.96 }}
  className="group flex cursor-pointer items-center gap-2 rounded-xl bg-[#111111] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/10 transition-colors hover:bg-[#303030]"
>
  Get Started

  <FaArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
</motion.button>


  </div>
</motion.nav>



  {/* HERO SECTION */}
  <section
    id="home"
    className="relative overflow-hidden px-5 pb-20 pt-32 sm:px-8 sm:pt-36 lg:px-12 lg:pb-28 lg:pt-40"
  >
    {/* Background Decoration */}
    <div className="pointer-events-none absolute left-1/2 top-20 h-112.5 w-175 -translate-x-1/2 rounded-full bg-[#FFF9F6] blur-[120px]" />

    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="relative z-10 mx-auto max-w-4xl text-center"
    >
      {/* Badge */}
      <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/80 px-4 py-2 shadow-sm">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-50" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
        </span>

        <span className="text-xs font-medium tracking-wide text-gray-600 sm:text-sm">
          Your AI-Powered Interview Platform
        </span>
      </div>

      {/* Heading */}
      <h1 className="text-4xl font-extrabold leading-[1.12] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
        Job Interviews
        <br />

        <span className="text-[#a0a0a0]">
          Don't Have to Suck
        </span>

        <br />

        <span className="relative inline-block">
          Anymore!

          <motion.span
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="absolute -bottom-2 left-0 h-1 rounded-full bg-black"
          />
        </span>
      </h1>

      {/* Description */}
      <p className="mx-auto mt-8 max-w-2xl text-sm leading-7 text-gray-500 sm:text-base sm:leading-8">
        FresherAI is an AI-powered interview preparation platform
        designed to help students and fresh graduates build confidence,
        sharpen their skills, and land their dream jobs.
      </p>

      {/* CTA Buttons */}
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <motion.button
          onClick={openLogin}
          whileHover={{
            scale: 1.04,
            boxShadow: "0px 12px 30px rgba(0,0,0,0.18)",
          }}
          whileTap={{ scale: 0.97 }}
          className="group flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg bg-[#111111] px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-black/10 transition-all sm:w-auto"
        >
          Get Started For Free

          <FaArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
        </motion.button>

        <a
          href="#features"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-black/10 bg-white px-7 py-3.5 text-sm font-semibold text-gray-700 transition-all hover:border-black/30 hover:bg-gray-50 sm:w-auto"
        >
          Explore Features
        </a>
      </div>

      {/* Trust Indicators */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-black">
        <span className="flex items-center gap-1.5">
          <span className="text-green-700">✓</span>
          AI-powered preparation
        </span>

        <span className="hidden h-1 w-1 rounded-full bg-gray-300 sm:block" />

        <span className="flex items-center gap-1.5">
          <span className="text-green-700">✓</span>
          Personalized feedback
        </span>
      </div>
    </motion.div>
  </section>

  {/* QUICK STATS */}
  <section className="border-y border-black/6 bg-[#FFF9F6] px-5 py-9 sm:px-8 lg:px-12">
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-7 sm:grid-cols-3 sm:gap-5">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="text-center"
        >
          <h3 className="text-3xl font-extrabold tracking-tight">
            {stat.value}
          </h3>

          <p className="mt-2 text-xs text-gray-500 sm:text-sm">
            {stat.label}
          </p>
        </motion.div>
      ))}
    </div>
  </section>

  {/* FEATURES SECTION */}
  <section
    id="features"
    className="px-5 py-20 sm:px-8 sm:py-28 lg:px-12"
  >
    <div className="mx-auto max-w-6xl">

      {/* Section Heading */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="mx-auto mb-14 max-w-2xl text-center"
      >
       <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-medium text-black">
  <span className="relative flex h-2 w-2">
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-60"></span>
    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
  </span>

AI-Powered Preparation </span>


        <h2 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-5xl">
          Everything You Need
          <br />

          <span className="text-gray-400">
            To Land Your Dream Job
          </span>
        </h2>

        <p className="mt-5 text-sm leading-7 text-gray-500 sm:text-base">
          Stop guessing what recruiters want. Prepare smarter with
          specialized AI agents that guide you through every stage of
          your interview journey.
        </p>
      </motion.div>

      {/* AI AGENT CARDS */}
      <div
        id="agents"
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {agents.map((agent, index) => {
          const Icon = agent.icon;

          return (
            <motion.article
              key={agent.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.5,
                delay: index * 0.12,
              }}
              whileHover={{
                y: -7,
                transition: { duration: 0.2 },
              }}
              className="group rounded-2xl border border-black/8 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.025)] transition-shadow hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]"
            >
              <div className="mb-8 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#111111] text-white transition-transform duration-300 group-hover:scale-110">
                  <Icon size={20} />
                </div>

                <span className="text-xs font-semibold tracking-widest text-gray-300">
                  {agent.number}
                </span>
              </div>

              <h3 className="text-lg font-bold tracking-tight">
                {agent.title}
              </h3>

              <p className="mt-3 min-h-21 text-sm leading-6 text-gray-500">
                {agent.description}
              </p>

              
            </motion.article>
          );
        })}
      </div>
    </div>
  </section>

  {/* CTA SECTION */}
  <section className="px-5 pb-20 sm:px-8 sm:pb-28 lg:px-12">
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6 }}
      className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-[#111111] px-6 py-14 text-center text-white sm:px-12 sm:py-20"
    >
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-96 -translate-x-1/2 rounded-full bg-white/8 blur-[100px]" />

      <div className="relative z-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
          <GiArtificialHive size={30} />
        </div>

        <h2 className="mx-auto mt-7 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-5xl">
          Your Dream Job Is
          <br />
          Closer Than You Think.
        </h2>

        <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/60 sm:text-base">
          Build confidence, practice with AI, and walk into your next
          interview ready to impress.
        </p>

        <motion.button
          onClick={openLogin}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="mt-8 inline-flex cursor-pointer items-center gap-3 rounded-lg bg-white px-7 py-3.5 text-sm font-bold text-black transition-colors hover:bg-gray-200"
        >
          Start Preparing Today
          <FaArrowRight />
        </motion.button>
      </div>
    </motion.div>
  </section>

  {/* FOOTER */}
  <footer className="border-t border-black/[0.07] bg-[#FFF9F6] px-5 py-8 sm:px-8 lg:px-12">
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
      <a href="#home" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black">
          <GiArtificialHive size={18} color="white" />
        </div>

        <span className="font-bold tracking-tight">FresherAI</span>
      </a>

      <p className="text-center text-xs text-black">
        Prepare smarter. Interview better. Build your future.
      </p>

      <p className="text-xs text-black">
        © {new Date().getFullYear()} FresherAI
      </p>
    </div>
  </footer>

  {/* LOGIN MODAL */}
  {showLogin && (
    <LoginModel
      onClose={() => setShowLogin(false)}
      setUser={setUser}
    />
  )}
</div>


);
}

export default Home;
