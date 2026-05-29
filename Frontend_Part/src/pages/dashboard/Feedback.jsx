import { useEffect, useMemo, useState } from "react";
import { MessageSquareQuote, Send, Star, Clock3 } from "lucide-react";
import { feedbackService } from "../../services/feedbackService";

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
      const data = await feedbackService.getMyFeedback();
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
      await feedbackService.submitFeedback({
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
    <div className="dashboard-page max-w-[1100px] space-y-6">
      <header className="border-b border-slate-100 pb-6 dark:border-slate-800">
        <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-700 dark:bg-slate-900">
          <MessageSquareQuote size={14} className="text-emerald-600" />
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Feedback</span>
        </div>
        <h1 className="dashboard-heading text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-4xl">
          Product Feedback
        </h1>
        <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-500 dark:text-slate-400">
          Share what is working and what should improve in your SQL workflow experience.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:p-6">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Satisfaction</p>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`rounded-md border p-2 transition-all ${
                    value <= rating
                      ? "border-amber-200 bg-amber-50 text-amber-500 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300"
                      : "border-slate-200 bg-white text-slate-300 hover:text-amber-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-600 dark:hover:text-amber-300"
                  }`}
                >
                  <Star size={18} fill={value <= rating ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Topic</label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-emerald-400/20"
            >
              {FEEDBACK_TOPICS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please share details. Minimum 10 characters."
              rows={6}
              className="w-full resize-y rounded-md border border-slate-200 bg-white p-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-emerald-400/20"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-xs text-slate-400 font-medium dark:text-slate-500">
              Rating: <span className="font-black text-slate-700 dark:text-slate-200">{rating}/5</span> | Topic:{" "}
              <span className="font-black text-slate-700 dark:text-slate-200">{topic}</span>
            </p>
            <button
              type="submit"
              disabled={!canSubmit}
              className="button-primary inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-[11px] font-extrabold uppercase tracking-[0.12em] disabled:cursor-not-allowed"
            >
              <Send size={14} />
              {submitting ? "Sending..." : "Submit"}
            </button>
          </div>

          {notice && (
            <div className="rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-[13px] font-semibold text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300">
              {notice}
            </div>
          )}
          {error && (
            <div className="rounded-md border border-rose-100 bg-rose-50 px-3 py-2.5 text-[13px] font-semibold text-rose-700 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-300">
              {error}
            </div>
          )}
        </form>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Your Feedback History</h2>
            <Clock3 size={16} className="text-slate-300" />
          </div>

          <div className="space-y-3 max-h-[520px] overflow-auto pr-1 custom-scrollbar">
            {loadingHistory ? (
              <FeedbackHistorySkeleton />
            ) : history.length === 0 ? (
              <p className="text-sm font-semibold text-slate-500">No feedback submitted yet.</p>
            ) : (
              history.map((item) => (
                <article key={item._id} className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{item.topic}</p>
                      <p className="text-xs font-semibold text-slate-400 mt-1">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700">
                      <Star size={11} fill="currentColor" />
                      {item.rating}/5
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-3 leading-relaxed dark:text-slate-300">{item.message}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] mt-3 text-emerald-700 dark:text-emerald-300">
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

function FeedbackHistorySkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map((id) => (
        <div key={id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="h-4 w-40 rounded-lg bg-slate-200" />
              <div className="h-3 w-28 rounded-lg bg-slate-200" />
            </div>
            <div className="h-5 w-14 rounded-full bg-slate-200" />
          </div>
          <div className="h-12 rounded-xl bg-slate-200" />
          <div className="mt-3 h-3 w-24 rounded-lg bg-slate-200" />
        </div>
      ))}
    </div>
  );
}
