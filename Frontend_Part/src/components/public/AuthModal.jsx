import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { X } from "lucide-react";
import { clerkModalAppearance } from "../../config/clerkAppearance";

const overlayMotion = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const clerkCardMotion = {
  hidden: { opacity: 0, scale: 0.96, y: 18 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] }
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 12,
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] }
  }
};

export default function AuthModal({ mode, onClose }) {
  const isRegister = mode === "register";
  const isOpen = mode === "login" || mode === "register";
  const redirectUrl = "/dashboard";

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.classList.add("public-auth-active");
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("public-auth-active");
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          variants={overlayMotion}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <button
            type="button"
            aria-label="Close authentication modal"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-[430px]"
            variants={clerkCardMotion}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="absolute -right-2 -top-12 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-slate-950/70 text-white shadow-lg backdrop-blur transition-all hover:bg-slate-900 sm:-right-12 sm:top-0"
            >
              <X size={18} />
            </button>

            {isRegister ? (
              <SignUp
                routing="hash"
                signInUrl="/login"
                forceRedirectUrl={redirectUrl}
                fallbackRedirectUrl={redirectUrl}
                appearance={clerkModalAppearance}
              />
            ) : (
              <SignIn
                routing="hash"
                signUpUrl="/register"
                forceRedirectUrl={redirectUrl}
                fallbackRedirectUrl={redirectUrl}
                appearance={clerkModalAppearance}
              />
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
