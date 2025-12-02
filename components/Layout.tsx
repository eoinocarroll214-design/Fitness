import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, Dumbbell, Utensils, User, Activity, Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => {
        onChangeView(view);
        setMobileMenuOpen(false);
      }}
      className={`flex items-center w-full p-3 rounded-lg mb-2 transition-colors ${
        currentView === view
          ? 'bg-primary-600 text-white shadow-md'
          : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      <Icon className="w-5 h-5 mr-3" />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow-sm p-4 flex justify-between items-center z-20 relative">
        <div className="flex items-center text-slate-800 font-bold text-lg">
          <Activity className="w-6 h-6 text-primary-600 mr-2" />
          Rehab & Rebuild
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 bg-white w-64 shadow-xl transform transition-transform duration-300 ease-in-out z-10 md:relative md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-slate-100 flex items-center">
          <Activity className="w-8 h-8 text-primary-600 mr-3" />
          <div>
            <h1 className="font-bold text-slate-900 text-lg">Eoin's App</h1>
            <p className="text-xs text-slate-500">Day by Day</p>
          </div>
        </div>

        <nav className="p-4 mt-4">
          <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem view="workout" icon={Dumbbell} label="Daily Workout" />
          <NavItem view="nutrition" icon={Utensils} label="Nutrition" />
          <NavItem view="profile" icon={User} label="Profile & Rules" />
        </nav>
        
        <div className="absolute bottom-0 w-full p-6 border-t border-slate-100">
           <div className="flex items-center">
             <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
             <span className="text-xs text-slate-500">System Online</span>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen pb-24 md:pb-8">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;