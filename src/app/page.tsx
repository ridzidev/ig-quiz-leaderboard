import Papa from 'papaparse';

export const revalidate = 300;

export default async function Page() {
  const fetchTime = new Date().toLocaleString();
  try {
    const response = await fetch(
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vSIcNaWpIzqyCsYsv_Z1xIbubVQvFNiOqJ3r52YpHNAYoY4AFwwcebyEi48M-BrFOZr7hYYQ2igUA4T/pub?output=csv'
    );
    if (!response.ok) throw new Error('Failed to fetch CSV');
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
      id: String(row["username"] || ''),
      partisipasi: String(row["partisipasi"] || ''),
      score: Number(row["score"]) || 0,
      imageurl: String(row["imageurl"] || ''), // New image URL field
    }));

    // Sorting & Ranking Logic
    leaderboard.sort((a, b) =>
      a.score !== b.score ? b.score - a.score : a.id.localeCompare(b.id)
    );

    if (leaderboard.length > 0) {
      leaderboard[0].rank = 1;
      for (let i = 1; i < leaderboard.length; i++) {
        leaderboard[i].rank =
          leaderboard[i].score < leaderboard[i - 1].score ? i + 1 : leaderboard[i - 1].rank;
      }
    }

    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-purple-800 mb-4">ridzi.ma Instagram Quiz Leaderboard</h1>
        <p className="text-sm text-gray-600 mb-2">Last updated: {fetchTime}</p>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white divide-y divide-gray-200 shadow-lg rounded-lg overflow-hidden">
            <thead className="bg-purple-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">Score</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">Participation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leaderboard.map((item, index) => (
                <tr key={index} className={`hover:bg-purple-50 ${item.rank === 1 ? 'bg-yellow-200' : item.rank === 2 ? 'bg-gray-200' : item.rank === 3 ? 'bg-yellow-100' : ''}`}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                    {item.rank === 1 && <span className="text-yellow-500 mr-1">🥇</span>}
                    {item.rank === 2 && <span className="text-gray-400 mr-1">🥈</span>}
                    {item.rank === 3 && <span className="text-yellow-700 mr-1">🥉</span>}
                    {item.rank}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-300 flex items-center justify-center">
                        {item.imageurl ? (
                          <img src={item.imageurl} alt={item.id} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-purple-500 text-white flex items-center justify-center font-bold">
                            {item.id ? item.id.charAt(0).toUpperCase() : '?'}
                          </div>
                        )}
                      </div>
                      <span className="ml-2 text-sm text-gray-800">{item.id}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.score}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.partisipasi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching or processing leaderboard:', error);
    return <div>Error loading leaderboard</div>;
  }
}