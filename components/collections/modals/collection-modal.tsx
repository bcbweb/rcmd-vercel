"use client";

import { useState, useEffect } from 'react';
import { useModalStore } from '@/stores/modal-store';
import { useCollectionStore } from '@/stores/collection-store';
import { useLinkStore } from '@/stores/link-store';
import { useRCMDStore } from '@/stores/rcmd-store';
import { Spinner } from '@/components/ui/spinner';
import { Search } from 'lucide-react';

export default function CollectionModal() {
  const {
    isCollectionModalOpen,
    setIsCollectionModalOpen,
    onModalSuccess
  } = useModalStore();
  const { insertCollection, isLoading } = useCollectionStore();
  const { links, fetchLinks } = useLinkStore();
  const { rcmds, fetchRCMDs } = useRCMDStore();

  // Collection metadata
  const [name, setName] = useState('');  // Changed from title
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');

  // Search and selection states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLinks, setSelectedLinks] = useState<string[]>([]);
  const [selectedRCMDs, setSelectedRCMDs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'links' | 'rcmds'>('links');

  useEffect(() => {
    if (isCollectionModalOpen) {
      fetchLinks();
      fetchRCMDs();
    }
  }, [isCollectionModalOpen, fetchLinks, fetchRCMDs]);

  const handleClose = () => {
    setIsCollectionModalOpen(false);
    // Reset form
    setName('');  // Changed from setTitle
    setDescription('');
    setVisibility('private');
    setSelectedLinks([]);
    setSelectedRCMDs([]);
    setSearchQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const collection = await insertCollection(
      name,
      description,
      visibility,
      selectedLinks,
      selectedRCMDs
    );

    if (collection) {
      onModalSuccess?.();
      handleClose();
    }
  };

  const filteredLinks = links.filter(link =>
    link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (link.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const filteredRCMDs = rcmds.filter(rcmd =>
    rcmd.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (rcmd.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const toggleLink = (linkId: string) => {
    setSelectedLinks(prev =>
      prev.includes(linkId)
        ? prev.filter(id => id !== linkId)
        : [...prev, linkId]
    );
  };

  const toggleRCMD = (rcmdId: string) => {
    setSelectedRCMDs(prev =>
      prev.includes(rcmdId)
        ? prev.filter(id => id !== rcmdId)
        : [...prev, rcmdId]
    );
  };

  if (!isCollectionModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">New Collection</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Collection Metadata Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as 'private' | 'public')}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </div>
          </div>

          {/* Content Selection Section */}
          <div className="border-t pt-4">
            <div className="flex items-center mb-4 space-x-2">
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('links')}
                  className={`px-4 py-2 rounded ${activeTab === 'links'
                    ? 'bg-white dark:bg-gray-600 shadow'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-500'
                    }`}
                >
                  Links ({selectedLinks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('rcmds')}
                  className={`px-4 py-2 rounded ${activeTab === 'rcmds'
                    ? 'bg-white dark:bg-gray-600 shadow'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-500'
                    }`}
                >
                  RCMDs ({selectedRCMDs.length})
                </button>
              </div>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div className="max-h-64 overflow-y-auto border rounded-md">
              {activeTab === 'links' ? (
                <div className="space-y-2 p-2">
                  {filteredLinks.map(link => (
                    <label
                      key={link.id}
                      className="flex items-center space-x-2 p-2 hover:bg-gray-50 
                        dark:hover:bg-gray-700 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedLinks.includes(link.id)}
                        onChange={() => toggleLink(link.id)}
                        className="rounded border-gray-300"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{link.title}</div>
                        <div className="text-sm text-gray-500 truncate">
                          {link.url}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 p-2">
                  {filteredRCMDs.map(rcmd => (
                    <label
                      key={rcmd.id}
                      className="flex items-center space-x-2 p-2 hover:bg-gray-50 
                        dark:hover:bg-gray-700 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRCMDs.includes(rcmd.id)}
                        onChange={() => toggleRCMD(rcmd.id)}
                        className="rounded border-gray-300"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{rcmd.title}</div>
                        <div className="text-sm text-gray-500 truncate">
                          {rcmd.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 
                dark:hover:text-gray-300"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 
                disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Spinner className="h-4 w-4" />
                  <span>Creating...</span>
                </>
              ) : (
                'Create Collection'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}