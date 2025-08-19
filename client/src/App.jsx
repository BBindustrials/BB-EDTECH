import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import supabase from "./services/supabaseClient";

// Pages
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import History from "./pages/History";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import Report from "./pages/Report";

// Components
import Layout from "./components/Layout";

// Features
import ConfusionSolverForm from "./features/ConfusionSolver/ConfusionSolverForm";
import TutorChat from "./features/SocraticTutor/TutorChat";
import AdaptiveTutor from "./features/AdaptiveTutor/AdaptiveTutor";
import MathSolver from "./features/Mathsolver";
import IDDHelper from "./features/IDDHelper/IDDHelper";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Handle Supabase Auth State
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      {session ? (
        <Routes>
          {/* Authenticated routes */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard session={session} />} />
            <Route path="/history" element={<History />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/report" element={<Report />} />
            <Route path="/confusion-solver" element={<ConfusionSolverForm />} />
            <Route path="/socratic-tutor" element={<TutorChat />} />
            <Route path="/adaptive-tutor" element={<AdaptiveTutor />} />
            <Route path="/math-solver" element={<MathSolver />} />
            <Route path="/idd-helper" element={<IDDHelper />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      ) : (
        <Routes>
          {/* Unauthenticated routes */}
          <Route path="/" element={<Login />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;
