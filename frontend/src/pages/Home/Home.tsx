import styles from './Home.module.css';
import {
	CreateDataSection,
	GetDataSection,
	SwitchModeSection,
	DataBaseRangeSection,
	DataBasePaginationSection,
} from './module';
import { useModeStore } from '@/store';

export function Home() {
	const { mode } = useModeStore();

	return (
		<div className={styles.home_page}>
			<CreateDataSection className={styles.create_block} />
			{mode == 'pagination' ? (
				<DataBasePaginationSection className={styles.table_block} />
			) : (
				<DataBaseRangeSection className={styles.table_block} />
			)}

			<GetDataSection className={styles.get_block} />
			<SwitchModeSection className={styles.switch_mode} />
		</div>
	);
}
