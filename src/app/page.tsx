"use client";

import Papa from "papaparse";
import Image from "next/image";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ScriptableContext,
  FontSpec,
  Scriptable,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useState, useEffect } from "react";

// Register Chart.js components globally
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// remove revalidate
// export const revalidate = 300;

// Define the LeaderboardEntry interface
interface LeaderboardEntry {
  id: string;
  partisipasi: string;
  score: number;
  rank?: number;
  imageurl?: string;
  scoreParticipationRatio?: number;
}

// Define the ChartData type
interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    hoverBackgroundColor: string;
    hoverBorderColor: string;
    data: number[];
  }[];
}

// Define the ChartOptions type more precisely
const chartOptions: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: "Score",
        font: {
          weight: "bold",
        },
      },
    },
    x: {
      title: {
        display: true,
        text: "Participant",
        font: {
          weight: "bold",
        },
      },
    },
  },
  plugins: {
    title: {
      display: true,
      text: "Top 5 Participants",
      font: {
        size: 16,
        weight: "bold",
      },
    },
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          // Specify the type for 'context'
          let label = context.dataset.label || "";

          if (label) {
            label += ": ";
          }
          if (context.parsed.y !== null) {
            label += new Intl.NumberFormat("en-US", {
              style: "decimal",
            }).format(context.parsed.y);
          }
          return label;
        },
      },
    },
  },
};

// Define a type for the label callback context.
interface TooltipLabelContext {
  dataset: {
    label?: string;
  };
  parsed: {
    y: number | null;
  };
}

const Page = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [totalQuizzes, setTotalQuizzes] = useState<number>(0);
  const [totalParticipants, setTotalParticipants] = useState<number>(0);
  const [meanScore, setMeanScore] = useState<number>(0);
  const [standardDeviation, setStandardDeviation] = useState<number>(0);
  const [medianScore, setMedianScore] = useState<number>(0);
  const [highestScore, setHighestScore] = useState<number>(0);
  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    datasets: [
      {
        label: "Score",
        backgroundColor: "rgba(153, 102, 255, 0.5)",
        borderColor: "rgba(153, 102, 255, 1)",
        borderWidth: 1,
        hoverBackgroundColor: "rgba(153, 102, 255, 0.8)",
        hoverBorderColor: "rgba(153, 102, 255, 1)",
        data: [],
      },
    ],
  });
  const [fetchTime, setFetchTime] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      const fetchTimeValue = new Date().toLocaleString();
      setFetchTime(fetchTimeValue);
      try {
        const response = await fetch(
          "https://docs.google.com/spreadsheets/d/e/2PACX-1vSIcNaWpIzqyCsYsv_Z1xIbubVQvFNiOqJ3r52YpHNAYoY4AFwwcebyEi48M-BrFOZr7hYYQ2igUA4T/pub?output=csv"
        );
        if (!response.ok) throw new Error("Failed to fetch CSV");
        const csvText = await response.text();

        const parsed = Papa.parse<Record<string, unknown>>(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
        });

        const parsedLeaderboard: LeaderboardEntry[] = parsed.data.map(
          (row) => ({
            id: String(row["username"] || ""),
            partisipasi: String(row["partisipasi"] || ""),
            score: Number(row["score"]) || 0,
            imageurl: String(row["imageurl"] || ""),
          })
        );

        const headerCount = parsed.meta?.fields ? parsed.meta.fields.length : 0;
        const quizzes = headerCount > 5 ? headerCount - 5 : 0;
        const participants = parsedLeaderboard.length;

        parsedLeaderboard.sort((a, b) =>
          a.score !== b.score ? b.score - a.score : a.id.localeCompare(b.id)
        );

        if (parsedLeaderboard.length > 0) {
          parsedLeaderboard[0].rank = 1;
          for (let i = 1; i < parsedLeaderboard.length; i++) {
            parsedLeaderboard[i].rank =
              parsedLeaderboard[i].score < parsedLeaderboard[i - 1].score
                ? i + 1
                : parsedLeaderboard[i - 1].rank;
          }
        }

        parsedLeaderboard.forEach((item) => {
          const participation = parseFloat(item.partisipasi);
          item.scoreParticipationRatio =
            participation > 0 ? (item.score / participation) * 100 : 0;
        });

        const scores = parsedLeaderboard.map((item) => item.score);
        const calculatedMeanScore =
          scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const calculatedStandardDeviation = Math.sqrt(
          scores.reduce(
            (sum, score) => sum + Math.pow(score - calculatedMeanScore, 2),
            0
          ) / scores.length
        );

        const sortedScores = [...scores].sort((a, b) => a - b);
        const middle = Math.floor(sortedScores.length / 2);
        const calculatedMedianScore =
          sortedScores.length % 2 === 0
            ? (sortedScores[middle - 1] + sortedScores[middle]) / 2
            : sortedScores[middle];

        const calculatedHighestScore = Math.max(...scores);

        const top5Participants = parsedLeaderboard.slice(0, 5);
        const calculatedChartData: ChartData = {
          labels: top5Participants.map((item) => item.id),
          datasets: [
            {
              label: "Score",
              backgroundColor: "rgba(153, 102, 255, 0.5)",
              borderColor: "rgba(153, 102, 255, 1)",
              borderWidth: 1,
              hoverBackgroundColor: "rgba(153, 102, 255, 0.8)",
              hoverBorderColor: "rgba(153, 102, 255, 1)",
              data: top5Participants.map((item) => item.score),
            },
          ],
        };
        setLeaderboard(parsedLeaderboard);
        setTotalQuizzes(quizzes);
        setTotalParticipants(participants);
        setMeanScore(calculatedMeanScore);
        setStandardDeviation(calculatedStandardDeviation);
        setMedianScore(calculatedMedianScore);
        setHighestScore(calculatedHighestScore);
        setChartData(calculatedChartData);
      } catch (error) {
        console.error("Error fetching or processing leaderboard:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-purple-800 mb-4">
        ridzi.ma Instagram Quiz Leaderboard
      </h1>
      <p className="text-sm text-gray-600 mb-2">Last updated: {fetchTime}</p>

      <div className="bg-gradient-to-r from-blue-500 to-teal-400 p-6 rounded-lg shadow-lg mb-4 text-white">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <svg
            className="w-6 h-6 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            ></path>
          </svg>
          Quiz Statistics
        </h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-black bg-opacity-10 p-4 rounded-lg flex items-center">
            <svg
              className="w-6 h-6 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              ></path>
            </svg>
            <div>
              <p className="text-sm font-semibold">Total Quizzes</p>
              <p className="text-3xl font-bold">{totalQuizzes}</p>
            </div>
          </div>
          <div className="bg-black bg-opacity-10 p-4 rounded-lg flex items-center">
            <svg
              className="w-6 h-6 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              ></path>
            </svg>
            <div>
              <p className="text-sm font-semibold">Total Participants</p>
              <p className="text-3xl font-bold">{totalParticipants}</p>
            </div>
          </div>
          <div className="bg-black bg-opacity-10 p-4 rounded-lg flex items-center">
            <svg
              className="w-6 h-6 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              ></path>
            </svg>
            <div>
              <p className="text-sm font-semibold">Mean Score</p>
              <p className="text-3xl font-bold">{meanScore.toFixed(2)}</p>
            </div>
          </div>
          <div className="bg-black bg-opacity-10 p-4 rounded-lg flex items-center">
            <svg
              className="w-6 h-6 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              ></path>
            </svg>
            <div>
              <p className="text-sm font-semibold">Standard Deviation</p>
              <p className="text-3xl font-bold">
                {standardDeviation.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="bg-black bg-opacity-10 p-4 rounded-lg flex items-center">
            <svg
              className="w-6 h-6 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 13h6M3 17V7a2 2 0 002-2h14a2 2 0 002 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              ></path>
            </svg>
            <div>
              <p className="text-sm font-semibold">Median Score</p>
              <p className="text-3xl font-bold">{medianScore.toFixed(2)}</p>
            </div>
          </div>
          <div className="bg-black bg-opacity-10 p-4 rounded-lg flex items-center">
            <svg
              className="w-6 h-6 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 3v4M3 5h4M6 17v-3.322A1.429 1.429 0 114.578 12h5.714c.632 0 1.188.435 1.374 1.015a1.428 1.428 0 010 2.357v3M9 11V3m3 9v5m3-13v5m-3 9H5.422a1.429 1.429 0 01-1.374-1.015c-.196-.58-.555-1.015-1.374-1.015H3m15 11v-3.322a1.429 1.429 0 10-2.858 0V22m-.63-5.322a1.43 1.43 0 01-.63-1.095c0-.632.266-1.169.63-1.387"
              ></path>
            </svg>
            <div>
              <p className="text-sm font-semibold">Highest Score</p>
              <p className="text-3xl font-bold">{highestScore}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div
        className="mb-4 bg-white shadow-lg rounded-lg p-4"
        style={{ minHeight: "300px", height: "30vh" }}
      >
        <h2 className="text-xl font-bold text-purple-800">
          Top 5 Participants
        </h2>
        <Bar data={chartData} options={chartOptions} />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white divide-y divide-gray-200 shadow-lg rounded-lg overflow-hidden">
          <thead className="bg-purple-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">
                Score
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">
                Participation
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">
                Score/Participation %
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {leaderboard.map((item, index) => (
              <tr
                key={index}
                className={`hover:bg-purple-50 ${
                  item.rank === 1
                    ? "bg-yellow-200"
                    : item.rank === 2
                    ? "bg-gray-200"
                    : item.rank === 3
                    ? "bg-yellow-100"
                    : ""
                }`}
              >
                <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                  {item.rank}
                  {item.rank === 1 && (
                    <span className="text-yellow-500 ml-1">🥇</span>
                  )}
                  {item.rank === 2 && (
                    <span className="text-gray-400 ml-1">🥈</span>
                  )}
                  {item.rank === 3 && (
                    <span className="text-yellow-700 ml-1">🥉</span>
                  )}
                  {item.score > meanScore && <span className="ml-1">🔥</span>}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-300 flex items-center justify-center">
                      {item.imageurl ? (
                        <Image
                          src={item.imageurl}
                          alt={item.id}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-purple-500 text-white flex items-center justify-center font-bold">
                          {item.id ? item.id.charAt(0).toUpperCase() : "?"}
                        </div>
                      )}
                    </div>
                    <span className="ml-2 text-sm text-gray-800">
                      {item.id}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {item.score}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {item.partisipasi}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span
                    className={`font-semibold ${
                      item.scoreParticipationRatio! > 80
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {item.scoreParticipationRatio?.toFixed(2)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Page;
