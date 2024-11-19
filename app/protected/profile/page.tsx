'use client';

import { type ProfileBlock } from '@/types';
import { useCallback, useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ProfileBlocks from '@/components/profile/ProfileBlocks';
import AddBlockButton from '@/components/profile/AddBlockButton';
import ShareButton from '@/components/profile/ShareButton';
import { useSupabase } from '@/components/providers/supabase-provider';

export default function EditProfilePage() {
  const { supabase, session } = useSupabase();
  const [blocks, setBlocks] = useState<ProfileBlock[]>([]);
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    async function getProfile() {
      if (session?.user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', session.user.id)
          .single();

        if (data?.username) {
          setUsername(data.username);
        }
      }
    }

    getProfile();
  }, [session, supabase]);

  const moveBlock = useCallback(async (dragIndex: number, hoverIndex: number) => {
    // Update block order in UI
    setBlocks(prevBlocks => {
      const newBlocks = [...prevBlocks];
      const [removed] = newBlocks.splice(dragIndex, 1);
      newBlocks.splice(hoverIndex, 0, removed);
      return newBlocks;
    });

    // Update order in database
    await supabase
      .from('profile_blocks')
      .update({ order: hoverIndex })
      .eq('id', blocks[dragIndex].id);
  }, [blocks]);

  const shareUrl = username ? `${window.location.origin}/${username}` : '';

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Edit Profile</h1>
          <div className="flex gap-4">
            <ShareButton url={shareUrl} />
            <AddBlockButton onAdd={(block) => setBlocks(prev => [...prev, block])} />
          </div>
        </div>

        <ProfileBlocks
          blocks={blocks}
          isEditing={true}
          onMove={moveBlock}
          onDelete={(id) => setBlocks(prev => prev.filter(b => b.id !== id))}
        />
      </div>
    </DndProvider>
  );
}