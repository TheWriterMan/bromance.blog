import React, { useState } from 'react';
import { Menu, X, ChevronRight, Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';

// --- Types ---
interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string;
  published_at: string;
  featured_image: string;
  views: number;
  likes: number;
  comments: number;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

interface SiteSettings {
  siteName: string;
  description: string;
  contactEmail: string;
  copyRights: string;
}

// --- Mock Data ---
const siteSettings: SiteSettings = {
  siteName: "VIBES 블로그",
  description: "All things Music and Culture",
  contactEmail: "hello@example.com",
  copyRights: "© 2024 Vibes Blog. All rights reserved."
};

const mockImages = [
  "https://loremflickr.com/800/600/anime?lock=11",
  "https://loremflickr.com/800/600/anime?lock=12",
  "https://loremflickr.com/800/600/anime?lock=13",
  "https://loremflickr.com/800/600/anime?lock=14",
  "https://loremflickr.com/800/600/anime?lock=15"
];

const mockArtistImages = [
  "https://api.dicebear.com/8.x/micah/svg?seed=Mimi",
  "https://api.dicebear.com/8.x/micah/svg?seed=Nana",
  "https://api.dicebear.com/8.x/micah/svg?seed=Yuki",
  "https://api.dicebear.com/8.x/micah/svg?seed=Ken"
];

const mockPosts: Post[] = Array.from({ length: 5 }).map((_, i) => ({
  id: `post-${i + 1}`,
  title: [
    "Exploring the New Sounds of the Season",
    "The Evolution of Modern Melodies in Popular Culture",
    "A Deep Dive into the Latest Debut Album",
    "How Visual Aesthetics Shape Our Musical Experience",
    "Behind the Scenes with the Rising Stars"
  ][i],
  slug: `post-${i + 1}`,
  content: "<p>Lorem ipsum...</p>",
  summary: "An introspective look at how the latest trends are reshaping the cultural landscape. Discover the nuances and underlying themes that make this release truly unique.",
  published_at: "December 4, 2023",
  featured_image: mockImages[i],
  views: 1200 + i * 300,
  likes: 340 + i * 12,
  comments: 45 + i * 3,
  category: { id: "c1", name: "Music", slug: "music" },
  tags: []
}));

const mockDetailPost: Post = {
  ...mockPosts[3],
  title: "A Comprehensive Fan Review of the Newest Album Release",
  content: `
    <p class="mb-6 text-lg leading-relaxed">Having immersed myself in the soul-stirring melodies of the latest album, I find myself compelled to share the emotional rollercoaster this musical journey unfolded.</p>
    <p class="mb-6 text-lg leading-relaxed">The title track immediately captivated me with its haunting beauty, delving into themes of love and loss. The soulful vocals acted as a guide, leading me through a landscape where every note carried the weight of shared emotions.</p>
    <img src="${mockImages[1]}" class="my-10 w-full h-auto aspect-video object-cover rounded-sm shadow-md" alt="Album detail" />
    <h3 class="text-2xl font-bold mb-4 mt-8">The Melancholic Melodies</h3>
    <p class="mb-6 text-lg leading-relaxed">As the album unfolded, the melancholic melodies painted a vivid picture of introspection. The raw vulnerability in the voice struck a chord, making it an emotional centerpiece. The upbeat rhythms brought a surprising but welcomed contrast, showcasing diversity.</p>
    <p class="mb-6 text-lg leading-relaxed">It isn't merely a collection of songs but a meticulously crafted narrative. Each track seamlessly transitions into the next, creating a cohesive storytelling experience.</p>
  `
};

// --- Main Component ---
export default function App() {
  const [view, setView] = useState<'home' | 'post'>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const primaryColor = "text-[#2e10a5]";
  const bgColor = "bg-[#ffeceb]";
  const borderColor = "border-[#2e10a5]";

  const Header = () => (
    <header className="pt-8 pb-4 px-6 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 
            onClick={() => setView('home')} 
            className={`text-4xl md:text-5xl font-black tracking-tighter cursor-pointer ${primaryColor}`}
          >
            {siteSettings.siteName}
          </h1>
          <p className={`mt-2 font-medium ${primaryColor}`}>{siteSettings.description}</p>
        </div>
        <div className={`hidden md:flex gap-4 font-bold text-sm tracking-wide ${primaryColor}`}>
          <a href="#" className="hover:underline decoration-dotted underline-offset-4">SUBSCRIBE</a>
          <a href="#" className="hover:underline decoration-dotted underline-offset-4">NEWSLETTER</a>
          <Menu className="w-5 h-5 cursor-pointer" />
        </div>
      </div>
      <nav className={`flex gap-6 font-bold text-sm tracking-wider ${primaryColor} mb-4`}>
        {['MUSIC', 'CULTURE', 'TRENDS', 'DEBUTS', 'FANS'].map((item) => (
          <a key={item} href="#" className="hover:underline decoration-dotted underline-offset-4">{item}</a>
        ))}
      </nav>
      <hr className={`border-b-2 border-dotted ${borderColor} opacity-50`} />
    </header>
  );

  const Footer = () => (
    <footer className="mt-20 py-12 px-6 border-t-2 border-solid border-white max-w-7xl mx-auto w-full flex flex-col md:flex-row justify-between items-start gap-8">
      <div>
        <h2 className={`text-3xl font-black tracking-tighter ${primaryColor}`}>{siteSettings.siteName}</h2>
        <p className={`mt-2 text-sm font-medium ${primaryColor}`}>{siteSettings.description}</p>
      </div>
      <div className="flex gap-16">
        <div className={`flex flex-col gap-2 ${primaryColor}`}>
          <h3 className="font-bold mb-2">MORE FROM US</h3>
          <a href="#" className="text-sm underline decoration-dotted underline-offset-4">Newsletter</a>
          <a href="#" className="text-sm underline decoration-dotted underline-offset-4">Subscribe</a>
        </div>
        <div className={`flex flex-col gap-2 ${primaryColor}`}>
          <h3 className="font-bold mb-2">CONTACTS</h3>
          <a href="#" className="text-sm underline decoration-dotted underline-offset-4">Contact Us</a>
          <a href="#" className="text-sm underline decoration-dotted underline-offset-4">Questions</a>
        </div>
      </div>
    </footer>
  );

  const HomeView = () => (
    <div className="max-w-7xl mx-auto w-full">
      {/* Trending Section */}
      <section className="px-6 mb-16 mt-8">
        <h2 className={`text-4xl font-extrabold mb-4 ${primaryColor}`}>Trending</h2>
        <hr className={`border-b-2 border-dotted ${borderColor} mb-8`} />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mockPosts.slice(0, 3).map((post) => (
            <div key={post.id} className="group cursor-pointer flex flex-col gap-3" onClick={() => setView('post')}>
              <img src={post.featured_image} alt={post.title} className="w-full aspect-[4/3] object-cover rounded-sm border-2 border-transparent group-hover:border-[#2e10a5] group-hover:shadow-[6px_6px_0px_#2e10a5] group-hover:-translate-y-1 transition-all" />
              <h3 className={`text-xl font-bold leading-tight group-hover:underline ${primaryColor}`}>{post.title}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Main Feed */}
      <section className="px-6 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Feature */}
          <div className="lg:col-span-1 flex flex-col group">
            <img 
              src={mockPosts[3].featured_image} 
              alt={mockPosts[3].title}
              className="w-full aspect-video object-cover rounded-sm mb-6 cursor-pointer border-2 border-transparent group-hover:border-[#2e10a5] group-hover:shadow-[6px_6px_0px_#2e10a5] group-hover:-translate-y-1 transition-all" 
              onClick={() => setView('post')}
            />
            <h3 className={`text-3xl font-extrabold leading-tight mb-3 cursor-pointer hover:underline ${primaryColor}`} onClick={() => setView('post')}>
              {mockPosts[3].title}
            </h3>
            <p className={`text-sm font-semibold opacity-70 mb-4 uppercase tracking-wide ${primaryColor}`}>Jane Doe • {mockPosts[3].published_at}</p>
            <p className={`text-base leading-relaxed ${primaryColor}`}>{mockPosts[3].summary}</p>
            <button className={`mt-4 text-sm font-bold uppercase tracking-wider ${primaryColor} hover:underline self-start`} onClick={() => setView('post')}>
              Read more
            </button>
          </div>

          {/* Sub Grid */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-12">
            {[mockPosts[1], mockPosts[2], mockPosts[4], mockPosts[0]].map((post, idx) => (
              <div key={idx} className="flex flex-col group cursor-pointer" onClick={() => setView('post')}>
                <img src={post.featured_image} alt={post.title} className="w-full aspect-video object-cover rounded-sm mb-4 border-2 border-transparent group-hover:border-[#2e10a5] group-hover:shadow-[4px_4px_0px_#2e10a5] group-hover:-translate-y-1 transition-all" />
                <h4 className={`text-2xl font-bold leading-tight mb-2 group-hover:underline ${primaryColor}`}>
                  {post.title}
                </h4>
                <p className={`text-xs font-semibold opacity-70 mb-3 uppercase tracking-wide ${primaryColor}`}>John Smith • {post.published_at}</p>
                <hr className={`border-b border-dotted ${borderColor} opacity-30 mb-3`} />
                <p className={`text-sm opacity-90 line-clamp-2 leading-relaxed ${primaryColor}`}>{post.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Banner Section */}
      <section className={`w-full bg-[#2e10a5] text-[#ffeceb] py-16 px-6 mb-16`}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-extrabold text-center mb-12">Featured Artists</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {mockArtistImages.map((img, i) => (
              <div key={i} className="relative group cursor-pointer hover:-translate-y-2 transition-transform" onClick={() => setView('post')}>
                <img src={img} alt={`Artist ${i + 1}`} className="w-full aspect-square object-cover bg-white rounded-sm border-2 border-transparent group-hover:border-white group-hover:shadow-[6px_6px_0px_white] transition-all" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2e10a5]/80 to-transparent flex items-end p-4 rounded-sm">
                  <p className="font-bold text-lg underline decoration-dotted underline-offset-4">Artist {i + 1}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );

  const PostView = () => (
    <article className="max-w-7xl mx-auto w-full px-6">
      {/* Post Header */}
      <div className="text-center my-12 max-w-4xl mx-auto">
        <p className={`text-sm font-bold tracking-widest uppercase mb-4 ${primaryColor}`}>
          BY FANS, {mockDetailPost.category?.name}
        </p>
        <h1 className={`text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 ${primaryColor}`}>
          {mockDetailPost.title}
        </h1>
        <div className="flex items-center justify-center gap-4">
          <img src={mockArtistImages[2]} alt="Author" className="w-10 h-10 rounded-full object-cover border-2 border-[#2e10a5]" />
          <div className="text-left">
            <p className={`text-sm font-bold ${primaryColor}`}>Jane Doe</p>
            <p className={`text-xs opacity-70 font-semibold uppercase tracking-wide ${primaryColor}`}>{mockDetailPost.published_at}</p>
          </div>
        </div>
        
        {/* Social Action Bar */}
        <div className={`flex items-center justify-center gap-6 mt-8 py-4 border-y border-dotted ${borderColor} opacity-80`}>
          <button className={`flex items-center gap-2 hover:opacity-70 transition-opacity ${primaryColor}`}>
            <Heart className="w-5 h-5" /> <span className="font-bold text-sm">{mockDetailPost.likes}</span>
          </button>
          <button className={`flex items-center gap-2 hover:opacity-70 transition-opacity ${primaryColor}`}>
            <MessageCircle className="w-5 h-5" /> <span className="font-bold text-sm">{mockDetailPost.comments}</span>
          </button>
          <button className={`flex items-center gap-2 hover:opacity-70 transition-opacity ${primaryColor}`}>
            <Share2 className="w-5 h-5" /> <span className="font-bold text-sm">Share</span>
          </button>
          <button className={`flex items-center gap-2 hover:opacity-70 transition-opacity ml-auto ${primaryColor}`}>
            <Bookmark className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="lg:flex lg:gap-16 relative">
        {/* Main Content */}
        <div className="lg:w-2/3">
          <img 
            src={mockDetailPost.featured_image} 
            alt={mockDetailPost.title}
            className="w-full aspect-video object-cover rounded-sm mb-12 border-2 border-[#2e10a5] shadow-[8px_8px_0px_#2e10a5]"
          />
          <div 
            className={`prose prose-lg max-w-none prose-headings:text-[#2e10a5] prose-p:text-[#2e10a5] ${primaryColor}`}
            dangerouslySetInnerHTML={{ __html: mockDetailPost.content }}
          ></div>

          {/* Comments Section */}
          <div className="mt-16 pt-8 border-t-2 border-dotted border-[#2e10a5]">
            <h3 className={`text-2xl font-bold mb-8 ${primaryColor}`}>Comments ({mockDetailPost.comments})</h3>
            <div className="flex gap-4 mb-8">
              <div className="w-10 h-10 rounded-full bg-[#2e10a5] shrink-0"></div>
              <textarea 
                className={`w-full p-4 border-2 border-[#2e10a5] bg-transparent rounded-sm outline-none placeholder:opacity-50 ${primaryColor}`}
                placeholder="Leave a comment..."
                rows={3}
              ></textarea>
            </div>
            
            <div className="space-y-6">
              {[1, 2].map((_, idx) => (
                <div key={idx} className="flex gap-4">
                  <img src={mockArtistImages[idx]} className="w-10 h-10 rounded-full object-cover shrink-0 border border-[#2e10a5]" alt="Commenter" />
                  <div>
                    <p className={`font-bold text-sm ${primaryColor}`}>FanUser{idx + 1} <span className="opacity-50 font-normal ml-2">2 days ago</span></p>
                    <p className={`mt-1 text-sm ${primaryColor}`}>This album is truly a masterpiece. I've had it on repeat since it dropped!</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Toggle */}
        <button 
          className={`lg:hidden fixed bottom-6 right-6 z-40 p-4 bg-[#2e10a5] text-white rounded-full shadow-xl flex items-center justify-center`}
          onClick={() => setIsSidebarOpen(true)}
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Sidebar */}
        <aside 
          className={`fixed inset-y-0 right-0 z-50 w-80 ${bgColor} p-6 border-l-2 border-[#2e10a5] transform transition-transform duration-300 ease-in-out overflow-y-auto ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} lg:relative lg:translate-x-0 lg:w-1/3 lg:border-none lg:p-0 lg:overflow-visible`}
        >
          <div className="flex justify-between items-center lg:hidden mb-8">
            <h3 className={`font-bold ${primaryColor}`}>More Content</h3>
            <button onClick={() => setIsSidebarOpen(false)} className={primaryColor}>
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Categories */}
          <div className="mb-12">
            <hr className={`border-b-2 border-dotted ${borderColor} mb-6`} />
            <h3 className={`text-sm font-bold tracking-widest uppercase text-center mb-6 ${primaryColor}`}>Categories</h3>
            <ul className="flex flex-col gap-3">
              {['Album Reviews', 'Concert Recaps', 'Artist Spotlights', 'K-Pop Debuts'].map((cat) => (
                <li key={cat} className={`flex justify-between items-center cursor-pointer hover:underline ${primaryColor}`}>
                  <span className="font-semibold">{cat}</span>
                  <span className="text-xs opacity-70 border border-[#2e10a5] px-2 py-1 rounded-full">12</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-12">
            <hr className={`border-b-2 border-dotted ${borderColor} mb-6`} />
            <h3 className={`text-sm font-bold tracking-widest uppercase text-center mb-6 ${primaryColor}`}>WATCH</h3>
            <div className={`w-full aspect-video rounded-sm flex items-center justify-center text-white font-bold bg-gray-900 border-2 border-[#2e10a5] shadow-[4px_4px_0px_#2e10a5] relative overflow-hidden hover:-translate-y-1 transition-transform cursor-pointer`}>
              <img src={mockImages[2]} alt="Video Thumbnail" className="absolute inset-0 w-full h-full object-cover opacity-60" />
              <div className="relative z-10 text-center">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2 backdrop-blur-sm">
                  ▶
                </div>
                <p className="text-xs font-normal opacity-90">0:00 / 3:45</p>
              </div>
            </div>
            <p className={`text-xs font-bold mt-3 text-center uppercase ${primaryColor}`}>Music Video Title</p>
          </div>

          <div>
            <hr className={`border-b-2 border-dotted ${borderColor} mb-6`} />
            <h3 className={`text-sm font-bold tracking-widest uppercase text-center mb-6 ${primaryColor}`}>RELATED POSTS</h3>
            <div className="flex flex-col gap-6">
              {mockPosts.slice(1, 4).map((post, idx) => (
                <div key={idx} className="flex gap-4 items-start cursor-pointer group" onClick={() => setView('post')}>
                  <img src={post.featured_image} alt={post.title} className="w-24 h-24 object-cover shrink-0 rounded-sm border-2 border-transparent group-hover:border-[#2e10a5] group-hover:shadow-[4px_4px_0px_#2e10a5] transition-all" />
                  <div className="flex flex-col justify-between h-full py-1">
                    <h4 className={`text-sm font-bold leading-snug group-hover:underline ${primaryColor}`}>{post.title}</h4>
                    <p className={`text-xs mt-2 opacity-75 font-semibold uppercase ${primaryColor}`}>{post.published_at}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className={`w-full mt-6 py-3 border-2 border-[#2e10a5] text-sm font-bold uppercase tracking-widest hover:bg-[#2e10a5] hover:text-[#ffeceb] transition-colors ${primaryColor}`} onClick={() => setView('home')}>
              View All
            </button>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-20 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}
      </div>
    </article>
  );

  return (
    <div className={`min-h-screen font-sans ${bgColor} overflow-x-hidden selection:bg-[#2e10a5] selection:text-white`}>
      <Header />
      <main>
        {view === 'home' ? <HomeView /> : <PostView />}
      </main>
      <Footer />
    </div>
  );
}