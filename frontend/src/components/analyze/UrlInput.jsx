import { useState } from 'react';
import { Link2, Sparkles, ShieldCheck, Globe } from 'lucide-react';
import GlowButton from '../ui/GlowButton';

const SAMPLE_URLS = [
  {
    label: 'Mayo Clinic (COVID Myths)',
    url: 'https://www.mayoclinic.org/diseases-conditions/coronavirus/in-depth/coronavirus-myths/art-20485720',
  },
  {
    label: 'WHO (Mythbusters)',
    url: 'https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public/myth-busters',
  },
  {
    label: 'Wikipedia (Misinformation)',
    url: 'https://en.wikipedia.org/wiki/Misinformation_related_to_the_COVID-19_pandemic',
  },
  {
    label: 'MedicalXpress (Cardiac Study)',
    url: 'https://medicalxpress.com/news/2024-04-scientists-mechanism-underlying-lethal-cardiac.html',
  },
];

const UrlInput = ({ onSubmit, isLoading }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    onSubmit({ url: url.trim() });
  };

  const handleSelectSample = (sampleUrl) => {
    setUrl(sampleUrl);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Sample URL Chips */}
      <div>
        <div className="flex items-center gap-1.5 mb-2 text-xs font-mono font-bold text-pink-800">
          <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
          <span>Try Clinical Sample URLs:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_URLS.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => handleSelectSample(s.url)}
              className="text-xs px-3 py-1.5 bg-[#C8E4FA] hover:bg-[#BEE0FB] border border-pink-300 hover:border-pink-400 rounded-full text-slate-800 font-mono font-medium transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input box */}
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Link2 className="w-5 h-5 text-slate-500" />
        </div>
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste medical or health article URL (e.g. https://www.mayoclinic.org/...)"
          className="w-full bg-[#C8E4FA] border border-pink-300 focus:bg-[#D6EBFC] focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/30 text-slate-900 placeholder:text-slate-500 rounded-xl py-3.5 pl-12 pr-4 font-sans text-sm md:text-base transition-all shadow-inner"
        />
      </div>

      {/* Security & Multi-Tier notice */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1 text-teal-800 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          Multi-Tier Stealth Scraper (Chrome TLS + Cloudflare Context Recovery)
        </span>
        {url && (
          <button
            type="button"
            onClick={() => setUrl('')}
            className="text-pink-700 hover:text-pink-900 font-mono text-xs underline cursor-pointer"
          >
            Clear URL
          </button>
        )}
      </div>

      <div className="flex justify-end pt-1">
        <GlowButton
          type="submit"
          variant="cyan"
          disabled={!url.trim() || isLoading}
          loading={isLoading}
          className="w-full md:w-auto"
        >
          Fetch & Analyze Medical Article
        </GlowButton>
      </div>
    </form>
  );
};

export default UrlInput;
