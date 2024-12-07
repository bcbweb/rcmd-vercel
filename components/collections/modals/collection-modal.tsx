"use client";

import { useState, useEffect } from 'react';
import { useModalStore } from '@/stores/modal-store';
import { useCollectionStore } from '@/stores/collection-store';
import { useRCMDStore } from '@/stores/rcmd-store';
import { Spinner } from '@/components/ui/spinner';
import { Search } from 'lucide-react';
import type { RCMDVisibility } from '@/types';

export default function CollectionModal() {
  const {
    isCollectionModalOpen,
    setIsCollectionModalOpen,
    onModalSuccess
  } = useModalStore();
  const { insertCollection, isLoading } = useCollectionStore();
  const { rcmds, fetchRCMDs } = useRCMDStore();

  // Collection metadata
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<RCMDVisibility>('private');

  // Search and selection states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRCMDs, setSelectedRCMDs] = useState<string[]>([]);

  // Form validation
  const isFormValid = name.trim() !== '' &&
    description.trim() !== '' &&
    selectedRCMDs.length > 0;

  useEffect(() => {
    if (isCollectionModalOpen) {
      fetchRCMDs();
    }
  }, [isCollectionModalOpen, fetchRCMDs]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setVisibility('private');
    setSelectedRCMDs([]);
    setSearchQuery('');
  };

  const handleClose = () => {
    setIsCollectionModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !isFormValid) return;

    try {
      await insertCollection({
        name,
        description,
        visibility,
        linkIds: [],
        rcmdIds: selectedRCMDs
      });

      onModalSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Failed to create collection:', error);
    }
  };

  const filteredRCMDs = rcmds.filter(rcmd =>
    rcmd.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (rcmd.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

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
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                required
                minLength={1}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                rows={3}
                required
                minLength={1}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Visibility <span className="text-red-500">*</span>
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as RCMDVisibility)}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                required
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </div>
          </div>

          {/* RCMD Selection Section */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">
                Select RCMDs <span className="text-red-500">*</span>
              </h3>
              <span className={`text-sm ${selectedRCMDs.length === 0 ? 'text-red-500' : 'text-gray-500'}`}>
                Selected: {selectedRCMDs.length}
              </span>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search RCMDs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div className="max-h-64 overflow-y-auto border rounded-md">
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
            </div>
            {selectedRCMDs.length === 0 && (
              <p className="text-red-500 text-sm mt-2">Please select at least one RCMD</p>
            )}
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
              disabled={isLoading || !isFormValid}
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