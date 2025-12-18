import Image from "next/image";
import { currentUser } from "@clerk/nextjs";

import { communityTabs } from "@/constants";

import UserCard from "@/components/cards/UserCard";
import ProfileHeader from "@/components/shared/ProfileHeader";
import CommunityChat from "@/components/shared/CommunityChat";
import JoinCommunityButton from "@/components/shared/JoinCommunityButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { fetchCommunityDetails } from "@/lib/actions/community.actions";
import { fetchCommunityMessages } from "@/lib/actions/message.actions";

async function Page({ params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return null;

  const communityDetails = await fetchCommunityDetails(params.id);
  const isMember = communityDetails.members.some((member: any) => member.id === user.id);
  
  let messages: any[] = [];
  if (isMember) {
    messages = await fetchCommunityMessages(params.id);
  }

  return (
    <section>
      <ProfileHeader
        accountId={communityDetails.createdBy.id}
        authUserId={user.id}
        name={communityDetails.name}
        username={communityDetails.username}
        imgUrl={communityDetails.image}
        bio=''
        type='Community'
      />

      {!isMember && (
        <div className='flex justify-center'>
          <JoinCommunityButton
            communityId={params.id}
            userId={user.id}
            isMember={false}
            isPrivate={communityDetails.isPrivate}
          />
        </div>
      )}

      <div>
        <Tabs defaultValue='chat' className='w-full'>
          <TabsList className='tab'>
            <TabsTrigger value='chat' className='tab'>
              <Image
                src='/assets/reply.svg'
                alt='chat'
                width={24}
                height={24}
                className='object-contain'
              />
              <p className='max-sm:hidden'>Chat</p>
            </TabsTrigger>
            <TabsTrigger value='members' className='tab'>
              <Image
                src='/assets/members.svg'
                alt='group info'
                width={24}
                height={24}
                className='object-contain'
              />
              <p className='max-sm:hidden'>Group Info</p>
              <p className='ml-1 rounded-sm bg-light-4 px-2 py-1 !text-tiny-medium text-light-2'>
                {communityDetails.members.length}
              </p>
            </TabsTrigger>
          </TabsList>

          <TabsContent value='chat' className='w-full text-light-1'>
            {isMember ? (
              <CommunityChat
                communityId={params.id}
                currentUserId={user.id}
                initialMessages={messages}
              />
            ) : (
              <div className='flex flex-col items-center justify-center h-64 bg-dark-2 rounded-lg'>
                <p className='text-light-3 text-center mb-4'>
                  Join this community to view and send messages
                </p>
                <JoinCommunityButton
                  communityId={params.id}
                  userId={user.id}
                  isMember={false}
                  isPrivate={communityDetails.isPrivate}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value='members' className='w-full text-light-1'>
            {communityDetails.bio && (
              // <div className='mb-8 p-6 rounded-lg' style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(124, 58, 237, 0.3)' }}>
                <p className='mb-8 pt-3 text-base-regular text-light-2'>{communityDetails.bio}</p>
              // </div>
            )}
            <h3 className='text-heading3-bold text-light-1 mb-6'>Members ({communityDetails.members.length})</h3>
            <section className='flex flex-col gap-6'>
              {communityDetails.members.map((member: any) => (
                <UserCard
                  key={member.id}
                  id={member.id}
                  name={member.name}
                  username={member.username}
                  imgUrl={member.image}
                  personType='User'
                />
              ))}
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

export default Page;
