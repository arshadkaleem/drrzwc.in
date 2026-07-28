import data from '@/data/extracted_data.json';
import HomeSlider from './components/HomeSlider';
import InnerPage from './components/InnerPage';
import Link from 'next/link';

interface PageProps {
  searchParams: Promise<{ page_id?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const { page_id } = await searchParams;

  // Handle page_id fallback (e.g. ?page_id=30)
  if (page_id) {
    const pageIdNum = parseInt(page_id, 10);
    const matchedPage = data.pages.find((p) => p.id === pageIdNum);
    if (matchedPage) {
      return <InnerPage page={matchedPage} />;
    }
  }

  // Home Page layout details
  const sliderSlides = data.home_fields.slider || [];
  const updates = data.home_fields.updates || [];
  const notifications = data.home_fields.notification || [];

  return (
    <div className="w-full flex flex-col">
      {/* 1. Image Slider Carousel */}
      <HomeSlider slides={sliderSlides} />

      {/* 2. Horizontal Scrolling News Updates */}
      <div className="w-full bg-[#c5a059]/5 border-y border-[#c5a059]/20 py-3.5 px-4 flex flex-col md:flex-row items-center">
        <div className="max-w-[1200px] mx-auto w-full flex flex-col md:flex-row items-center px-4">
          <div className="bg-[#0a1d37] text-[#c5a059] px-4 py-1.5 font-bold text-xs tracking-wider uppercase rounded-full md:mr-6 mb-3 md:mb-0 select-none shrink-0 hidden md:block font-heading border border-[#c5a059]/30">
            Updates:
          </div>
          <div className="bg-[#0a1d37] text-[#c5a059] px-4 py-1.5 font-bold text-xs tracking-wider uppercase rounded-full mb-3 md:hidden font-heading border border-[#c5a059]/30">
            Updates:
          </div>
          <div className="flex-grow marquee-container py-1.5">
            <div className="marquee-content space-x-12 pr-12">
              {updates.map((item: any, idx: number) => {
                const href = item.url.replace('https://drrzwc.in', '').replace('http://localhost/drrzwc.in', '');
                return (
                  <a
                    key={idx}
                    href={href || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-700 hover:text-[#c5a059] text-xs font-semibold flex items-center shrink-0 border-r border-zinc-200 pr-6 last:border-0 transition-colors"
                  >
                    {item.title}
                  </a>
                );
              })}
              {/* Repeated for loop */}
              {updates.map((item: any, idx: number) => {
                const href = item.url.replace('https://drrzwc.in', '').replace('http://localhost/drrzwc.in', '');
                return (
                  <a
                    key={`dup-${idx}`}
                    href={href || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-700 hover:text-[#c5a059] text-xs font-semibold flex items-center shrink-0 border-r border-zinc-200 pr-6 last:border-0 transition-colors"
                  >
                    {item.title}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Highlights Section */}
      <div className="w-full py-16 px-4 bg-[#faf9f6]">
        <div className="max-w-[1200px] mx-auto px-4 flex flex-col">
          <h2 className="text-3xl font-bold text-center text-[#0a1d37] font-heading">Highlights</h2>
          <div className="double-line-bottom-centered w-full mb-12"></div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Box 1: Online Admission */}
            <div className="bg-white rounded-lg p-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)] border-t-2 border-t-[#c5a059]/40 border-x border-b border-zinc-100 flex flex-col justify-between min-h-[140px] hover:translate-y-[-4px] hover:shadow-[0_12px_35px_rgba(197,160,89,0.15)] hover:border-[#c5a059]/40 transition-all duration-300">
              <div className="flex items-start justify-between">
                <h3 className="text-base font-bold text-zinc-800 font-heading">Admissions Online</h3>
                <span className="text-[#c5a059]"><i className="fa fa-graduation-cap text-3xl"></i></span>
              </div>
              <p className="text-[11px] text-zinc-500 font-semibold mt-2">
                <a
                  href="https://cms.drrzwc.in/Student/Register/Register"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#c5a059] flex items-center transition-colors"
                >
                  <span className="mr-1">»</span> Online Admission Process
                </a>
              </p>
            </div>

            {/* Box 2: Prospectus */}
            <div className="bg-white rounded-lg p-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)] border-t-2 border-t-[#c5a059]/40 border-x border-b border-zinc-100 flex flex-col justify-between min-h-[140px] hover:translate-y-[-4px] hover:shadow-[0_12px_35px_rgba(197,160,89,0.15)] hover:border-[#c5a059]/40 transition-all duration-300">
              <div className="flex items-start justify-between">
                <h3 className="text-base font-bold text-zinc-800 font-heading">Prospects</h3>
                <span className="text-[#c5a059]"><i className="fa fa-file text-3xl"></i></span>
              </div>
              <p className="text-[11px] text-zinc-500 font-semibold mt-2">
                <a
                  href="/wp-content/uploads/2024/02/Prospectus-2024-2025.pdf"
                  target="_blank"
                  className="hover:text-[#c5a059] flex items-center transition-colors"
                >
                  <span className="mr-1">»</span> Download Prospects PDF
                </a>
              </p>
            </div>

            {/* Box 3: ERP Login */}
            <div className="bg-white rounded-lg p-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)] border-t-2 border-t-[#c5a059]/40 border-x border-b border-zinc-100 flex flex-col justify-between min-h-[140px] hover:translate-y-[-4px] hover:shadow-[0_12px_35px_rgba(197,160,89,0.15)] hover:border-[#c5a059]/40 transition-all duration-300">
              <div className="flex items-start justify-between">
                <h3 className="text-base font-bold text-zinc-800 font-heading">ERP Login</h3>
                <span className="text-[#c5a059]"><i className="fa fa-key text-3xl"></i></span>
              </div>
              <p className="text-[11px] text-zinc-500 font-semibold mt-2">
                <a href="#" className="hover:text-[#c5a059] flex items-center transition-colors">
                  <span className="mr-1">»</span> Access Portal Login
                </a>
              </p>
            </div>

            {/* Box 4: Admissions Form */}
            <div className="bg-white rounded-lg p-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)] border-t-2 border-t-[#c5a059]/40 border-x border-b border-zinc-100 flex flex-col justify-between min-h-[140px] hover:translate-y-[-4px] hover:shadow-[0_12px_35px_rgba(197,160,89,0.15)] hover:border-[#c5a059]/40 transition-all duration-300">
              <div className="flex items-start justify-between">
                <h3 className="text-base font-bold text-zinc-800 font-heading">Admissions Form</h3>
                <span className="text-[#c5a059]"><i className="fa fa-file text-3xl"></i></span>
              </div>
              <p className="text-[11px] text-zinc-500 font-semibold mt-2">
                <Link href="/admission-forms" className="hover:text-[#c5a059] flex items-center transition-colors">
                  <span className="mr-1">»</span> View Admission Forms
                </Link>
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* 4. Notification and About Us Columns */}
      <div className="w-full py-16 px-4 bg-white border-t border-zinc-150">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* About Us (8/12 wide) */}
            <div className="lg:col-span-8 bg-[#faf9f6]/40 p-6 md:p-8 rounded-lg border border-zinc-150">
              <h2 className="text-2xl font-bold text-[#0a1d37] font-heading">About Us</h2>
              <div className="double-line-bottom w-full mb-6"></div>
              
              <p className="text-[#c5a059] font-bold text-base mb-4">
                Welcome to Dr. Rafiq Zakaria College for Women, Aurangabad
              </p>
              <p className="text-zinc-600 text-sm leading-relaxed text-justify">
                Dr. Rafiq Zakaria a renowned Islamic Scholar of International Repute, a name to conjure with in the intellectual circles of India and abroad the then minister in the state. Cabinet founded the Maulana Azad College of Arts Science & Commerce in the historic campus of Rauza Baugh; Aurangabad in 1963. The year was milestone in the history of Higher Education in the backward Region of Marathwada. Dr. Rafiq Zakaria being the founder president of the Maulana Azad Education Society has been particularly responsible for the phenomenal growth of the Maulana Azad College campus as well as Marathwada Region by introducing quite new courses in Higher Education, which are a departure from the traditional ones. His vision has borne rich fruits. The year 1968 was yet another landmark in the educational environment of Aurangabad City. It witnessed the establishment of a Ladies Section of the Maulana Azad College, in a rental building in the City Chowk area with 35 Students on its rolls.
              </p>
            </div>

            {/* Notification List (4/12 wide) */}
            <div className="lg:col-span-4 flex flex-col bg-white rounded-lg border border-zinc-200 overflow-hidden shadow-sm">
              <h2 className="noti font-semibold text-white bg-[#0a1d37] border-l-4 border-[#c5a059] px-4 py-3 text-base uppercase tracking-wider font-heading">
                Notification
              </h2>
              <div className="p-6 bg-[#faf9f6]/40 flex-grow max-h-[320px] overflow-hidden relative">
                <div className="flex flex-col space-y-4 animate-[marqueeVertical_25s_linear_infinite] hover:[animation-play-state:paused]">
                  {notifications.map((noti: any, index: number) => {
                    const href = noti.url.replace('https://drrzwc.in', '').replace('http://localhost/drrzwc.in', '');
                    return (
                      <div key={index} className="border-b border-zinc-200/60 pb-3 last:border-0">
                        <a
                          href={href || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-zinc-700 hover:text-[#c5a059] leading-snug block transition-colors"
                        >
                          {noti.title}
                        </a>
                      </div>
                    );
                  })}
                  {/* Repeat for seamless animation */}
                  {notifications.map((noti: any, index: number) => {
                    const href = noti.url.replace('https://drrzwc.in', '').replace('http://localhost/drrzwc.in', '');
                    return (
                      <div key={`dup-${index}`} className="border-b border-zinc-200/60 pb-3 last:border-0 font-sans">
                        <a
                          href={href || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-zinc-700 hover:text-[#c5a059] leading-snug block transition-colors"
                        >
                          {noti.title}
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
