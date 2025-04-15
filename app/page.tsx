'use client'; // MUST be the very first line

import { useState, useEffect } from 'react';
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

  // Initialize theme on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setIsDarkMode(savedTheme === 'dark');
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    const themeValue = newMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', themeValue);
    localStorage.setItem('theme', themeValue);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setResults([]);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}`
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
    <div className="container">
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
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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
            !isLoading && <p className="no-results">No results found. Try a different query.</p>
          )}
        </div>
      </main>

      <footer>
        <p>Powered by Morphic AI on Vercel | © {new Date().getFullYear()}</p>
      </footer>

      <style jsx global>{`
        :root {
          --primary: #7c3aed;
          --secondary: #a78bfa;
          --text: #1f2937;
          --bg: #ffffff;
          --card-bg: #f9fafb;
          --shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        [data-theme="dark"] {
          --primary: #8b5cf6;
          --secondary: #c4b5fd;
          --text: #e5e7eb;
          --bg: #111827;
          --card-bg: #1f2937;
          --shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
        }

        body {
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          transition: background-color 0.3s, color 0.3s;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          min-height: 100vh;
        }
      `}</style>

      <style jsx>{`
        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
        }

        .logo {
          font-size: 1.8rem;
          font-weight: 700;
          color: var(--primary);
          background: linear-gradient(to right, var(--primary), var(--secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .theme-toggle {
          background: none;
          border: none;
          color: var(--text);
          cursor: pointer;
          font-size: 1.2rem;
          padding: 0.5rem;
        }

        .hero {
          text-align: center;
          margin-bottom: 3rem;
        }

        h1 {
          font-size: 3rem;
          margin-bottom: 1rem;
          background: linear-gradient(to right, var(--primary), var(--secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .subtitle {
          font-size: 1.2rem;
          opacity: 0.8;
          margin-bottom: 2rem;
          color: var(--text);
        }

        .search-box {
          max-width: 600px;
          margin: 0 auto;
          position: relative;
        }

        input {
          width: 100%;
          padding: 1rem 1.5rem;
          border: 2px solid var(--card-bg);
          border-radius: 50px;
          font-size: 1rem;
          background: var(--card-bg);
          color: var(--text);
          outline: none;
          transition: all 0.3s;
        }

        input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.2);
        }

        #searchButton {
          position: absolute;
          right: 8px;
          top: 8px;
          background: linear-gradient(to right, var(--primary), var(--secondary));
          color: white;
          border: none;
          border-radius: 50px;
          padding: 0.6rem 1.5rem;
          cursor: pointer;
          font-weight: 600;
          transition: transform 0.2s;
        }

        #searchButton:hover {
          transform: translateY(-2px);
        }

        .loading {
          text-align: center;
          margin: 2rem 0;
        }

        .spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-left-color: var(--primary);
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .results {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-top: 2rem;
        }

        .result-card {
          background: var(--card-bg);
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: var(--shadow);
          border-left: 4px solid var(--primary);
          transition: transform 0.3s;
        }

        .result-card:hover {
          transform: translateY(-5px);
        }

        .result-title {
          color: var(--primary);
          margin-bottom: 0.5rem;
          font-size: 1.2rem;
        }

        .no-results {
          grid-column: 1 / -1;
          text-align: center;
          color: var(--text);
        }

        footer {
          text-align: center;
          margin-top: 4rem;
          opacity: 0.7;
          font-size: 0.9rem;
          color: var(--text);
        }

        @media (max-width: 768px) {
          h1 {
            font-size: 2rem;
          }
          
          .container {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
