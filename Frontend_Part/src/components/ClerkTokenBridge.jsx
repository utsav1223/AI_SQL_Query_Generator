import { useEffect } from "react";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { setClerkTokenGetter } from "../services/clerkToken";

export default function ClerkTokenBridge() {
  const { getToken } = useClerkAuth();

  useEffect(() => {
    setClerkTokenGetter(() => getToken({ skipCache: true }));

    return () => {
      setClerkTokenGetter(null);
    };
  }, [getToken]);

  return null;
}
