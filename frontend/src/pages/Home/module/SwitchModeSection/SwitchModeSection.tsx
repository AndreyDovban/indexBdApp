import styles from './SwitchModeSection.module.css';
import { type DetailedHTMLProps, type HTMLAttributes } from 'react';
import { Toggle2 } from '@/ui';
import { useModeStore } from '@/store';

interface SwitchModeProps extends DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> {
	className?: string;
}

export function SwitchModeSection({ className, ...props }: SwitchModeProps) {
	const { mode, toggleMode } = useModeStore();

	return (
		<section className={`${className} ${styles.switch_mode_section}`} {...props}>
			<Toggle2 className={styles.toggle} on={mode == 'pagination'} onClick={toggleMode} appearance="quaternary">
				<span>Pagination</span>
				<span>Range</span>
			</Toggle2>
		</section>
	);
}
