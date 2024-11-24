"use client";

import { useState, useEffect } from 'react';
import LinkBlock from './link-block';
import type { Link } from '@/types';

interface Props {
  initialLinks?: Link[];
  onDelete?: (id: string) => Promise<void>;
}

type SortOption = 'created_at' | 'view_count' | 'click_count';

export default function LinkBlocks({
  initialLinks = [],
  onDelete
}: Props) {
  const [links, setLinks] = useState<Link[]>(initialLinks);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('created_at');

  useEffect(() => {
    setLinks(initialLinks);
  }, [initialLinks]);

  const filteredAndSortedLinks = [...links]
    .filter((link) =>
      link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (link.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'created_at') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return (b[sortBy] ?? 0) - (a[sortBy] ?? 0);
    });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search links..."
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
        />
        <select
          title="Sort"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="ml-4 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
        >
          <option value="created_at">Newest</option>
          <option value="view_count">Most Viewed</option>
          <option value="click_count">Most Clicked</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredAndSortedLinks.map((link) => (
          <LinkBlock
            key={link.id}
            link={link}
            onDelete={onDelete}
          />
        ))}
      </div>

      {filteredAndSortedLinks.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No links found
        </div>
      )}
    </div>
  );
}