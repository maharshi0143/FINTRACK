import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Sidebar from '../components/common/Sidebar';
import Navbar from '../components/common/NavBar';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency } from '../utils/formatters';

function RealTimeNotifications() {
  const { socketService, connected } = useSocket();

  useEffect(() => {
    const socket = socketService.socket;
    if (!socket || !connected) return;

    const handleTransaction = (data) => {
      const isIncome = data.type === 'income';
      toast(
        `${isIncome ? 'Income' : 'Expense'} recorded: ${data.title} (${formatCurrency(data.amount)})`,
        {
          icon: isIncome ? '💰' : '💸',
          style: {
            background: 'rgba(17, 17, 19, 0.95)',
            color: '#fafafa',
            border: isIncome
              ? '1px solid rgba(34, 197, 94, 0.2)'
              : '1px solid rgba(239, 68, 68, 0.2)',
          },
        },
      );
    };

    const handleBudgetAlert = (data) => {
      toast(`Budget alert: ${data.message || 'Budget updated'}`, {
        icon: '🎯',
        style: {
          background: 'rgba(17, 17, 19, 0.95)',
          color: '#fafafa',
          border: '1px solid rgba(251, 191, 36, 0.2)',
        },
      });
    };

    const handleNotification = (data) => {
      toast(data.title || 'New notification', {
        icon: '🔔',
        style: {
          background: 'rgba(17, 17, 19, 0.95)',
          color: '#fafafa',
          border: '1px solid rgba(59, 130, 246, 0.2)',
        },
      });
    };

    socket.on('transactionCreated', handleTransaction);
    socket.on('transactionUpdated', handleTransaction);
    socket.on('budgetCreated', handleBudgetAlert);
    socket.on('budgetUpdated', handleBudgetAlert);
    socket.on('notification', handleNotification);

    return () => {
      socket.off('transactionCreated', handleTransaction);
      socket.off('transactionUpdated', handleTransaction);
      socket.off('budgetCreated', handleBudgetAlert);
      socket.off('budgetUpdated', handleBudgetAlert);
      socket.off('notification', handleNotification);
    };
  }, [socketService.socket, connected]);

  return null;
}

function MainLayout({ children }) {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen text-white">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - fixed on all screens */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="min-h-screen flex flex-col lg:ml-72">
        <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 pt-20 lg:pt-0">
          {children}
        </main>
      </div>

      {/* Real-time socket notifications */}
      {isAuthenticated && <RealTimeNotifications />}
    </div>
  );
}

export default MainLayout;
