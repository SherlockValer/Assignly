import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getAllEngineers } from "../api/engineers";
import { getAllProjects } from "../api/projects";
import {
  getAllAssignments,
  getAssignmentsByEngineer,
} from "../api/assignments";
import type { User } from "../context/AuthContext";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import {
  Users,
  Briefcase,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  UserCheck,
  Search,
} from "lucide-react";
import { Input } from "../components/ui/input";

interface Assignment {
  _id: string;
  engineerId: string | { _id: string; name: string };
  projectId: string | { _id: string; name: string };
  allocationPercentage: number;
  startDate: string;
  endDate: string;
  role: string;
}

interface EngineerWithCapacity extends User {
  currentCapacity: number;
  availableCapacity: number;
  assignments: Assignment[];
}

interface ProjectWithAssignments {
  _id: string;
  name: string;
  description: string;
  status: string;
  teamSize: number;
  startDate: string;
  endDate: string;
  requiredSkills: string[];
  assignments?: Assignment[];
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [engineers, setEngineers] = useState<EngineerWithCapacity[]>([]);
  const [projects, setProjects] = useState<ProjectWithAssignments[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [skillFilter, setSkillFilter] = useState<string>("all");

  // Helper function to get engineer ID
  const getEngineerId = (assignment: Assignment): string => {
    return typeof assignment.engineerId === "string"
      ? assignment.engineerId
      : assignment.engineerId._id;
  };

  // Helper function to get project name
  const getProjectName = (assignment: Assignment): string => {
    if (typeof assignment.projectId === "string") {
      return "Unknown Project";
    }
    return assignment.projectId.name || "Unknown Project";
  };

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const fetchData = async () => {
      try {
        if (user.role === "manager") {
          const [engs, projs, assigns] = await Promise.all([
            getAllEngineers(),
            getAllProjects(),
            getAllAssignments(),
          ]);

          // Calculate capacity for each engineer
          const engineersWithCapacity = engs.map((engineer: User) => {
            const engineerAssignments = assigns.filter(
              (a: Assignment) =>
                getEngineerId(a) === engineer._id &&
                new Date(a.endDate) >= new Date()
            );
            const currentCapacity = engineerAssignments.reduce(
              (sum: number, a: Assignment) =>
                sum + (a.allocationPercentage || 0),
              0
            );
            const maxCapacity = engineer.maxCapacity || 100;
            const availableCapacity = Math.max(
              0,
              maxCapacity - currentCapacity
            );

            return {
              ...engineer,
              currentCapacity,
              availableCapacity,
              assignments: engineerAssignments,
            };
          });

          setEngineers(engineersWithCapacity);
          setProjects(projs as ProjectWithAssignments[]);
          setAssignments(assigns);
        } else {
          const userAssignments = await getAssignmentsByEngineer(user._id);
          setAssignments(userAssignments);
        }
      } catch {
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Filter engineers based on search and skills (for managers)
  const filteredEngineers = engineers.filter((engineer) => {
    const matchesSearch =
      engineer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      engineer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      engineer.skills?.some((skill) =>
        skill.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesSkill =
      skillFilter === "all" ||
      engineer.skills?.some((skill) =>
        skill.toLowerCase().includes(skillFilter.toLowerCase())
      );

    return matchesSearch && matchesSkill;
  });

  // Filter assignments based on search (for engineers)
  const filteredAssignments = assignments.filter((assignment) => {
    const projectName = getProjectName(assignment).toLowerCase();
    const role = assignment.role.toLowerCase();
    return (
      projectName.includes(searchTerm.toLowerCase()) ||
      role.includes(searchTerm.toLowerCase())
    );
  });

  // Get unique skills for filter
  const allSkills = Array.from(
    new Set(engineers.flatMap((engineer) => engineer.skills || []))
  ).sort();

  if (!user) return null;

  const getCapacityColor = (capacity: number, maxCapacity: number) => {
    const percentage = (capacity / maxCapacity) * 100;
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "planning":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user.name}! ({user.role})
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="capitalize">
            {user.role}
          </Badge>
        </div>
      </div>

    
      {user.role === "manager" ? (
        /* Manager Dashboard */
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Engineers
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{engineers.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active team members
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Projects
                </CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {projects.filter((p) => p.status === "active").length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently running
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Overloaded Engineers
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {
                    engineers.filter(
                      (e) => e.currentCapacity > (e.maxCapacity || 100) * 0.9
                    ).length
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  &gt;90% capacity
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Available Engineers
                </CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {engineers.filter((e) => e.availableCapacity > 20).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ready for new assignments
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Engineers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search engineers by name, email, or skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Skill Filter */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={skillFilter === "all" ? "default" : "outline"}
                    onClick={() => setSkillFilter("all")}
                  >
                    All Skills
                  </Button>
                  {allSkills.slice(0, 8).map((skill) => (
                    <Button
                      key={skill}
                      variant={skillFilter === skill ? "default" : "outline"}
                      onClick={() => setSkillFilter(skill)}
                      size="sm"
                    >
                      {skill}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Overview
              </CardTitle>
              <CardDescription>
                Current capacity and availability of team members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredEngineers.map((engineer) => (
                  <div
                    key={engineer._id}
                    className="flex flex-wrap gap-4 items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${engineer.name}`}
                        />
                        <AvatarFallback>
                          {engineer.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{engineer.name}</h3>
                        <p className="text-sm text-gray-600">
                          {engineer.email}
                        </p>
                        <div className="flex gap-1 mt-1">
                          {engineer.skills?.slice(0, 3).map((skill: string) => (
                            <Badge
                              key={skill}
                              variant="secondary"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                          {engineer.skills && engineer.skills.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{engineer.skills.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {engineer.currentCapacity}% allocated
                        </p>
                        <p className="text-xs text-gray-600">
                          {engineer.availableCapacity}% available
                        </p>
                      </div>
                      <div className="w-32">
                        <Progress
                          value={engineer.currentCapacity}
                          className="h-2"
                        />
                        <div
                          className={`h-1 mt-1 rounded ${getCapacityColor(
                            engineer.currentCapacity,
                            engineer.maxCapacity || 100
                          )}`}
                        ></div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            engineer.currentCapacity > 90
                              ? "destructive"
                              : engineer.currentCapacity > 75
                              ? "secondary"
                              : "default"
                          }
                        >
                          {engineer.seniority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Projects Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Active Projects
              </CardTitle>
              <CardDescription>
                Current project status and team allocation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects
                  .filter((p) => p.status === "active")
                  .map((project) => (
                    <div key={project._id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold">{project.name}</h3>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {project.description}
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Team Size:</span>
                          <span className="font-medium">
                            {project.teamSize}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Required Skills:</span>
                          <span className="font-medium">
                            {project.requiredSkills?.length || 0}
                          </span>
                        </div>
                        <div className="flex gap-1 mt-2">
                          {project.requiredSkills
                            ?.slice(0, 3)
                            .map((skill: string) => (
                              <Badge
                                key={skill}
                                variant="outline"
                                className="text-xs"
                              >
                                {skill}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Engineer Dashboard */
        <div className="space-y-6">
          {/* Engineer Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Current Assignments
                </CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {
                    assignments.filter((a) => new Date(a.endDate) >= new Date())
                      .length
                  }
                </div>
                <p className="text-xs text-muted-foreground">Active projects</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Allocation
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {assignments
                    .filter((a) => new Date(a.endDate) >= new Date())
                    .reduce((sum, a) => sum + (a.allocationPercentage || 0), 0)}
                  %
                </div>
                <p className="text-xs text-muted-foreground">
                  Current workload
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Available Capacity
                </CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.max(
                    0,
                    (user.maxCapacity || 100) -
                      assignments
                        .filter((a) => new Date(a.endDate) >= new Date())
                        .reduce(
                          (sum, a) => sum + (a.allocationPercentage || 0),
                          0
                        )
                  )}
                  %
                </div>
                <p className="text-xs text-muted-foreground">
                  Ready for new work
                </p>
              </CardContent>
            </Card>
          </div>

          {/* My Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                My Current Assignments
              </CardTitle>
              <CardDescription>
                Projects you're currently working on
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">No current assignments</p>
                  <p className="text-sm text-gray-500 mt-1">
                    You're available for new projects!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAssignments.map((assignment) => (
                    <div
                      key={assignment._id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Briefcase className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            {getProjectName(assignment)}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {assignment.role}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-500">
                              {new Date(
                                assignment.startDate
                              ).toLocaleDateString()}{" "}
                              -{" "}
                              {new Date(
                                assignment.endDate
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">
                          {assignment.allocationPercentage}%
                        </div>
                        <p className="text-xs text-gray-600">Allocation</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Manage your profile and view assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button asChild>
                  <Link to="/profile">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Update Profile
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/assignments">
                    <Calendar className="h-4 w-4 mr-2" />
                    View All Assignments
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
