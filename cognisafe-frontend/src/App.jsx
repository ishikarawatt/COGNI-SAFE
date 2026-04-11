import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import ScrollToTop from "./components/common/ScrollToTop";
import CustomCursor from "./components/common/CustomCursor";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Session from "./pages/Session";
import Brain from "./pages/Brain";
import ARReport from "./pages/ARReport";

const App = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <CustomCursor />
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/session" element={<ProtectedRoute><Session /></ProtectedRoute>} />
          <Route path="/brain" element={<ProtectedRoute><Brain /></ProtectedRoute>} />
          <Route path="/ar-report" element={<ProtectedRoute><ARReport /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;