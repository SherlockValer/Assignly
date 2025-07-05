import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAssignmentsByEngineer } from '../api/assignments';
import { getEngineerCapacity } from '../api/engineers';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { 
  User, 
  Calendar, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Activity,
  Target,
  Zap
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface Assignment {
  _id: string;
  projectId: { _id: string; name: string };
  engineerId: { _id: string; name: string };
  allocationPercentage: number;
  startDate: string;
  endDate: string;
  role: string;
}

interface EngineerCapacity {
  currentCapacity: number;
  availableCapacity: number;
  assignments: Array<{
    _id: string;
    projectId: string;
    allocationPercentage: number;
    startDate: string;
    endDate: string;
  }>;
}

const EngineerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [capacity, setCapacity] = useState<EngineerCapacity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'engineer') return;
    
    setLoading(true);
    const fetchData = async () => {
      try {
        const [assignmentsData, capacityData] = await Promise.all([
          getAssignmentsByEngineer(user._id),
          getEngineerCapacity(user._id)
        ]);
        setAssignments(assignmentsData);
        setCapacity(capacityData);
      } catch {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  if (!user || user.role !== 'engineer') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
          <p>Access denied. Engineers only.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Calculate personal metrics
  const activeAssignments = assignments.filter(a => new Date(a.endDate) >= new Date());
  const completedAssignments = assignments.filter(a => new Date(a.endDate) < new Date());
  const currentUtilization = capacity?.currentCapacity || 0;
  const availableCapacity = capacity?.availableCapacity || 0;
  const maxCapacity = user.maxCapacity || 100;

  // Skills analysis
  const skillsUsed = new Set<string>();
  activeAssignments.forEach(assignment => {
    // This would need to be enhanced with actual project skills data
    skillsUsed.add(assignment.role);
  });

  // Timeline data for next 3 months
  const getMonthlyData = () => {
    const months = [];
    const utilization = [];
    const now = new Date();
    
    for (let i = 0; i < 3; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() + i, 1);
      months.push(month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
      
      // Calculate utilization for this month
      const monthAssignments = assignments.filter(a => {
        const start = new Date(a.startDate);
        const end = new Date(a.endDate);
        return start <= month && end >= month;
      });
      
      const monthUtilization = monthAssignments.reduce((sum, a) => sum + a.allocationPercentage, 0);
      utilization.push(Math.min(monthUtilization, 100));
    }
    
    return { months, utilization };
  };

  const { months, utilization } = getMonthlyData();

  const utilizationData = {
    labels: months,
    datasets: [
      {
        label: 'Capacity Utilization (%)',
        data: utilization,
        backgroundColor: utilization.map(u => 
          u > 90 ? '#f87171' : 
          u > 75 ? '#fbbf24' : '#34d399'
        ),
        borderColor: utilization.map(u => 
          u > 90 ? '#ef4444' : 
          u > 75 ? '#f59e0b' : '#10b981'
        ),
        borderWidth: 1,
      },
    ],
  };

  const assignmentStatusData = {
    labels: ['Active', 'Completed'],
    datasets: [
      {
        data: [activeAssignments.length, completedAssignments.length],
        backgroundColor: ['#06b6d4', '#64748b'],
        borderColor: ['#0891b2', '#475569'],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  // Only show charts if there's data
  const hasData = activeAssignments.length > 0 || completedAssignments.length > 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Personal analytics and capacity planning
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {activeAssignments.length} active assignment{activeAssignments.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Utilization</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentUtilization}%</div>
            <p className="text-xs text-muted-foreground">
              of {maxCapacity}% capacity
            </p>
            <Progress value={currentUtilization} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Capacity</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableCapacity}%</div>
            <p className="text-xs text-muted-foreground">
              Ready for new projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAssignments.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently working on
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedAssignments.length}</div>
            <p className="text-xs text-muted-foreground">
              Successfully delivered
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Capacity Utilization (Next 3 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <Bar data={utilizationData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Assignment Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <Doughnut data={assignmentStatusData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Current Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Current Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeAssignments.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No active assignments</h3>
              <p className="text-gray-600">
                You're currently available for new projects!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeAssignments.map((assignment) => (
                <div key={assignment._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{assignment.projectId?.name || 'Unknown Project'}</h4>
                      <p className="text-sm text-gray-600">{assignment.role || 'Developer'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">
                      {assignment.allocationPercentage}%
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(assignment.endDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skills Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Skills in Use
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Array.from(skillsUsed).map((skill) => (
              <Badge key={skill} variant="outline">
                {skill}
              </Badge>
            ))}
            {skillsUsed.size === 0 && (
              <p className="text-gray-600">No skills currently in use</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EngineerDashboard; 