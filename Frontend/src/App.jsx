import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import { setResume } from "./redux/resumeSlice.js";

import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Scorer from "./pages/Scorer.jsx";

import Step1setup from "./components/interview/Step1setup.jsx";
import InterviewPage from "./pages/interviewPage.jsx";
import Step3report from "./components/interview/Step3report.jsx";

import SmoothScroll from "./components/SmoothScroll.jsx";

import { getCurrentUser } from "./apis/user.api.js";
import { getResume } from "./apis/resume.api.js";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const dispatch = useDispatch();

  // GET CURRENT USER
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const data = await getCurrentUser();
        setUser(data?.user || null);
      } catch (error) {
        console.error("GET CURRENT USER ERROR:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  // GET USER RESUME
  useEffect(() => {
    const fetchResume = async () => {
      try {
        const result = await getResume();
        dispatch(setResume(result?.data || null));
      } catch (error) {
        console.error("GET RESUME ERROR:", error);
      }
    };

    if (user) {
      fetchResume();
    }
  }, [user, dispatch]);

  // LOADING SCREEN
  if (loading) {
    return (
      <div className="fixed left-0 top-0 z-9999 w-full">
        <div className="h-1 w-full animate-pulse bg-black" />
      </div>
    );
  }

  return (
    <>
      <SmoothScroll />

      <Routes>
        {/* HOME */}
        <Route
          path="/"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Home setUser={setUser} />
            )
          }
        />

        {/* DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            user ? (
              <Dashboard user={user} setUser={setUser} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* RESUME SCORER */}
        <Route
          path="/scorer"
          element={
            user ? (
              <Scorer user={user} setUser={setUser} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* STEP 1: INTERVIEW SETUP */}
        <Route
          path="/interview/setup"
          element={
            user ? (
              <Step1setup user={user} setUser={setUser} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        
       {/* STEP 2: AI INTERVIEW */}
<Route
  path="/interview/:id"
  element={
    user ? (
      <InterviewPage user={user} setUser={setUser} />
    ) : (
      <Navigate to="/" replace />
    )
  }
/>

        {/* STEP 3: INTERVIEW REPORT */}
        <Route
          path="/interview/:id/report"
          element={
            user ? (
              <Step3report user={user} setUser={setUser} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* INVALID ROUTES */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;