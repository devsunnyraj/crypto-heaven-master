"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteCommunity } from "@/lib/actions/community.actions";

interface Props {
  communityId: string;
  communityName: string;
}

function DeleteCommunity({ communityId, communityName }: Props) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteCommunity(communityId);
      router.push("/communities");
    } catch (error) {
      console.error("Error deleting community:", error);
      alert("Failed to delete community. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className='mt-6 flex items-center gap-2 rounded-lg bg-red-500 hover:bg-red-600 px-4 py-3 text-light-1 transition-colors'
      >
        <Image
          src='/assets/delete.svg'
          alt='delete'
          width={18}
          height={18}
          className='cursor-pointer object-contain'
        />
        <span className='text-small-regular'>Delete Community</span>
      </button>
    );
  }

  return (
    <div className='mt-6 rounded-lg bg-dark-3 p-4 border border-red-500'>
      <p className='text-light-1 mb-3'>
        Are you sure you want to delete <span className='font-semibold'>{communityName}</span>? 
        This action cannot be undone.
      </p>
      <div className='flex gap-3'>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className='flex-1 rounded-lg bg-red-500 hover:bg-red-600 px-4 py-2 text-light-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {isDeleting ? "Deleting..." : "Yes, Delete"}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          className='flex-1 rounded-lg bg-dark-4 hover:bg-dark-2 px-4 py-2 text-light-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default DeleteCommunity;
