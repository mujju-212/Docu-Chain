import { Home, Info, Shield, LogIn, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Dock, DockIcon, DockItem, DockLabel } from '../ui/dock';

const navigationData = [
  {
    title: 'Home',
    icon: <Home className='h-full w-full text-blue-400' />,
    href: '/',
  },
  {
    title: 'About',
    icon: <Info className='h-full w-full text-blue-400' />,
    href: '/about',
  },
  {
    title: 'Verify Document',
    icon: <Shield className='h-full w-full text-blue-400' />,
    href: '/verify',
  },
  {
    title: 'Login',
    icon: <LogIn className='h-full w-full text-blue-400' />,
    href: '/login',
  },
  {
    title: 'Sign Up',
    icon: <UserPlus className='h-full w-full text-blue-400' />,
    href: '/register',
  },
];

export function NavigationDock() {
  return (
    <div className='w-full flex justify-center py-2'>
      <Dock 
        className='items-center'
        magnification={70}
        distance={140}
        panelHeight={60}
      >
        {navigationData.map((item, idx) => (
          <Link to={item.href} key={idx} className="no-underline">
            <DockItem className='aspect-square rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/10 hover:from-blue-500/30 hover:to-blue-600/20 transition-all duration-300 border border-blue-400/40 shadow-md'>
              <DockLabel>{item.title}</DockLabel>
              <DockIcon>{item.icon}</DockIcon>
            </DockItem>
          </Link>
        ))}
      </Dock>
    </div>
  );
}
