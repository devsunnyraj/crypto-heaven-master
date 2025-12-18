"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { joinCommunity, leaveCommunity } from "@/lib/actions/community.actions";
import { usePathname } from "next/navigation";

interface Props {
  communityId: string;
  userId: string;
  isMember: boolean;
  isPrivate: boolean;
  hasRequested?: boolean;
}

export default function JoinCommunityButton({
  communityId,
  userId,
  isMember,
  isPrivate,
  hasRequested = false,
}: Props) {
  const [memberStatus, setMemberStatus] = useState(isMember);
  const [requestStatus, setRequestStatus] = useState(hasRequested);
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  const handleJoin = async () => {
    setIsLoading(true);
    try {
      const result = await joinCommunity(communityId, userId, pathname);
      if (result.status === "joined") {
        setMemberStatus(true);
        window.location.reload();
      } else if (result.status === "requested") {
        setRequestStatus(true);
      }
    } catch (error) {
      console.error("Error joining community:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeave = async () => {
    setIsLoading(true);
    try {
      await leaveCommunity(communityId, userId, pathname);
      setMemberStatus(false);
      window.location.reload();
    } catch (error) {
      console.error("Error leaving community:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (memberStatus) {
    return (
      <Button
        onClick={handleLeave}
        disabled={isLoading}
        className='bg-red-600 hover:bg-red-700 px-5 py-2 text-light-1'
      >
        {isLoading ? "Leaving..." : "Leave Community"}
      </Button>
    );
  }

  if (requestStatus) {
    return (
      <Button
        disabled
        className='bg-gray-600 px-5 py-2 text-light-1 cursor-not-allowed'
      >
        Request Pending
      </Button>
    );
  }

  return (
    <Button
      onClick={handleJoin}
      disabled={isLoading}
      className='bg-purple-600 hover:bg-purple-700 px-5 py-2 text-light-1'
      style={{ background: isLoading ? '#6b21a8' : '#7c3aed' }}
    >
      {isLoading ? "Joining..." : isPrivate ? "Request to Join" : "Join Community"}
    </Button>
  );
}
