import { Routes, Route } from "react-router-dom";
import Navbar from "./components/NAVBAR";
import Footer from "./components/FOOTER";
import Home from "./pages/HOME";
import About from "./pages/ABOUT";
import SubmitComplaint from "./pages/SUBMIT_COMPLAINT";
import AdminDashboard from "./pages/ADMIN_DASHBOARD";
import ComplaintDetails from "./pages/COMPLAINT_DETAILS";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/submit" element={<SubmitComplaint />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/complaint/:id" element={<ComplaintDetails />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;