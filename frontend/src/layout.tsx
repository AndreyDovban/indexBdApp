import { Header, Main } from '@/components';
import { ToggleThemeService } from './services';
import { Outlet } from 'react-router-dom';

const Layout = () => {
	return (
		<>
			<ToggleThemeService />
			<Header />
			<Main>
				<Outlet />
			</Main>
		</>
	);
};

export default Layout;
