import styles from './Home.module.css';
import { CreateDataSection, GetDataSection, DataBaseRangeSection } from './module';

export function Home() {
	return (
		<div className={styles.home_page}>
			<CreateDataSection className={styles.create_block} />
			<DataBaseRangeSection className={styles.table_block} />
			<GetDataSection className={styles.get_block} />
		</div>
	);
}
