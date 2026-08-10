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
        <div className="mx-auto w-full flex flex-col md:flex-row items-center px-4 md:px-12">
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
        <div className="mx-auto px-4 md:px-12 flex flex-col">
          <h2 className="text-3xl font-bold text-center text-[#0a1d37] font-heading">Highlights</h2>
          <div className="double-line-bottom-centered w-full mb-12"></div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Box 1: Online Admission */}
            <div className="group relative overflow-hidden bg-white rounded-xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border-t-4 border-t-[#c5a059] border-x border-b border-zinc-150 flex flex-col justify-between min-h-[160px] hover:-translate-y-1.5 hover:shadow-[0_15px_35px_rgba(10,29,55,0.12)] hover:border-[#c5a059] transition-all duration-300">
              {/* Background Vector Icon */}
              <div className="relative z-10 flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#0a1d37] font-heading">Admissions Online</h3>
                <span className="w-10 h-10 rounded-lg bg-[#0a1d37]/5 flex items-center justify-center text-[#c5a059] group-hover:bg-[#0a1d37] group-hover:text-white transition-colors duration-200">
                  <i className="fa fa-graduation-cap text-lg"></i>
                </span>
              </div>
              <div className="relative z-10 mt-auto">
                <a
                  href="https://cms.drrzwc.in/Student/Register/Register"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#0a1d37] hover:bg-[#c5a059] text-white hover:text-[#0a1d37] text-xs font-bold font-heading rounded-lg shadow-sm transition-all duration-200"
                >
                  <span>Online Admission Process</span>
                  <i className="fa fa-external-link text-[10px]"></i>
                </a>
              </div>
            </div>

            {/* Box 2: Prospectus */}
            <div className="group relative overflow-hidden bg-white rounded-xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border-t-4 border-t-[#c5a059] border-x border-b border-zinc-150 flex flex-col justify-between min-h-[160px] hover:-translate-y-1.5 hover:shadow-[0_15px_35px_rgba(10,29,55,0.12)] hover:border-[#c5a059] transition-all duration-300">
              <div className="relative z-10 flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#0a1d37] font-heading">Prospectus</h3>
                <span className="w-10 h-10 rounded-lg bg-[#0a1d37]/5 flex items-center justify-center text-[#c5a059] group-hover:bg-[#0a1d37] group-hover:text-white transition-colors duration-200">
                  <i className="fa fa-file-text-o text-lg"></i>
                </span>
              </div>
              <div className="relative z-10 mt-auto">
                <a
                  href="/wp-content/uploads/2024/02/Prospectus-2024-2025.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#0a1d37] hover:bg-[#c5a059] text-white hover:text-[#0a1d37] text-xs font-bold font-heading rounded-lg shadow-sm transition-all duration-200"
                >
                  <span>Download Prospectus PDF</span>
                  <i className="fa fa-external-link text-[10px]"></i>
                </a>
              </div>
            </div>

            {/* Box 3: ERP Login */}
            <div className="group relative overflow-hidden bg-white rounded-xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border-t-4 border-t-[#c5a059] border-x border-b border-zinc-150 flex flex-col justify-between min-h-[160px] hover:-translate-y-1.5 hover:shadow-[0_15px_35px_rgba(10,29,55,0.12)] hover:border-[#c5a059] transition-all duration-300">
              <div className="relative z-10 flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#0a1d37] font-heading">ERP Login</h3>
                <span className="w-10 h-10 rounded-lg bg-[#0a1d37]/5 flex items-center justify-center text-[#c5a059] group-hover:bg-[#0a1d37] group-hover:text-white transition-colors duration-200">
                  <i className="fa fa-key text-lg"></i>
                </span>
              </div>
              <div className="relative z-10 mt-auto">
                <a
                  href="https://cms.drrzwc.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#0a1d37] hover:bg-[#c5a059] text-white hover:text-[#0a1d37] text-xs font-bold font-heading rounded-lg shadow-sm transition-all duration-200"
                >
                  <span>Access Portal Login</span>
                  <i className="fa fa-external-link text-[10px]"></i>
                </a>
              </div>
            </div>

            {/* Box 4: Admissions Form */}
            <div className="group relative overflow-hidden bg-white rounded-xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border-t-4 border-t-[#c5a059] border-x border-b border-zinc-150 flex flex-col justify-between min-h-[160px] hover:-translate-y-1.5 hover:shadow-[0_15px_35px_rgba(10,29,55,0.12)] hover:border-[#c5a059] transition-all duration-300">
              <div className="relative z-10 flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#0a1d37] font-heading">Admissions Form</h3>
                <span className="w-10 h-10 rounded-lg bg-[#0a1d37]/5 flex items-center justify-center text-[#c5a059] group-hover:bg-[#0a1d37] group-hover:text-white transition-colors duration-200">
                  <i className="fa fa-file-pdf-o text-lg"></i>
                </span>
              </div>
              <div className="relative z-10 mt-auto">
                <a
                  href="/admission-forms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#0a1d37] hover:bg-[#c5a059] text-white hover:text-[#0a1d37] text-xs font-bold font-heading rounded-lg shadow-sm transition-all duration-200"
                >
                  <span>View Admission Forms</span>
                  <i className="fa fa-external-link text-[10px]"></i>
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 4. Notification and About Us Columns */}
      <div className="w-full py-16 px-4 bg-white border-t border-zinc-150">
        <div className="mx-auto px-4 md:px-12">
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
