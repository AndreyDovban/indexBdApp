import styles from './Range.module.css';
import cn from 'classnames';
import type { DetailedHTMLProps, InputHTMLAttributes } from 'react';

interface CheckBoxProps extends DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
	className?: string;
}

export function Range({ className, ...props }: CheckBoxProps) {
	return <input type="range" className={cn(className, styles.range)} {...props} />;
}
