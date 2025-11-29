import React from 'react';

export function ThemeSelector({ currentTheme, onThemeChange }) {
  const themes = [
    { id: 'blue', label: '1', name: 'Blue' },
    { id: 'crimson', label: '2', name: 'Crimson' },
    { id: 'black', label: '3', name: 'Black' }
  ];

  return (
    <div className="theme-selector">
      <span className="theme-label">Theme:</span>
      {themes.map(theme => (
        <button
          key={theme.id}
          type="button"
          data-theme={theme.id}
          aria-label={`Theme ${theme.label}`}
          className={currentTheme === theme.id ? 'active' : ''}
          aria-pressed={currentTheme === theme.id}
          onClick={() => onThemeChange(theme.id)}
        >
          {theme.label}
        </button>
      ))}
    </div>
  );
}

