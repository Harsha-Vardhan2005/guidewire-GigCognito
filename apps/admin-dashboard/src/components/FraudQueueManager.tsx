import React, { useEffect, useState } from "react";
import { adminAPI } from "../utils/api";
import { FraudQueue, FraudClaim } from "../types";
import { AlertTriangle, Check, X } from "lucide-react";
import toast from "react-hot-toast";

export const FraudQueueManager: React.FC = () => {
  const [queue, setQueue] = useState<FraudQueue | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      const res = await adminAPI.getFraudQueue(15, 0);
      if (res.success && res.data) {
        setQueue(res.data);
      }
    } catch (error) {
      console.error("Error fetching fraud queue:", error);
      toast.error("Failed to load fraud queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (claim: FraudClaim) => {
    setProcessing(claim.id);
    try {
      const res = await adminAPI.updateFraudClaim(claim.id, "APPROVE");
      if (res.success) {
        toast.success("Claim approved & payout initiated!");
        await fetchQueue();
      } else {
        toast.error(res.error || "Failed to approve claim");
      }
    } catch (error) {
      console.error("Error approving claim:", error);
      toast.error("Error approving claim");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (claim: FraudClaim) => {
    setProcessing(claim.id);
    try {
      const res = await adminAPI.updateFraudClaim(claim.id, "REJECT");
      if (res.success) {
        toast.success("Claim rejected");
        await fetchQueue();
      } else {
        toast.error(res.error || "Failed to reject claim");
      }
    } catch (error) {
      console.error("Error rejecting claim:", error);
      toast.error("Error rejecting claim");
    } finally {
      setProcessing(null);
    }
  };

  const getRiskColor = (score: number) => {
    if (score > 0.85) return "text-red-400";
    if (score > 0.65) return "text-orange-400";
    return "text-yellow-400";
  };

  return (
    <div className="glass p-6">
      <div className="section-header flex items-center gap-3 mb-4">
        <AlertTriangle size={20} className="text-red-400" />
        <span>
          Fraud Queue — {queue?.total || 0} Pending
        </span>
        <span className="text-xs bg-red-900/30 text-red-300 px-2 py-1 rounded ml-auto">
          {queue?.total || 0} Pending • 1hr SLA
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-red-400"></div>
        </div>
      ) : !queue || queue.items.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No pending fraud reviews</p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {queue.items.map((claim) => (
            <div
              key={claim.id}
              className="p-4 bg-red-900/10 border border-red-700/30 rounded-lg hover:border-red-600/50 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-100">{claim.workerName}</h4>
                    <span className="badge badge-info text-xs">{claim.zone}</span>
                    <span className={`text-sm font-bold ${getRiskColor(parseFloat(claim.fraudScore))}`}>
                      Risk: {claim.fraudScore}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    Claim: ₹{claim.claimAmount} • {claim.triggerType}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {claim.flags.map((flag) => (
                      <span key={flag} className="badge badge-warning text-xs">
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(claim)}
                  disabled={processing === claim.id}
                  className="btn btn-success btn-sm flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Check size={16} />
                  Approve
                </button>
                <button
                  onClick={() => handleReject(claim)}
                  disabled={processing === claim.id}
                  className="btn btn-danger btn-sm flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <X size={16} />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
