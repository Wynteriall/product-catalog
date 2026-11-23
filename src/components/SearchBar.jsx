import { useEffect, useRef, useState } from 'react';
import './SearchBar.css';

const CATEGORIES = [
  'Drinks',
  'Snacks',
  'Ready-to-Eat',
  'Essentials',
  'General',
];

const SORT_STATES = {
  default: {
    next: 'price-asc',
    arrow: '↕',
    ariaLabel: 'Price sort: default order. Activate to sort low to high.',
    title: 'Sort by price: Default (click for Low → High)',
  },
  'price-asc': {
    next: 'price-desc',
    arrow: '↑',
    ariaLabel: 'Price sort: low to high. Activate to sort high to low.',
    title: 'Sort by price: Low → High (click for High → Low)',
  },
  'price-desc': {
    next: 'default',
    arrow: '↓',
    ariaLabel: 'Price sort: high to low. Activate to reset to default order.',
    title: 'Sort by price: High → Low (click for Default)',
  },
};

function PixelSearchIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="search-dock__icon"
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      <rect x="4" y="2" width="5" height="2" fill="currentColor" />
      <rect x="2" y="4" width="2" height="5" fill="currentColor" />
      <rect x="9" y="4" width="2" height="5" fill="currentColor" />
      <rect x="4" y="9" width="5" height="2" fill="currentColor" />
      <rect x="10" y="10" width="2" height="2" fill="currentColor" />
      <rect x="12" y="12" width="2" height="2" fill="currentColor" />
    </svg>
  );
}

function SearchBar({
  searchText,
  onSearchChange,
  selectedCategories,
  onToggleCategory,
  onClearCategories,
  sortOrder,
  onSortOrderChange,
  onClearFilters,
  resultCount,
  totalCount,
}) {
  const [isCatOpen, setIsCatOpen] = useState(false);

  const catWrapRef = useRef(null);
  const catBtnRef = useRef(null);
  const inputRef = useRef(null);
  const closeTimerRef = useRef(null);

  const hasActiveFilters =
    searchText.trim() !== '' ||
    selectedCategories.length > 0 ||
    sortOrder !== 'default';

  const sortConfig = SORT_STATES[sortOrder] || SORT_STATES.default;
  const isSortActive = sortOrder !== 'default';

  function clearCloseTimer() {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function openCategories() {
    clearCloseTimer();
    setIsCatOpen(true);
  }

  function scheduleCloseCategories() {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setIsCatOpen(false);
    }, 140);
  }

  useEffect(() => {
    return () => {
      clearCloseTimer();
    };
  }, []);

  useEffect(() => {
    if (!isCatOpen) {
      return undefined;
    }

    function handleDocumentMouseDown(event) {
      if (catWrapRef.current && !catWrapRef.current.contains(event.target)) {
        setIsCatOpen(false);
      }
    }

    document.addEventListener('mousedown', handleDocumentMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown);
    };
  }, [isCatOpen]);

  function handleCategoryKeyDown(event) {
    if (event.key === 'Escape' && isCatOpen) {
      event.preventDefault();
      setIsCatOpen(false);
      catBtnRef.current?.focus();
    }
  }

  function handleCategoryBlur(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsCatOpen(false);
    }
  }

  function handleClearInput() {
    onSearchChange('');
    inputRef.current?.focus();
  }

  return (
    <section className="search-dock" aria-label="Search and filter products">
      <p className="sr-only" role="status" aria-live="polite">
        Showing {resultCount} of {totalCount} products
      </p>

      <div className="search-dock__top">
        <div
          ref={catWrapRef}
          className="search-dock__cat-wrap"
          onMouseEnter={openCategories}
          onMouseLeave={scheduleCloseCategories}
          onKeyDown={handleCategoryKeyDown}
          onBlur={handleCategoryBlur}
        >
          {isCatOpen ? (
            <div className="search-dock__cat-popover">
              <div
                id="category-popup"
                className="search-dock__cat-popup"
                role="group"
                aria-label="Filter by category"
              >
                {CATEGORIES.map((cat) => {
                  const isActive = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      className={`search-dock__cat-option${isActive ? ' search-dock__cat-option--active' : ''}`}
                      aria-pressed={isActive}
                      onClick={() => onToggleCategory(cat)}
                    >
                      <span className="search-dock__cat-box" aria-hidden="true">
                        {isActive ? '×' : ''}
                      </span>
                      <span className="search-dock__cat-name">{cat}</span>
                    </button>
                  );
                })}

                {selectedCategories.length > 0 ? (
                  <button
                    type="button"
                    className="search-dock__cat-clear"
                    onClick={onClearCategories}
                  >
                    All / Clear
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          <button
            ref={catBtnRef}
            type="button"
            className={`search-dock__pill search-dock__cat-btn${selectedCategories.length > 0 ? ' search-dock__pill--active' : ''}`}
            aria-expanded={isCatOpen}
            aria-haspopup="true"
            aria-controls="category-popup"
            onClick={() => {
              clearCloseTimer();
              setIsCatOpen((prev) => !prev);
            }}
          >
            <span>CATEGORIES</span>
            {selectedCategories.length > 0 ? (
              <span className="search-dock__badge">{selectedCategories.length}</span>
            ) : null}
          </button>
        </div>

        {hasActiveFilters ? (
          <div className="search-dock__status">
            <span className="search-dock__count-pill">
              <strong>{resultCount}</strong> of {totalCount}
            </span>
            <span className="search-dock__status-sep" aria-hidden="true">
              ·
            </span>
            <button
              type="button"
              className="search-dock__reset-btn"
              onClick={onClearFilters}
            >
              Reset
            </button>
          </div>
        ) : null}

        <button
          type="button"
          className={`search-dock__pill search-dock__price-btn${isSortActive ? ' search-dock__pill--active' : ' search-dock__price-btn--default'}`}
          aria-label={sortConfig.ariaLabel}
          title={sortConfig.title}
          onClick={() => onSortOrderChange(sortConfig.next)}
        >
          <span>PRICE</span>
          <span
            className={`search-dock__price-arrow${isSortActive ? ' search-dock__price-arrow--active' : ''}`}
            aria-hidden="true"
          >
            {sortConfig.arrow}
          </span>
        </button>
      </div>

      <div className="search-dock__bar">
        <label htmlFor="product-search" className="sr-only">
          Search products
        </label>
        <PixelSearchIcon />
        <input
          ref={inputRef}
          id="product-search"
          type="text"
          className="search-dock__input"
          placeholder="Search Pixel Mart items..."
          value={searchText}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        {searchText !== '' ? (
          <button
            type="button"
            className="search-dock__clear-input"
            aria-label="Clear search"
            onClick={handleClearInput}
          >
            ×
          </button>
        ) : null}
      </div>
    </section>
  );
}

export default SearchBar;
