"use client";

import { createClient } from "@/utils/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";

type SupabaseContext = {
	supabase: ReturnType<typeof createClient>;
	session: Session | null;
};

const Context = createContext<SupabaseContext>({
	supabase: createClient(),
	session: null,
});

export default function SupabaseProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [supabase] = useState(() => createClient());
	const [session, setSession] = useState<Session | null>(null);

	useEffect(() => {
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
		});

		return () => subscription.unsubscribe();
	}, [supabase]);

	return (
		<Context.Provider value={{ supabase, session }}>
			{children}
		</Context.Provider>
	);
}

export const useSupabase = () => useContext(Context);
