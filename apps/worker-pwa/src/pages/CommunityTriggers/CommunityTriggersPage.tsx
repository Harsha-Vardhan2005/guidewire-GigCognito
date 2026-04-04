import React, { useEffect, useState } from "react";

interface Proposal {
  id: string;
  title: string;
  description: string;
  votes: number;
  status: string;
  createdAt: string;
}

const CommunityTriggersPage: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const authHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("gs_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    fetch("/api/community-triggers/list", {
      headers: {
        ...authHeaders(),
      },
    })
      .then(res => res.json())
      .then(setProposals);
  }, []);

  const handlePropose = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/community-triggers/propose", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ title, description })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Proposal submitted!");
        setProposals(p => [...p, data]);
        setTitle("");
        setDescription("");
      } else {
        setError(data.error || data.message || "Failed to propose");
      }
    } catch (err) {
      setError("Network error");
    }
    setLoading(false);
  };

  const handleVote = async (id: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/community-triggers/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ proposalId: id })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Voted!");
        setProposals(p => p.map(pr => pr.id === id ? data : pr));
      } else {
        setError(data.error || data.message || "Failed to vote");
      }
    } catch (err) {
      setError("Network error");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8 px-4">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">🗳️</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-blue-800 tracking-tight">Community Voting</h2>
        </div>
        <div className="mb-8 bg-white/90 p-6 rounded-2xl shadow-lg border border-blue-100 animate-fade-in">
          <h3 className="text-lg font-semibold text-blue-700 mb-2 flex items-center gap-2"><span>Propose a New Trigger</span> <span className="text-xl">💡</span></h3>
          <form onSubmit={handlePropose} className="flex flex-col gap-3">
            <input
              className="border border-blue-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50"
              placeholder="Trigger Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
            <textarea
              className="border border-blue-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50"
              placeholder="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              rows={3}
            />
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold transition" disabled={loading}>
              {loading ? "Submitting..." : "Propose Trigger"}
            </button>
          </form>
          {error && <div className="text-red-600 mt-2 text-center">{error}</div>}
          {success && <div className="text-green-600 mt-2 text-center">{success}</div>}
        </div>
        <h3 className="text-xl font-bold mb-4 text-blue-900 flex items-center gap-2"><span>Current Proposals</span> <span className="text-lg">📋</span></h3>
        <ul className="space-y-4">
          {proposals.length === 0 && <li className="text-blue-500 text-center">No proposals yet. Be the first!</li>}
          {proposals.map(p => (
            <li key={p.id} className="p-4 bg-white/80 border border-blue-100 rounded-2xl shadow flex flex-col gap-1 animate-fade-in">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-blue-700 text-xl">🔔</span>
                <span className="font-bold text-blue-900 text-lg">{p.title}</span>
              </div>
              <div className="text-sm text-blue-700 mb-1">{p.description}</div>
              <div className="flex items-center gap-4 text-xs text-blue-500 mb-2">
                <span>Votes: <b>{p.votes}</b></span>
                <span>Status: {p.status}</span>
                <span className="text-gray-400">{new Date(p.createdAt).toLocaleString()}</span>
              </div>
              <button
                className="self-start bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded font-medium transition"
                onClick={() => handleVote(p.id)}
                disabled={loading}
              >
                👍 Vote
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CommunityTriggersPage;
