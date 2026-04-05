import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLanding } from '../api/landingApi';
import { unwrapApiData } from '../utils/apiPayload';
import { fullImageUrl } from '../utils/constants';

/** Ảnh hero cố định — khuôn viên FPT Hòa Lạc (public/fpt.jpg). */
const HERO_SECTION_IMAGE = '/fpt.jpg';

const CAROUSEL_PLACEHOLDER_IMG =
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&q=80';


const CATEGORY_IMAGES = [
  'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80',
  'https://images.unsplash.com/photo-1512820790800-1bec6b6b0659?w=600&q=80',
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80',
  'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&q=80',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
];

function formatLinePrice(item) {
  if (item?.isGiveaway || item?.purpose === 'GIVEAWAY') return '0đ (Giveaway)';
  const p = item?.price;
  if (p == null || p === '') return '—';
  return `${Number(p).toLocaleString('vi-VN')}đ`;
}

export default function StitchLandingPage() {
  const navigate = useNavigate();
  const [landing, setLanding] = useState(null);
  const [landingError, setLandingError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getLanding();
        const data = unwrapApiData(res);
        if (!cancelled) setLanding(data);
      } catch (e) {
        if (!cancelled) setLandingError(e?.message || 'Không tải được dữ liệu landing');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadingLanding = landing === null && !landingError;

  const hero = landing?.heroListing;
  const heroImg = HERO_SECTION_IMAGE;
  const heroLine = loadingLanding
      ? 'Đang tải tin mới...'
      : hero
          ? `${hero.title} — ${formatLinePrice(hero)}`
          : 'Chưa có tin nào — hãy đăng bán đầu tiên!';

  const t = landing?.totals;
  const statUsers = t?.registeredUsers ?? 0;
  const statDeals = t?.completedDeals ?? 0;
  const statRep = t?.averageReputation != null ? Number(t.averageReputation) : 4.9;

  useEffect(() => {
    // Scroll reveal animation
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');

          // Trigger stat counters if this is the stats section
          const statNumbers = entry.target.querySelectorAll('.stat-number');
          statNumbers.forEach(stat => {
            if (!stat.dataset.animated) {
              stat.dataset.animated = 'true';
              const target = parseFloat(stat.getAttribute('data-target'));
              const suffix = stat.getAttribute('data-suffix') || '';

              let current = 0;
              const duration = 4000; // ms
              const interval = 20; // ms
              const steps = duration / interval;
              const stepValue = target / steps;

              const updateCounter = setInterval(() => {
                current += stepValue;
                if (current >= target) {
                  current = target;
                  clearInterval(updateCounter);
                }

                // Format appropriately based on if it's a decimal (e.g. 4.9)
                let displayValue = target % 1 !== 0 ? current.toFixed(1) : Math.floor(current);

                // Add commas for thousands
                if (target >= 1000) {
                  displayValue = displayValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                }

                stat.innerText = displayValue + suffix;
              }, interval);
            }
          });

          if (entry.target.classList.contains('py-20')) {
            const connector = entry.target.querySelector('.connector-line');
            if (connector) {
              setTimeout(() => {
                connector.style.width = '100%';
              }, 300);
            }
          }
        }
      });
    }, { threshold: 0.1 });

    const targets = document.querySelectorAll('.scroll-fade-target, .stat-counter, .connector-line');
    targets.forEach(target => observer.observe(target));

    return () => {
      targets.forEach(target => observer.unobserve(target));
      observer.disconnect();
    };
  }, [landing?.totals]);

  return (
      <>
        <div className="layout-container flex h-full grow flex-col">
          {/* Top Navigation Bar */}
          <main className="flex-1">
            {landingError && (
                <div className="px-6 pt-4 text-center text-amber-200 text-sm" role="status">
                  {landingError} — hiển thị nội dung mặc định.
                </div>
            )}
            {/* Hero Section */}
            <section className="relative overflow-hidden px-6 py-16 md:py-24 lg:px-20">
              <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
                <div className="w-full lg:w-[45%] text-center lg:text-left space-y-8 z-10 shrink-0">
                  <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.1] tracking-tight text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.45)]">
                    <span className="text-white">SLIFE - Chốt đồ cũ,</span><br />
                    <span className="text-violet-300">Đủ đồ dùng</span>, <span className="text-slate-100">Ngay tại Hòa Lạc</span>
                  </h1>
                  <p className="text-lg text-slate-300 max-w-xl mx-auto lg:mx-0">
                    Nền tảng mua bán ký gửi dành riêng cho sinh viên FPT University. An toàn, tiết kiệm và cực kỳ tiện lợi ngay trong Campus.
                  </p>
                  <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                    <button
                        onClick={() => navigate('/feed')}
                        className="px-8 py-4 bg-primary text-white rounded-full font-bold text-lg shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all duration-300 animate-sparkle"
                    >
                      Khám phá ngay
                    </button>
                    <button
                        onClick={() => navigate('/listings/new')}
                        className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 rounded-full font-bold text-lg hover:bg-slate-50 hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:scale-95 transition-all duration-300 animate-sparkle"
                    >
                      Đăng tin bán
                    </button>
                  </div>
                </div>
                <div className="relative w-full lg:w-[55%] aspect-video md:aspect-[16/10] lg:aspect-[4/3] rounded-3xl overflow-hidden shadow-[0_20px_80px_-15px_rgba(124,58,237,0.4)] border border-white/20 ring-1 ring-white/10 group">
                  <img
                      className="w-full h-full object-cover object-[20%_center] transition-transform duration-1000 group-hover:scale-105"
                      alt="Khuôn viên Đại học FPT Hòa Lạc"
                      src={heroImg}
                  />
                </div>
              </div>
            </section>
            {/* Value Proposition */}
            <section className="py-16 bg-white dark:bg-slate-900/50">
              <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="p-8 rounded-3xl bg-background-light dark:bg-slate-800 border border-primary/5 text-center group hover:border-primary/30 transition-all">
                    <div className="size-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-3xl">verified_user</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3">An toàn tuyệt đối</h3>
                    <p className="text-slate-600 dark:text-slate-400">Xác thực 100% qua Email @fpt.edu.vn. Không lo lừa đảo, không tài khoản ảo.</p>
                  </div>
                  <div className="p-8 rounded-3xl bg-background-light dark:bg-slate-800 border border-primary/5 text-center group hover:border-primary/30 transition-all">
                    <div className="size-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-3xl">savings</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3">Tiết kiệm tối đa</h3>
                    <p className="text-slate-600 dark:text-slate-400">Săn đồ cũ giá hời chỉ bằng 1/3 giá mới. Chuyên mục Giveaway 0đ cực chất.</p>
                  </div>
                  <div className="p-8 rounded-3xl bg-background-light dark:bg-slate-800 border border-primary/5 text-center group hover:border-primary/30 transition-all">
                    <div className="size-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-3xl">location_on</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3">Giao dịch Campus</h3>
                    <p className="text-slate-600 dark:text-slate-400">Gặp mặt trực tiếp tại Dom, Thư viện hay 7-Eleven. Không phí ship, check đồ tận tay.</p>
                  </div>
                </div>
              </div>
            </section>
            {/* Featured Categories */}
            <section className="py-8">
              <div className="max-w-7xl mx-auto px-6"><div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-bold" style={{ color: '#F8FAFC' }}>Danh mục nổi bật</h2>
                <button
                    type="button"
                    className="font-bold hover:underline flex items-center gap-1 bg-transparent border-none cursor-pointer"
                    style={{ color: '#C4B5FD' }}
                    onClick={() => navigate('/feed')}
                >
                  Xem tất cả <span className="material-symbols-outlined">trending_flat</span>
                </button>
              </div>
                <div className="overflow-hidden relative">
                  <div className="py-4 grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
                    {(landing?.categoryStats ?? []).length === 0 ? (
                        <p className="text-slate-400 text-sm col-span-full text-center py-6">Chưa có thống kê danh mục.</p>
                    ) : (
                        landing.categoryStats.map((c, idx) => (
                            <button
                                type="button"
                                key={c.categoryId ?? idx}
                                onClick={() => navigate(`/feed?category=${c.categoryId}`)}
                                className="relative group cursor-pointer overflow-hidden rounded-2xl w-full aspect-square text-left"
                            >
                              <img
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                  alt=""
                                  src={CATEGORY_IMAGES[idx % CATEGORY_IMAGES.length]}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 text-left items-start">
                                <h4 className="text-white font-bold text-sm md:text-lg">{c.name}</h4>
                                <p className="text-white/80 text-xs mt-1">{Number(c.listingCount ?? 0).toLocaleString('vi-VN')} tin đăng</p>
                              </div>
                            </button>
                        ))
                    )}
                  </div>
                </div></div>
            </section>
            {/* Live Feed / Active Listings */}
            <section className="py-16 bg-slate-50 dark:bg-slate-800/20">
              <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between mb-10">
                  <h2 className="text-3xl font-bold">Tin mới nhất</h2>
                  <button
                      type="button"
                      className="text-primary font-bold hover:underline flex items-center gap-1 bg-transparent border-none cursor-pointer"
                      onClick={() => navigate('/feed')}
                  >
                    Xem tất cả <span className="material-symbols-outlined">trending_flat</span>
                  </button>
                </div>
                <div className="overflow-hidden relative">
                  <div className="animate-auto-scroll gap-6 py-4">
                    {(() => {
                      const raw = landing?.recentListings ?? [];
                      const items = raw.length ? [...raw, ...raw] : [];
                      if (!items.length) {
                        return (
                            <p className="text-slate-500 py-8 w-full text-center col-span-full">Chưa có tin đăng nào.</p>
                        );
                      }
                      return items.map((item, idx) => (
                          <div
                              key={`${item.id}-${idx}`}
                              role="button"
                              tabIndex={0}
                              onClick={() => navigate(`/listings/${item.id}`)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') navigate(`/listings/${item.id}`);
                              }}
                              className="w-72 flex-shrink-0 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-105 transition-all duration-300 cursor-pointer"
                          >
                            <div className="relative aspect-square">
                              <img
                                  className="w-full h-full object-cover"
                                  alt=""
                                  src={fullImageUrl(item.thumbnailUrl || (item.imageUrls && item.imageUrls[0])) || CAROUSEL_PLACEHOLDER_IMG}
                              />
                            </div>
                            <div className="p-4">
                              <h4 className="font-bold truncate">{item.title}</h4>
                              <p className={item.isGiveaway || item.purpose === 'GIVEAWAY' ? 'text-green-600 font-bold' : 'text-primary font-bold'}>
                                {formatLinePrice(item)}
                              </p>
                            </div>
                          </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </section>
            {/* How it works */}
            <section className="py-20 scroll-fade-target">
              <div className="max-w-5xl mx-auto px-6">
                <h2 className="text-3xl font-bold mb-16 text-center" style={{ color: '#F8FAFC' }}>3 bước chốt đơn cực nhanh</h2>
                <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12">
                  {/* Connector line for desktop */}
                  <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-1 bg-slate-200 dark:bg-slate-700 -z-10 overflow-hidden rounded-full">
                    <div className="connector-line h-full bg-primary transition-all duration-[3000] ease-in-out" style={{ width: 0 }} />          </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="size-20 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6 shadow-lg shadow-primary/30 animate-pulse-custom">1</div>
                    <h3 className="text-xl font-bold mb-3" style={{ color: '#F1F5F9' }}>Login FPT SSO</h3>
                    <p style={{ color: '#CBD5E1' }}>Đăng nhập bằng tài khoản @fpt.edu.vn để bắt đầu mua bán.</p>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="size-20 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6 shadow-lg shadow-primary/30 animate-pulse-custom">2</div>
                    <h3 className="text-xl font-bold mb-3" style={{ color: '#F1F5F9' }}>Chat &amp; Trả giá</h3>
                    <p style={{ color: '#CBD5E1' }}>Trực tiếp nhắn tin với người bán, thỏa thuận giá và địa điểm hẹn.</p>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="size-20 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6 shadow-lg shadow-primary/30 animate-pulse-custom">3</div>
                    <h3 className="text-xl font-bold mb-3" style={{ color: '#F1F5F9' }}>Check &amp; Giao dịch</h3>
                    <p style={{ color: '#CBD5E1' }}>Gặp mặt tại Campus, kiểm tra đồ kỹ càng và thanh toán trực tiếp.</p>
                  </div>
                </div>
              </div>
            </section>
            {/* Trust Indicators */}
            {/* Trust Indicators */}
            <section className="py-16 relative z-10 bg-primary">
              <div className="max-w-7xl mx-auto px-6">
                <div
                    key={`stats-${statUsers}-${statDeals}-${statRep}`}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-white text-center"
                >
                  <div className="stat-counter transition-all duration-700 ease-out">
                    <p className="text-4xl md:text-6xl font-black mb-2 stat-number text-white" data-suffix="+" data-target={statUsers}>0+</p>
                    <p className="text-white font-bold text-lg">Sinh viên tham gia</p>
                  </div>
                  <div className="stat-counter transition-all duration-700 ease-out">
                    <p className="text-4xl md:text-6xl font-black mb-2 stat-number text-white" data-suffix="+" data-target={statDeals}>0+</p>
                    <p className="text-white font-bold text-lg">Giao dịch thành công</p>
                  </div>
                  <div className="stat-counter transition-all duration-700 ease-out">
                    <p className="text-4xl md:text-6xl font-black mb-2 stat-number text-white" data-suffix="/5" data-target={statRep}>0/5</p>
                    <p className="text-white font-bold text-lg">Điểm uy tín trung bình</p>
                  </div>
                  <div className="stat-counter transition-all duration-700 ease-out">
                    <p className="text-4xl md:text-6xl font-black mb-2 stat-number text-white" data-suffix="/7" data-target={24}>0/7</p>
                    <p className="text-white font-bold text-lg">Hỗ trợ cộng đồng</p>
                  </div>
                </div>
              </div>
            </section>
            {/* Integrated Chat UI & Giveaway Section */}
            <section className="py-20 bg-white dark:bg-slate-900 overflow-hidden">
              <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                <div>
                  <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary font-bold text-sm mb-6 uppercase tracking-wider">Trải nghiệm mượt mà</span>
                  <h2 className="text-4xl font-bold mb-6 leading-tight">Chốt deal ngay trong 1 nốt nhạc</h2>
                  <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                    Hệ thống chat tích hợp giúp bạn trao đổi nhanh chóng. Tính năng "Make Offer" cho phép bạn đưa ra mức giá mong muốn chỉ với một chạm.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800">
                      <span className="material-symbols-outlined text-primary mt-1">chat_bubble</span>
                      <div>
                        <h4 className="font-bold">Chat Real-time</h4>
                        <p className="text-sm text-slate-500">Thông báo tức thì qua email và app để bạn không bỏ lỡ deal hời.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800">
                      <span className="material-symbols-outlined text-primary mt-1">stars</span>
                      <div>
                        <h4 className="font-bold">Uy tín người bán</h4>
                        <p className="text-sm text-slate-500">Xem điểm Reputation Score dựa trên các giao dịch thực tế trước đó.</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Simulated Chat UI */}
                <div className="relative bg-slate-100 dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 max-w-sm mx-auto w-full">
                  <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-4 mb-4">
                    <div className="size-10 rounded-full bg-slate-300">
                      <img className="w-full h-full rounded-full object-cover" data-alt="Chat partner avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAnhkDQoVZClpjckZyBN2ywi51xluOMzmLfresyd3SoD0X-QmXn_yJ3oxjos3xoKyhF1e0LQCnZIJ9mKIAzm2PP6glAYTH5QMSgHSqPp92K9TEc2KQDfP-g0aQs_IKPIfyejt-WKG3dla-lVMfDJ4aMMZbuSK0Q-N83OhVRbOfXMu2xe8aPABgKnpjy8mQmT_vdTRH3Loe9DxudUo5W8Ilx4HE8-jv6KBMDiUG6Cck17pgXrL48ag_qbU8iJDIT-Ja2Ee69pQgFgrM" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Trần Thùy Linh</h4>
                      <p className="text-[10px] text-green-500 font-bold uppercase">Online</p>
                    </div>
                    <button className="ml-auto text-slate-400"><span className="material-symbols-outlined">more_vert</span></button>
                  </div>
                  <div className="space-y-4 mb-20 h-64 overflow-y-auto pr-2">
                    <div className="bg-slate-200 dark:bg-slate-700 rounded-2xl p-3 text-sm max-w-[80%]">
                      Hi bạn, cuốn sách Vovinam này còn mới không ạ?
                    </div>
                    <div className="bg-primary text-white rounded-2xl p-3 text-sm max-w-[80%] ml-auto">
                      Còn mới 95% nha bạn, mình mới thi xong kỳ trước.
                    </div>
                    <div className="bg-slate-200 dark:bg-slate-700 rounded-2xl p-3 text-sm max-w-[80%]">
                      Để mình 50k nhé? Trưa mai mình qua Dom E lấy.
                    </div>
                  </div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex gap-2 mb-3">
                      <button className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1 hover:bg-slate-50">
                        <span className="material-symbols-outlined text-sm">request_quote</span> Make Offer
                      </button>
                      <button className="flex-1 text-white py-2 rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-1 bg-primary shadow-primary/20">
                        <span className="material-symbols-outlined text-sm">check_circle</span> Accept
                      </button>
                    </div>
                    <div className="relative">
                      <input className="w-full bg-white dark:bg-slate-900 border-none rounded-full py-3 px-4 text-xs pr-12 focus:ring-1 focus:ring-primary" placeholder="Nhắn tin..." type="text" />
                      <button className="absolute right-3 top-1/2 -translate-y-1/2 text-primary">
                        <span className="material-symbols-outlined">send</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>
          {/* Footer */}
        </div>

      </>
  );
}
