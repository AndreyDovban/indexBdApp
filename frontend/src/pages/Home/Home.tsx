import styles from './Home.module.css';
import { CreateDataSection, GetDataSection, DataBaseDexieSection } from './module';

export function Home() {
	return (
		<div className={styles.home_page}>
			<CreateDataSection className={styles.create_block} />

			<DataBaseDexieSection className={styles.table_block} />

			<GetDataSection className={styles.get_block} />
		</div>
	);
}
