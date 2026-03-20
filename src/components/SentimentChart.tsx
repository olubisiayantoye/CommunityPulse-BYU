interface Stats {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
}

export default function SentimentChart({ stats }: { stats: Stats }) {
  const getPercentage = (value: number) => {
    return stats.total > 0 ? Math.round((value / stats.total) * 100) : 0;
  };

  const positivePercent = getPercentage(stats.positive);
  const neutralPercent = getPercentage(stats.neutral);
  const negativePercent = getPercentage(stats.negative);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Sentiment Analysis</h3>

      <div className="flex items-end justify-center gap-4 h-48 mb-6">
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="w-full flex items-end justify-center h-full">
            <div
              className="bg-green-500 w-full rounded-t-lg transition-all duration-500 flex items-end justify-center pb-2"
              style={{ height: `${Math.max(positivePercent, 5)}%` }}
            >
              <span className="text-white font-bold text-sm">{positivePercent}%</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{stats.positive}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Positive</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="w-full flex items-end justify-center h-full">
            <div
              className="bg-gray-500 w-full rounded-t-lg transition-all duration-500 flex items-end justify-center pb-2"
              style={{ height: `${Math.max(neutralPercent, 5)}%` }}
            >
              <span className="text-white font-bold text-sm">{neutralPercent}%</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{stats.neutral}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Neutral</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="w-full flex items-end justify-center h-full">
            <div
              className="bg-red-500 w-full rounded-t-lg transition-all duration-500 flex items-end justify-center pb-2"
              style={{ height: `${Math.max(negativePercent, 5)}%` }}
            >
              <span className="text-white font-bold text-sm">{negativePercent}%</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{stats.negative}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Negative</p>
          </div>
        </div>
      </div>

      {stats.negative > stats.positive && stats.negative > stats.total * 0.3 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-300 font-medium">
            Alert: High negative sentiment detected ({negativePercent}%)
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            Consider reviewing recent feedback and addressing community concerns
          </p>
        </div>
      )}
    </div>
  );
}
