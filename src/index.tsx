import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { DataContextProvider } from "./hooks/Data";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  // <React.StrictMode>
  <DataContextProvider>
    <App />
  </DataContextProvider>
  // </React.StrictMode>
);
