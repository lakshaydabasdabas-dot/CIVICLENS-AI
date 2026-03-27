import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { ComplaintsProvider } from "./context/ComplaintsProvider.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <ComplaintsProvider>
        <App />
      </ComplaintsProvider>
    </HashRouter>
  </React.StrictMode>
);
