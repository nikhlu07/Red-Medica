import { Link, useLocation } from 'react-router-dom';

export const Footer = () => {
  const location = useLocation();

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/verify', label: 'Verify' },
    { path: '/analytics', label: 'Analytics' },
    { path: '/help', label: 'Help' },
  ];

  if (location.pathname === '/') {
    return null;
  }

  return (
    <footer className="py-12 bg-white border-t border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <img src="/logo.svg" alt="Red Médica Logo" className="h-7 w-auto" />
            <span className="ml-2 text-xl font-bold text-gray-800">Red Médica</span>
          </div>
          <nav className="flex justify-center flex-wrap gap-x-6 gap-y-2 mb-6 text-sm font-medium">
            {navLinks.map(link => (
                 <Link key={link.path} to={link.path} className="text-gray-600 hover:text-blue-600 transition-colors">
                    {link.label}
                 </Link>
            ))}
          </nav>
          <div className="flex justify-center items-center space-x-6 mb-6">
            <a href="https://github.com/nikhlu07/Red-Medica" className="text-gray-400 hover:text-blue-600 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
            </a>
          </div>
          <p className="text-sm text-gray-500">&copy; 2025 Red Médica. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};
