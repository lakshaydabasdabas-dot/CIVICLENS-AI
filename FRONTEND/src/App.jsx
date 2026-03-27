import { Route, Routes } from "react-router-dom";
import InteractionRoot from "./components/InteractionRoot.jsx";
import Navbar from "./components/NAVBAR.jsx";
import Footer from "./components/FOOTER.jsx";
import Home from "./pages/HOME.jsx";
import About from "./pages/ABOUT.jsx";
import SubmitComplaint from "./pages/SUBMIT_COMPLAINT.jsx";
import AdminDashboard from "./pages/ADMIN_DASHBOARD.jsx";
import ComplaintDetails from "./pages/COMPLAINT_DETAILS.jsx";
import Login from "./pages/LOGIN.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

function App() {
  return (
    <AuthProvider>
      <InteractionRoot>
        <Navbar />
        <main className="app-shell">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/submit" element={<SubmitComplaint />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/complaint/:id"
              element={
                <ProtectedRoute>
                  <ComplaintDetails />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
      </InteractionRoot>
    </AuthProvider>
  );
}

export default App;