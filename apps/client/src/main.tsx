import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { AuthProvider } from "./auth/AuthProvider";
import { TooltipProvider } from "./components/ui/tooltip";
import { FeedbackProvider } from "./feedback/FeedbackProvider";
import { createQueryClient } from "./queries/queryClient";
import { router } from "./router";
import "./index.css";

const queryClient = createQueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <FeedbackProvider>
            <RouterProvider router={router} />
          </FeedbackProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
