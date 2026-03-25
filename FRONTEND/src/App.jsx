import { Route, Routes } from "react-router-dom";
import InteractionRoot from "./components/InteractionRoot.jsx";
import Navbar from "./components/NAVBAR.jsx";
import Footer from "./components/FOOTER.jsx";
import Home from "./pages/HOME.jsx";
import About from "./pages/ABOUT.jsx";
import SubmitComplaint from "./pages/SUBMIT_COMPLAINT.jsx";
import AdminDashboard from "./pages/ADMIN_DASHBOARD.jsx";
import ComplaintDetails from "./pages/COMPLAINT_DETAILS.jsx";

function App() {
  return (
    <InteractionRoot>
      <div className="app-shell">
        <Navbar />
        <main className="page-shell">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/submit" element={<SubmitComplaint />} />
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/complaint/:id" element={<ComplaintDetails />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </InteractionRoot>
  );
}

export default App;
