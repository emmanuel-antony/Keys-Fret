import { useState, useRef, useCallback } from 'react';
import { Search, Loader2, Link2, Upload } from 'lucide-react';

interface UrlInputProps {
  onSubmit: (data: { url?: string; file?: File }) => void;
  isLoading: boolean;
}

export function UrlInput({ onSubmit, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) onSubmit({ url: url.trim() });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSubmit({ file });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onSubmit({ file });
      return;
    }

    const text = e.dataTransfer.getData('text/plain');
    if (text) {
      setUrl(text);
      setTimeout(() => onSubmit({ url: text.trim() }), 100);
    }
  }, [onSubmit]);

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="relative group flex flex-col gap-3"
      >
        <div className="relative">
          {/* Animated border glow */}
          <div
            className={`absolute -inset-0.5 rounded-2xl transition-all duration-300 blur-sm ${
              isDragging
                ? 'bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 opacity-80'
                : isFocused
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 opacity-50'
                : 'bg-gradient-to-r from-indigo-500/0 to-purple-500/0 opacity-0 group-hover:opacity-30 group-hover:bg-gradient-to-r group-hover:from-indigo-500 group-hover:to-purple-500'
            }`}
          />

          <div className={`relative flex items-center rounded-2xl border transition-all duration-300 overflow-hidden ${
            isDragging
              ? 'border-indigo-400/80 bg-indigo-500/10'
              : isFocused
              ? 'border-indigo-500/60 bg-white/8'
              : 'border-white/10 bg-white/5'
          }`}>

            {/* Icon */}
            <div className="flex-shrink-0 pl-5 pr-3">
              {isDragging ? (
                <Link2 className="w-5 h-5 text-indigo-400 animate-bounce" />
              ) : (
                <Search className="w-5 h-5 text-indigo-400/70" />
              )}
            </div>

            {/* Input */}
            <input
              id="youtube-url-input"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={isDragging ? 'Drop a link or audio file here!' : 'Paste a YouTube URL (e.g. https://youtube.com/...)'}
              className="flex-1 py-4 pr-2 bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm md:text-base"
              disabled={isLoading}
              autoComplete="off"
            />

            {/* Upload Button */}
            <div className="flex-shrink-0 pr-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="audio/*" 
                className="hidden" 
              />
              <button
                type="button"
                disabled={isLoading}
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 text-gray-400 hover:text-indigo-300 transition-colors bg-white/5 hover:bg-white/10 rounded-xl"
                title="Upload Audio File"
              >
                <Upload className="w-5 h-5" />
              </button>
            </div>

            {/* Submit Button */}
            <div className="flex-shrink-0 p-2">
              <button
                type="submit"
                id="analyze-button"
                disabled={isLoading || !url.trim()}
                className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
                  isLoading || !url.trim()
                    ? 'bg-indigo-500/30 text-indigo-300/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-400 hover:to-indigo-500 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing…</span>
                  </>
                ) : (
                  <span>Analyze ✦</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Drag hint */}
        {!isLoading && (
          <p className="text-center text-xs text-gray-600 mt-2">
            You can also drag & drop a YouTube link or an Audio File onto this bar
          </p>
        )}
      </form>
    </div>
  );
}
