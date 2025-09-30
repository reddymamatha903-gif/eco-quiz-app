"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, RotateCcw, Crown } from "lucide-react";

// Firebase
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";

// 🔥 Replace these with your Firebase Config (from Firebase Console)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface LeaderboardEntry {
  name: string;
  score: number;
  ecoPoints: number;
}

const questions: Question[] = [
  {
    id: 1,
    text: "What percentage of the Earth's surface is covered by oceans?",
    options: ["50%", "71%", "90%", "35%"],
    correctAnswer: 1,
    explanation: "Approximately 71% of the Earth's surface is covered by oceans."
  },
  {
    id: 2,
    text: "Which is the most effective way to reduce your carbon footprint?",
    options: ["Driving a hybrid car", "Eating less meat", "Flying less", "Using renewable energy"],
    correctAnswer: 1,
    explanation: "Reducing meat consumption has one of the largest individual impacts."
  },
  {
    id: 3,
    text: "How long does it take for a plastic bottle to decompose?",
    options: ["10 years", "100 years", "450 years", "1000 years"],
    correctAnswer: 2,
    explanation: "Plastic bottles can take up to 450 years to fully decompose."
  }
];

export default function EcoQuizApp() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const currentQuestion = questions[currentQuestionIndex];
  const ecoPoints = Math.floor((score / questions.length) * 100);

  // 🎯 Fetch leaderboard in real-time
  useEffect(() => {
    const q = query(collection(db, "leaderboard"), orderBy("score", "desc"), limit(5));
    const unsub = onSnapshot(q, (snapshot) => {
      setLeaderboard(snapshot.docs.map((doc) => doc.data() as LeaderboardEntry));
    });
    return () => unsub();
  }, []);

  const handleAnswer = (index: number) => {
    setSelectedAnswer(index);
    if (index === currentQuestion.correctAnswer) {
      setScore((prev) => prev + 1);
    }
    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => prev + 1);
        setSelectedAnswer(null);
      }, 800);
    } else {
      setQuizCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setQuizCompleted(false);
  };

  const saveToLeaderboard = async () => {
    if (!playerName.trim()) return;
    try {
      await addDoc(collection(db, "leaderboard"), {
        name: playerName,
        score,
        ecoPoints,
      });
    } catch (error) {
      console.error("Error saving leaderboard:", error);
    }
  };

  if (quizCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader className="text-center">
            <Trophy className="h-12 w-12 text-green-600 mx-auto mb-2" />
            <CardTitle className="text-2xl font-bold">Quiz Completed!</CardTitle>
            <p className="text-muted-foreground">You scored {score}/{questions.length} ({ecoPoints} pts)</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full border p-2 rounded-lg"
            />
            <Button onClick={saveToLeaderboard} className="w-full">Save to Leaderboard</Button>
            <Button onClick={handleRestart} className="w-full" variant="outline">
              <RotateCcw className="mr-2 h-5 w-5" />
              Retake Quiz
            </Button>

            <div className="mt-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Crown className="text-yellow-500" /> Leaderboard
              </h3>
              <ul className="mt-3 space-y-2">
                {leaderboard.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No scores yet</p>
                ) : (
                  leaderboard.map((entry, idx) => (
                    <li
                      key={idx}
                      className="flex justify-between bg-green-50 p-2 rounded-lg border"
                    >
                      <span className="font-medium">{entry.name}</span>
                      <span>{entry.score}/{questions.length} ({entry.ecoPoints} pts)</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <Badge variant="outline">
            Question {currentQuestionIndex + 1}/{questions.length}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <CardTitle className="text-xl">{currentQuestion.text}</CardTitle>
          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => (
              <Button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={selectedAnswer !== null}
                className={`w-full justify-start ${
                  selectedAnswer === idx
                    ? idx === currentQuestion.correctAnswer
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                    : ""
                }`}
              >
                {option}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
