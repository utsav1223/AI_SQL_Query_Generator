import "./index.css";
import { ClerkProvider } from "@clerk/clerk-react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import AppProviders from "./providers/AppProviders";
import MissingClerkKey from "./components/MissingClerkKey";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

ReactDOM.createRoot(document.getElementById("root")).render(
  clerkPublishableKey ? (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      afterSignOutUrl="/"
      signInUrl="/login"
      signUpUrl="/register"
    >
      <BrowserRouter>
        <AppProviders>
          <App />
        </AppProviders>
      </BrowserRouter>
    </ClerkProvider>
  ) : (
    <MissingClerkKey />
  )
);
