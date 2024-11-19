import { Database } from './supabase';
import { RCMD, Business } from './index';

export type ProfileBlock = Database['public']['Tables']['profile_blocks']['Row'] & {
  rcmd?: RCMD;
  business?: Business;
  content?: {
    type: 'text' | 'image' | 'video' | 'social';
    data: any;
  };
};