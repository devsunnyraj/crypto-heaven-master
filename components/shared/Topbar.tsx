import { OrganizationSwitcher, SignedIn, SignOutButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Image from "next/image";
import Link from "next/link";

function Topbar() {
  return (
    <nav className='topbar'>
      <Link href='/' className='flex items-center gap-2'>
        <Image src='/logo.svg' alt='logo' width={40} height={40} />
        <p className='text-heading3-bold text-light-1 max-xs:hidden [font-family:var(--font-dancing)] text-[1.5rem]' 
          style={{background: "linear-gradient(90deg, #f1c0ff, #b8c0ff, #80ffdb)", 
                  WebkitBackgroundClip: "text", 
                  WebkitTextFillColor: "transparent", 
                  backgroundClip: "text" 
                }}>
          Crypto Heaven
        </p>
      </Link>

      <div className='flex items-center gap-1'>
        <div className='block md:hidden'>
          <SignedIn>
            <SignOutButton>
              <div className='flex cursor-pointer'>
                <Image
                  src='/assets/logout.svg'
                  alt='logout'
                  width={24}
                  height={24}
                />
              </div>
            </SignOutButton>
          </SignedIn>
        </div>

        <OrganizationSwitcher
          appearance={{
            baseTheme: dark,
            variables: {
              colorBackground: '#101012',
              colorText: '#EFEFEF',
              colorTextSecondary: '#7C7C8D',
              colorPrimary: '#877EFF',
              colorInputBackground: '#1F1F22',
              colorInputText: '#EFEFEF',
            },
            elements: {
              organizationSwitcherTrigger: "py-2 px-4 bg-dark-2 text-light-1",
              organizationSwitcherTriggerIcon: "text-light-2",
              organizationPreview: "text-light-1",
              organizationPreviewTextContainer: "text-light-1",
              organizationPreviewMainIdentifier: "text-light-1",
              organizationPreviewSecondaryIdentifier: "text-light-2",
              organizationSwitcherPopoverCard: "bg-dark-2",
              organizationSwitcherPopoverActionButton: "text-light-1 hover:bg-dark-2 hover:text-light-1",
              organizationSwitcherPopoverActionButtonText: "text-light-1",
              organizationSwitcherPopoverActionButtonIcon: "text-light-2",
              userPreviewTextContainer: "text-light-1",
              userPreviewMainIdentifier: "text-light-1",
              userPreviewSecondaryIdentifier: "text-light-2",
              avatarBox: "text-light-1",
            },
          }}
        />
      </div>
    </nav>
  );
}

export default Topbar;
