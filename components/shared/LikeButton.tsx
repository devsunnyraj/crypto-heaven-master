"use client";

import Image from "next/image";
import { useState } from "react";
import { likeThread } from "@/lib/actions/thread.actions";

interface Props {
  threadId: string;
  currentUserId: string;
  initialLikes: string[];
}

export default function LikeButton({ threadId, currentUserId, initialLikes }: Props) {
  const [isLiked, setIsLiked] = useState(initialLikes.includes(currentUserId));
  const [likeCount, setLikeCount] = useState(initialLikes.length);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    const newLikedState = !isLiked;
    const newCount = newLikedState ? likeCount + 1 : likeCount - 1;
    
    setIsLiked(newLikedState);
    setLikeCount(newCount);
    
    try {
      await likeThread(threadId, currentUserId, window.location.pathname);
    } catch (error) {
      setIsLiked(!newLikedState);
      setLikeCount(initialLikes.length);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className='flex items-center gap-1'>
      <Image
        src={isLiked ? '/assets/heart-filled.svg' : '/assets/heart-gray.svg'}
        alt='heart'
        width={24}
        height={24}
        className='cursor-pointer object-contain'
        onClick={handleLike}
        style={{ 
          filter: isLiked ? 'invert(37%) sepia(86%) saturate(3395%) hue-rotate(253deg) brightness(94%) contrast(96%)' : 'none' 
        }}
      />
      {likeCount > 0 && (
        <span className='text-small-regular text-light-3'>{likeCount}</span>
      )}
    </div>
  );
}
