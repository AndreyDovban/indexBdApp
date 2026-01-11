import './styles/index.css';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Home } from '@/pages';
import Layout from './layout';

const root = document.getElementById('root');

ReactDOM.createRoot(root as HTMLElement).render(
	<HashRouter basename={'/'}>
		<Routes>
			<Route element={<Layout />}>
				<Route path="/" element={<Home />} />
			</Route>
		</Routes>
	</HashRouter>,
);
