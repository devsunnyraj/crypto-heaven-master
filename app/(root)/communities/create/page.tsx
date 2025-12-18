import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import CreateCommunityForm from "@/components/forms/CreateCommunity";
import { fetchUser } from "@/lib/actions/user.actions";

async function Page() {
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  return (
    <div className='flex flex-col max-w-2xl'>
      <div className='mb-8'>
        <h1 className='head-text mb-2'>Create Community</h1>
        <p className='text-base-regular text-light-3'>
          Set up your new community with a name, description, and image. You'll be the admin and can manage members.
        </p>
      </div>
      <CreateCommunityForm userId={user.id} />
    </div>
  );
}

export default Page;
