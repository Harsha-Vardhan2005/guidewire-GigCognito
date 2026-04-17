import React, { useEffect, useState } from "react";
import { adminAPI } from "../utils/api";
import { WorkerRow } from "../types";
import { Users, ChevronLeft, ChevronRight } from "lucide-react";

export const WorkersTable: React.FC = () => {
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(50);

  const fetchWorkers = async (pageNum: number) => {
    try {
      const offset = (pageNum - 1) * pageSize;
      const res = await adminAPI.getWorkers(pageSize, offset);
      if (res.success && res.data) {
        setWorkers(res.data.items);
        setTotal(res.data.total);
      }
    } catch (error) {
      console.error("Error fetching workers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers(page);
  }, [page]);

  const getFraudBadge = (flag: string) => {
    if (flag === "CLEAN") return "badge-success";
    if (flag.includes("HIGH")) return "badge-danger";
    return "badge-warning";
  };

  const maxPages = Math.ceil(total / pageSize);

  return (
    <div className="glass p-6">
      <div className="section-header flex items-center gap-3 mb-4">
        <Users size={20} className="text-blue-400" />
        <span>Active Workers (Showing {workers.length} of {total})</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-400"></div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  <th className="table-cell text-left">Worker ID</th>
                  <th className="table-cell text-left">Zone</th>
                  <th className="table-cell text-center">Tier</th>
                  <th className="table-cell text-center">Claims (30d)</th>
                  <th className="table-cell text-center">Fraud Flag</th>
                  <th className="table-cell text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {workers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-cell text-center py-8 text-gray-400">
                      No workers found
                    </td>
                  </tr>
                ) : (
                  workers.map((worker) => (
                    <tr key={worker.workerId} className="table-row">
                      <td className="table-cell font-mono text-xs text-blue-300">
                        {worker.workerId.slice(0, 12)}...
                      </td>
                      <td className="table-cell">
                        <span className="badge badge-info text-xs">{worker.zone}</span>
                      </td>
                      <td className="table-cell text-center">
                        <span className="text-gray-300">{worker.tier}</span>
                      </td>
                      <td className="table-cell text-center">
                        <span className="font-semibold">{worker.claims}</span>
                      </td>
                      <td className="table-cell text-center">
                        <span className={`badge ${getFraudBadge(worker.fraudFlag)} text-xs`}>
                          {worker.fraudFlag}
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        <span className={`badge ${worker.status === "ACTIVE" ? "badge-success" : "badge-warning"} text-xs`}>
                          {worker.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
            <p className="text-xs text-gray-400">
              Page {page} of {maxPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="btn btn-secondary btn-sm flex items-center gap-2 disabled:opacity-50"
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(maxPages, page + 1))}
                disabled={page === maxPages}
                className="btn btn-secondary btn-sm flex items-center gap-2 disabled:opacity-50"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
