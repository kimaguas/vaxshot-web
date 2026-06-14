import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import App from "./App.jsx";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: "8px",
                padding: "12px 18px",
                fontSize: "14px",
                fontWeight: "500",
                boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
                minWidth: "280px",
                maxWidth: "420px",
              },
              success: {
                duration: 3500,
                style: { background: "#16a34a", color: "#fff" },
                iconTheme: { primary: "#fff", secondary: "#16a34a" },
              },
              error: {
                duration: 5000,
                style: { background: "#dc2626", color: "#fff" },
                iconTheme: { primary: "#fff", secondary: "#dc2626" },
              },
            }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
);
