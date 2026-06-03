export default function Header({ darkMode, onToggleDark }) {
  return (
    <header className="site-header">
      <div className="header-row">
        <h1 className="site-title">Number Guessing Games</h1>
        <button
          id="dark-mode-toggle"
          className="dark-toggle"
          onClick={onToggleDark}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? '○ Light' : '● Dark'}
        </button>
      </div>
      <p className="site-subtitle">Four modes. Logic over luck.</p>
    </header>
  )
}
