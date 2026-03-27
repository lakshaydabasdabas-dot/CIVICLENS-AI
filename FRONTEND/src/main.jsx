import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import { ComplaintsProvider } from "./context/ComplaintsProvider.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ComplaintsProvider>
        <App />
      </ComplaintsProvider>
    </BrowserRouter>
  </React.StrictMode>
);