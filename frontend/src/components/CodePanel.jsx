import React, { useState } from 'react';

const tabs = [
  { id: 'frontend', label: 'Frontend UI' },
  { id: 'backend', label: 'API endpoint' },
  { id: 'watcher', label: 'Watcher' },
  { id: 'env', label: 'Config (.env)' }
];

const CodePanel = ({ snippets }) => {
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  const currentSnippet = snippets?.[activeTab] ?? '';

  const copyActive = async () => {
    try {
      await navigator.clipboard.writeText(currentSnippet);
    } catch (error) {
      console.error('Failed to copy snippet', error);
    }
  };

  return (
    <section className="code-panel">
      <header>
        <div>
          <span className="preview-tag">Generated bundle</span>
          <h2>Copy-ready output</h2>
        </div>
        <button type="button" className="btn-secondary" onClick={copyActive}>
          Copy snippet
        </button>
      </header>
      <nav className="code-tabs" aria-label="Code exports">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={tab.id === activeTab ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <pre className="code-output">
        <code>{currentSnippet}</code>
      </pre>
    </section>
  );
};

export default CodePanel;
