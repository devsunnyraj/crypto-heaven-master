import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import PostThread from "@/components/forms/PostThread";
import { fetchUser } from "@/lib/actions/user.actions";

async function Page(props: { searchParams: Promise<{ community?: string }> }) {
  const searchParams = await props.searchParams;
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  return (
    <>
      <h1 className='head-text'>Create Post</h1>

      <PostThread userId={userInfo._id} userCommunities={userInfo.communities || []} preselectedCommunity={searchParams.community} />
    </>
  );
}

export default Page;
