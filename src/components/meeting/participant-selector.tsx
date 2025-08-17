"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { X, Search, Users, UserPlus, Shield, Check } from "lucide-react";
import debounce from "lodash/debounce";

interface User {
  _id: Id<"users">;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profileImageUrl?: string;
}

interface ParticipantSelectorProps {
  foundationId: Id<"foundations">;
  selectedParticipants: Id<"users">[];
  onParticipantsChange: (participants: Id<"users">[]) => void;
  allowUninvitedJoin: boolean;
  onAllowUninvitedChange: (allow: boolean) => void;
  currentUserId?: Id<"users">;
}

export function ParticipantSelector({
  foundationId,
  selectedParticipants,
  onParticipantsChange,
  allowUninvitedJoin,
  onAllowUninvitedChange,
  currentUserId,
}: ParticipantSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounce search term
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setDebouncedSearchTerm(term);
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  // Search users
  const searchResults = useQuery(
    api.users.searchUsersForMeeting,
    debouncedSearchTerm && debouncedSearchTerm.length >= 2
      ? { foundationId, searchTerm: debouncedSearchTerm }
      : "skip"
  );

  // Get selected participants details
  const selectedUsers = useQuery(
    api.users.getUsersByIds,
    selectedParticipants && selectedParticipants.length > 0 
      ? { userIds: selectedParticipants }
      : "skip"
  );

  // Handle clicks outside search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddParticipant = (user: User) => {
    const participants = selectedParticipants || [];
    if (!participants.includes(user._id) && user._id !== currentUserId) {
      onParticipantsChange([...participants, user._id]);
      setSearchTerm("");
      setShowResults(false);
    }
  };

  const handleRemoveParticipant = (userId: Id<"users">) => {
    const participants = selectedParticipants || [];
    onParticipantsChange(participants.filter(id => id !== userId));
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
      case "super_admin":
        return "bg-red-100 text-red-700";
      case "reviewer":
        return "bg-blue-100 text-blue-700";
      case "beneficiary":
        return "bg-green-100 text-green-700";
      case "guardian":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="participants">
          <Users className="inline h-4 w-4 mr-1" />
          Invite Participants
        </Label>
        <p className="text-xs text-gray-500 mt-1">
          Search and add people from your foundation to this meeting
        </p>
      </div>

      {/* Search Input */}
      <div className="relative" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="participants"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            placeholder="Type to search by name or email..."
            className="pl-10"
          />
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults && searchResults.length > 0 && (
          <Card className="absolute z-50 w-full mt-1 p-2 max-h-60 overflow-y-auto">
            {searchResults
              .filter(user => 
                !(selectedParticipants || []).includes(user._id) && 
                user._id !== currentUserId
              )
              .map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                  onClick={() => handleAddParticipant(user)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <span className="text-xs font-semibold text-emerald-700">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <Badge className={cn("text-xs", getRoleBadgeColor(user.role))}>
                    {user.role}
                  </Badge>
                </div>
              ))}
            {searchResults && searchResults.length === 0 && debouncedSearchTerm && debouncedSearchTerm.length >= 2 && (
              <p className="text-sm text-gray-500 text-center py-2">
                No users found matching "{debouncedSearchTerm}"
              </p>
            )}
          </Card>
        )}
      </div>

      {/* Selected Participants */}
      {selectedUsers && selectedUsers.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-gray-600">
            Invited ({selectedUsers.length})
          </Label>
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map((user) => (
              <Badge
                key={user._id}
                variant="secondary"
                className="pl-2 pr-1 py-1 flex items-center gap-1"
              >
                <span className="text-xs">
                  {user.firstName} {user.lastName}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveParticipant(user._id)}
                  className="ml-1 rounded-full hover:bg-gray-200 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Access Control */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="allow-uninvited" className="text-sm font-medium">
              <Shield className="inline h-4 w-4 mr-1" />
              Allow anyone to join
            </Label>
            <p className="text-xs text-gray-500">
              {allowUninvitedJoin 
                ? "Anyone in your foundation can join this meeting"
                : "Only invited participants can join (others need approval)"}
            </p>
          </div>
          <Switch
            id="allow-uninvited"
            checked={allowUninvitedJoin}
            onCheckedChange={onAllowUninvitedChange}
          />
        </div>
      </div>

      {/* Info Message */}
      {!allowUninvitedJoin && selectedUsers && selectedUsers.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-700">
            <Shield className="inline h-3 w-3 mr-1" />
            No participants invited. Only you will be able to join this meeting unless you invite others or allow anyone to join.
          </p>
        </div>
      )}
    </div>
  );
}