import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllAssignments, getAssignmentsByEngineer } from '../api/assignments';
import { getAllProjects } from '../api/projects';
import { getAllEngineers } from '../api/engineers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { 
  Calendar, 
  Clock, 
  Briefcase,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';

interface Assignment {
  _id: string;
  engineerId: string | { _id: string; name: string };
  projectId: string | { _id: string; name: string };
  allocationPercentage: number;
  startDate: string;
  endDate: string;
  role: string;
}

interface Project {
  _id: string;
  name: string;
  status: string;
}

interface Engineer {
  _id: string;
  name: string;
}

const Timeline: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedEngineer, setSelectedEngineer] = useState<string>('all');

  useEffect(() => {
    if (!user) return;
    
    // Only managers can access global timeline
    if (user.role !== 'manager') {
      setError('Access denied. Managers only.');
      return;
    }
    
    setLoading(true);
    const fetchData = async () => {
      try {
        const [assigns, projs, engs] = await Promise.all([
          user.role === 'manager' ? getAllAssignments() : getAssignmentsByEngineer(user._id),
          getAllProjects(),
          getAllEngineers()
        ]);
        
        setAssignments(assigns);
        setProjects(projs);
        setEngineers(engs);
      } catch {
        setError('Failed to load timeline data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  if (!user) return null;

  // Check if user is not a manager
  if (user.role !== 'manager') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
          <p>Access denied. Managers only.</p>
        </div>
      </div>
    );
  }

  // Helper functions
  const getProjectName = (assignment: Assignment): string => {
    if (typeof assignment.projectId === 'string') {
      const project = projects.find(p => p._id === assignment.projectId);
      return project?.name || 'Unknown Project';
    }
    return assignment.projectId.name || 'Unknown Project';
  };

  const getEngineerName = (assignment: Assignment): string => {
    if (typeof assignment.engineerId === 'string') {
      const engineer = engineers.find(e => e._id === assignment.engineerId);
      return engineer?.name || 'Unknown Engineer';
    }
    return assignment.engineerId.name || 'Unknown Engineer';
  };

  const getStatusColor = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    if (end < now) return 'bg-gray-100 text-gray-800';
    if (end.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    if (end < now) return 'Completed';
    if (end.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) return 'Ending Soon';
    return 'Active';
  };

  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getAssignmentsForDate = (date: Date) => {
    return filteredAssignments.filter(assignment => {
      const start = new Date(assignment.startDate);
      const end = new Date(assignment.endDate);
      return date >= start && date <= end;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth() && 
           date.getFullYear() === currentMonth.getFullYear();
  };

  // Filter assignments
  const filteredAssignments = assignments.filter(assignment => {
    const projectMatch = selectedProject === 'all' || 
      (typeof assignment.projectId === 'string' 
        ? assignment.projectId === selectedProject
        : assignment.projectId._id === selectedProject);
    
    const engineerMatch = selectedEngineer === 'all' || 
      (typeof assignment.engineerId === 'string'
        ? assignment.engineerId === selectedEngineer
        : assignment.engineerId._id === selectedEngineer);
    
    return projectMatch && engineerMatch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading timeline...</p>
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assignment Timeline</h1>
          <p className="text-gray-600 mt-1">
            Calendar view of all assignments and project timelines
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">Project</label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Projects</option>
                {projects.map(project => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            {user.role === 'manager' && (
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">Engineer</label>
                <select
                  value={selectedEngineer}
                  onChange={(e) => setSelectedEngineer(e.target.value)}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Engineers</option>
                  {engineers.map(engineer => (
                    <option key={engineer._id} value={engineer._id}>
                      {engineer.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <h2 className="text-xl font-semibold">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <Button
          variant="outline"
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {Array.from({ length: getFirstDayOfMonth(currentMonth) }, (_, i) => (
              <div key={`empty-${i}`} className="p-2"></div>
            ))}
            
            {Array.from({ length: getDaysInMonth(currentMonth) }, (_, i) => {
              const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
              const dayAssignments = getAssignmentsForDate(date);
              
              return (
                <div
                  key={i}
                  className={`p-2 min-h-[100px] border rounded-lg ${
                    isToday(date) ? 'bg-blue-50 border-blue-200' : 'bg-white'
                  } ${!isCurrentMonth(date) ? 'opacity-50' : ''}`}
                >
                  <div className="text-sm font-medium mb-1">
                    {i + 1}
                  </div>
                  <div className="space-y-1">
                    {dayAssignments.slice(0, 3).map(assignment => (
                      <div
                        key={assignment._id}
                        className="text-xs p-1 rounded bg-blue-100 text-blue-800 wrap"
                        title={`${getProjectName(assignment)} - ${assignment.allocationPercentage}%`}
                      >
                        {getProjectName(assignment)}
                      </div>
                    ))}
                    {dayAssignments.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{dayAssignments.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Upcoming Assignments
          </CardTitle>
          <CardDescription>
            Assignments starting in the next 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No assignments found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAssignments
                .filter(a => new Date(a.startDate) >= new Date())
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                .slice(0, 10)
                .map(assignment => (
                  <div key={assignment._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Briefcase className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{getProjectName(assignment)}</h3>
                        <p className="text-sm text-gray-600">
                          {user.role === 'manager' ? getEngineerName(assignment) : assignment.role}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3 text-gray-500" />
                          <span className="text-xs text-gray-500">
                            {new Date(assignment.startDate).toLocaleDateString()} - {new Date(assignment.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">
                        {assignment.allocationPercentage}%
                      </div>
                      <Badge className={getStatusColor(assignment.endDate)}>
                        {getStatusText(assignment.endDate)}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Timeline; 