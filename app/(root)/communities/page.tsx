import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import Searchbar from "@/components/shared/Searchbar";
import Pagination from "@/components/shared/Pagination";
import CommunityCard from "@/components/cards/CommunityCard";

import { fetchUser } from "@/lib/actions/user.actions";
import { fetchCommunities } from "@/lib/actions/community.actions";

export const dynamic = 'force-dynamic';

async function Page(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const result = await fetchCommunities({
    searchString: searchParams.q,
    pageNumber: searchParams?.page ? +searchParams.page : 1,
    pageSize: 25,
  });

  return (
    <>
      <div className='flex items-center justify-between'>
        <h1 className='head-text'>Communities</h1>
        <a
          href='/communities/create'
                    className='bg-black hover:bg-purple-600/20 text-purple-600 p-2 sm:bg-purple-600 sm:hover:bg-purple-700 sm:text-white sm:px-6 sm:py-2.5 rounded-lg text-sm sm:text-base font-semibold transition-colors flex items-center sm:gap-2 border border-purple-600/20 sm:border-0'
          // className='bg-black hover:bg-gray-900 text-white p-2 sm:bg-purple-600 sm:hover:bg-purple-700 sm:px-6 sm:py-2.5 rounded-lg text-sm sm:text-base font-semibold transition-colors flex items-center sm:gap-2 border border-gray-800 sm:border-0'
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span className="hidden sm:inline">Create Community</span>
        </a>
      </div>

      <div className='mt-5'>
        <Searchbar routeType='communities' />
      </div>

      <section className='mt-9 flex flex-wrap gap-4'>
        {result.communities.length === 0 ? (
          <p className='no-result'>No Result</p>
        ) : (
          <>
            {result.communities.map((community) => (
              <CommunityCard
                key={community.id}
                id={community.id}
                name={community.name}
                username={community.username}
                imgUrl={community.image}
                bio={community.bio}
                members={community.members}
              />
            ))}
          </>
        )}
      </section>

      <Pagination
        path='communities'
        pageNumber={searchParams?.page ? +searchParams.page : 1}
        isNext={result.isNext}
      />
    </>
  );
}

export default Page;
