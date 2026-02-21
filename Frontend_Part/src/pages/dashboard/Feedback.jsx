import { useEffect, useMemo, useState } from "react";
import { MessageSquareQuote, Send, Star, Clock3 } from "lucide-react";
import { apiRequest } from "../../services/api";

const FEEDBACK_TOPICS = ["Product UX", "SQL Generation", "Billing", "Performance", "Bug Report"];

export default function Feedback() {
  const [rating, setRating] = useState(5);
  const [topic, setTopic] = useState(FEEDBACK_TOPICS[0]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const canSubmit = useMemo(() => message.trim().length >= 10 && !submitting, [message, submitting]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await apiRequest("/feedback/mine", "GET");
      setHistory(data || []);
    } catch (err) {
      setError(err.message || "Failed to load feedback history");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setError("");
    setNotice("");

    try {
      setSubmitting(true);
      await apiRequest("/feedback", "POST", {
        rating,
        topic,
        message: message.trim()
      });

      setNotice("Thanks. Your feedback has been recorded.");
      setMessage("");
      setRating(5);
      setTopic(FEEDBACK_TOPICS[0]);
      await loadHistory();
    } catch (err) {
      setError(err.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-page max-w-[1100px] space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <header className="border-b border-slate-100 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 mb-4">
          <MessageSquareQuote size={14} className="text-emerald-600" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Feedback</span>
        </div>
        <h1 className="dashboard-heading text-4xl md:text-5xl font-black tracking-tighter text-slate-900 leading-none">
          Product <span className="text-emerald-500">Feedback</span>
        </h1>
        <p className="text-slate-500 font-medium text-lg mt-4 max-w-3xl">
          Share what is working and what should improve in your SQL workflow experience.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-[32px] p-6 md:p-8 shadow-sm space-y-6">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Satisfaction</p>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`p-2 rounded-xl border transition-all ${
                    value <= rating
                      ? "bg-amber-50 border-amber-200 text-amber-500"
                      : "bg-white border-slate-200 text-slate-300 hover:text-amber-400"
                  }`}
                >
                  <Star size={18} fill={value <= rating ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Topic</label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full h-12 px-4 rounded-2xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-100"
            >
              {FEEDBACK_TOPICS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please share details. Minimum 10 characters."
              rows={6}
              className="w-full p-4 rounded-2xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-100 resize-y"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-xs text-slate-400 font-medium">
              Rating: <span className="font-black text-slate-700">{rating}/5</span> | Topic:{" "}
              <span className="font-black text-slate-700">{topic}</span>
            </p>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-2xl bg-slate-950 text-white text-xs font-black uppercase tracking-[0.2em] disabled:bg-slate-200 disabled:text-slate-500 transition-all"
            >
              <Send size={14} />
              {submitting ? "Sending..." : "Submit"}
            </button>
          </div>

          {notice && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {notice}
            </div>
          )}
          {error && (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {error}
            </div>
          )}
        </form>

        <section className="bg-white border border-slate-200 rounded-[32px] p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Your Feedback History</h2>
            <Clock3 size={16} className="text-slate-300" />
          </div>

          <div className="space-y-3 max-h-[520px] overflow-auto pr-1 custom-scrollbar">
            {loadingHistory ? (
              <p className="text-sm font-semibold text-slate-500">Loading feedback history...</p>
            ) : history.length === 0 ? (
              <p className="text-sm font-semibold text-slate-500">No feedback submitted yet.</p>
            ) : (
              history.map((item) => (
                <article key={item._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-800">{item.topic}</p>
                      <p className="text-xs font-semibold text-slate-400 mt-1">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700">
                      <Star size={11} fill="currentColor" />
                      {item.rating}/5
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-3 leading-relaxed">{item.message}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] mt-3 text-emerald-700">
                    Status: {item.status || "new"}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
