import { Navigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";

function ProtectedRoute({ children }) {
  const { isAuthenticated, isCheckingAuth } = useContext(AuthContext);
  const location = useLocation();

  if (isCheckingAuth) {
    return (
      <div
        style={{
          padding: "2rem",
          borderRadius: "18px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        Checking admin access...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default ProtectedRoute;