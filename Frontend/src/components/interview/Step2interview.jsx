import React, { useEffect, useRef, useState, useCallback } from "react";

import { useNavigate } from "react-router-dom";

import femaleAI from "../../assets/female-ai.mp4";
import maleAI from "../../assets/male-ai.mp4";

import { submitAnswer } from "../../apis/interview.api";

import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaPaperPlane,
  FaComments,
  FaSpinner,
  FaVolumeUp,
  FaVolumeMute,
  FaCode,
} from "react-icons/fa";

function Step2interview({ interviewData, user, setUser }) {
  const navigate = useNavigate();

  // ==========================================
  // REFS
  // ==========================================

  const videoRef = useRef(null);
  const cameraRef = useRef(null);
  const streamRef = useRef(null);

  const recognitionRef = useRef(null);

  const micEnabledRef = useRef(false);
  const submittingRef = useRef(false);
  const answerRef = useRef("");

  const restartTimerRef = useRef(null);
  const isStartingRef = useRef(false);

  // Welcome should play only once
  const welcomePlayedRef = useRef(false);

  // AI speaking flag (ref so mic functions always see the latest value)
  const isSpeakingRef = useRef(false);

  // Camera helpers
  const cameraStartingRef = useRef(false);
  const unmountedRef = useRef(false);

  // ==========================================
  // STATES
  // ==========================================

  const [currentQuestion, setCurrentQuestion] = useState(
    interviewData?.question || null,
  );

  const [questionIndex, setQuestionIndex] = useState(
    interviewData?.currentQuestion || 0,
  );

  const [answer, setAnswer] = useState("");

  const initialDuration = interviewData?.question?.timer || 60;

  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [timerDuration, setTimerDuration] = useState(initialDuration);

  // Camera (mandatory during the interview)
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraReady, setCameraReady] = useState(false); // true once camera started successfully
  const [cameraStarting, setCameraStarting] = useState(true);
  const [showCameraWarning, setShowCameraWarning] = useState(false);
  const [cameraMessage, setCameraMessage] = useState("");

  const [micEnabled, setMicEnabled] = useState(false);
  const [micListening, setMicListening] = useState(false);
  const [micStarting, setMicStarting] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState("javascript");
  const [codeValue, setCodeValue] = useState("");
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [showFeedbackStep, setShowFeedbackStep] = useState(false);
  const [pendingNextQuestion, setPendingNextQuestion] = useState(null);
  const [pendingNextQuestionIndex, setPendingNextQuestionIndex] = useState(null);
  const [videoType, setVideoType] = useState("female");

  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const interviewId = interviewData?.interviewId;
  const totalQuestions = interviewData?.totalQuestions || 0;

  // ==========================================
  // ANSWER REF
  // ==========================================

  useEffect(() => {
    answerRef.current = answer;
  }, [answer]);

  // ==========================================
  // AI VIDEO PLAYBACK
  // Video plays only while the AI voice is speaking.
  // ==========================================

  useEffect(() => {
    const video = videoRef.current;

    if (video) {
      video.pause();
      video.currentTime = 0;
    }

    return () => {
      const currentVideo = videoRef.current;
      if (currentVideo) {
        currentVideo.pause();
        currentVideo.currentTime = 0;
      }
    };
  }, [videoType]);

  // ==========================================
  // AI WELCOME + INTERVIEW QUESTIONS
  // Starts only after the camera is on.
  // ==========================================

  useEffect(() => {
    if (
      !cameraReady ||
      !currentQuestion?.question ||
      showFeedbackStep ||
      showCompletionModal
    ) {
      return;
    }

    // A question timer must remain stopped until the AI finishes speaking.
    setIsTimerRunning(false);

    // If voice is disabled or unsupported, don't leave the timer stuck.
    if (!voiceEnabled) {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      const video = videoRef.current;
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
      setIsTimerRunning(true);
      return;
    }

    if (!window.speechSynthesis) {
      console.log("Speech synthesis not supported; starting timer without voice.");
      setIsTimerRunning(true);
      return;
    }

    let cancelled = false;
    let welcomeTimer;

    const femalePatterns =
      /zira|samantha|susan|aria|jenny|female|hazel|karen|victoria/i;

    const malePatterns = /david|mark|guy|james|daniel|male|ryan|alex|george/i;

    const getSelectedVoice = () => {
      const voices = window.speechSynthesis.getVoices();

      const englishVoices = voices.filter((voice) =>
        voice.lang.toLowerCase().startsWith("en"),
      );

      const preferredVoice = englishVoices.find((voice) =>
        videoType === "female"
          ? femalePatterns.test(voice.name)
          : malePatterns.test(voice.name),
      );

      return preferredVoice || englishVoices[0] || null;
    };

    const speakText = (text, onComplete) => {
      if (cancelled) return;

      const utterance = new SpeechSynthesisUtterance(text);

      utterance.voice = getSelectedVoice();

      utterance.lang = utterance.voice?.lang || "en-US";

      utterance.rate = 0.95;
      utterance.pitch = videoType === "female" ? 1.15 : 0.85;
      utterance.volume = 1;

      utterance.onstart = () => {
        if (!cancelled) {
          // Mic must be OFF while the AI is speaking
          isSpeakingRef.current = true;
          stopMicrophone();

          setIsSpeaking(true);

          const video = videoRef.current;
          if (video) {
            video.currentTime = 0;
            video.play().catch((error) => {
              console.log("AI VIDEO PLAY ERROR:", error);
            });
          }
        }
      };

      utterance.onend = () => {
        if (!cancelled) {
          isSpeakingRef.current = false;
          setIsSpeaking(false);

          const video = videoRef.current;
          if (video) {
            video.pause();
            video.currentTime = 0;
          }

          if (onComplete) {
            onComplete();
          }
        }
      };

      utterance.onerror = (event) => {
        console.error("AI SPEECH ERROR:", event.error);

        if (!cancelled) {
          isSpeakingRef.current = false;
          setIsSpeaking(false);

          const video = videoRef.current;
          if (video) {
            video.pause();
            video.currentTime = 0;
          }
          // Don't block the interview if the browser speech engine errors.
          setIsTimerRunning(true);
        }
      };

      console.log("AI VOICE:", utterance.voice?.name || "Default voice");

      window.speechSynthesis.speak(utterance);
    };

    const speakQuestion = () => {
      if (cancelled) return;

      // Start this question's timer only after the full question is spoken.
      speakText(currentQuestion.question, () => {
        if (!cancelled) setIsTimerRunning(true);
      });
    };

    const startInterview = () => {
      if (cancelled) return;

      window.speechSynthesis.cancel();

      // Speak the personalized welcome only once, at interview start.
      if (!welcomePlayedRef.current) {
        welcomePlayedRef.current = true;

        const userName = user?.fullName || user?.name || user?.username || "there";

        const welcomeMessage =
          `Hello ${userName}! Welcome to your AI mock interview. ` +
          `I'm your AI interviewer, and I'll be guiding you through this session today. ` +
          `Take your time, stay confident, and answer each question to the best of your ability. ` +
          `Are you ready? Let's get started with your first question.`;

        speakText(welcomeMessage, () => {
          speakQuestion();
        });
      } else {
        // Subsequent questions
        speakQuestion();
      }
    };

    // Small delay also prevents React StrictMode
    // from cancelling the first welcome immediately.
    welcomeTimer = setTimeout(() => {
      startInterview();
    }, 300);

    return () => {
      cancelled = true;

      clearTimeout(welcomeTimer);

      window.speechSynthesis.cancel();

      isSpeakingRef.current = false;
      setIsSpeaking(false);

      const video = videoRef.current;
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
    };
  }, [
    cameraReady,
    currentQuestion,
    videoType,
    voiceEnabled,
    user?.fullName,
    user?.name,
    user?.username,
    showFeedbackStep,
    showCompletionModal,
  ]);

  // ==========================================
  // CAMERA STREAM -> VIDEO ELEMENT
  // ==========================================

  useEffect(() => {
    if (cameraOn && cameraRef.current && streamRef.current) {
      cameraRef.current.srcObject = streamRef.current;

      cameraRef.current.play().catch((error) => {
        console.error("CAMERA PLAY ERROR:", error);
      });
    }
  }, [cameraOn]);

  // ==========================================
  // START CAMERA (mandatory)
  // ==========================================

  const startCamera = async () => {
    // Already running
    if (streamRef.current?.active) {
      setCameraOn(true);
      setCameraReady(true);
      setCameraStarting(false);
      return true;
    }

    if (cameraStartingRef.current) return false;
    cameraStartingRef.current = true;
    setCameraStarting(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      // Component closed while permission prompt was open
      if (unmountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return false;
      }

      streamRef.current = stream;

      // If camera gets disconnected / permission revoked mid-interview
      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          if (unmountedRef.current) return;

          streamRef.current = null;
          setCameraOn(false);
          setCameraMessage(
            "Your camera was turned off. The camera must stay on during the interview. Please turn it on again to continue.",
          );
          setShowCameraWarning(true);
        };
      });

      setCameraOn(true);
      setCameraReady(true);
      setShowCameraWarning(false);

      return true;
    } catch (error) {
      console.error("CAMERA ERROR:", error);

      setCameraOn(false);
      setCameraMessage(
        "Camera access is required to take this interview. Please allow camera permission in your browser and try again.",
      );
      setShowCameraWarning(true);

      return false;
    } finally {
      cameraStartingRef.current = false;
      setCameraStarting(false);
    }
  };

  // Auto-start camera as soon as the interview opens
  useEffect(() => {
    startCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==========================================
  // CAMERA BUTTON (cannot be turned off)
  // ==========================================

  const handleCameraButton = () => {
    if (cameraOn) {
      setCameraMessage(
        "The camera cannot be turned off during the interview. Please keep it on until the interview is finished.",
      );
      setShowCameraWarning(true);
      return;
    }

    startCamera();
  };

  // ==========================================
  // STOP MICROPHONE
  // ==========================================

  const stopMicrophone = () => {
    micEnabledRef.current = false;
    isStartingRef.current = false;

    clearTimeout(restartTimerRef.current);

    setMicEnabled(false);
    setMicListening(false);
    setMicStarting(false);

    if (recognitionRef.current) {
      const recognition = recognitionRef.current;

      recognitionRef.current = null;

      try {
        recognition.stop();
      } catch (error) {
        console.log("MIC STOP:", error.message);
      }
    }
  };

  // ==========================================
  // START MICROPHONE
  // ==========================================

  const startMicrophone = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      micEnabledRef.current = false;

      setMicEnabled(false);
      setMicListening(false);
      setMicStarting(false);

      alert("Speech recognition is not supported. Please use Google Chrome.");

      return;
    }

    if (
      !micEnabledRef.current ||
      submittingRef.current ||
      isSpeakingRef.current ||
      recognitionRef.current ||
      isStartingRef.current
    ) {
      return;
    }

    clearTimeout(restartTimerRef.current);

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;
    isStartingRef.current = true;

    setMicStarting(true);

    // ON START

    recognition.onstart = () => {
      isStartingRef.current = false;

      if (!micEnabledRef.current) {
        try {
          recognition.stop();
        } catch (error) {
          console.log(error);
        }

        return;
      }

      setMicEnabled(true);
      setMicListening(true);
      setMicStarting(false);

      console.log("MICROPHONE STARTED");
    };

    // ON RESULT

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript.trim()) {
        const updatedAnswer = answerRef.current + finalTranscript;

        answerRef.current = updatedAnswer;

        setAnswer(updatedAnswer);
      }

      console.log("INTERIM SPEECH:", interimTranscript);
      console.log("FINAL ANSWER:", answerRef.current);
    };

    // ON ERROR

    recognition.onerror = (event) => {
      console.error("MICROPHONE ERROR:", event.error);

      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed" ||
        event.error === "audio-capture"
      ) {
        micEnabledRef.current = false;

        setMicEnabled(false);
        setMicListening(false);
        setMicStarting(false);

        clearTimeout(restartTimerRef.current);

        if (recognitionRef.current === recognition) {
          recognitionRef.current = null;
        }

        if (event.error === "not-allowed") {
          alert(
            "Microphone permission denied. Allow microphone access in Chrome settings.",
          );
        }
      }
    };

    // ON END

    recognition.onend = () => {
      console.log("MICROPHONE ENDED");

      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }

      isStartingRef.current = false;

      if (
        micEnabledRef.current &&
        !submittingRef.current &&
        !isSpeakingRef.current
      ) {
        setMicListening(false);
        setMicStarting(true);

        clearTimeout(restartTimerRef.current);

        restartTimerRef.current = setTimeout(() => {
          startMicrophone();
        }, 700);
      } else {
        setMicEnabled(false);
        setMicListening(false);
        setMicStarting(false);
      }
    };

    // START

    try {
      recognition.start();
    } catch (error) {
      console.error("MIC START ERROR:", error);

      recognitionRef.current = null;
      isStartingRef.current = false;

      setMicListening(false);
      setMicStarting(false);

      if (
        micEnabledRef.current &&
        !submittingRef.current &&
        !isSpeakingRef.current
      ) {
        restartTimerRef.current = setTimeout(() => {
          startMicrophone();
        }, 1000);
      }
    }
  };

  // ==========================================
  // TOGGLE MICROPHONE
  // ==========================================

  const toggleMic = () => {
    // Mic cannot be used while the AI is speaking
    if (isSpeakingRef.current) return;

    if (micEnabledRef.current) {
      stopMicrophone();
      return;
    }

    if (isSubmitting) return;

    micEnabledRef.current = true;

    setMicEnabled(true);
    setMicListening(false);
    setMicStarting(true);

    startMicrophone();
  };

  // ==========================================
  // SUBMIT ANSWER
  // ==========================================

  const handleSubmit = useCallback(
    async (autoSubmit = false) => {
      if (submittingRef.current) return;

      const finalAnswer =
        answerRef.current.trim() ||
        (autoSubmit ? "No answer provided. Time expired." : "");

      if (!finalAnswer) {
        setShowAnswerModal(true);
        return;
      }

      if (!interviewId) {
        alert("Interview ID missing.");
        return;
      }

      submittingRef.current = true;

      setIsTimerRunning(false);
      setIsSubmitting(true);

      stopMicrophone();

      window.speechSynthesis?.cancel();

      try {
        const response = await submitAnswer({
          interviewId,
          answer: finalAnswer,
        });

        console.log("SUBMIT RESPONSE:", response);

        if (!response.success) {
          throw new Error("Answer submission failed.");
        }

        // Save AI feedback for the answer that was just evaluated.
        // API response may contain feedback as a string or an object.
        setAiFeedback(response.feedback ?? response.aiFeedback ?? null);

        // INTERVIEW COMPLETED: show confirmation before opening the report
        if (response.completed) {
          stopMicrophone();
          window.speechSynthesis?.cancel();

          const video = videoRef.current;
          if (video) {
            video.pause();
            video.currentTime = 0;
          }

          setShowCompletionModal(true);
          return;
        }

        // NEXT QUESTION: API may return the question under `question`,
        // while `currentQuestion` can be a numeric question counter.
        const nextQuestion =
          response.question ||
          (typeof response.currentQuestion === "object"
            ? response.currentQuestion
            : null);

        if (!nextQuestion) {
          throw new Error("Next question was not returned by the server.");
        }

        // Keep the question that was just answered on screen while its
        // feedback is displayed directly beneath it. Load the next question
        // only when the user clicks the continue button.
        const nextIndex =
          typeof response.currentQuestion === "number"
            ? Math.max(0, response.currentQuestion - 1)
            : questionIndex + 1;

        setPendingNextQuestion(nextQuestion);
        setPendingNextQuestionIndex(nextIndex);
        setShowFeedbackStep(true);

        // Freeze the timer while the user reviews feedback.
        stopMicrophone();
        window.speechSynthesis?.cancel();
        setIsSpeaking(false);

        const video = videoRef.current;
        if (video) {
          video.pause();
          video.currentTime = 0;
        }
      } catch (error) {
        console.error("SUBMIT ANSWER ERROR:", error);

        alert(
          error.response?.data?.message ||
            error.message ||
            "Unable to submit answer.",
        );
      } finally {
        submittingRef.current = false;

        setIsSubmitting(false);
      }
    },
    [interviewId, navigate, questionIndex],
  );

  // ==========================================
  // TIMER
  // ==========================================

  useEffect(() => {
    if (
      !currentQuestion ||
      !isTimerRunning ||
      isSubmitting ||
      showFeedbackStep ||
      showCompletionModal
    )
      return;

    if (timeLeft <= 0) {
      handleSubmit(true);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((previous) => previous - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    timeLeft,
    currentQuestion,
    isTimerRunning,
    isSubmitting,
    showFeedbackStep,
    showCompletionModal,
    handleSubmit,
  ]);

  // ==========================================
  // TIMER PROGRESS
  // ==========================================

  const timerProgress = Math.max(
    0,
    Math.min(100, (timeLeft / timerDuration) * 100),
  );

  const handleContinueToNextQuestion = () => {
    if (!pendingNextQuestion) return;

    setCurrentQuestion(pendingNextQuestion);
    setQuestionIndex(pendingNextQuestionIndex ?? questionIndex + 1);
    setPendingNextQuestion(null);
    setPendingNextQuestionIndex(null);
    setAiFeedback(null);
    setShowFeedbackStep(false);

    setAnswer("");
    answerRef.current = "";

    const nextDuration = pendingNextQuestion.timer || 60;
    setTimerDuration(nextDuration);
    setTimeLeft(nextDuration);
    setIsTimerRunning(false);
  };

  // ==========================================
  // CODE EDITOR: APPEND CODE TO ANSWER
  // ==========================================

  const addCodeToAnswer = () => {
    const trimmedCode = codeValue.trim();
    if (!trimmedCode) return;

    const fence = "\u0060\u0060\u0060";
    const codeBlock = `\n\n${fence}${codeLanguage}\n${trimmedCode}\n${fence}`;
    const updatedAnswer = answerRef.current.trim()
      ? `${answerRef.current.trim()}${codeBlock}`
      : codeBlock.trim();

    answerRef.current = updatedAnswer;
    setAnswer(updatedAnswer);
    setShowCodeEditor(false);
  };

  // ==========================================
  // CTRL + ENTER SUBMISSION
  // ==========================================

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === "Enter") {
        handleSubmit(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleSubmit]);

  // ==========================================
  // CLEANUP
  // ==========================================

  useEffect(() => {
    unmountedRef.current = false;

    return () => {
      unmountedRef.current = true;

      micEnabledRef.current = false;
      isStartingRef.current = false;

      clearTimeout(restartTimerRef.current);

      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.log("MIC CLEANUP:", error);
        }
      }

      window.speechSynthesis?.cancel();
    };
  }, []);

  // ==========================================
  // LOADING
  // ==========================================

  if (!interviewData) {
    return (
      <div className="min-h-screen bg-[#08090D] flex items-center justify-center text-white">
        Loading interview...
      </div>
    );
  }

  // ==========================================
  // PROGRESS
  // ==========================================

  const progress =
    totalQuestions > 0 ? ((questionIndex + 1) / totalQuestions) * 100 : 0;

  // DIFFICULTY LABEL
  const difficultyLabels = {
    easy: "Beginner Friendly",
    medium: "Intermediate Challenge",
    hard: "Advanced Challenge",
  };

  const difficultyLabel =
    difficultyLabels[String(currentQuestion?.difficulty || "").toLowerCase()] ||
    "Interview Challenge";

  const feedbackText =
    typeof aiFeedback === "string"
      ? aiFeedback
      : aiFeedback?.feedback ||
        aiFeedback?.message ||
        aiFeedback?.summary ||
        aiFeedback?.overallFeedback ||
        aiFeedback?.feedbackText ||
        aiFeedback?.comment ||
        aiFeedback?.suggestion ||
        aiFeedback?.analysis ||
        aiFeedback?.overall ||
        aiFeedback?.evaluation ||
        "";

  const feedbackStrengths = Array.isArray(aiFeedback?.strengths)
    ? aiFeedback.strengths
    : aiFeedback?.strengths
      ? [aiFeedback.strengths]
      : [];

  const feedbackImprovements = Array.isArray(aiFeedback?.improvements)
    ? aiFeedback.improvements
    : Array.isArray(aiFeedback?.areasToImprove)
      ? aiFeedback.areasToImprove
      : aiFeedback?.improvements || aiFeedback?.areasToImprove
        ? [aiFeedback.improvements || aiFeedback.areasToImprove]
        : [];
  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="min-h-screen bg-[#08090D] p-4 md:p-6 text-white">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-5 lg:grid-cols-[330px_1fr]">
        {/* ================================== */}
        {/* LEFT PANEL */}
        {/* ================================== */}

        <div className="flex flex-col gap-5">
          {/* AI VIDEO */}

          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#15161C]">
            <video
              ref={videoRef}
              key={videoType}
              src={videoType === "female" ? femaleAI : maleAI}
              muted
              loop
              playsInline
              preload="auto"
              className="h-60 w-full object-cover"
            />

            <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-black/70 px-3 py-2 text-sm">
              <FaVolumeUp />

              {isSpeaking ? "AI Interviewer Speaking..." : "AI Interviewer"}
            </div>
          </div>

          {/* USER CAMERA */}

          <div className="relative flex min-h-57.5 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#15161C]">
            <video
              ref={cameraRef}
              autoPlay
              muted
              playsInline
              className={`absolute inset-0 h-full w-full object-cover ${
                cameraOn ? "block" : "hidden"
              }`}
            />

            {cameraOn && (
              <div className="absolute left-3 top-3 flex items-center gap-2 rounded-lg bg-black/70 px-3 py-1.5 text-xs">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                Camera on
              </div>
            )}

            {!cameraOn && (
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#292B32] text-2xl font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>

                <p className="mt-3 text-sm text-gray-400">
                  {user?.name || "You"}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {cameraStarting
                    ? "Starting camera..."
                    : "Camera is required"}
                </p>
              </div>
            )}
          </div>

          {/* CONTROLS */}

          <div className="flex flex-wrap justify-center gap-3">
            {/* MICROPHONE */}

            <button
              type="button"
              onClick={toggleMic}
              disabled={isSubmitting || isSpeaking}
              className={`flex h-12 w-12 items-center justify-center rounded-xl text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                micEnabled
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-[#24252D] hover:bg-[#343640]"
              }`}
              title={
                isSpeaking
                  ? "Microphone is disabled while the AI is speaking"
                  : micEnabled
                    ? "Turn microphone off"
                    : "Turn microphone on"
              }
            >
              {micEnabled ? (
                <FaMicrophone className="text-lg" />
              ) : (
                <FaMicrophoneSlash className="text-lg" />
              )}
            </button>

            {/* CAMERA (mandatory, cannot be turned off) */}

            <button
              type="button"
              onClick={handleCameraButton}
              disabled={isSubmitting}
              className={`flex h-12 w-12 items-center justify-center rounded-xl transition ${
                cameraOn
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
              title={
                cameraOn
                  ? "Camera must stay on during the interview"
                  : "Turn camera on"
              }
            >
              <FaVideo />
            </button>

            {/* CODE EDITOR */}
            <button
              type="button"
              onClick={() => setShowCodeEditor(true)}
              disabled={isSubmitting || showFeedbackStep}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#24252D] px-4 text-xs font-semibold text-white transition hover:bg-[#343640] disabled:cursor-not-allowed disabled:opacity-50"
              title="Open code editor"
            >
              <FaCode className="text-sm" />
              {/* Code Editor */}
            </button>

            {/* AI VOICE */}

            <button
              type="button"
              onClick={() => setVoiceEnabled((previous) => !previous)}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#24252D] hover:bg-[#343640]"
              title="Toggle interviewer voice"
            >
              {voiceEnabled ? <FaVolumeUp /> : <FaVolumeMute />}
            </button>

            {/* SWITCH AI */}

            <button
              type="button"
              onClick={() =>
                setVideoType((previous) =>
                  previous === "female" ? "male" : "female",
                )
              }
              className="rounded-xl bg-[#24252D] px-4 text-xs hover:bg-[#343640]"
            >
              {videoType === "female" ? "Male AI" : "Female AI"}
            </button>
          </div>

          <p className="text-center text-xs text-gray-500">
            Answer using your microphone, type below, or use the code editor.
          </p>
        </div>

        {/* ================================== */}
        {/* RIGHT PANEL */}
        {/* ================================== */}

        <div className="rounded-2xl border border-white/10 bg-[#111219] p-5 md:p-8">
          {/* HEADER */}

          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">AI Interview</h1>

              <div className="mt-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-purple-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_#a855f7]" />
                  {difficultyLabel}
                </span>
              </div>
            </div>

            {/* SVG TIMER */}

            <div className="relative flex h-20 w-20 items-center justify-center">
              <svg
                className="absolute inset-0 h-full w-full -rotate-90"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="43"
                  fill="none"
                  stroke="#292B32"
                  strokeWidth="6"
                />

                <circle
                  cx="50"
                  cy="50"
                  r="43"
                  fill="none"
                  stroke={timeLeft <= 10 ? "#EF4444" : "#10B981"}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 43}
                  strokeDashoffset={
                    2 * Math.PI * 43 * (1 - timerProgress / 100)
                  }
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>

              <span
                className={`text-lg font-bold ${
                  isTimerRunning && timeLeft <= 10
                    ? "text-red-500"
                    : "text-green-400"
                }`}
              >
                {isTimerRunning ? `${timeLeft}s` : "Ready"}
              </span>
            </div>
          </div>

          {/* QUESTION */}

          <div className="mt-8 rounded-xl border border-white/10 bg-[#191A22] p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-black">
                <FaComments />
              </div>

              <span className="text-sm text-gray-400">
                Question {questionIndex + 1}
              </span>
            </div>

            <p className="text-lg leading-8">{currentQuestion?.question}</p>
          </div>

          {/* FEEDBACK FOR THE QUESTION CURRENTLY SHOWN */}
          {(aiFeedback || showFeedbackStep) && (
            <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <FaComments size={14} />
                </span>
                <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-400">
                  AI Feedback · Question {questionIndex + 1}
                </h3>
              </div>

              {feedbackText ? (
                <p className="text-sm leading-6 text-gray-300">
                  {feedbackText}
                </p>
              ) : (
                <p className="text-sm leading-6 text-gray-300">
                  Your answer has been evaluated. Review the points below to
                  improve your next response.
                </p>
              )}

              {feedbackStrengths.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1 text-xs font-semibold text-emerald-300">
                    What went well
                  </p>
                  <ul className="list-inside list-disc space-y-1 text-sm text-gray-300">
                    {feedbackStrengths.map((item, index) => (
                      <li key={`strength-${index}`}>{String(item)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {feedbackImprovements.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1 text-xs font-semibold text-amber-300">
                    How to improve
                  </p>
                  <ul className="list-inside list-disc space-y-1 text-sm text-gray-300">
                    {feedbackImprovements.map((item, index) => (
                      <li key={`improvement-${index}`}>{String(item)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {showFeedbackStep && pendingNextQuestion && (
                <button
                  type="button"
                  onClick={handleContinueToNextQuestion}
                  className="mt-5 w-full rounded-xl bg-green-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-green-400"
                >
                  Continue to Question {questionIndex + 2} →
                </button>
              )}
            </div>
          )}

          {/* PROGRESS */}

          <div className="mt-6">
            <div className="mb-2 flex justify-between text-xs text-gray-400">
              <span>Progress</span>

              <span>
                {questionIndex + 1}/{totalQuestions}
              </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-[#292B32]">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-500"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>

          {/* ANSWER: hidden while reviewing AI feedback */}
          {!showFeedbackStep && (
            <>
              <div className="mt-7">
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-semibold">Your Answer</label>

                  <span
                    className={`text-xs ${
                      isSpeaking
                        ? "text-purple-300"
                        : micListening
                          ? "text-green-400"
                          : micStarting
                            ? "text-yellow-400"
                            : "text-gray-400"
                    }`}
                  >
                    {isSpeaking
                      ? "AI is speaking... mic is off"
                      : micListening
                        ? "Listening..."
                        : micStarting
                          ? "Starting microphone..."
                          : "Text or Voice"}
                  </span>
                </div>

                <textarea
                  value={answer}
                  onChange={(event) => {
                    setAnswer(event.target.value);
                    answerRef.current = event.target.value;
                  }}
                  disabled={isSubmitting}
                  placeholder={
                    micListening
                      ? "Speak your answer..."
                      : "Write your answer here..."
                  }
                  className="min-h-45 w-full resize-none rounded-xl border border-white/10 bg-[#191A22] p-4 text-sm leading-7 text-white outline-none placeholder:text-gray-600 focus:border-green-500"
                />
              </div>

              {/* SUBMIT */}

              <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-5 sm:flex-row">
                <p className="text-xs text-gray-500">
                  Press Ctrl + Enter to submit
                </p>

                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-3 rounded-xl bg-green-500 px-7 py-3.5 font-semibold text-black transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Evaluating...
                    </>
                  ) : (
                    <>
                      Submit Answer
                      <FaPaperPlane />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* CAMERA WARNING MODAL */}
      {showCameraWarning && (
        <div className="fixed inset-0 z-10002 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-[#191A22] p-7 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
              <FaVideo className="text-2xl text-red-400" />
            </div>

            <h2 className="mt-5 text-2xl font-bold text-white">
              Camera Required
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-400">
              {cameraMessage}
            </p>

            {cameraOn ? (
              <button
                type="button"
                onClick={() => setShowCameraWarning(false)}
                className="mt-7 w-full rounded-xl bg-green-500 px-5 py-3 font-semibold text-black transition hover:bg-green-400"
              >
                Got It
              </button>
            ) : (
              <button
                type="button"
                onClick={startCamera}
                disabled={cameraStarting}
                className="mt-7 w-full rounded-xl bg-green-500 px-5 py-3 font-semibold text-black transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cameraStarting ? "Starting camera..." : "Turn Camera On"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* INTERVIEW COMPLETION MODAL */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-10000 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-green-500/20 bg-[#191A22] p-8 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10 text-3xl">
              🎉
            </div>

            <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-green-400">
              Interview Completed
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              Great job! You did it.
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              You have successfully completed all {totalQuestions || 6}{" "}
              questions. Your interview report is ready to view.
            </p>

            {feedbackText && (
              <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-left">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Final Answer Feedback
                </p>
                <p className="text-sm leading-6 text-gray-300">
                  {feedbackText}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => navigate(`/interview/${interviewId}/report`)}
              className="mt-7 w-full rounded-xl bg-green-500 px-5 py-3 font-semibold text-black transition hover:bg-green-400"
            >
              View Interview Report
            </button>
          </div>
        </div>
      )}

      {/* CODE EDITOR MODAL */}
      {showCodeEditor && (
        <div className="fixed inset-0 z-10001 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#111219] shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-white">Code Editor</h2>
                <p className="mt-1 text-xs text-gray-400">
                  Write your solution and add it to your interview answer.
                </p>
              </div>
              <select
                value={codeLanguage}
                onChange={(event) => setCodeLanguage(event.target.value)}
                className="rounded-lg border border-white/10 bg-[#24252D] px-3 py-2 text-sm text-white outline-none focus:border-green-500"
                aria-label="Programming language"
              >
                <option value="c">C</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="go">Go</option>
                <option value="csharp">C#</option>
                <option value="php">PHP</option>
                <option value="ruby">Ruby</option>
                <option value="rust">Rust</option>
                <option value="sql">SQL</option>
              </select>
            </div>

            <div className="p-4 sm:p-5">
              <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                <span className="h-2 w-2 rounded-full bg-yellow-400" />
                <span className="h-2 w-2 rounded-full bg-green-400" />
                <span className="ml-2">
                  solution.
                  {codeLanguage === "cpp"
                    ? "cpp"
                    : codeLanguage === "python"
                      ? "py"
                      : codeLanguage === "javascript"
                        ? "js"
                        : codeLanguage}
                </span>
              </div>
              <textarea
                value={codeValue}
                onChange={(event) => setCodeValue(event.target.value)}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                placeholder={`// Write your ${codeLanguage} solution here...`}
                className="min-h-90 w-full resize-y rounded-xl border border-white/10 bg-[#090B10] p-5 font-mono text-sm leading-7 text-green-300 outline-none placeholder:text-gray-600 focus:border-green-500"
              />
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowCodeEditor(false)}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addCodeToAnswer}
                disabled={!codeValue.trim()}
                className="rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add to Answer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ANSWER REQUIRED MODAL */}
      {showAnswerModal && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#191A22] p-7 text-center shadow-2xl">
            {/* ICON */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-500/10">
              <span className="text-3xl">✍️</span>
            </div>

            {/* TITLE */}
            <h2 className="mt-5 text-2xl font-bold text-white">
              Answer Required
            </h2>

            {/* DESCRIPTION */}
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Please provide your answer before submitting. You can type your
              response or use the microphone.
            </p>

            {/* BUTTON */}
            <button
              type="button"
              onClick={() => setShowAnswerModal(false)}
              className="mt-7 w-full rounded-xl bg-green-500 px-5 py-3 font-semibold text-black transition hover:bg-green-400"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Step2interview;
