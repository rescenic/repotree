'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const CookiePolicy = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Button
          onClick={() => router.back()}
          className="mb-8 flex items-center text-white rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors duration-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Go back
        </Button>

        <h1 className="text-3xl font-bold mb-6">Cookie Policy</h1>

        <div className="p-6 space-y-4 transition-colors duration-300">
          <p>
            This Cookie Policy explains how RepoTree (&quot;we&quot;,
            &quot;us&quot;, and &quot;our&quot;) uses cookies and similar
            technologies to recognize you when you visit our website at
            https://repotree.com (&quot;Website&quot;). It explains what these
            technologies are and why we use them, as well as your rights to
            control our use of them.
          </p>

          <h2 className="text-xl font-semibold">What are cookies?</h2>
          <p>
            Cookies are small data files that are placed on your computer or
            mobile device when you visit a website. Cookies are widely used by
            website owners in order to make their websites work, or to work more
            efficiently, as well as to provide reporting information.
          </p>

          <h2 className="text-xl font-semibold">Why do we use cookies?</h2>
          <p>
            We use first party and third party cookies for several reasons. Some
            cookies are required for technical reasons in order for our Website
            to operate, and we refer to these as &quot;essential&quot; or
            &quot;strictly necessary&quot; cookies. Other cookies enable us to
            track and target the interests of our users to enhance the
            experience on our Website. Third parties serve cookies through our
            Website for advertising, analytics and other purposes.
          </p>

          <h2 className="text-xl font-semibold">How can I control cookies?</h2>
          <p>
            You have the right to decide whether to accept or reject cookies.
            You can exercise your cookie preferences by clicking on the
            appropriate opt-out links provided in the cookie banner or you can
            set or amend your web browser controls to accept or refuse cookies.
          </p>

          <p>
            If you have any questions about our use of cookies or other
            technologies, please email us at privacy@repotree.com.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
