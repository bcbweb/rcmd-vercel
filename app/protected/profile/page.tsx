import { redirect } from 'next/navigation';

export default function ExplorePage() {
  redirect('/protected/profile/rcmds');
}