'use client';
import { useEffect, useRef } from 'react';
import './Portal.css';
import { createPortal } from 'react-dom';
type ClientPortalInterface = {
	children: React.ReactNode;
	show?: boolean;
	onClose?: () => void;
	selector: string;
};

export function Portal({ children, selector, show }: ClientPortalInterface) {
	const ref = useRef<Element | null>(null);

	useEffect(() => {
		ref.current = document.getElementById(selector);
		if (!show && ref.current) {
			ref.current.innerHTML = '';
		}
	}, [selector, show]);

	return show && ref.current ? createPortal(children, ref.current) : null;
}
