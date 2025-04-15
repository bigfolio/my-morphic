"use client"; // Mark as client component

import { useState } from 'react';
import Head from 'next/head';

interface SearchResult {
  id: string;
  title: string;
  content: string;
}

export default function MorphicAISearch() {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'light' : 'dark');
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setResults([]);

    try {
      // Replace with your actual API endpoint
      const response = await fetch(
        `https://my-morphic-alpha.vercel.app/api/search?q=${encodeURIComponent(query)}`
      );
      const data: SearchResult[] = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`container ${isDarkMode ? 'dark' : 'light'}`}>
      <Head>
        <title>Morphic AI | Intelligent Search</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>

      <header>
        <div className="logo">Morphic AI</div>
        <button className="theme-toggle" onClick={toggleTheme}>
          <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`} />
        </button>
      </header>

      <main>
        <section className="hero">
          <h1>Intelligent Search Engine</h1>
          <p className="subtitle">
            Ask anything. Morphic AI understands natural language and delivers precise answers.
          </p>

          <div className="search-box">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search for anything..."
            />
            <button id="searchButton" onClick={handleSearch}>
              <i className="fas fa-search" /> Search
            </button>
          </div>
        </section>

        {isLoading && (
          <div className="loading">
            <div className="spinner" />
            <p>Analyzing your query...</p>
          </div>
        )}

        <div className="results">
          {results.length > 0 ? (
            results.map((result) => (
              <div key={result.id} className="result-card">
                <h3 className="result-title">{result.title}</h3>
                <p>{result.content}</p>
              </div>
            ))
          ) : (
            !isLoading && <p style={{ gridColumn: '1/-1' }}>No results found. Try a different query.</p>
          )}
        </div>
      </main>

      <footer>
        <p>Powered by Morphic AI on Vercel | © 2023</p>
      </footer>

      <style jsx>{`
        /* Paste all CSS from the previous HTML example here */
        /* Ensure you replace :root with .light and .dark classes */
        .light {
          --primary: #7c3aed;
          --secondary: #a78bfa;
          --text: #1f2937;
          --bg: #ffffff;
          --card-bg: #f9fafb;
          --shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .dark {
          --primary: #8b5cf6;
          --secondary: #c4b5fd;
          --text: #e5e7eb;
          --bg: #111827;
          --card-bg: #1f2937;
          --shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
        }

        /* Rest of the CSS remains the same */
        body {
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          line-height: 1.6;
        }
        /* ... */
      `}</style>
    </div>
  );
}
