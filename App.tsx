
import React, { useState, useRef, useMemo } from 'react';
import { 
  Camera, 
  Search, 
  Phone, 
  Plus, 
  X, 
  MapPin, 
  Store, 
  User, 
  Loader2,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Filter,
  Tag,
  Clock,
  Home,
  BookOpen,
  Info,
  Sprout,
  ArrowLeft,
  ChevronDown,
  LayoutDashboard,
  Mic,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Leaf,
  Sparkles,
  Droplets,
  Cpu,
  Activity,
  History,
  FileText,
  BadgeCheck
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

// --- Types ---

interface Product {
  id: string;
  nameKh: string;
  nameEn: string;
  price: string;
  unit: string;
  location: string;
  sellerPhone: string;
  image: string;
  category: string;
  timestamp: number;
}

interface SeedAnalysis {
  status: 'Good' | 'Bad';
  score: number;
  reasonKh: string;
  reasonEn: string;
  defectsKh: string[];
  defectsEn: string[];
}

const CATEGORIES = [
  { id: 'all', kh: 'ទាំងអស់', en: 'All', icon: <Store size={18} /> },
  { id: 'veg', kh: 'បន្លែ', en: 'Vegetables', icon: <Tag size={18} /> },
  { id: 'fruit', kh: 'ផ្លែឈើ', en: 'Fruits', icon: <Tag size={18} /> },
  { id: 'rice', kh: 'ស្រូវអង្ករ', en: 'Rice/Grains', icon: <Tag size={18} /> },
];

const PROVINCES = [
  'ភ្នំពេញ (Phnom Penh)',
  'កំពង់ស្ពឺ (Kampong Speu)',
  'បាត់ដំបង (Battambang)',
  'កំពត (Kampot)',
  'សៀមរាប (Siem Reap)',
  'តាកែវ (Takeo)',
  'ពោធិ៍សាត់ (Pursat)',
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    nameKh: 'ស្វាយកែវរមៀត',
    nameEn: 'Keo Romiet Mango',
    price: '2500',
    unit: 'គីឡូ (kg)',
    location: 'កំពង់ស្ពឺ (Kampong Speu)',
    sellerPhone: '012345678',
    image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?q=80&w=600&auto=format&fit=crop',
    category: 'fruit',
    timestamp: Date.now() - 3600000
  },
  {
    id: '2',
    nameKh: 'ស្ពៃបូកគោ',
    nameEn: 'Chinese Cabbage',
    price: '3000',
    unit: 'គីឡូ (kg)',
    location: 'បាត់ដំបង (Battambang)',
    sellerPhone: '098765432',
    image: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?q=80&w=600&auto=format&fit=crop',
    category: 'veg',
    timestamp: Date.now() - 7200000
  }
];

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'buy' | 'sell' | 'tips' | 'seedCheck' | 'projectInfo'>('home');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [lang, setLang] = useState<'kh' | 'en'>('kh');

  // Sell Wizard State
  const [sellStep, setSellStep] = useState(0); 
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [formData, setFormData] = useState({
    nameKh: '',
    nameEn: '',
    price: '',
    unit: 'គីឡូ (kg)',
    location: PROVINCES[0],
    sellerPhone: '',
    category: 'veg'
  });

  // Seed Check State
  const [seedImage, setSeedImage] = useState<string | null>(null);
  const [seedAnalysis, setSeedAnalysis] = useState<SeedAnalysis | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const seedInputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.nameKh.includes(searchQuery) || 
                          p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.location.includes(searchQuery);
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>, mode: 'sell' | 'seed') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (mode === 'sell') {
          setCapturedImage(base64);
          setSellStep(1); 
          analyzeCropType(base64);
        } else {
          setSeedImage(base64);
          analyzeSeeds(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeCropType = async (base64: string) => {
    if (!process.env.API_KEY) return;
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const model = 'gemini-3-flash-preview';
      const cleanBase64 = base64.split(',')[1];
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            { inlineData: { data: cleanBase64, mimeType: 'image/jpeg' } },
            { text: "Identify crop. Return JSON: { nameKh, nameEn, category: 'veg'|'fruit'|'rice' }" }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              nameKh: { type: Type.STRING },
              nameEn: { type: Type.STRING },
              category: { type: Type.STRING },
            },
            required: ["nameKh", "nameEn", "category"],
          },
        }
      });
      if (response.text) {
        const data = JSON.parse(response.text);
        setFormData(prev => ({
          ...prev,
          nameKh: data.nameKh || '',
          nameEn: data.nameEn || '',
          category: data.category || 'veg'
        }));
      }
    } catch (err) { console.error(err); } finally { setIsAnalyzing(false); }
  };

  const analyzeSeeds = async (base64: string) => {
    if (!process.env.API_KEY) return;
    setIsAnalyzing(true);
    setSeedAnalysis(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const model = 'gemini-3-flash-preview';
      const cleanBase64 = base64.split(',')[1];
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            { inlineData: { data: cleanBase64, mimeType: 'image/jpeg' } },
            { text: "Analyze the quality of these agricultural seeds. Check for discoloration, mold, deformity, or pests. Return a detailed JSON report including a quality score out of 100. Be specific about defects." }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING },
              score: { type: Type.NUMBER },
              reasonKh: { type: Type.STRING },
              reasonEn: { type: Type.STRING },
              defectsKh: { type: Type.ARRAY, items: { type: Type.STRING } },
              defectsEn: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["status", "score", "reasonKh", "reasonEn", "defectsKh", "defectsEn"],
          },
        }
      });
      if (response.text) {
        setSeedAnalysis(JSON.parse(response.text));
      }
    } catch (err) { console.error(err); } finally { setIsAnalyzing(false); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!capturedImage) return;
    const newProduct: Product = {
      id: Date.now().toString(),
      ...formData,
      image: capturedImage,
      timestamp: Date.now()
    };
    setProducts([newProduct, ...products]);
    setView('buy');
    resetSellForm();
  };

  const resetSellForm = () => {
    setCapturedImage(null);
    setSellStep(0);
    setFormData({
      nameKh: '',
      nameEn: '',
      price: '',
      unit: 'គីឡូ (kg)',
      location: PROVINCES[0],
      sellerPhone: '',
      category: 'veg'
    });
  };

  const renderHome = () => (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300 pb-10">
      <div className="flex-none bg-[#1B4332] p-6 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10px] left-[-10px] w-24 h-24 bg-teal-400/10 rounded-full blur-2xl" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-emerald-300 text-[10px] font-black uppercase tracking-[0.2em]">សហគមន៍កសិកម្ម</p>
              <h1 className="text-3xl font-black text-white leading-none">ជម្រាបសួរ!</h1>
            </div>
            <div className="bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/20">
              <Leaf className="text-emerald-400" size={24} />
            </div>
          </div>
          
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="bg-amber-400/20 p-2 rounded-xl">
                <TrendingUp className="text-amber-400" size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-100 uppercase">ទីផ្សារថ្ងៃនេះ</p>
                <p className="font-black text-sm text-white">២,៥០០៛/គក</p>
              </div>
            </div>
            <ChevronRight className="text-emerald-500" size={18} />
          </div>
        </div>
      </div>

      <button 
        onClick={() => setView('projectInfo')}
        className="flex-none bg-gradient-to-r from-emerald-600 to-teal-700 p-5 rounded-[2rem] text-white shadow-lg flex items-center gap-4 group active:scale-95 transition-all overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform" />
        <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
          <Droplets className="text-white" size={24} />
        </div>
        <div className="flex-1 text-left">
          <h3 className="font-black text-base leading-tight">បច្ចេកវិទ្យាស្រោចស្រព និងដាក់ជីឆ្លាតវៃ</h3>
          <p className="text-[10px] font-black text-white/90 uppercase tracking-wider mt-1">Smart Irrigation System • Agriculture 4.0</p>
        </div>
        <ArrowRight className="text-emerald-200 group-hover:translate-x-1 transition-transform" size={20} />
      </button>

      <div className="flex-none grid grid-cols-2 gap-4">
        <HomeCard 
          icon={<Store className="text-[#1B4332]" size={28} />} 
          label="ផ្សារកសិផល" 
          sub="ទិញបន្លែផ្លែឈើ"
          onClick={() => setView('buy')} 
        />
        <HomeCard 
          icon={<Sparkles className="text-indigo-600" size={28} />} 
          label="គ្រូពេទ្យគ្រាប់ពូជ" 
          sub="ពិនិត្យគ្រាប់ពូជ AI"
          onClick={() => { setSeedImage(null); setSeedAnalysis(null); setView('seedCheck'); }} 
        />
        <HomeCard 
          icon={<Camera className="text-emerald-600" size={28} />} 
          label="ដាក់លក់" 
          sub="បង្ហោះទំនិញថ្មី"
          onClick={() => { resetSellForm(); setView('sell'); }} 
        />
        <HomeCard 
          icon={<BookOpen className="text-amber-500" size={28} />} 
          label="ចំណេះដឹង" 
          sub="គន្លឹះដាំដុះ"
          onClick={() => setView('tips')} 
        />
      </div>

      <div className="flex flex-col mt-2">
        <div className="flex justify-between items-end mb-4 px-1">
          <h2 className="text-xl font-black text-[#1B4332]">ផលិតផលថ្មីៗ</h2>
          <button onClick={() => setView('buy')} className="text-emerald-700 font-black text-sm flex items-center gap-1">មើលទាំងអស់ <ArrowRight size={14} /></button>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-1 px-1">
          {products.map(p => (
            <div key={p.id} onClick={() => setView('buy')} className="flex-none w-[180px] bg-white rounded-[2.2rem] overflow-hidden shadow-sm border border-slate-100 flex flex-col active:scale-95 transition-all">
              <div className="h-32 relative">
                <img src={p.image} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-md px-2 py-1 rounded-lg text-[9px] font-black text-[#1B4332] shadow-sm">
                  {p.location.split(' (')[0]}
                </div>
              </div>
              <div className="p-4">
                <p className="font-black text-slate-900 text-sm truncate">{p.nameKh}</p>
                <p className="text-[#1B4332] font-black text-base mt-0.5">{Number(p.price).toLocaleString()}៛</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderProjectInfo = () => (
    <div className="flex flex-col animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center justify-between mb-4 flex-none">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('home')} className="p-2 bg-white rounded-xl shadow-sm text-slate-600">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-black text-[#1B4332]">ព័ត៌មានប្រព័ន្ធវៃឆ្លាត</h2>
        </div>
        <button 
          onClick={() => setLang(lang === 'kh' ? 'en' : 'kh')}
          className="bg-[#1B4332] text-white px-3 py-1 rounded-full text-[10px] font-black"
        >
          {lang === 'kh' ? 'ENGLISH' : 'ភាសាខ្មែរ'}
        </button>
      </div>

      <div className="space-y-6 px-1">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-emerald-100 p-2 rounded-xl text-emerald-700">
              <Cpu size={20} />
            </div>
            <h3 className="font-black text-[#1B4332] text-lg leading-tight">
              {lang === 'kh' ? 'គម្រោង: ប្រព័ន្ធស្រោចស្រព និងផ្តល់ជីឆ្លាតវៃសម្រាប់ការដាំដុះសាឡាត់' : 'Project: Smart Irrigation and Fertilizer Dispensing System for Lettuce Cultivation'}
            </h3>
          </div>
          <p className="text-slate-700 font-bold text-xs leading-relaxed mb-4">
            {lang === 'kh' 
              ? 'ប្រព័ន្ធនេះរួមបញ្ចូលបច្ចេកវិទ្យា IoT, Cloud Computing, និងបញ្ញាសិប្បនិម្មិត (AI) ដើម្បីគ្រប់គ្រងការស្រោចស្រព និងការផ្តល់ជីដោយស្វ័យប្រវត្តិ។' 
              : 'This system integrates IoT sensors, Cloud computing, Artificial Intelligence (AI), and automated irrigation/fertilizer mechanisms.'}
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            <InfoBox 
              icon={<Activity size={16} />} 
              label={lang === 'kh' ? 'ត្រួតពិនិត្យដី' : 'Soil Monitoring'} 
              value={lang === 'kh' ? 'pH, សំណើម, NPK' : 'pH, Moisture, NPK'} 
            />
            <InfoBox 
              icon={<Zap size={16} />} 
              label={lang === 'kh' ? 'ការគ្រប់គ្រង' : 'Control'} 
              value={lang === 'kh' ? 'AI ស្វ័យប្រវត្តិ' : 'AI Automated'} 
            />
          </div>
        </div>

        <div className="bg-[#1B4332] p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-xl">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
           <h3 className="text-xl font-black mb-6 flex items-center gap-3">
             <Sparkles className="text-amber-400" size={24} />
             {lang === 'kh' ? 'ហេតុអ្វីអ្នកត្រូវការប្រព័ន្ធនេះ?' : 'Why do you need this system?'}
           </h3>
           
           <div className="space-y-6">
             <BenefitItem 
               lang={lang}
               icon={<Zap className="text-emerald-400" />}
               khTitle="កាត់បន្ថយការខ្ជះខ្ជាយ"
               enTitle="Reduce Waste"
               khDesc="សន្សំសំចៃទឹក និងជីបានយ៉ាងច្រើន ដោយផ្តល់តែអ្វីដែលដំណាំត្រូវការ។"
               enDesc="Significant savings on water and fertilizer by providing only what the crop needs."
             />
             <BenefitItem 
               lang={lang}
               icon={<TrendingUp className="text-emerald-400" />}
               khTitle="ទិន្នផលខ្ពស់"
               enTitle="Higher Yield"
               khDesc="ធ្វើឱ្យដំណាំសាឡាត់របស់អ្នកមានសុខភាពល្អ និងលូតលាស់បានលឿនជាងមុន។"
               enDesc="Improve crop health and ensure your lettuce grows faster and uniform."
             />
             <BenefitItem 
               lang={lang}
               icon={<ShieldCheck className="text-emerald-400" />}
               khTitle="ឈប់ស្រោចពេលភ្លៀង"
               enTitle="Auto Rain Stop"
               khDesc="ប្រព័ន្ធនឹងឈប់ស្រោចស្រពដោយស្វ័យប្រវត្តិនៅពេលមេឃភ្លៀង ដើម្បីការពារដំណាំ។"
               enDesc="The system automatically stops irrigation during rainfall to protect your plants."
             />
             <BenefitItem 
               lang={lang}
               icon={<LayoutDashboard className="text-emerald-400" />}
               enTitle="Easy Monitoring"
               khTitle="ងាយស្រួលតាមដាន"
               khDesc="អាចមើលស្ថានភាពចម្ការបានគ្រប់ពេល តាមរយៈផ្ទាំងគ្រប់គ្រងលើទូរស័ព្ទដៃ។"
               enDesc="View real-time insights, alerts, and reports anytime on your mobile phone."
             />
           </div>

           <div className="mt-8 pt-6 border-t border-white/10 text-center">
             <p className="text-[10px] font-black text-emerald-300 uppercase tracking-[0.2em]">
               {lang === 'kh' ? 'គាំទ្រកសិកម្ម ៤.០ កម្ពុជា' : 'Supporting Cambodian Agriculture 4.0'}
             </p>
           </div>
        </div>

        {/* Call-to-Action for Installation/Purchase */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-lg border-2 border-emerald-500 flex flex-col items-center gap-4 text-center mb-8">
          <div className="bg-emerald-100 p-4 rounded-full text-emerald-700">
            <Phone size={32} fill="currentColor" strokeWidth={0} />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#1B4332] mb-1">
              {lang === 'kh' ? 'ចង់ជាវ ឬតំឡើងប្រព័ន្ធនេះ?' : 'Want to buy or install?'}
            </h3>
            <p className="text-xs font-bold text-slate-700 leading-relaxed mb-5">
              {lang === 'kh' 
                ? 'បើលោកអ្នកមានបំណងចង់តំឡើងប្រព័ន្ធស្រោចស្រពឆ្លាតវៃនេះក្នុងចម្ការសាឡាត់ សូមទំនាក់ទំនងមកយើងខ្ញុំឥឡូវនេះ!' 
                : 'If you are interested in installing this smart irrigation system in your farm, please contact us now!'}
            </p>
            <a 
              href="tel:012345678" 
              className="inline-flex items-center gap-3 bg-amber-500 text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-amber-500/20 active:scale-95 transition-all text-lg"
            >
              <Phone size={20} fill="currentColor" strokeWidth={0} />
              {lang === 'kh' ? 'ហៅទូរស័ព្ទមកយើង' : 'Call Us Now'}
            </a>
            <p className="text-[10px] font-black text-slate-400 mt-4 uppercase tracking-widest">
              Available 24/7 for farmers
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSeedCheck = () => (
    <div className="flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 flex-none">
        <button onClick={() => setView('home')} className="p-2.5 bg-white rounded-2xl shadow-sm text-slate-600 active:scale-90 transition-transform">
          <ArrowLeft size={22} />
        </button>
        <h2 className="text-2xl font-black text-[#1B4332]">គ្រូពេទ្យគ្រាប់ពូជ​​ AI</h2>
      </div>

      <div className="relative">
        {!seedImage ? (
          /* Scanner Selection View */
          <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 p-8 flex flex-col items-center gap-10">
            <div 
              className="w-full aspect-[4/5] rounded-[3rem] bg-indigo-50/40 border-2 border-dashed border-indigo-200 flex flex-col items-center justify-center gap-8 relative overflow-hidden group cursor-pointer active:bg-indigo-100 transition-all"
              onClick={() => seedInputRef.current?.click()}
            >
              {/* Scan Decorative Elements */}
              <div className="absolute top-10 left-10 w-8 h-8 border-t-4 border-l-4 border-indigo-400 rounded-tl-xl" />
              <div className="absolute top-10 right-10 w-8 h-8 border-t-4 border-r-4 border-indigo-400 rounded-tr-xl" />
              <div className="absolute bottom-10 left-10 w-8 h-8 border-b-4 border-l-4 border-indigo-400 rounded-bl-xl" />
              <div className="absolute bottom-10 right-10 w-8 h-8 border-b-4 border-r-4 border-indigo-400 rounded-br-xl" />
              
              <div className="bg-white p-12 rounded-full shadow-2xl text-indigo-500 group-hover:scale-110 transition-transform relative z-10">
                <Camera size={80} strokeWidth={1.2} />
              </div>
              
              <div className="text-center relative z-10">
                <span className="block font-black text-indigo-950 text-2xl mb-2">ថតរូបគ្រាប់ពូជ</span>
                <span className="text-[10px] uppercase font-black tracking-[0.2em] text-indigo-600/60 bg-indigo-100/50 px-4 py-1.5 rounded-full">Scan for Quality</span>
              </div>
              
              {/* Scan Animation Beam */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-[scan_3s_ease-in-out_infinite]" />
            </div>

            <input type="file" accept="image/*" capture="environment" hidden ref={seedInputRef} onChange={(e) => handleImageCapture(e, 'seed')} />
            
            <div className="flex items-start gap-4 bg-slate-50 px-6 py-5 rounded-[2rem] border border-slate-200">
               <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
                 <ShieldCheck size={24} />
               </div>
               <p className="text-xs font-black text-slate-700 leading-relaxed">
                 AI នឹងវិភាគរក ផ្សិត ជំងឺ ឬភាពមិនប្រក្រតីដែលមើលមិនឃើញនឹងភ្នែក ដើម្បីធានាបាននូវទិន្នផលខ្ពស់។
               </p>
            </div>
          </div>
        ) : (
          /* Report / Analyzing View */
          <div className="space-y-6">
            {/* Image Preview Card */}
            <div className="bg-white rounded-[2.5rem] shadow-lg overflow-hidden border border-slate-100">
              <div className="h-64 relative group">
                <img src={seedImage} className="w-full h-full object-cover" />
                {!isAnalyzing && (
                   <button onClick={() => setSeedImage(null)} className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white p-2.5 rounded-full shadow-xl active:scale-90 transition-transform"><X size={20} /></button>
                )}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-indigo-950/80 backdrop-blur-xl flex flex-col items-center justify-center text-white p-6 overflow-hidden">
                    <div className="relative mb-8">
                       <div className="w-32 h-32 border-[6px] border-indigo-400/20 border-t-indigo-400 rounded-full animate-spin" />
                       <Sparkles size={40} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-300 animate-pulse" />
                    </div>
                    <p className="font-black text-2xl animate-pulse text-indigo-100 tracking-tight">កំពុងវិភាគគុណភាព...</p>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mt-4">AI Vision Lab Engine v2.0</p>
                    
                    {/* Floating Particles/Lines for high-tech effect */}
                    <div className="absolute inset-0 pointer-events-none opacity-20">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="absolute h-px w-full bg-white animate-scan-fast" style={{ top: `${i * 25}%`, animationDelay: `${i * 0.5}s` }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Result Report Card */}
            {seedAnalysis && (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-6 pb-20">
                <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 p-8 overflow-hidden relative">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 mb-1">របាយការណ៍ AI</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={12} /> {new Date().toLocaleTimeString()} • Scan #482
                      </p>
                    </div>
                    <div className={`px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-sm ${seedAnalysis.status === 'Good' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                      {seedAnalysis.status === 'Good' ? <BadgeCheck size={16}/> : <AlertTriangle size={16}/>}
                      {seedAnalysis.status === 'Good' ? 'Pass' : 'Fail'}
                    </div>
                  </div>

                  {/* Score Visualization */}
                  <div className="flex flex-col items-center text-center mb-10 py-4">
                    <div className="relative w-44 h-44 flex items-center justify-center mb-6">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="88" cy="88" r="78" stroke="currentColor" strokeWidth="14" fill="transparent" className="text-slate-100" />
                        <circle cx="88" cy="88" r="78" stroke="currentColor" strokeWidth="14" fill="transparent" 
                          strokeDasharray={490}
                          strokeDashoffset={490 - (490 * seedAnalysis.score) / 100}
                          strokeLinecap="round"
                          className={`transition-all duration-1000 ease-out ${seedAnalysis.status === 'Good' ? 'text-emerald-500' : 'text-rose-500'}`} 
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl font-black text-slate-900 leading-none">{seedAnalysis.score}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Quality Score</span>
                      </div>
                    </div>
                    <h4 className={`text-2xl font-black mb-2 ${seedAnalysis.status === 'Good' ? 'text-emerald-800' : 'text-rose-800'}`}>
                      {seedAnalysis.status === 'Good' ? 'ពូជមានគុណភាពល្អ' : 'ពូជគុណភាពខ្សោយ'}
                    </h4>
                    <p className="text-sm font-bold text-slate-600 leading-relaxed max-w-[280px]">
                      {lang === 'kh' ? seedAnalysis.reasonKh : seedAnalysis.reasonEn}
                    </p>
                  </div>

                  {/* Details List */}
                  <div className="space-y-4">
                    <h5 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 mb-4">ការវិភាគលម្អិត (Detailed Analysis)</h5>
                    
                    {seedAnalysis.defectsKh.length > 0 ? (
                      seedAnalysis.defectsKh.map((defect, idx) => (
                        <div key={idx} className={`p-4 rounded-2xl flex items-center gap-4 ${seedAnalysis.status === 'Good' ? 'bg-emerald-50/50' : 'bg-rose-50/50'}`}>
                          <div className={`p-2 rounded-xl ${seedAnalysis.status === 'Good' ? 'bg-emerald-200 text-emerald-700' : 'bg-rose-200 text-rose-700'}`}>
                            {seedAnalysis.status === 'Good' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800">{defect}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">{seedAnalysis.defectsEn[idx]}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-emerald-50 p-4 rounded-2xl flex items-center gap-4">
                         <div className="bg-emerald-200 text-emerald-700 p-2 rounded-xl">
                           <CheckCircle2 size={18} />
                         </div>
                         <p className="text-sm font-black text-emerald-800">រកមិនឃើញជំងឺ ឬភាពខ្សោយ (No diseases detected)</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 flex gap-4">
                     <button 
                       onClick={() => setSeedImage(null)} 
                       className="flex-1 bg-slate-100 text-slate-700 font-black py-4 rounded-2xl active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2"
                     >
                       <Camera size={18} /> ថតម្តងទៀត
                     </button>
                     <button 
                       onClick={() => setView('tips')}
                       className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl active:scale-95 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                     >
                       <FileText size={18} /> មើលគន្លឹះដាំ
                     </button>
                  </div>
                </div>
                
                {/* Save to History / Actions */}
                <div className="flex flex-col items-center gap-4 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Powered by AI Vision Agriculture 4.0</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(0); opacity: 0; }
          50% { transform: translateY(300px); opacity: 0.8; }
        }
        @keyframes scan-fast {
          0% { transform: translateX(-100%); opacity: 0; }
          50% { opacity: 0.5; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        .animate-scan-fast {
          animation: scan-fast 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );

  const renderBuy = () => (
    <div className="flex flex-col animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex-none pb-4">
        <div className="flex items-center gap-3 mb-4">
           <button onClick={() => setView('home')} className="p-2 bg-white rounded-xl shadow-sm text-slate-600">
             <ArrowLeft size={20} />
           </button>
           <h2 className="text-xl font-black text-[#1B4332]">ទិញផលិតផល</h2>
        </div>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-600 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="ស្វែងរកផលិតផល ឬទីតាំង..."
            className="w-full bg-white border-2 border-slate-200 rounded-3xl py-4 pl-12 pr-4 text-sm font-black text-slate-900 outline-none focus:border-emerald-500 transition-all shadow-sm placeholder:text-slate-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4 pb-4">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 flex flex-col group">
            <div className="relative h-48 overflow-hidden">
              <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={product.nameEn} />
              <div className="absolute top-4 left-4 bg-emerald-950/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1.5 border border-white/20">
                <MapPin size={12} /> {product.location.split(' (')[0]}
              </div>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-none mb-1">{product.nameKh}</h3>
                  <p className="text-slate-500 text-xs font-bold">{product.nameEn}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-[#1B4332]">{Number(product.price).toLocaleString()}៛</span>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ក្នុង {product.unit.split(' (')[0]}</p>
                </div>
              </div>
              <a href={`tel:${product.sellerPhone}`} className="w-full bg-emerald-600 text-white font-black py-4.5 rounded-[2rem] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-emerald-600/20 text-lg">
                <Phone size={22} fill="currentColor" strokeWidth={0} />
                តេជួបអ្នកលក់
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSell = () => (
    <div className="flex flex-col animate-in slide-in-from-right duration-300">
      <div className="flex items-center gap-4 mb-4 flex-none">
        <button onClick={() => { if(sellStep > 0) setSellStep(0); else setView('home'); }} className="p-2 bg-white rounded-xl shadow-sm text-slate-600">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-black text-[#1B4332]">ដាក់លក់ផលិតផល</h2>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col min-h-0 overflow-hidden">
        {sellStep === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8">
             <div className="w-full aspect-square rounded-[3rem] bg-emerald-50/50 border-4 border-dashed border-emerald-100 flex flex-col items-center justify-center gap-6 text-emerald-600 active:bg-emerald-100 transition-colors" onClick={() => fileInputRef.current?.click()}>
                <div className="bg-white p-8 rounded-full shadow-xl text-emerald-600">
                  <Camera size={64} strokeWidth={2} />
                </div>
                <div className="text-center px-6">
                  <span className="block font-black text-emerald-900 text-xl mb-1">ថតរូបផលិតផល</span>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">AI recognition enabled</p>
                </div>
             </div>
             <input type="file" accept="image/*" capture="environment" hidden ref={fileInputRef} onChange={(e) => handleImageCapture(e, 'sell')} />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 animate-in slide-in-from-right">
             <div className="flex-none h-48 relative">
               <img src={capturedImage!} className="w-full h-full object-cover" />
               <button type="button" onClick={() => setSellStep(0)} className="absolute top-4 right-4 bg-black/40 backdrop-blur-md p-2 rounded-full text-white shadow-xl"><X size={20} /></button>
               {isAnalyzing && (
                 <div className="absolute inset-0 bg-emerald-900/60 backdrop-blur-sm flex items-center justify-center">
                   <Loader2 className="text-white animate-spin" size={40} />
                 </div>
               )}
             </div>
             <div className="p-6 space-y-6">
                <FormInput label="ឈ្មោះកសិផល (Product Name)" value={formData.nameKh} onChange={(v) => setFormData({...formData, nameKh: v})} />
                <FormInput label="តម្លៃ (Price)" type="number" suffix="៛" value={formData.price} onChange={(v) => setFormData({...formData, price: v})} />
                <FormInput label="លេខទូរស័ព្ទ (Phone)" type="tel" value={formData.sellerPhone} onChange={(v) => setFormData({...formData, sellerPhone: v})} placeholder="012 XXX XXX" />
             </div>
             <div className="flex-none p-6 pt-0">
                <button type="submit" className="w-full bg-[#1B4332] text-white font-black py-5 rounded-[2rem] shadow-xl shadow-emerald-900/20 text-lg active:scale-95 transition-all">បង្ហោះលក់ផលិតផល</button>
             </div>
          </form>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-full max-w-xl mx-auto bg-[#F5F3F0]">
      <header className="flex-none bg-white/70 backdrop-blur-md px-6 h-16 flex items-center justify-between border-b border-slate-200 relative z-50">
        <div className="flex items-center gap-3" onClick={() => setView('home')}>
          <div className="bg-[#1B4332] text-white p-2 rounded-xl shadow-xl">
            <Sprout size={18} strokeWidth={2.5} />
          </div>
          <h1 className="text-base font-black text-[#1B4332] uppercase tracking-tighter">Phsar Kasekor</h1>
        </div>
        <div className="bg-white/50 p-2 rounded-xl border border-slate-200">
           <User size={18} className="text-[#1B4332]" />
        </div>
      </header>

      <main className="flex-1 min-h-0 px-6 py-6 overflow-y-auto no-scrollbar relative">
        {view === 'home' && renderHome()}
        {view === 'buy' && renderBuy()}
        {view === 'sell' && renderSell()}
        {view === 'seedCheck' && renderSeedCheck()}
        {view === 'projectInfo' && renderProjectInfo()}
        {view === 'tips' && (
           <div className="flex flex-col animate-in slide-in-from-right duration-300">
             <div className="flex items-center gap-4 mb-4 flex-none">
                <button onClick={() => setView('home')} className="p-2 bg-white rounded-xl shadow-sm text-slate-600">
                  <ArrowLeft size={20} />
                </button>
                <h2 className="text-xl font-black text-[#1B4332]">គន្លឹះបច្ចេកទេស</h2>
             </div>
             <div className="space-y-4 pb-6">
                {[
                  { q: "របៀបដាំត្រសក់ឱ្យមានផ្លែច្រើន", a: "ការដាំត្រសក់ត្រូវការទឹកគ្រប់គ្រាន់ និងការដាក់ជីធម្មជាតិដែលផ្សំពីលាមកសត្វ..." },
                  { q: "ការជ្រើសរើសពូជស្រូវសម្រាប់រដូវប្រាំង", a: "ពូជស្រូវសែនក្រអូប គឺជាជម្រើសដ៏ល្អបំផុតសម្រាប់កសិករដែលចង់បានទិន្នផលខ្ពស់..." },
                  { q: "ការកំចាត់ដង្កូវហ្វូងលើដំណាំពោត", a: "ការប្រើប្រាស់វិធីសាស្ត្រជីវសាស្ត្រ និងការតាមដានឱ្យបានជាប់លាប់គឺជាគន្លឹះ..." }
                ].map((tip, i) => (
                  <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-3 group active:bg-emerald-50 transition-colors">
                    <h3 className="font-black text-slate-900 text-lg leading-snug group-active:text-[#1B4332]">{tip.q}</h3>
                    <p className="text-slate-700 font-bold text-xs leading-relaxed opacity-80">{tip.a}</p>
                  </div>
                ))}
             </div>
          </div>
        )}
      </main>

      <div className="flex-none p-6 pt-0">
        <nav className="bg-white border border-slate-200 h-20 rounded-[2.5rem] flex items-center px-4 justify-between relative shadow-2xl shadow-slate-900/10">
          <NavButton active={view === 'home'} icon={<LayoutDashboard size={22} />} label="ដើម" onClick={() => setView('home')} />
          <NavButton active={view === 'buy'} icon={<Store size={22} />} label="ទិញ" onClick={() => setView('buy')} />
          
          <div className="relative -top-8">
            <button 
              onClick={() => { resetSellForm(); setView('sell'); }}
              className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center shadow-2xl transition-all border-4 border-[#F5F3F0] transform duration-500 ${view === 'sell' ? 'bg-[#1B4332] text-white scale-110 rotate-90' : 'bg-emerald-600 text-white hover:bg-[#1B4332]'}`}
            >
              <Plus size={36} strokeWidth={3.5} />
            </button>
          </div>

          <NavButton active={view === 'seedCheck'} icon={<ShieldCheck size={22} />} label="ពូជ" onClick={() => setView('seedCheck')} />
          <NavButton active={view === 'tips' || view === 'projectInfo'} icon={<BookOpen size={22} />} label="គន្លឹះ" onClick={() => setView('tips')} />
        </nav>
      </div>
    </div>
  );
};

// --- Helper Components ---

const HomeCard: React.FC<{ icon: React.ReactNode, label: string, sub: string, onClick: () => void }> = ({ icon, label, sub, onClick }) => (
  <button 
    onClick={onClick}
    className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-2 text-center active:scale-95 transition-all group"
  >
    <div className="p-3 bg-slate-50 rounded-2xl group-active:bg-emerald-50 transition-colors">
      {icon}
    </div>
    <div>
      <span className="block font-black text-slate-900 text-xs">{label}</span>
      <span className="block text-[8px] font-black text-slate-600 uppercase tracking-widest">{sub}</span>
    </div>
  </button>
);

const NavButton: React.FC<{ active: boolean, icon: React.ReactNode, label: string, onClick: () => void }> = ({ active, icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1.5 transition-all flex-1 py-2 ${active ? 'text-[#1B4332]' : 'text-slate-600'}`}
  >
    <div className={`${active ? 'scale-110' : 'scale-100 opacity-70'} transition-all`}>
      {icon}
    </div>
    <span className={`text-[9px] font-black uppercase tracking-widest ${active ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
  </button>
);

const InfoBox: React.FC<{ icon: React.ReactNode, label: string, value: string }> = ({ icon, label, value }) => (
  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
    <div className="flex items-center gap-2 text-emerald-700 mb-1">
      {icon}
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <p className="text-[10px] font-black text-slate-900">{value}</p>
  </div>
);

const BenefitItem: React.FC<{ lang: 'kh' | 'en', icon: React.ReactNode, khTitle: string, enTitle: string, khDesc: string, enDesc: string }> = ({ lang, icon, khTitle, enTitle, khDesc, enDesc }) => (
  <div className="flex gap-4">
    <div className="bg-white/10 p-2.5 h-fit rounded-xl border border-white/10">
      {React.cloneElement(icon as React.ReactElement<any>, { size: 20 })}
    </div>
    <div>
      <h4 className="font-black text-sm mb-0.5 text-white">{lang === 'kh' ? khTitle : enTitle}</h4>
      <p className="text-[10px] font-black text-emerald-100 leading-relaxed">{lang === 'kh' ? khDesc : enDesc}</p>
    </div>
  </div>
);

const FormInput: React.FC<{ label: string, value: string, onChange: (v: string) => void, type?: string, suffix?: string, placeholder?: string }> = ({ label, value, onChange, type = 'text', suffix, placeholder }) => (
  <div>
    <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2 ml-1">{label}</label>
    <div className="relative">
      <input 
        type={type} 
        placeholder={placeholder}
        className="w-full bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] px-5 py-4 font-black text-slate-900 outline-none focus:border-emerald-500 transition-all shadow-inner placeholder:text-slate-400" 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
      />
      {suffix && <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-500 text-sm">{suffix}</span>}
    </div>
  </div>
);

export default App;
