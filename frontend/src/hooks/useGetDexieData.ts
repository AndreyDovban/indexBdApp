import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';

export function useGetAdvancedData() {
	const [data, setData] = useState();
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<Error | null>(null);

	const request = async () => {
		try {
			setLoading(true);
			setError(null);

			// const objects = useLiveQuery(() => db.objects.toArray());
		} catch (error) {
			if (error instanceof Error && error.name !== 'AbortError') {
				setError(error);
			}
		} finally {
			setLoading(false);
		}
	};

	return { data, loading, error, request };
}
