import Papa from "papaparse";
import Image from "next/image"; // Import the Image component

export const revalidate = 300;

export default async function Page() {
  const fetchTime = new Date().toLocaleString();
  try {
    const response = await fetch(
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vSIcNaWpIzqyCsYsv_Z1xIbubVQvFNiOqJ3r52YpHNAYoY4AFwwcebyEi48M-BrFOZr7hYYQ2igUA4T/pub?output=csv"
    );
    if (!response.ok) throw new Error("Failed to fetch CSV");
    const csvText = await response.text();

    interface LeaderboardEntry {
      id: string;
      partisipasi: string;
      score: number;
      rank?: number;
      imageurl?: string; // New field for the image URL
    }

    // Parse the CSV
    const parsed = Papa.parse<Record<string, unknown>>(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });

    // Ensure that data is an array of LeaderboardEntry
    const leaderboard: LeaderboardEntry[] = parsed.data.map((row) => ({
      id: String(row["username"] || ""),
      partisipasi: String(row["partisipasi"] || ""),
      score: Number(row["score"]) || 0,
      imageurl: String(row["imageurl"] || ""), // New image URL field
    }));

    // Calculate total quizzes and participants
    const headerCount = parsed.meta?.fields ? parsed.meta.fields.length : 0; // Safe navigation operator
    const totalQuizzes = headerCount > 5 ? headerCount - 5 : 0;
    const totalParticipants = leaderboard.length;

    // Sorting & Ranking Logic
    leaderboard.sort((a, b) =>
      a.score !== b.score ? b.score - a.score : a.id.localeCompare(b.id)
    );

    if (leaderboard.length > 0) {
      leaderboard[0].rank = 1;
      for (let i = 1; i < leaderboard.length; i++) {
        leaderboard[i].rank =
          leaderboard[i].score < leaderboard[i - 1].score
            ? i + 1
            : leaderboard[i - 1].rank;
      }
    }

    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-purple-800 mb-4">
          ridzi.ma Instagram Quiz Leaderboard
        </h1>
        <p className="text-sm text-gray-600 mb-2">Last updated: {fetchTime}</p>

        {/* Creative Box to show total quizzes and participants */}
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
          <div className="grid grid-cols-2 gap-6">
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
          </div>
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
                    {item.rank === 1 && (
                      <span className="text-yellow-500 mr-1">🥇</span>
                    )}
                    {item.rank === 2 && (
                      <span className="text-gray-400 mr-1">🥈</span>
                    )}
                    {item.rank === 3 && (
                      <span className="text-yellow-700 mr-1">🥉</span>
                    )}
                    {item.rank}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-300 flex items-center justify-center">
                        {item.imageurl ? (
                          <Image
                            src={item.imageurl}
                            alt={item.id}
                            width={40} // Adjust width and height as needed
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching or processing leaderboard:", error);
    return <div>Error loading leaderboard</div>;
  }
}
