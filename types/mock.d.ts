import { Profile, RCMD } from '@/types';

declare module '@/data/mock/profiles.json' {
  const value: Profile[];
  export default value;
}

declare module '@/data/mock/rcmds.json' {
  const value: RCMD[];
  export default value;
}