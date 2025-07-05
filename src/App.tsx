import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import MainLayout from './layouts/MainLayout';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Assignments from './pages/Assignments';
import Profile from './pages/Profile';
import Projects from './pages/Projects';
import CreateAssignment from './pages/CreateAssignment';
import Analytics from './pages/Analytics';
import Timeline from './pages/Timeline';
import EngineerDashboard from './pages/EngineerDashboard';
import PrivateRoute from './components/PrivateRoute';

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        element: <PrivateRoute />,
        children: [
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'assignments', element: <Assignments /> },
          { path: 'profile', element: <Profile /> },
          { path: 'projects', element: <Projects /> },
          { path: 'assignments/create', element: <CreateAssignment /> },
          { path: 'analytics', element: <Analytics /> },
          { path: 'timeline', element: <Timeline /> },
          { path: 'engineer-dashboard', element: <EngineerDashboard /> },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;
