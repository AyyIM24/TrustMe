import { useState } from 'react';
import { Link2 } from 'lucide-react';
import GlowButton from '../ui/GlowButton';

const UrlInput = ({ onSubmit, isLoading }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    onSubmit({ url });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Link2 className="w-5 h-5 text-slate-500" />
        </div>
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste health or medical article URL (e.g., https://bbc.com/news/health-...)"
          className="w-full bg-[#C8E4FA] border border-pink-300 focus:bg-[#D6EBFC] focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/30 text-slate-900 placeholder:text-slate-500 rounded-xl py-4 pl-12 pr-4 font-sans text-sm md:text-base transition-all shadow-inner"
        />
      </div>

      <div className="flex justify-end">
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
