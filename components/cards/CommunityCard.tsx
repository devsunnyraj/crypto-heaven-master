import Image from "next/image";
import Link from "next/link";

import { Button } from "../ui/button";

interface Props {
  id: string;
  name: string;
  username: string;
  imgUrl: string;
  bio: string;
  members: {
    image: string;
  }[];
}

function CommunityCard({ id, name, username, imgUrl, bio, members }: Props) {
  return (
    <article className='community-card'>
      <div className='flex flex-wrap items-center gap-3'>
        <Link href={`/communities/${id}`} className='relative h-12 w-12'>
          <Image
            src={imgUrl}
            alt='community_logo'
            fill            sizes="48px"            className='rounded-full object-cover'
          />
        </Link>

        <div>
          <Link href={`/communities/${id}`}>
            <h4 className='text-base-semibold text-light-1'>{name}</h4>
          </Link>
          <p className='text-small-medium text-gray-1'>@{username}</p>
        </div>
      </div>

      <p className='mt-4 text-subtle-medium text-gray-1'>{bio}</p>

      <div className='mt-5 flex flex-wrap items-center justify-between gap-3'>
        <Link href={`/communities/${id}`}>
          <Button size='sm' className='community-card_btn'>
            View
          </Button>
        </Link>

        {members.length > 0 && (
          <div className='flex items-center gap-2'>
            <div className='flex items-center'>
              {members.slice(0, 3).map((member, index) => (
                <Image
                  key={index}
                  src={member.image}
                  alt={`user_${index}`}
                  width={28}
                  height={28}
                  className={`${
                    index !== 0 && "-ml-2"
                  } rounded-full object-cover`}
                />
              ))}
            </div>
            <p className='text-subtle-medium text-gray-1'>
              {members.length} {members.length === 1 ? 'Member' : 'Members'}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

export default CommunityCard;
