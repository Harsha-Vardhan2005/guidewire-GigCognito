import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { adminAPI } from "../utils/api";
import { LossRatioPoint } from "../types";
import { TrendingDown } from "lucide-react";

export const LossRatioChart: React.FC = () => {
  const [data, setData] = useState<LossRatioPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await adminAPI.getLossRatioTrend();
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (error) {
        console.error("Error fetching loss ratio:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-lg">
          <p className="text-gray-300 text-sm">{data.week}</p>
          <p className="text-blue-400 font-semibold">
            Ratio: {(data.loss_ratio * 100).toFixed(1)}%
          </p>
          <p className="text-gray-400 text-xs">Cap: {(data.cap * 100).toFixed(0)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass p-6">
      <div className="section-header flex items-center gap-3 mb-4">
        <TrendingDown size={20} className="text-blue-400" />
        <span>12-Week Loss Ratio Trend</span>
        <span className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded ml-auto">
          IRDAI 70% CAP
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-400"></div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="week" stroke="#94a3b8" style={{ fontSize: 12 }} />
            <YAxis
              yAxisId="left"
              stroke="#94a3b8"
              label={{ value: "Loss Ratio %", angle: -90, position: "insideLeft" }}
              style={{ fontSize: 12 }}
              domain={[0, 1]}
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: 20 }} />
            <Line
              type="monotone"
              dataKey="loss_ratio"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6", r: 4 }}
              activeDot={{ r: 6 }}
              name="Loss Ratio"
              yAxisId="left"
            />
            <Line
              type="monotone"
              dataKey="cap"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="IRDAI Cap"
              yAxisId="left"
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
        <p className="text-xs text-blue-300">
          📊 Loss ratio monitored weekly. If exceeds {(0.7 * 100)}%, new enrollments are suspended to maintain solvency.
        </p>
      </div>
    </div>
  );
};
