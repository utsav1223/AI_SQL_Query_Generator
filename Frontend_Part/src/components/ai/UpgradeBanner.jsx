import { useNavigate } from "react-router-dom";

export default function UpgradeBanner() {
  const navigate = useNavigate();

  return (
    <div className="p-8 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
      <h2 className="text-2xl font-bold mb-3">
        Upgrade to Pro
      </h2>

      <p className="text-gray-700 mb-6">
        This feature is available in the Pro plan.
        Unlock SQL optimization, validation, formatting, and explanation tools.
      </p>

      <button
        onClick={() => navigate("/dashboard/settings")}
        className="px-6 py-3 bg-black text-white rounded-lg hover:opacity-90 transition"
      >
        Upgrade Now
      </button>
    </div>
  );
}
