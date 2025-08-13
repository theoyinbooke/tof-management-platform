"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar,
  Users,
  MapPin,
  User,
  Eye,
  Edit,
  BookOpen,
  GraduationCap,
  Award,
  Target,
  TrendingUp,
  Activity,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";

interface ProgramCardProps {
  program: {
    _id: Id<"programs">;
    name: string;
    description: string;
    type: string;
    status: string;
    startDate: number;
    endDate?: number | null;
    location?: string | null;
    enrollmentCount: number;
    maxParticipants?: number | null;
    coordinator?: {
      firstName: string;
      lastName: string;
    } | null;
  };
  canManage?: boolean;
  onView?: (programId: Id<"programs">) => void;
  onEdit?: (programId: Id<"programs">) => void;
}

export function ProgramCard({ program, canManage, onView, onEdit }: ProgramCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "planning":
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1" />Planning</Badge>;
      case "active":
        return <Badge className="bg-green-100 text-green-800"><Activity className="w-3 h-3 mr-1" />Active</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeMap = {
      workshop: { icon: BookOpen, label: "Workshop", color: "bg-purple-100 text-purple-800" },
      mentorship: { icon: User, label: "Mentorship", color: "bg-blue-100 text-blue-800" },
      tutoring: { icon: GraduationCap, label: "Tutoring", color: "bg-green-100 text-green-800" },
      scholarship: { icon: Award, label: "Scholarship", color: "bg-yellow-100 text-yellow-800" },
      career_guidance: { icon: Target, label: "Career Guidance", color: "bg-indigo-100 text-indigo-800" },
      life_skills: { icon: TrendingUp, label: "Life Skills", color: "bg-pink-100 text-pink-800" },
      other: { icon: BookOpen, label: "Other", color: "bg-gray-100 text-gray-800" },
    };

    const config = typeMap[type as keyof typeof typeMap] || typeMap.other;
    const IconComponent = config.icon;

    return (
      <Badge className={config.color}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{program.name}</CardTitle>
            <div className="flex gap-2 mt-2">
              {getTypeBadge(program.type)}
              {getStatusBadge(program.status)}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 line-clamp-2">{program.description}</p>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Starts {formatDate(new Date(program.startDate))}</span>
          </div>
          
          {program.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{program.location}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>
              {program.enrollmentCount} enrolled
              {program.maxParticipants && ` / ${program.maxParticipants} max`}
            </span>
          </div>
          
          {program.coordinator && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>
                {program.coordinator.firstName} {program.coordinator.lastName}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onView?.(program._id)}
          >
            <Eye className="w-4 h-4 mr-1" />
            View Details
          </Button>
          {canManage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit?.(program._id)}
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}