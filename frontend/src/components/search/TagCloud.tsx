import { useQuery } from '@tanstack/react-query';
import { getTagStats } from '../../services/tag';
import { useNavigate } from 'react-router-dom';

export default function TagCloud() {
  const navigate = useNavigate();
  const { data: tagStats = [], isLoading } = useQuery({
    queryKey: ['tag-stats'],
    queryFn: getTagStats,
    staleTime: 5 * 60 * 1000
  });

  if (isLoading) return <div className="text-sm text-gray-500 dark:text-gray-400">Loading tags...</div>;
  if (!tagStats.length) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {tagStats.map(({ tag, count }) => (
        <button
          key={tag}
          type="button"
          onClick={() => navigate(`/inventories?tag=${encodeURIComponent(tag)}`)}
          style={{ fontSize: `${Math.min(count * 4 + 12, 32)}px` }}
          className="text-blue-700 dark:text-blue-300 hover:underline"
          title={`${count} inventories`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}