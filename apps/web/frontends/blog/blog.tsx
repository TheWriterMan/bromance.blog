import React, { useState } from 'react';
import { 
  Menu, X, Heart, MessageCircle, Share2, Bookmark, Search, 
  PanelRight, ChevronRight, ChevronLeft, Coffee, BookOpen, Star, 
  List, ArrowUpDown, User, Calendar, Eye, Lock, ArrowLeft,
  Book, Award, Settings, Sparkles, Sliders
} from 'lucide-react';

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
  read_time: string;
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
  kofiLink: string;
}

interface Novel {
  id: string;
  title: string;
  altTitle: string;
  author: string;
  translator?: string;
  coverImage: string;
  status: 'Ongoing' | 'Completed';
  rating: number;
  reviewsCount: number;
  views: string;
  genre: string[];
  tags: string[];
  synopsis: string;
  chapters: Array<{
    id: string;
    number: number;
    title: string;
    publishedAt: string;
    isLocked?: boolean;
    content: string;
  }>;
}

// --- Mock Data ---
const siteSettings: SiteSettings = {
  siteName: "BROMANCE 同人",
  description: "All things Drama, Manga, and Culture",
  contactEmail: "hello@bromance.blog",
  copyRights: "© 2026 Bromance Blog. All rights reserved.",
  kofiLink: "https://ko-fi.com/"
};

const mockCategories = [
  { id: 'drama', name: 'Drama', count: 124 },
  { id: 'novel', name: 'Novel', count: 86 },
  { id: 'manga', name: 'Manga', count: 52 },
  { id: 'anime', name: 'Anime', count: 28 },
  { id: 'random', name: 'Random', count: 195 }
];

const mockImages = [
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80", // Anime/Novel style artwork
  "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=80",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
  "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&q=80",
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80"
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
  published_at: "December 4, 2025",
  featured_image: mockImages[i],
  views: 1200 + i * 300,
  likes: 340 + i * 12,
  comments: 45 + i * 3,
  read_time: `${Math.floor(Math.random() * 5) + 3} min read`,
  category: { id: "c1", name: "Music", slug: "music" },
  tags: []
}));

const mockDetailPost: Post = {
  ...mockPosts[3],
  title: "A Comprehensive Fan Review of the Newest Album Release",
  content: `
    <p class="mb-6 text-lg leading-relaxed">Having immersed myself in the soul-stirring melodies of the latest album, I find myself compelled to share the emotional rollercoaster this musical journey unfolded.</p>
    <p class="mb-6 text-lg leading-relaxed">The title track immediately captivated me with its haunting beauty, delving into themes of love and loss. The soulful vocals acted as a guide, leading me through a landscape where every note carried the weight of shared emotions.</p>
    <img src="${mockImages[1]}" class="my-10 w-full h-auto aspect-video object-cover rounded-sm shadow-md hover:shadow-xl transition-shadow duration-300" alt="Album detail" />
    <h3 class="text-2xl font-bold mb-4 mt-8">The Melancholic Melodies</h3>
    <p class="mb-6 text-lg leading-relaxed">As the album unfolded, the melancholic melodies painted a vivid picture of introspection. The raw vulnerability in the voice struck a chord, making it an emotional centerpiece. The upbeat rhythms brought a surprising but welcomed contrast, showcasing diversity.</p>
    <p class="mb-6 text-lg leading-relaxed">It isn't merely a collection of songs but a meticulously crafted narrative. Each track seamlessly transitions into the next, creating a cohesive storytelling experience.</p>
  `
};

// --- Mock Novels Data for "MY WORK" ---
const mockNovels: Novel[] = [
  {
    id: "flee-famine-husband",
    title: "Taking My Little Husband to Flee Famine (Rebirth)",
    altTitle: "重生带小夫郎去逃荒",
    author: "Bromance Studio",
    translator: "Bromance Translations",
    coverImage: "https://images.unsplash.com/photo-1514894780887-121968d00567?w=600&q=80",
    status: "Ongoing",
    rating: 4.9,
    reviewsCount: 148,
    views: "1.2M",
    genre: ["Rebirth", "Farming", "Historical", "Bromance / BL", "Slow Burn", "Survival"],
    tags: ["Mute MC", "Dimensional Space", "Famine Migration", "Smart Protagonist", "Loyal Lover", "Sweet Romance"],
    synopsis: `Waking up in a destitute village on the brink of a historic catastrophic famine, Lu Yan discovers he has reborn back to his 19-year-old self. Beside him is his 'little husband'—a mute, thin youth named Lin Yao whom the village forced upon him. In his previous life, Lu Yan feared the burden, abandoned Yao, and eventually died in a freezing gutter. 

Reborn with a magical spatial pocket and knowledge of the future, Lu Yan looks at Lin Yao's terrified but faithful eyes and promises things will be different. Packing their tiny clay pot, a bag of wild grain, and holding Lin Yao's hand, they set off alongside the migrating villagers to survive the migration, cultivate wilderness crops, build an oasis, and foster a beautiful, unbreakable devotion that thrives even during the harshest times.`,
    chapters: Array.from({ length: 15 }).map((_, idx) => ({
      id: `chapter-${idx + 1}`,
      number: idx + 1,
      title: [
        "Rebirth at the Brink of Starvation",
        "The Mute Little Husband",
        "A Secret Space Pocket Discovered",
        "The Village Assembly & Forced Migration",
        "Packing Up the Meager Straw Cottage",
        "First Step into the Dangerous Mountain Pass",
        "Catching Wild Pheasants on the Run",
        "Sharing a Hot Bowl of Broth",
        "Vicious Relatives Try to Steal Food",
        "Protecting Lin Yao from Harm",
        "Discovering a Underground Water Source",
        "A Sudden Dust Storm & The Separated Cart",
        "Deep Night Comforts under the Stars",
        "Reaching the Prefectural City Borders (VIP Preview)",
        "The Guard's Extortion & Strategic Entrance (VIP Preview)"
      ][idx],
      publishedAt: `2026-06-${String(10 - idx).padStart(2, '0')}`,
      isLocked: idx >= 13,
      content: `
        <p class="mb-4">The air was dry and suffocating. The scent of parched earth and yellow dust scraped the back of Lu Yan's throat as he gasped for breath.</p>
        <p class="mb-4">He suddenly opened his eyes, only to find himself staring at a dilapidated straw ceiling. The blistering heat of midsummer seeped through the cracks, cooking the small room like an oven.</p>
        <p class="mb-4">"Am I... alive?" Lu Yan whispered, his voice incredibly hoarse, like sandpaper rubbing against stone.</p>
        <p class="mb-4">Before he could process the sheer shock of his situation, a small, trembling hand reached out from the darkness of the bedside corner, holding a cracked wooden bowl with barely a tablespoon of lukewarm, murky water inside.</p>
        <p class="mb-4">Lu Yan turned his head. Sitting on the dirt floor was a thin, fragile figure wearing a patched coarse coat that hung loosely off his small frame. His face was smudged with soot, but his eyes were wide, clear, and brimming with cautious concern and fear.</p>
        <p class="mb-4">"Yao'er..." Lu Yan’s chest tightened with a powerful wave of emotion. It was Lin Yao. The mute youth who had been wedded to him in a mock ceremony by the village chief, whom he had cruelly abandoned on the road to the southern capitals in his previous life.</p>
        <p class="mb-4">Seeing Lu Yan call his name, Lin Yao shrank back slightly, fearing the usual cold scowls or outbursts. He pushed the precious water bowl forward, gesturing for Lu Yan to drink. During a historic drought where a cup of clean water was worth silver, this mute boy had saved every drop of his ration for him.</p>
        <p class="mb-4">"Stupid child," Lu Yan croaked, tears finally spilling from his dry eyes. He grabbed the small hand, pulling Lin Yao closer. This time, he would never let go.</p>
        <p class="mb-4">[This is the end of the chapter preview. Continue to explore subsequent chapters in the index to see how Lu Yan unlocks his spiritual pocket and leads his little husband to safety!]</p>
      `
    }))
  },
  {
    id: "villain-hero-system",
    title: "The Villain's Guide to Raising a Hero",
    altTitle: "反派养崽系统",
    author: "Bromance Studio",
    coverImage: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80",
    status: "Completed",
    rating: 4.8,
    reviewsCount: 92,
    views: "850K",
    genre: ["Transmigration", "System", "Comedy", "Xianxia", "Bromance"],
    tags: ["Strong MC", "Adorable Protagonist", "Master-Disciple", "Shanae System", "Fluffy"],
    synopsis: `Transmigrating as the absolute trash-tier elder villain who is destined to be slaughtered by his own disciple, Xu Yan decides the best way to survive is to turn the cold, future demon emperor into an overly pampered sweet potato! Supported by an eccentric System that penalizes him for acting out of character, he must master the art of being "cold on the outside, but extremely doting inside".`,
    chapters: Array.from({ length: 5 }).map((_, idx) => ({
      id: `chap-${idx + 1}`,
      number: idx + 1,
      title: `Chapter ${idx + 1}: The System's Ultimatum`,
      publishedAt: "2026-05-12",
      content: "<p>The immortal peaks were surrounded by mist, and inside the jade pavilion, Xu Yan woke up to a high-pitched ringing sound...</p>"
    }))
  }
];

export default function App() {
  const [view, setView] = useState<'home' | 'post' | 'category' | 'my-work'>('home');
  const [selectedNovel, setSelectedNovel] = useState<Novel>(mockNovels[0]);
  const [novelTab, setNovelTab] = useState<'synopsis' | 'chapters' | 'reviews'>('synopsis');
  const [sortChaptersDesc, setSortChaptersDesc] = useState<boolean>(false);
  const [chapterSearch, setChapterSearch] = useState<string>('');
  
  // Chapter Reading Mode State
  const [activeReadingChapter, setActiveReadingChapter] = useState<typeof mockNovels[0]['chapters'][0] | null>(null);
  const [readerFontSize, setReaderFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('lg');
  const [readerTheme, setReaderTheme] = useState<'classic' | 'sepia' | 'dark'>('classic');

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [novelLiked, setNovelLiked] = useState(false);
  const [novelRating, setNovelRating] = useState(4);
  const [newReviewText, setNewReviewText] = useState('');
  const [novelReviews, setNovelReviews] = useState<Array<{user: string; avatar: string; rating: number; text: string; date: string}>>([
    { user: "MianMian_fufu", avatar: mockArtistImages[0], rating: 5, text: "The relationship dynamics here are so beautifully pure! Lu Yan is incredibly protective, and Yao'er is the sweetest, most precious little bean. I cried so hard in chapter 1, highly recommend!", date: "2 days ago" },
    { user: "Xiao_MangaGuy", avatar: mockArtistImages[1], rating: 5, text: "The famine migration logistics feel very realistic and exciting. Not just romance, the farming elements are written perfectly too.", date: "1 week ago" }
  ]);

  // Hardcoded Crimson White theme defaults
  const primaryThemeColor = "#cc0000";
  const bgThemeColor = "#ffffff";

  const primaryColor = "text-[var(--color-primary)]";
  const borderColor = "border-[var(--color-primary)]";

  const handleNovelReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;
    const newRev = {
      user: "GuestReader",
      avatar: mockArtistImages[3],
      rating: novelRating,
      text: newReviewText,
      date: "Just now"
    };
    setNovelReviews([newRev, ...novelReviews]);
    setNewReviewText('');
  };

  const renderBreadcrumbs = (items: { label: string, onClick?: () => void }[]) => (
    <nav className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-70 mb-6 overflow-x-auto whitespace-nowrap ${primaryColor}`}>
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <span 
            className={`transition-colors duration-200 ${item.onClick ? 'cursor-pointer hover:text-opacity-100 hover:underline' : 'opacity-50 pointer-events-none'}`}
            onClick={item.onClick}
          >
            {item.label}
          </span>
          {idx < items.length - 1 && <ChevronRight className="w-3 h-3" />}
        </React.Fragment>
      ))}
    </nav>
  );

  const renderHeader = () => (
    <div className="sticky top-0 z-40 bg-[var(--color-bg)]/90 backdrop-blur-md transition-colors duration-300 border-b border-[var(--color-primary)]/10 shadow-sm">
      <header className="pt-6 pb-4 px-6 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-end mb-6">
          <div 
            onClick={() => { setView('home'); setActiveReadingChapter(null); }}
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 bg-[#cc0000] text-white flex items-center justify-center font-black rounded-lg shadow-md tracking-tighter text-xl">
              B
            </div>
            <div>
              <h1 className={`text-2xl md:text-3xl font-black tracking-tighter ${primaryColor} leading-none`}>
                {siteSettings.siteName}
              </h1>
              <span className="text-[10px] uppercase tracking-widest font-bold opacity-60">bromance.blog</span>
            </div>
          </div>
          
          <div className={`hidden md:flex items-center gap-6 font-bold text-sm tracking-wide ${primaryColor}`}>
            <button 
              onClick={() => { setView('home'); setActiveReadingChapter(null); }} 
              className={`hover:opacity-70 transition-all uppercase tracking-wider ${view === 'home' ? 'underline underline-offset-8 decoration-2' : ''}`}
            >
              Blog
            </button>
            <button 
              onClick={() => { setView('my-work'); setActiveReadingChapter(null); }} 
              className={`hover:opacity-70 transition-all uppercase tracking-wider flex items-center gap-1.5 ${view === 'my-work' ? 'underline underline-offset-8 decoration-2' : ''}`}
            >
              <BookOpen className="w-4 h-4" /> My Work
            </button>
            
            <div className={`flex items-center border-b-2 transition-all duration-300 ${isSearchFocused ? borderColor : 'border-transparent'}`}>
              <Search className="w-4 h-4 mr-2" />
              <input 
                type="text" 
                placeholder="Search series..." 
                className="bg-transparent outline-none w-24 focus:w-48 transition-all duration-300 placeholder:text-[var(--color-primary)]/50"
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
            </div>
            
            <a 
              href={siteSettings.kofiLink} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 border border-[var(--color-primary)] text-[var(--color-primary)] rounded-full hover:bg-[var(--color-primary)] hover:text-[var(--color-bg)] transition-colors duration-200"
            >
              <Coffee className="w-4 h-4" />
              Support Creator
            </a>
          </div>

          <div className="md:hidden flex items-center gap-4">
            <a href={siteSettings.kofiLink} target="_blank" rel="noreferrer" className={primaryColor}>
              <Coffee className="w-6 h-6 hover:scale-110 transition-transform" />
            </a>
            <button onClick={() => setIsMobileMenuOpen(true)} className={`${primaryColor} active:scale-95 transition-transform`}>
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        <nav className={`hidden md:flex gap-6 font-bold text-sm tracking-wider ${primaryColor} overflow-x-auto pb-2 scrollbar-hide`}>
          {mockCategories.map((item) => (
            <button 
              key={item.id} 
              onClick={() => { setView('category'); setActiveReadingChapter(null); }}
              className="hover:underline decoration-solid underline-offset-8 uppercase whitespace-nowrap transition-all duration-300 hover:opacity-70"
            >
              {item.name}
            </button>
          ))}
        </nav>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-[var(--color-bg)] z-50 flex flex-col overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b border-[var(--color-primary)]/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#cc0000] text-white flex items-center justify-center font-black rounded-md tracking-tighter text-lg">
                B
              </div>
              <h2 className={`text-xl font-black ${primaryColor}`}>{siteSettings.siteName}</h2>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className={`${primaryColor} active:scale-95 transition-transform`}>
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className={`flex flex-col p-6 gap-6 ${primaryColor}`}>
            <div className={`flex items-center border-b-2 pb-2 ${borderColor}`}>
              <Search className="w-5 h-5 mr-3" />
              <input 
                type="text" 
                placeholder="Search stories & tags..." 
                className="bg-transparent outline-none w-full font-bold placeholder:text-[var(--color-primary)]/50"
              />
            </div>

            <div className="flex flex-col gap-4 text-2xl font-extrabold mt-4">
              <button className="text-left hover:translate-x-2 transition-transform" onClick={() => { setView('home'); setActiveReadingChapter(null); setIsMobileMenuOpen(false); }}>HOME</button>
              <button className="text-left hover:translate-x-2 transition-transform flex items-center gap-3 text-red-600" onClick={() => { setView('my-work'); setActiveReadingChapter(null); setIsMobileMenuOpen(false); }}>
                <BookOpen className="w-6 h-6" /> MY WORK (NOVELS)
              </button>
              <hr className="border-[var(--color-primary)]/10" />
              {mockCategories.map((item) => (
                <button 
                  key={item.id} 
                  onClick={() => { setView('category'); setActiveReadingChapter(null); setIsMobileMenuOpen(false); }}
                  className="text-left hover:translate-x-2 transition-transform uppercase"
                >
                  {item.name}
                </button>
              ))}
            </div>

            <hr className={`border-[var(--color-primary)]/20 my-4`} />

            <div className="flex flex-col gap-4 font-bold">
              <a href={siteSettings.kofiLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                <Coffee className="w-5 h-5" /> Support on Ko-Fi
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderFooter = () => (
    <footer className="mt-20 py-12 px-6 border-t border-solid border-[var(--color-primary)] max-w-7xl mx-auto w-full flex flex-col md:flex-row justify-between items-start gap-8">
      <div>
        <h2 className={`text-3xl font-black tracking-tighter ${primaryColor}`}>{siteSettings.siteName}</h2>
        <p className={`mt-2 text-sm font-medium ${primaryColor} opacity-80`}>{siteSettings.description}</p>
        <p className={`mt-6 text-xs font-semibold ${primaryColor} opacity-50`}>{siteSettings.copyRights}</p>
      </div>
      <div className="flex flex-wrap gap-12">
        <div className={`flex flex-col gap-3 ${primaryColor}`}>
          <h3 className="font-extrabold mb-1">MORE FROM US</h3>
          <a href={siteSettings.kofiLink} target="_blank" rel="noreferrer" className="text-sm flex items-center gap-2 font-bold hover:opacity-70 transition-opacity">
            <Coffee className="w-4 h-4" /> Buy us a coffee
          </a>
          <button onClick={() => { setView('my-work'); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="text-sm text-left font-bold flex items-center gap-2 hover:opacity-70 transition-opacity">
            <BookOpen className="w-4 h-4" /> Read Our Novels
          </button>
        </div>
        <div className={`flex flex-col gap-3 ${primaryColor}`}>
          <h3 className="font-extrabold mb-1">CONTACTS</h3>
          <a href="#" className="text-sm hover:underline decoration-dotted underline-offset-4 transition-all">Contact Us</a>
          <a href="#" className="text-sm hover:underline decoration-dotted underline-offset-4 transition-all">Questions</a>
        </div>
      </div>
    </footer>
  );

  const renderHome = () => (
    <div className="w-full">
      <section className="relative w-full h-[65vh] min-h-[400px] mb-8 overflow-hidden border-b border-[var(--color-primary)]/20">
        <img 
          src="https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=1600&q=80" 
          alt="Hero Banner" 
          className="absolute inset-0 w-full h-full object-cover brightness-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 flex flex-col items-center justify-center px-6">
          <span className="text-white text-xs tracking-widest font-black uppercase bg-[#cc0000] px-4 py-1.5 rounded mb-4 shadow-lg animate-pulse">Official Creator Hub</span>
          <h2 className={`text-6xl md:text-8xl font-black tracking-tighter text-center text-white`}>
            {siteSettings.siteName}
          </h2>
          <p className="text-gray-200 font-medium text-lg md:text-xl mt-4 text-center max-w-2xl">
            A boutique translation and reading ecosystem for fans of Bromance, Famine Farming Rebirth, and Cultivation Web Novels.
          </p>
          <button 
            onClick={() => setView('my-work')}
            className="mt-8 px-8 py-3 bg-[#cc0000] text-white font-extrabold text-sm uppercase tracking-widest hover:bg-white hover:text-[#cc0000] transition-all duration-300 rounded shadow-md hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" /> Go to Novel Library
          </button>
        </div>
      </section>

      <div className="max-w-7xl mx-auto w-full px-6">
        <section className="mb-8">
          <div className="flex justify-between items-end mb-4">
            <h2 className={`text-4xl font-extrabold ${primaryColor}`}>Trending Now</h2>
            <button onClick={() => setView('my-work')} className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1 hover:underline ${primaryColor}`}>
              View Series <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <hr className={`border-b border-[var(--color-primary)]/20 mb-6`} />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {mockPosts.slice(0, 3).map((post) => (
              <div 
                key={post.id} 
                className="group cursor-pointer flex flex-col gap-3" 
                onClick={() => setView('post')}
              >
                <div className="overflow-hidden aspect-[4/3] w-full bg-[var(--color-primary)]/5">
                  <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]" />
                </div>
                <h3 className={`text-xl font-bold leading-tight mt-2 decoration-2 underline-offset-4 group-hover:underline ${primaryColor}`}>{post.title}</h3>
                <p className={`text-xs font-semibold opacity-70 ${primaryColor}`}>{post.read_time}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Highlighted Masterwork Section */}
        <section className="my-16 bg-[#cc0000]/5 border-2 border-[#cc0000]/10 p-6 md:p-10 rounded-lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-4 aspect-[3/4] w-full max-w-[280px] mx-auto overflow-hidden rounded shadow-2xl relative group">
              <img src={mockNovels[0].coverImage} alt={mockNovels[0].title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-black uppercase px-2 py-1 rounded">HOT SERIES</div>
            </div>
            <div className="lg:col-span-8">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-red-600 mb-2">
                <Sparkles className="w-4 h-4" /> Best Selling Webnovel
              </div>
              <h3 className="text-3xl md:text-4xl font-extrabold text-red-700 tracking-tight leading-tight mb-2">
                {mockNovels[0].title}
              </h3>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">ALT: {mockNovels[0].altTitle} • {mockNovels[0].status}</p>
              
              <p className="text-sm md:text-base text-gray-700 leading-relaxed line-clamp-4 mb-6">
                {mockNovels[0].synopsis}
              </p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {mockNovels[0].genre.slice(0, 4).map((g, idx) => (
                  <span key={idx} className="text-xs font-bold bg-[#cc0000]/10 text-red-700 px-3 py-1 rounded-full">{g}</span>
                ))}
              </div>

              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => {
                    setSelectedNovel(mockNovels[0]);
                    setNovelTab('synopsis');
                    setView('my-work');
                    window.scrollTo({top: 0, behavior: 'smooth'});
                  }} 
                  className="px-6 py-3 bg-[#cc0000] text-white font-extrabold text-xs uppercase tracking-widest rounded hover:bg-red-800 transition-colors"
                >
                  Explore Details
                </button>
                <button 
                  onClick={() => {
                    setSelectedNovel(mockNovels[0]);
                    setActiveReadingChapter(mockNovels[0].chapters[0]);
                    setView('my-work');
                    window.scrollTo({top: 0, behavior: 'smooth'});
                  }} 
                  className="px-6 py-3 border border-red-700 text-red-700 font-extrabold text-xs uppercase tracking-widest rounded hover:bg-red-50 transition-colors"
                >
                  Read Chapter 1
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1 flex flex-col group cursor-pointer" onClick={() => setView('post')}>
              <div className="overflow-hidden aspect-video w-full mb-6 bg-[var(--color-primary)]/5">
                <img 
                  src={mockPosts[3].featured_image} 
                  alt={mockPosts[3].title}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]" 
                />
              </div>
              <h3 className={`text-3xl font-extrabold leading-tight mb-3 decoration-2 underline-offset-4 group-hover:underline ${primaryColor}`}>
                {mockPosts[3].title}
              </h3>
              <p className={`text-sm font-semibold opacity-70 mb-4 uppercase tracking-wide flex items-center gap-2 ${primaryColor}`}>
                Jane Doe <span className="w-1 h-1 rounded-full bg-current"></span> {mockPosts[3].published_at}
              </p>
              <p className={`text-base leading-relaxed ${primaryColor} opacity-90`}>{mockPosts[3].summary}</p>
              <span className={`mt-6 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider ${primaryColor} hover:opacity-70 transition-opacity`}>
                Read more <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-12">
              {[mockPosts[1], mockPosts[2], mockPosts[4], mockPosts[0]].map((post, idx) => (
                <div key={idx} className="flex flex-col group cursor-pointer" onClick={() => setView('post')}>
                  <div className="overflow-hidden aspect-video w-full mb-4 bg-[var(--color-primary)]/5">
                    <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]" />
                  </div>
                  <h4 className={`text-2xl font-bold leading-tight mb-2 decoration-2 underline-offset-4 group-hover:underline ${primaryColor}`}>
                    {post.title}
                  </h4>
                  <div className="flex items-center gap-2 mb-3">
                    <p className={`text-xs font-semibold opacity-70 uppercase tracking-wide ${primaryColor}`}>John Smith</p>
                    <span className={`text-xs opacity-40 ${primaryColor}`}>•</span>
                    <p className={`text-xs font-semibold opacity-70 ${primaryColor}`}>{post.read_time}</p>
                  </div>
                  <hr className={`border-b border-[var(--color-primary)]/10 mb-3`} />
                  <p className={`text-sm opacity-90 line-clamp-2 leading-relaxed ${primaryColor}`}>{post.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );

  const renderCategory = () => (
    <div className="max-w-7xl mx-auto w-full px-6 py-8">
      {renderBreadcrumbs([
        { label: 'Home', onClick: () => setView('home') },
        { label: 'Music' }
      ])}
      <div className="mb-12 border-b border-[var(--color-primary)]/10 pb-8 text-center md:text-left">
        <p className={`text-sm font-bold tracking-widest uppercase mb-4 ${primaryColor}`}>Category</p>
        <h2 className={`text-5xl md:text-6xl font-black tracking-tighter ${primaryColor}`}>Music</h2>
        <p className={`text-lg mt-6 opacity-80 max-w-2xl ${primaryColor}`}>Exploring the latest sounds, comprehensive reviews, and cultural impacts in the world of music.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
        {mockPosts.map((post, idx) => (
          <div key={idx} className="flex flex-col group cursor-pointer" onClick={() => setView('post')}>
            <div className="overflow-hidden aspect-[4/3] w-full mb-4 bg-[var(--color-primary)]/5">
              <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]" />
            </div>
            <h4 className={`text-xl font-bold leading-tight mb-2 decoration-2 underline-offset-4 group-hover:underline ${primaryColor}`}>
              {post.title}
            </h4>
            <p className={`text-xs font-semibold opacity-70 mb-3 uppercase tracking-wide ${primaryColor}`}>John Smith • {post.read_time}</p>
            <p className={`text-sm opacity-90 line-clamp-3 leading-relaxed ${primaryColor}`}>{post.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPost = () => (
    <article className="max-w-7xl mx-auto w-full px-6 overflow-hidden">
      <div className="mt-8">
        {renderBreadcrumbs([
          { label: 'Home', onClick: () => setView('home') },
          { label: mockDetailPost.category?.name || 'Category', onClick: () => setView('category') },
          { label: mockDetailPost.title }
        ])}
      </div>
      
      <div className="text-center my-12 max-w-4xl mx-auto">
        <p className={`text-sm font-bold tracking-widest uppercase mb-4 ${primaryColor} cursor-pointer hover:underline transition-all`} onClick={() => setView('category')}>
          BY FANS, {mockDetailPost.category?.name}
        </p>
        <h1 className={`text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 ${primaryColor}`}>
          {mockDetailPost.title}
        </h1>
        <div className="flex items-center justify-center gap-4">
          <img src={mockArtistImages[2]} alt="Author" className={`w-12 h-12 rounded-full object-cover border border-[var(--color-primary)]/20 shadow-sm`} />
          <div className="text-left">
            <p className={`text-sm font-bold ${primaryColor}`}>Jane Doe</p>
            <p className={`text-xs opacity-70 font-semibold uppercase tracking-wide flex items-center gap-2 ${primaryColor}`}>
              {mockDetailPost.published_at} <span className="w-1 h-1 rounded-full bg-current"></span> {mockDetailPost.read_time}
            </p>
          </div>
        </div>
      </div>

      <div className="lg:flex lg:gap-16 relative">
        <div className="lg:w-2/3">
          <div className="overflow-hidden mb-12 border border-[var(--color-primary)]/10">
            <img 
              src={mockDetailPost.featured_image} 
              alt={mockDetailPost.title}
              className="w-full aspect-video object-cover"
            />
          </div>
          <div 
            className={`prose prose-lg max-w-none prose-headings:text-[var(--color-primary)] prose-p:text-[var(--color-primary)] ${primaryColor}`}
            dangerouslySetInnerHTML={{ __html: mockDetailPost.content }}
          ></div>

          {/* Inline Support Widget inside Article */}
          <div className="my-16 p-8 border border-[var(--color-primary)]/20 flex flex-col sm:flex-row items-center gap-6 justify-between bg-[var(--color-primary)]/5">
            <div>
              <h3 className={`text-2xl font-black mb-2 ${primaryColor}`}>Enjoying the content?</h3>
              <p className={`text-sm font-medium opacity-80 ${primaryColor}`}>Support Jane Doe by buying her a coffee!</p>
            </div>
            <a 
              href={siteSettings.kofiLink}
              target="_blank"
              rel="noreferrer"
              className="whitespace-nowrap flex items-center gap-2 px-6 py-3 font-bold text-lg border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-bg)] transition-colors duration-300"
            >
              <Coffee className="w-5 h-5" />
              Support Me
            </a>
          </div>

          {/* REPOSITIONED AND COHESIVE INTERACTION & SHARE BAR (Combined right before Comment Section) */}
          <div className={`flex flex-wrap items-center justify-between gap-4 py-4 px-6 border-y border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 rounded-sm my-12`}>
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setLiked(!liked)}
                className={`flex items-center gap-2 transition-all duration-300 ${primaryColor} ${liked ? 'opacity-100 scale-110 font-black' : 'hover:opacity-70 hover:scale-105 active:scale-95'}`}
              >
                <Heart className={`w-5 h-5 transition-colors ${liked ? 'fill-[#cc0000] text-[#cc0000]' : ''}`} /> 
                <span className="font-bold text-sm">Like ({mockDetailPost.likes + (liked ? 1 : 0)})</span>
              </button>
              
              <button className={`flex items-center gap-2 hover:opacity-70 transition-transform hover:scale-105 active:scale-95 ${primaryColor}`}>
                <MessageCircle className="w-5 h-5" /> 
                <span className="font-bold text-sm">Comment ({mockDetailPost.comments})</span>
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button className={`flex items-center gap-2 hover:opacity-70 transition-transform hover:scale-105 active:scale-95 ${primaryColor}`}>
                <Share2 className="w-5 h-5" /> 
                <span className="font-bold text-sm">Share</span>
              </button>
              <button className={`flex items-center gap-2 hover:opacity-70 transition-transform hover:scale-105 active:scale-95 ${primaryColor}`}>
                <Bookmark className="w-5 h-5" />
                <span className="font-bold text-sm hidden sm:inline">Save</span>
              </button>
            </div>
          </div>

          {/* Comments Section */}
          <div className="mt-8">
            <h3 className={`text-2xl font-bold mb-8 ${primaryColor}`}>Comments ({mockDetailPost.comments})</h3>
            <div className="flex gap-4 mb-8">
              <div className="w-12 h-12 rounded-full bg-[var(--color-primary)] shrink-0 flex items-center justify-center text-[var(--color-bg)] font-bold shadow-inner">U</div>
              <textarea 
                className={`w-full p-4 border border-[var(--color-primary)]/30 bg-transparent outline-none placeholder:opacity-50 ${primaryColor} focus:border-[var(--color-primary)] transition-colors duration-300`}
                placeholder="Leave a friendly comment..."
                rows={3}
              ></textarea>
            </div>
            
            <div className="space-y-8">
              {[1, 2].map((_, idx) => (
                <div key={idx} className="flex gap-4 group">
                  <img src={mockArtistImages[idx]} className="w-12 h-12 rounded-full object-cover shrink-0 border border-[var(--color-primary)]/20" alt="Commenter" />
                  <div className="p-4 border border-[var(--color-primary)]/10 bg-[var(--color-primary)]/5 w-full">
                    <p className={`font-bold text-sm ${primaryColor}`}>FanUser{idx + 1} <span className="opacity-50 font-normal ml-2 text-xs">2 days ago</span></p>
                    <p className={`mt-2 text-sm leading-relaxed ${primaryColor}`}>This album is truly a masterpiece. I've had it on repeat since it dropped!</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button 
          className={`lg:hidden fixed bottom-6 right-6 z-40 p-4 bg-[var(--color-primary)] text-[var(--color-bg)] rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95`}
          onClick={() => setIsSidebarOpen(true)}
        >
          <PanelRight className="w-6 h-6" />
        </button>

        <div
          className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
          onClick={() => setIsSidebarOpen(false)}
        />

        <aside 
          className={`fixed inset-y-0 right-0 z-50 w-80 bg-[var(--color-bg)] p-6 border-l border-[var(--color-primary)]/20 transform transition-transform duration-300 ease-in-out overflow-y-auto lg:shadow-none ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} lg:relative lg:translate-x-0 lg:w-1/3 lg:border-none lg:p-0 lg:overflow-visible`}
        >
          <div className="flex justify-between items-center lg:hidden mb-8">
            <h3 className={`font-bold ${primaryColor}`}>More Content</h3>
            <button onClick={() => setIsSidebarOpen(false)} className={`${primaryColor} hover:scale-110 active:scale-95 transition-transform`}>
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-12 sticky top-28">
            <h3 className={`text-sm font-bold tracking-widest uppercase mb-6 ${primaryColor}`}>Categories</h3>
            <ul className="flex flex-col gap-3">
              {mockCategories.slice(0,4).map((cat) => (
                <li key={cat.id} className={`flex justify-between items-center cursor-pointer p-3 hover:bg-[var(--color-primary)] hover:text-[var(--color-bg)] transition-colors duration-200 group`} onClick={() => setView('category')}>
                  <span className="font-semibold">{cat.name}</span>
                  <span className={`text-xs font-bold bg-[var(--color-primary)]/10 px-2 py-1 rounded-full group-hover:bg-[var(--color-bg)]/20`}>{cat.count}</span>
                </li>
              ))}
            </ul>

            <hr className={`border-b border-[var(--color-primary)]/10 my-8`} />
            
            <h3 className={`text-sm font-bold tracking-widest uppercase mb-6 ${primaryColor}`}>Related</h3>
            <div className="flex flex-col gap-6">
              {mockPosts.slice(1, 4).map((post, idx) => (
                <div key={idx} className="flex gap-4 items-start cursor-pointer group" onClick={() => setView('post')}>
                  <div className="w-24 h-24 shrink-0 overflow-hidden bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/10">
                    <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]" />
                  </div>
                  <div className="flex flex-col justify-center h-full py-1">
                    <h4 className={`text-sm font-bold leading-snug decoration-2 underline-offset-4 group-hover:underline ${primaryColor} line-clamp-2`}>{post.title}</h4>
                    <p className={`text-xs mt-2 opacity-75 font-semibold uppercase ${primaryColor}`}>{post.read_time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </article>
  );

  // --- MY WORK Page View: Novelib Styled Details Page ---
  const renderMyWork = () => {
    // Filter chapters based on search query
    const filteredChapters = selectedNovel.chapters.filter(ch => 
      ch.title.toLowerCase().includes(chapterSearch.toLowerCase()) || 
      `Chapter ${ch.number}`.toLowerCase().includes(chapterSearch.toLowerCase())
    );

    // Sort sorted chapters list
    const sortedChapters = [...filteredChapters].sort((a, b) => {
      return sortChaptersDesc ? b.number - a.number : a.number - b.number;
    });

    if (activeReadingChapter) {
      // Return the Immersive Novel Reader view
      return (
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={() => setActiveReadingChapter(null)}
              className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-red-600 hover:underline"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Novel Index
            </button>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setReaderTheme(t => t === 'classic' ? 'sepia' : t === 'sepia' ? 'dark' : 'classic')} 
                className="p-2 border rounded hover:bg-gray-50 flex items-center gap-1 text-xs font-bold uppercase tracking-wider"
                title="Change theme"
              >
                <Settings className="w-4 h-4" /> Theme: {readerTheme}
              </button>
              <div className="flex items-center border rounded overflow-hidden">
                <button onClick={() => setReaderFontSize(s => s === 'xl' ? 'lg' : s === 'lg' ? 'md' : 'sm')} className="px-3 py-1 bg-gray-100 border-r text-xs font-black hover:bg-gray-200">-A</button>
                <span className="px-3 text-xs font-bold uppercase bg-white">Size</span>
                <button onClick={() => setReaderFontSize(s => s === 'sm' ? 'md' : s === 'md' ? 'lg' : 'xl')} className="px-3 py-1 bg-gray-100 border-l text-xs font-black hover:bg-gray-200">+A</button>
              </div>
            </div>
          </div>

          <div className={`p-8 md:p-12 border rounded-md shadow-sm transition-all ${
            readerTheme === 'sepia' ? 'bg-[#fcf8f2] text-[#5c3a21] border-[#e6d0b3]' :
            readerTheme === 'dark' ? 'bg-[#18181b] text-zinc-300 border-zinc-800' :
            'bg-white text-zinc-800 border-zinc-200'
          }`}>
            <div className="text-center mb-10 border-b pb-8 border-current/10">
              <span className="text-xs uppercase tracking-widest font-black text-red-600 mb-2 block">{selectedNovel.title}</span>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
                Chapter {activeReadingChapter.number}: {activeReadingChapter.title}
              </h1>
              <p className="text-xs opacity-75 font-bold">Published in {selectedNovel.translator || 'Bromance Translator'}</p>
            </div>

            {activeReadingChapter.isLocked ? (
              <div className="text-center py-16 px-4 bg-red-600/5 rounded-lg border border-red-600/20 max-w-lg mx-auto my-12">
                <Lock className="w-12 h-12 mx-auto text-red-600 mb-4 animate-bounce" />
                <h3 className="text-2xl font-bold text-red-700 mb-2">This is a Premium Chapter</h3>
                <p className="text-sm text-gray-700 mb-6">Support our translator and unlock all early draft chapters up to Chapter 100 instantly by buying us a coffee on Ko-Fi!</p>
                <a 
                  href={siteSettings.kofiLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#cc0000] text-white font-extrabold uppercase text-sm tracking-widest rounded hover:bg-red-800 transition-colors"
                >
                  <Coffee className="w-4 h-4" /> Unlock on Ko-Fi
                </a>
              </div>
            ) : (
              <div 
                className={`leading-relaxed space-y-6 ${
                  readerFontSize === 'sm' ? 'text-base' :
                  readerFontSize === 'md' ? 'text-lg' :
                  readerFontSize === 'lg' ? 'text-xl' :
                  'text-2xl'
                }`}
                dangerouslySetInnerHTML={{ __html: activeReadingChapter.content }}
              ></div>
            )}

            <div className="flex justify-between items-center border-t border-current/10 pt-8 mt-12 gap-4">
              <button 
                disabled={activeReadingChapter.number === 1}
                onClick={() => {
                  const prev = selectedNovel.chapters.find(ch => ch.number === activeReadingChapter.number - 1);
                  if (prev) {
                    setActiveReadingChapter(prev);
                    window.scrollTo({top: 0, behavior: 'smooth'});
                  }
                }}
                className="px-4 py-2 border border-current rounded-md text-xs font-bold uppercase tracking-wider hover:bg-current/5 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              
              <button 
                onClick={() => {
                  setActiveReadingChapter(null);
                  setNovelTab('chapters');
                  window.scrollTo({top: 0, behavior: 'smooth'});
                }}
                className="px-4 py-2 border border-current rounded-md text-xs font-bold uppercase tracking-wider hover:bg-current/5 flex items-center gap-2"
              >
                <List className="w-4 h-4" /> Table of Contents
              </button>

              <button 
                disabled={activeReadingChapter.number === selectedNovel.chapters.length}
                onClick={() => {
                  const next = selectedNovel.chapters.find(ch => ch.number === activeReadingChapter.number + 1);
                  if (next) {
                    setActiveReadingChapter(next);
                    window.scrollTo({top: 0, behavior: 'smooth'});
                  }
                }}
                className="px-4 py-2 border border-current rounded-md text-xs font-bold uppercase tracking-wider hover:bg-current/5 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-7xl mx-auto w-full px-6 py-8">
        {renderBreadcrumbs([
          { label: 'Home', onClick: () => setView('home') },
          { label: 'My Work / Novel Archive' }
        ])}

        {/* Series Selector Carousel (For multiple works) */}
        <div className="flex gap-4 overflow-x-auto pb-4 mb-8 border-b scrollbar-hide">
          {mockNovels.map((novel) => (
            <button
              key={novel.id}
              onClick={() => {
                setSelectedNovel(novel);
                setNovelTab('synopsis');
              }}
              className={`px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-widest flex items-center gap-2 whitespace-nowrap transition-all ${
                selectedNovel.id === novel.id 
                  ? 'bg-[#cc0000] text-white shadow-md scale-105' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <Book className="w-3.5 h-3.5" /> {novel.title.split(' (')[0]}
            </button>
          ))}
        </div>

        {/* Novelib Premium Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column - Novel Cover and Stats Sidebar */}
          <div className="lg:col-span-4 flex flex-col items-center lg:items-stretch">
            <div className="aspect-[3/4] w-full max-w-[340px] mx-auto overflow-hidden rounded-md shadow-2xl relative border-4 border-double border-red-600/30">
              <img 
                src={selectedNovel.coverImage} 
                alt={selectedNovel.title} 
                className="w-full h-full object-cover"
              />
              <span className={`absolute top-4 left-4 text-[10px] tracking-widest font-black uppercase text-white px-3 py-1 rounded shadow-md ${selectedNovel.status === 'Ongoing' ? 'bg-amber-600' : 'bg-green-700'}`}>
                {selectedNovel.status}
              </span>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-[340px] mx-auto my-6 border-y border-red-600/20 py-4 text-center">
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Chapters</span>
                <span className="text-xl font-extrabold text-red-700">{selectedNovel.chapters.length}</span>
              </div>
              <div className="border-x border-red-600/10">
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Rating</span>
                <span className="text-xl font-extrabold text-red-700 flex items-center justify-center gap-0.5">
                  {selectedNovel.rating} <Star className="w-4 h-4 fill-[#cc0000] stroke-none" />
                </span>
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Views</span>
                <span className="text-xl font-extrabold text-red-700">{selectedNovel.views}</span>
              </div>
            </div>

            {/* Action Panel */}
            <div className="flex flex-col gap-3 w-full max-w-[340px] mx-auto">
              <button 
                onClick={() => {
                  setActiveReadingChapter(selectedNovel.chapters[0]);
                  window.scrollTo({top: 0, behavior: 'smooth'});
                }}
                className="w-full py-3 bg-[#cc0000] text-white font-extrabold uppercase text-sm tracking-widest hover:bg-red-800 transition-colors rounded shadow-sm flex items-center justify-center gap-2"
              >
                <BookOpen className="w-5 h-5" /> Read Chapter 1
              </button>
              
              <button 
                onClick={() => setNovelLiked(!novelLiked)}
                className={`w-full py-3 border font-extrabold uppercase text-sm tracking-widest rounded flex items-center justify-center gap-2 transition-all ${
                  novelLiked 
                    ? 'bg-red-50 border-[#cc0000] text-[#cc0000]' 
                    : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Heart className={`w-5 h-5 ${novelLiked ? 'fill-[#cc0000]' : ''}`} />
                {novelLiked ? "Saved in Library" : "Add to Library"}
              </button>

              <a 
                href={siteSettings.kofiLink}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 border border-[#cc0000] text-[#cc0000] font-extrabold uppercase text-sm tracking-widest rounded hover:bg-[#cc0000]/5 flex items-center justify-center gap-2 transition-all"
              >
                <Coffee className="w-5 h-5" /> Support This Translation
              </a>
            </div>

            {/* Book Meta Details Box */}
            <div className="mt-8 p-6 bg-red-600/5 rounded-md border border-red-600/10 w-full max-w-[340px] mx-auto space-y-4">
              <h4 className="text-sm font-extrabold text-red-700 uppercase tracking-widest border-b pb-2 border-red-600/10">Novel Details</h4>
              <div className="grid grid-cols-2 text-xs font-semibold text-gray-700">
                <span className="text-gray-400">Alternative Title:</span>
                <span className="text-right text-red-800 font-bold">{selectedNovel.altTitle}</span>
              </div>
              <div className="grid grid-cols-2 text-xs font-semibold text-gray-700">
                <span className="text-gray-400">Author:</span>
                <span className="text-right text-red-800 font-bold">{selectedNovel.author}</span>
              </div>
              <div className="grid grid-cols-2 text-xs font-semibold text-gray-700">
                <span className="text-gray-400">Translator:</span>
                <span className="text-right text-red-800 font-bold">{selectedNovel.translator || 'Official Team'}</span>
              </div>
              <div className="grid grid-cols-2 text-xs font-semibold text-gray-700">
                <span className="text-gray-400">Status:</span>
                <span className="text-right text-red-800 font-bold">{selectedNovel.status}</span>
              </div>
              <div className="grid grid-cols-2 text-xs font-semibold text-gray-700">
                <span className="text-gray-400">Rating Scale:</span>
                <span className="text-right text-red-800 font-bold">⭐⭐⭐⭐⭐ (4.9/5)</span>
              </div>
            </div>
          </div>

          {/* Right Column - Title, Genres, Synopsis, Chapter List Tabs */}
          <div className="lg:col-span-8">
            <div className="mb-6">
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedNovel.genre.map((genreName, idx) => (
                  <span key={idx} className="text-xs font-black uppercase tracking-widest bg-red-600 text-white px-3 py-1 rounded">
                    {genreName}
                  </span>
                ))}
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-red-700 tracking-tight leading-tight">
                {selectedNovel.title}
              </h1>
              <p className="text-sm font-extrabold text-gray-400 tracking-widest uppercase mt-2">
                Original Title: <span className="text-red-700">{selectedNovel.altTitle}</span>
              </p>
            </div>

            {/* Interactive Novelib Navigation Tabs */}
            <div className="flex border-b border-gray-200 mt-8 mb-6">
              <button
                onClick={() => setNovelTab('synopsis')}
                className={`py-3 px-6 font-extrabold text-sm uppercase tracking-wider border-b-2 transition-all ${
                  novelTab === 'synopsis' 
                    ? 'border-[#cc0000] text-[#cc0000]' 
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                Synopsis & Details
              </button>
              <button
                onClick={() => setNovelTab('chapters')}
                className={`py-3 px-6 font-extrabold text-sm uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
                  novelTab === 'chapters' 
                    ? 'border-[#cc0000] text-[#cc0000]' 
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                Table of Contents 
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">{selectedNovel.chapters.length}</span>
              </button>
              <button
                onClick={() => setNovelTab('reviews')}
                className={`py-3 px-6 font-extrabold text-sm uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
                  novelTab === 'reviews' 
                    ? 'border-[#cc0000] text-[#cc0000]' 
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                Reviews 
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">{novelReviews.length}</span>
              </button>
            </div>

            {/* Tab Contents */}
            {novelTab === 'synopsis' && (
              <div className="space-y-8 animate-fadeIn">
                <div className="bg-gray-50 p-6 rounded-md border border-gray-100">
                  <h3 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" /> Book Synopsis
                  </h3>
                  <div className="text-gray-700 leading-relaxed text-base space-y-4 whitespace-pre-line">
                    {selectedNovel.synopsis}
                  </div>
                </div>

                {/* Tags Section */}
                <div>
                  <h3 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5" /> Series Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedNovel.tags.map((tag, idx) => (
                      <span 
                        key={idx} 
                        className="text-xs font-bold bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-700 px-3.5 py-1.5 rounded-sm border border-gray-200 hover:border-red-600/30 cursor-pointer transition-colors"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Important Highlights panel */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="border border-red-600/10 p-5 rounded bg-red-600/[0.01]">
                    <h4 className="font-extrabold text-sm text-red-700 mb-2 uppercase tracking-wide">Weekly Schedule</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">We release **3 new chapters** every week on Monday, Wednesday, and Friday at 18:00 UTC.</p>
                  </div>
                  <div className="border border-red-600/10 p-5 rounded bg-red-600/[0.01]">
                    <h4 className="font-extrabold text-sm text-red-700 mb-2 uppercase tracking-wide">Support Goal</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">For every $15 raised on Ko-Fi, we translate and release a guaranteed extra VIP/bonus chapter!</p>
                  </div>
                </div>
              </div>
            )}

            {novelTab === 'chapters' && (
              <div className="space-y-6 animate-fadeIn">
                
                {/* Search and Sort Chapter Bar */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50 p-4 border border-gray-200 rounded">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search chapters..." 
                      value={chapterSearch}
                      onChange={(e) => setChapterSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border rounded text-xs outline-none bg-white font-semibold text-gray-700 focus:border-red-600"
                    />
                  </div>
                  
                  <button 
                    onClick={() => setSortChaptersDesc(!sortChaptersDesc)}
                    className="w-full sm:w-auto px-4 py-2 bg-white border rounded text-xs font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-100 flex items-center justify-center gap-2"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" /> Sort: {sortChaptersDesc ? 'Newest First' : 'Oldest First'}
                  </button>
                </div>

                {/* Table of Chapters Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sortedChapters.map((chapter) => (
                    <div 
                      key={chapter.id}
                      onClick={() => {
                        setActiveReadingChapter(chapter);
                        window.scrollTo({top: 0, behavior: 'smooth'});
                      }}
                      className="group p-4 border border-gray-100 bg-white hover:border-[#cc0000] hover:bg-red-600/[0.02] cursor-pointer rounded transition-all duration-200 flex justify-between items-center"
                    >
                      <div className="space-y-1 overflow-hidden pr-4">
                        <span className="text-[10px] font-black text-red-700 tracking-wider uppercase">Chapter {chapter.number}</span>
                        <h4 className="font-bold text-sm text-gray-800 line-clamp-1 group-hover:text-red-700 transition-colors">
                          {chapter.title}
                        </h4>
                        <span className="text-[10px] font-semibold text-gray-400 block">{chapter.publishedAt}</span>
                      </div>
                      
                      {chapter.isLocked ? (
                        <span className="bg-red-50 text-red-700 p-2 rounded-full border border-red-100 flex items-center justify-center shrink-0">
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider shrink-0 border border-green-100">
                          FREE
                        </span>
                      )}
                    </div>
                  ))}

                  {sortedChapters.length === 0 && (
                    <div className="col-span-2 text-center py-12 text-gray-400 font-bold">
                      No chapters matching your search filter were found.
                    </div>
                  )}
                </div>
              </div>
            )}

            {novelTab === 'reviews' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Review Submission Box */}
                <form onSubmit={handleNovelReviewSubmit} className="border p-6 bg-gray-50 border-gray-200 rounded">
                  <h4 className="font-extrabold text-sm uppercase tracking-widest text-red-700 mb-4">Write a Novel Review</h4>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-bold text-gray-500 uppercase mr-2">Your Rating:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                          key={star} 
                          type="button" 
                          onClick={() => setNovelRating(star)}
                          className="hover:scale-110 transition-transform text-xl"
                        >
                          <Star className={`w-5 h-5 ${star <= novelRating ? 'fill-red-600 text-red-600' : 'text-gray-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea 
                    value={newReviewText}
                    onChange={(e) => setNewReviewText(e.target.value)}
                    placeholder="Provide constructive review feedback about the translation, story development, or characters..."
                    className="w-full p-3 border rounded text-sm bg-white outline-none focus:border-red-600 min-h-[100px] mb-4 text-gray-700 font-semibold"
                    required
                  />
                  <button 
                    type="submit" 
                    className="px-6 py-2 bg-red-600 text-white font-extrabold text-xs uppercase tracking-widest hover:bg-red-700 transition-colors rounded"
                  >
                    Submit Review
                  </button>
                </form>

                {/* Reviews List */}
                <div className="space-y-6">
                  {novelReviews.map((rev, idx) => (
                    <div key={idx} className="p-5 border border-gray-100 rounded bg-white flex gap-4">
                      <img src={rev.avatar} alt="User Avatar" className="w-12 h-12 rounded-full border border-gray-200 shrink-0" />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-red-800">{rev.user}</span>
                          <span className="text-[10px] text-gray-400 font-bold">{rev.date}</span>
                        </div>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-red-600 text-red-600' : 'text-gray-200'}`} />
                          ))}
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed font-semibold">{rev.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    );
  };

  return (
    <div 
      style={{
        '--color-primary': primaryThemeColor,
        '--color-bg': bgThemeColor,
      } as React.CSSProperties}
      className="min-h-screen font-sans bg-[var(--color-bg)] text-[var(--color-primary)] overflow-x-hidden selection:bg-[var(--color-primary)] selection:text-[var(--color-bg)] transition-colors duration-500"
    >
      {renderHeader()}
      <main className="min-h-[60vh]">
        {view === 'home' && renderHome()}
        {view === 'category' && renderCategory()}
        {view === 'post' && renderPost()}
        {view === 'my-work' && renderMyWork()}
      </main>
      {renderFooter()}

      {/* Floating Actions */}
      <div className="fixed bottom-6 left-6 z-40 flex flex-col gap-4">
        <a 
          href={siteSettings.kofiLink}
          target="_blank"
          rel="noreferrer"
          className="p-4 rounded-full border border-[var(--color-primary)] bg-[var(--color-bg)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-bg)] transition-all duration-300 group flex items-center gap-0 hover:gap-3 overflow-hidden shadow-md"
        >
          <Coffee className="w-6 h-6 shrink-0 text-[#cc0000] group-hover:text-inherit" />
          <span className="font-bold whitespace-nowrap w-0 group-hover:w-[95px] transition-all duration-300 overflow-hidden text-sm inline-block">
            Support me
          </span>
        </a>
      </div>
    </div>
  );
}