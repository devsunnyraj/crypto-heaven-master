"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useUploadThing } from "@/lib/uploadthing";
import { isBase64Image } from "@/lib/utils";
import { createCommunity } from "@/lib/actions/community.actions";

interface Props {
  userId: string;
}

export default function CreateCommunityForm({ userId }: Props) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const { startUpload } = useUploadThing("media");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    image: "",
    name: "",
    username: "",
    bio: "",
    isPrivate: false,
  });

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();

    const fileReader = new FileReader();

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFiles([file]);

      if (!file.type.includes("image")) return;

      fileReader.onload = async (event) => {
        const imageDataUrl = event.target?.result?.toString() || "";
        setFormData({ ...formData, image: imageDataUrl });
      };

      fileReader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let imageUrl = formData.image;

      // Upload image if it's a new file
      if (files.length > 0 && isBase64Image(formData.image)) {
        const imgRes = await startUpload(files);

        if (imgRes && imgRes[0].fileUrl) {
          imageUrl = imgRes[0].fileUrl;
        }
      }

      // Create unique ID for community
      const communityId = `community_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await createCommunity(
        communityId,
        formData.name,
        formData.username,
        imageUrl,
        formData.bio,
        userId,
        formData.isPrivate
      );

      router.push("/communities");
    } catch (error) {
      console.error("Error creating community:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-8'>
      {/* Image Upload */}
      <div className='flex items-center gap-4'>
        <label className='account-form_image-label'>
          {formData.image ? (
            <Image
              src={formData.image}
              alt='community_image'
              width={96}
              height={96}
              priority
              className='rounded-full object-cover'
            />
          ) : (
            <Image
              src='/assets/profile.svg'
              alt='community_image'
              width={24}
              height={24}
              className='object-contain'
            />
          )}
        </label>
        <input
          type='file'
          accept='image/*'
          placeholder='Upload community image'
          className='account-form_image-input'
          onChange={handleImage}
        />
      </div>

      {/* Community Name */}
      <div className='flex flex-col gap-2'>
        <label className='text-base-semibold text-light-2'>
          Community Name
        </label>
        <input
          type='text'
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className='account-form_input no-focus'
          placeholder='Enter community name'
        />
      </div>

      {/* Username */}
      <div className='flex flex-col gap-2'>
        <label className='text-base-semibold text-light-2'>
          Username (unique identifier)
        </label>
        <div className='flex items-center gap-2'>
          <span className='text-light-3'>@</span>
          <input
            type='text'
            required
            value={formData.username}
            onChange={(e) =>
              setFormData({
                ...formData,
                username: e.target.value.toLowerCase().replace(/\s/g, ""),
              })
            }
            className='account-form_input no-focus flex-1'
            placeholder='communityname'
          />
        </div>
      </div>

      {/* Bio */}
      <div className='flex flex-col gap-2'>
        <label className='text-base-semibold text-light-2'>
          Description
        </label>
        <textarea
          required
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          className='account-form_input no-focus'
          rows={4}
          placeholder='What is your community about?'
        />
      </div>

      {/* Privacy Toggle */}
      <div className='flex items-center gap-3'>
        <input
          type='checkbox'
          id='isPrivate'
          checked={formData.isPrivate}
          onChange={(e) =>
            setFormData({ ...formData, isPrivate: e.target.checked })
          }
          className='w-5 h-5 cursor-pointer accent-purple-600'
        />
        <label htmlFor='isPrivate' className='text-base-semibold text-light-2 cursor-pointer'>
          Private Community (requires approval to join)
        </label>
      </div>

      {/* Submit Button */}
      <button
        type='submit'
        disabled={isSubmitting}
        className='bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-semibold transition-colors'
        style={{ background: isSubmitting ? '#6b21a8' : '#7c3aed' }}
      >
        {isSubmitting ? 'Creating Community...' : 'Create Community'}
      </button>
    </form>
  );
}
