
import React, { useState, useCallback } from 'react';
import { generatePost } from './services/geminiService';
import { authorStyles } from './constants';

// --- Helper Components defined outside the main component to avoid re-creation on re-renders ---

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);

const Header: React.FC = () => (
    <header className="text-center p-4">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            Generator Postów AI
        </h1>
        <p className="text-gray-300 mt-2">
            Wpisz słowa kluczowe, wybierz styl i stwórz unikalny post na social media!
        </p>
    </header>
);

// --- InputForm Component ---
interface InputFormProps {
    keywords: string;
    setKeywords: (keywords: string) => void;
    style: string;
    setStyle: (style: string) => void;
    onSubmit: () => void;
    isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ keywords, setKeywords, style, setStyle, onSubmit, isLoading }) => (
    <div className="w-full max-w-2xl mx-auto mt-8 space-y-6">
        <div className="relative">
            <label htmlFor="keywords" className="block text-sm font-medium text-gray-300 mb-2">
                Słowa kluczowe / Temat posta
            </label>
            <textarea
                id="keywords"
                rows={4}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg shadow-sm text-gray-200 p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out placeholder-gray-500"
                placeholder="np. nowa kolekcja kawy, promocja wiosenna, ekologiczne opakowania..."
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                disabled={isLoading}
            />
        </div>

        <div>
            <label htmlFor="style" className="block text-sm font-medium text-gray-300 mb-2">
                Wybierz styl
            </label>
            <select
                id="style"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg shadow-sm text-gray-200 p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                disabled={isLoading}
            >
                {authorStyles.map((s) => (
                    <option key={s} value={s}>{s}</option>
                ))}
            </select>
        </div>

        <div className="text-center">
            <button
                onClick={onSubmit}
                disabled={isLoading || !keywords.trim()}
                className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
                {isLoading ? (
                    'Generowanie...'
                ) : (
                    <>
                        <SparklesIcon className="w-5 h-5 mr-2" />
                        Wygeneruj Post
                    </>
                )}
            </button>
        </div>
    </div>
);


// --- PostDisplay Component ---
interface FormattedPostProps {
  text: string;
}

const FormattedPost: React.FC<FormattedPostProps> = ({ text }) => {
  const formatText = (inputText: string) => {
    // Basic HTML escaping
    const escapeHtml = (unsafe: string) => {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }
    let formatted = escapeHtml(inputText);
    // Replace markdown **bold** with <strong> tags
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Replace newlines with <br> tags
    formatted = formatted.replace(/\n/g, '<br />');
    return formatted;
  };

  return (
    <div
      className="text-gray-200 whitespace-pre-wrap"
      dangerouslySetInnerHTML={{ __html: formatText(text) }}
    />
  );
};

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center space-x-2">
        <div className="w-4 h-4 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="w-4 h-4 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-4 h-4 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        <span className="text-gray-300 ml-3">Tworzenie magii...</span>
    </div>
);

interface PostDisplayProps {
    post: string;
    isLoading: boolean;
    error: string | null;
}

const PostDisplay: React.FC<PostDisplayProps> = ({ post, isLoading, error }) => {
    const hasContent = !isLoading && !error && post;

    return (
        <div className="w-full max-w-2xl mx-auto mt-8">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-lg p-6 min-h-[200px] flex flex-col justify-center border border-gray-700 transition-all duration-300">
                {isLoading && <LoadingSpinner />}
                {error && <p className="text-red-400 text-center">{error}</p>}
                {!isLoading && !error && !post && (
                    <p className="text-gray-500 text-center">
                        Tutaj pojawi się Twój wygenerowany post...
                    </p>
                )}
                {hasContent && <FormattedPost text={post} />}
            </div>
        </div>
    );
};


// --- Main App Component ---
const App: React.FC = () => {
    const [keywords, setKeywords] = useState<string>('');
    const [style, setStyle] = useState<string>(authorStyles[0]);
    const [post, setPost] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback(async () => {
        if (!keywords.trim()) {
            setError("Proszę wpisać słowa kluczowe.");
            return;
        }
        
        setIsLoading(true);
        setError(null);
        setPost('');

        try {
            const generatedPost = await generatePost(keywords, style);
            setPost(generatedPost);
        } catch (err: any) {
            setError(err.message || 'Wystąpił nieoczekiwany błąd.');
        } finally {
            setIsLoading(false);
        }
    }, [keywords, style]);

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-6 lg:p-8">
            <div 
                className="absolute top-0 left-0 w-full h-full bg-repeat opacity-5"
                style={{backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')"}}
            ></div>
            <div className="relative z-10 container mx-auto max-w-4xl">
                <Header />
                <main>
                    <InputForm
                        keywords={keywords}
                        setKeywords={setKeywords}
                        style={style}
                        setStyle={setStyle}
                        onSubmit={handleSubmit}
                        isLoading={isLoading}
                    />
                    <PostDisplay
                        post={post}
                        isLoading={isLoading}
                        error={error}
                    />
                </main>
                <footer className="text-center text-gray-500 mt-12 text-sm">
                    <p>Stworzone z pomocą Gemini AI</p>
                </footer>
            </div>
        </div>
    );
};

export default App;
