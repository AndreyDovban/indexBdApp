import { type DetailedHTMLProps, type ForwardedRef, forwardRef, type InputHTMLAttributes } from 'react';
import cn from 'classnames';
import styles from './Checkbox.module.css';

interface CheckBoxProps extends DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
	className?: string;
}

export const CheckBox = forwardRef(function Input(
	{ className, ...props }: CheckBoxProps,
	ref: ForwardedRef<HTMLInputElement>,
) {
	return (
		<label className={cn(className, styles.checkbox)}>
			<input type="checkbox" className={cn(className, styles.input)} ref={ref} {...props} />
			<span className={styles.ttt}>✔</span>
		</label>
	);
});
