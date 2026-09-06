import { useState } from 'react';
import GlowButton from '../ui/GlowButton';

const TextInput = ({ onSubmit, isLoading }) => {
  const [text, setText] = useState('');
  const maxChars = 5000;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim().length < 10) return;
    onSubmit({ text });
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, maxChars))}
          placeholder="Paste healthcare article text, medical claim, vaccine rumor, or health news content here (minimum 10 characters)..."
          rows={8}
          className="w-full bg-[#C8E4FA] border border-pink-300 focus:bg-[#D6EBFC] focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/30 text-slate-900 placeholder:text-slate-500 rounded-xl p-4 md:p-6 font-sans text-sm md:text-base transition-all resize-none shadow-inner"
        />
        <div className="absolute bottom-4 right-4 flex items-center gap-4 text-xs font-mono text-slate-600">
          <span>Words: {wordCount}</span>
          <span>
            {text.length}/{maxChars} chars
          </span>
        </div>
      </div>

      <div className="flex justify-end">
        <GlowButton
          type="submit"
          variant="cyan"
          disabled={text.trim().length < 10 || isLoading}
          loading={isLoading}
          className="w-full md:w-auto"
        >
          Analyze Healthcare Claim
        </GlowButton>
      </div>
    </form>
  );
};

export default TextInput;
