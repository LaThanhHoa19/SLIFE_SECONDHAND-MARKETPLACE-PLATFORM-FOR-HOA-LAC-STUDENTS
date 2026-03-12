<div className="layout-container flex h-full grow flex-col">
  {/* Top Navigation Bar */}
  <main className="flex-1">
    {/* Hero Section */}
    <section className="relative overflow-hidden px-6 py-16 md:py-24 lg:px-20">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 text-center lg:text-left space-y-8 z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.1] tracking-tight text-slate-900 dark:text-white">
            SLIFE - Chốt đồ cũ,<br /><span className="text-primary">Đủ đồ dùng</span>, Ngay tại Hòa Lạc
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto lg:mx-0">
            Nền tảng mua bán ký gửi dành riêng cho sinh viên FPT University. An toàn, tiết kiệm và cực kỳ tiện lợi ngay trong Campus.
          </p>
          <div className="flex flex-wrap justify-center lg:justify-start gap-4">
            <button className="px-8 py-4 bg-primary text-white rounded-full font-bold text-lg shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all animate-sparkle">Khám phá ngay</button>
            <button className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 rounded-full font-bold text-lg hover:bg-slate-50 transition-all animate-sparkle">Đăng tin bán</button>
          </div>
        </div>
        <div className="flex-1 relative w-full aspect-square md:aspect-video lg:aspect-square rounded-3xl overflow-hidden shadow-2xl border-8 border-white dark:border-slate-800">
          <img className="w-full h-full object-cover" data-alt="Students studying together with electronics and books" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDye8aE83yOsZyyyA94rSwLlkDj6YXwOcSSj3NySZh5JnWYPdJA3F3beWwSwpHWE4OHWUGJ82aw8Zvih-QQ1iSW977QsvzrBhdjOAi0wiu8U8jh6pdVYLQKnbNSnjXzEvBM0SZzAoBFxbTWdVruSs-58OIpOGA1eIPvdVgHX5r-vl_mKXN4MUz91fnnxGpltzL0CFiwxz2zlaUbTcuY-muhlu5MnDpIj_lv6gsZH3_kOJoBfW3ksj-1Yfydsxms2aHKjoUrtpCPqCg" />
          <div className="absolute bottom-6 left-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur p-4 rounded-2xl shadow-xl flex items-center gap-4">
            <div className="size-12 bg-primary/20 rounded-full flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">local_fire_department</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vừa đăng bán</p>
              <p className="font-bold">Macbook Air M1 - 12.5tr</p>
            </div>
          </div>
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
        <h2 className="text-3xl font-bold">Danh mục nổi bật</h2>
        <a className="text-primary font-bold hover:underline flex items-center gap-1" href="#">
          Xem tất cả <span className="material-symbols-outlined">trending_flat</span>
        </a>
      </div>
        <div className="overflow-hidden relative">
          <div className="py-4 grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {/* Original set of 5 items */}
            <div className="relative group cursor-pointer overflow-hidden rounded-2xl w-full aspect-square"><img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" data-alt="Electronics and laptops" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDea6dytfNyiYv1ZPFcchis38NQKpObBA7ssSqcigpj4QqvWpiVet3bc6I0AGQ7lyRB1BAde2ItgA7eo_nbszR8lXOLNNACOH61s4DM0K2RKuqkZI_BGW1BW0eDbE8JUcEivT9AoguhyF5hAg0kELt3Kgbw6C6foOvywAFCcyaxTPRIluO-wAs8C-EHul6SrCu4UQlXQcrRiGtATlfDXWzYRStX_wW6WW6mBziQNpcdlC7bJ9FqMb5MuaILYInMnPxYJa-1OzQBSxU" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 text-left items-start"><h4 className="text-white font-bold text-sm md:text-lg">Thiết bị điện tử</h4>
                <p className="text-white/80 text-xs mt-1">342 tin đăng</p></div></div>
            <div className="relative group cursor-pointer overflow-hidden rounded-2xl w-full aspect-square"><img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" data-alt="Stack of textbooks" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDB-20JCnSlxNmUaubxteX6YhtEGy30H7RKVFMRqOkYi9nyUJzrJEEwywM9CYu8kxHCDb5PAjUc1tmCODpdtJ7H1yz-t9GpQjj_3eWGffVSVFH1XjjF8VY-TS66KSg299Nsg_mVnZ4ezGgtCnFCh2cQIdjb457ao1xzFzc3NsuqFsImnzSzSm_Fvh0dmNaiXdosDJofb5sHqPgmdvXnNOOgubeeGKemVyimt9FT5RYahLJkJspM77-t5PEimiiW4s7sakCh_TPNiuo" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 text-left items-start">
                <h4 className="text-white font-bold text-sm md:text-base">Sách giáo khoa</h4>
                <p className="text-white/80 text-xs mt-1">156 tin đăng</p>
              </div></div>
            <div className="relative group cursor-pointer overflow-hidden rounded-2xl w-full aspect-square"><img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" data-alt="Dorm room furniture and gear" src="data:image/png;base64,placeholder" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 text-left items-start">
                <h4 className="text-white font-bold text-sm md:text-base">Đồ dùng Dorm</h4>
                <p className="text-white/80 text-xs mt-1">89 tin đăng</p>
              </div></div>
            <div className="relative group cursor-pointer overflow-hidden rounded-2xl w-full aspect-square"><img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" data-alt="Fashionable clothes and sneakers" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJsL92ad15FcecO2VTYQhXDcfdUUWPns5sNq8Et0l8Ew5LGrr-2hPn-IhHFV5acLkejd-c1en5W5ZXwrKCsYAtDdkvVRfJCXtz4PNtN5HCh3gEOaMlytS3mr0-flDhT7AjY6llWgMEhac6O5I61EhHTMQXMToGFb5z2tF0bjEdLq-zc5dVYF8kjnOiJesDhGcuG2Wb2sMdCFctlhBx569uias9vBJjeGvBf-scYKHGlMt1JRKYSdJf1nMf-dA5ZJ7cqtqHABrkaSQ" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 text-left items-start">
                <h4 className="text-white font-bold text-sm md:text-base">Thời trang</h4>
                <p className="text-white/80 text-xs mt-1">521 tin đăng</p>
              </div></div>
            <div className="relative group cursor-pointer overflow-hidden rounded-2xl w-full aspect-square"><img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" data-alt="Sports gear" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDbofF5y505BWr0LTfcjBPBmb4U1iutFQimDRSG7C_-E5aQxaH609lCH3qRjZ4lrX2VUUzY9vLK_5OPVEiLb6vnfYih5rOVcVV8bSjcIdpYg6DapKyCxVnu-MLeQyOQ-7Utjg_s8uwyLexHGmpo-IYEeiRtrme7m9z-jMCzhKFmw6tku2Pppezl5q7CLdMc47Pi_0k18XhW092iC-13QR9Oy7aLV7KpmVyeXgz5glfPBHHMnAD6t0_U4j_JZqFMk7mwbOvgFQVptvw" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 text-left items-start">
                <h4 className="text-white font-bold text-sm md:text-base">Thể thao</h4>
                <p className="text-white/80 text-xs mt-1">112 tin đăng</p>
              </div></div>
            {/* Duplicated set for seamless loop */}
          </div>
        </div></div>
    </section>
    {/* Live Feed / Active Listings */}
    <section className="py-16 bg-slate-50 dark:bg-slate-800/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-bold">Tin mới nhất</h2>
          <a className="text-primary font-bold hover:underline flex items-center gap-1" href="#">
            Xem tất cả <span className="material-symbols-outlined">trending_flat</span>
          </a>
        </div>
        <div className="overflow-hidden relative">
          <div className="animate-auto-scroll gap-6 py-4">
            {/* Original set of cards */}
            <div className="w-72 flex-shrink-0 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-105 transition-all duration-300">
              <div className="relative aspect-square"><img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDADcautLMqgRVFSzIufK4J3_93dfTbKzOwNMZWMp_m0Y7yabt_9VE3N5TBiHNQLpyvaHKkXHTLbSBmxucPnbru-DH6loQjPe23fbfyueK_Bm8s94VE5LeDEr9UGxiBiB2XRa5SHX1QiUPbuqkGs6xdNP3zCcHHHa8eeOjUqjmCmRZSj0ONAKIesqUc5h0Fa1UXJpmk417L1YdTr0Rg5J6RGqnZT36Fs6GUtvC2bAO60ruDHsSBFxsP7SNnQqP1aLdqr4B5uBfspSE" /><span className="absolute top-3 left-3 px-3 py-1 text-white text-xs font-bold rounded-full" style={{ backgroundColor: '#f26e21' }}>Pass gấp</span></div>
              <div className="p-4"><h4 className="font-bold truncate">iPad Pro 11-inch M1 128GB</h4><p className="text-primary font-bold">9.500.000đ</p></div>
            </div>
            <div className="w-72 flex-shrink-0 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-105 transition-all duration-300">
              <div className="relative aspect-square"><img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAaaBLO8xbex7of-4gUkz1qRQZHzgITdcXz_ReZduc2K1g_Jnv0ZMkT19iO4TROozAEHgzybj0OQhqQHoq0g8Ero-e_yDJ5vrN_CmFEp99wxXamILs4fkjrOj-yPzaU26iesQdXgo7N_UIcOlawkcUvO9RQ6_CWJCD5G3vBAd3yKCvcTjR-vmI3ooTl0Y8W7yRxw9UuCiJP1tOKVUl2KswmILs1maKxvetm9p8BaNdIOxfXa1CLh0QOXXJ_bXfJbSjkr87ecIssIAw" /><span className="absolute top-3 left-3 px-3 py-1 text-white text-xs font-bold rounded-full uppercase" style={{ backgroundColor: '#10b981' }}>Tặng miễn phí</span></div>
              <div className="p-4"><h4 className="font-bold truncate">Bộ sách chuyên ngành SE kỳ 1</h4><p className="text-green-600 font-bold">0đ (Giveaway)</p></div>
            </div>
            <div className="w-72 flex-shrink-0 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-105 transition-all duration-300">
              <div className="relative aspect-square"><img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDbofF5y505BWr0LTfcjBPBmb4U1iutFQimDRSG7C_-E5aQxaH609lCH3qRjZ4lrX2VUUzY9vLK_5OPVEiLb6vnfYih5rOVcVV8bSjcIdpYg6DapKyCxVnu-MLeQyOQ-7Utjg_s8uwyLexHGmpo-IYEeiRtrme7m9z-jMCzhKFmw6tku2Pppezl5q7CLdMc47Pi_0k18XhW092iC-13QR9Oy7aLV7KpmVyeXgz5glfPBHHMnAD6t0_U4j_JZqFMk7mwbOvgFQVptvw" /></div>
              <div className="p-4"><h4 className="font-bold truncate">Nike Air Max (Size 42)</h4><p className="text-primary font-bold">850.000đ</p></div>
            </div>
            <div className="w-72 flex-shrink-0 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-105 transition-all duration-300">
              <div className="relative aspect-square"><img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBUxVGXI6rpHzcjbP7t8wZWfZlZFvJHmtSxZVfDBHcqvKTIXj49LIbLeHDcPvfcVWC5Cyi6C5vOW0rSJpeADG1sBpdhyWRq5gFFRI4GUI0QwmumQ40lOPDJ8FRvt1QbT-RoHAabfvi9IkCwwvCESVgwhyp_Z9sZxRxudxrSeapjJHSnD12kuiS_0hotnKRAKlBnoTUJ75ghnIe-JLGOheA1fWjiKsgs71XX6shlx6NmsFzxsyDYL_CEf9K3M3NrMx7PWgbexRndVZ8" /></div>
              <div className="p-4"><h4 className="font-bold truncate">Máy ảnh Fujifilm X-T30</h4><p className="text-primary font-bold">14.200.000đ</p></div>
            </div>
            {/* Duplicated set for seamless loop */}
            <div className="w-72 flex-shrink-0 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-105 transition-all duration-300">
              <div className="relative aspect-square"><img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDADcautLMqgRVFSzIufK4J3_93dfTbKzOwNMZWMp_m0Y7yabt_9VE3N5TBiHNQLpyvaHKkXHTLbSBmxucPnbru-DH6loQjPe23fbfyueK_Bm8s94VE5LeDEr9UGxiBiB2XRa5SHX1QiUPbuqkGs6xdNP3zCcHHHa8eeOjUqjmCmRZSj0ONAKIesqUc5h0Fa1UXJpmk417L1YdTr0Rg5J6RGqnZT36Fs6GUtvC2bAO60ruDHsSBFxsP7SNnQqP1aLdqr4B5uBfspSE" /><span className="absolute top-3 left-3 px-3 py-1 text-white text-xs font-bold rounded-full" style={{ backgroundColor: '#f26e21' }}>Pass gấp</span></div>
              <div className="p-4"><h4 className="font-bold truncate">iPad Pro 11-inch M1 128GB</h4><p className="text-primary font-bold">9.500.000đ</p></div>
            </div>
            <div className="w-72 flex-shrink-0 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-105 transition-all duration-300">
              <div className="relative aspect-square"><img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAaaBLO8xbex7of-4gUkz1qRQZHzgITdcXz_ReZduc2K1g_Jnv0ZMkT19iO4TROozAEHgzybj0OQhqQHoq0g8Ero-e_yDJ5vrN_CmFEp99wxXamILs4fkjrOj-yPzaU26iesQdXgo7N_UIcOlawkcUvO9RQ6_CWJCD5G3vBAd3yKCvcTjR-vmI3ooTl0Y8W7yRxw9UuCiJP1tOKVUl2KswmILs1maKxvetm9p8BaNdIOxfXa1CLh0QOXXJ_bXfJbSjkr87ecIssIAw" /><span className="absolute top-3 left-3 px-3 py-1 text-white text-xs font-bold rounded-full uppercase" style={{ backgroundColor: '#10b981' }}>Tặng miễn phí</span></div>
              <div className="p-4"><h4 className="font-bold truncate">Bộ sách chuyên ngành SE kỳ 1</h4><p className="text-green-600 font-bold">0đ (Giveaway)</p></div>
            </div>
            <div className="w-72 flex-shrink-0 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-105 transition-all duration-300">
              <div className="relative aspect-square"><img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDbofF5y505BWr0LTfcjBPBmb4U1iutFQimDRSG7C_-E5aQxaH609lCH3qRjZ4lrX2VUUzY9vLK_5OPVEiLb6vnfYih5rOVcVV8bSjcIdpYg6DapKyCxVnu-MLeQyOQ-7Utjg_s8uwyLexHGmpo-IYEeiRtrme7m9z-jMCzhKFmw6tku2Pppezl5q7CLdMc47Pi_0k18XhW092iC-13QR9Oy7aLV7KpmVyeXgz5glfPBHHMnAD6t0_U4j_JZqFMk7mwbOvgFQVptvw" /></div>
              <div className="p-4"><h4 className="font-bold truncate">Nike Air Max (Size 42)</h4><p className="text-primary font-bold">850.000đ</p></div>
            </div>
            <div className="w-72 flex-shrink-0 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-105 transition-all duration-300">
              <div className="relative aspect-square"><img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBUxVGXI6rpHzcjbP7t8wZWfZlZFvJHmtSxZVfDBHcqvKTIXj49LIbLeHDcPvfcVWC5Cyi6C5vOW0rSJpeADG1sBpdhyWRq5gFFRI4GUI0QwmumQ40lOPDJ8FRvt1QbT-RoHAabfvi9IkCwwvCESVgwhyp_Z9sZxRxudxrSeapjJHSnD12kuiS_0hotnKRAKlBnoTUJ75ghnIe-JLGOheA1fWjiKsgs71XX6shlx6NmsFzxsyDYL_CEf9K3M3NrMx7PWgbexRndVZ8" /></div>
              <div className="p-4"><h4 className="font-bold truncate">Máy ảnh Fujifilm X-T30</h4><p className="text-primary font-bold">14.200.000đ</p></div>
            </div>
          </div>
        </div>
      </div>
    </section>
    {/* How it works */}
    <section className="py-20 scroll-fade-target">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-bold mb-16 text-center">3 bước chốt đơn cực nhanh</h2>
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Connector line for desktop */}
          <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-1 bg-slate-200 dark:bg-slate-700 -z-10 overflow-hidden rounded-full">
            <div className="connector-line h-full bg-primary transition-all duration-[300000] ease-in-out" style={{ width: 0 }} />          </div>
          <div className="flex flex-col items-center text-center">
            <div className="size-20 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6 shadow-lg shadow-primary/30 animate-pulse-custom">1</div>
            <h3 className="text-xl font-bold mb-3">Login FPT SSO</h3>
            <p className="text-slate-600 dark:text-slate-400">Đăng nhập bằng tài khoản @fpt.edu.vn để bắt đầu mua bán.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="size-20 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6 shadow-lg shadow-primary/30 animate-pulse-custom">2</div>
            <h3 className="text-xl font-bold mb-3">Chat &amp; Trả giá</h3>
            <p className="text-slate-600 dark:text-slate-400">Trực tiếp nhắn tin với người bán, thỏa thuận giá và địa điểm hẹn.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="size-20 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6 shadow-lg shadow-primary/30 animate-pulse-custom">3</div>
            <h3 className="text-xl font-bold mb-3">Check &amp; Giao dịch</h3>
            <p className="text-slate-600 dark:text-slate-400">Gặp mặt tại Campus, kiểm tra đồ kỹ càng và thanh toán trực tiếp.</p>
          </div>
        </div>
      </div>
    </section>
    {/* Trust Indicators */}
    {/* Trust Indicators */}
    <section className="py-16 relative z-10 bg-primary">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-white text-center">
          <div className="stat-counter transition-all duration-700 ease-out">
            <p className="text-4xl md:text-6xl font-black mb-2 stat-number text-white" data-suffix="+" data-target={5000}>0+</p>
            <p className="text-white font-bold text-lg">Sinh viên tham gia</p>
          </div>
          <div className="stat-counter transition-all duration-700 ease-out">
            <p className="text-4xl md:text-6xl font-black mb-2 stat-number text-white" data-suffix="+" data-target={12500}>0+</p>
            <p className="text-white font-bold text-lg">Giao dịch thành công</p>
          </div>
          <div className="stat-counter transition-all duration-700 ease-out">
            <p className="text-4xl md:text-6xl font-black mb-2 stat-number text-white" data-suffix="/5" data-target="4.9">0/5</p>
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
