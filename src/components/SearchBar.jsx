import './SearchBar.css';

const CATEGORIES = [
  'All',
  'Drinks',
  'Snacks',
  'Ready-to-Eat',
  'Essentials',
  'General',
];

const SORT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

function SearchBar({
  searchText,
  onSearchChange,
  category,
  onCategoryChange,
  sortOrder,
  onSortOrderChange,
  onClearFilters,
  resultCount,
  totalCount,
}) {
  return (
    <section className="search-bar" aria-label="Search and filter products">
      <p className="search-bar__count" role="status" aria-live="polite">
        Showing {resultCount} of {totalCount} products
      </p>

      <div className="search-bar__field">
        <label htmlFor="product-search" className="search-bar__label">
          Search
        </label>
        <input
          id="product-search"
          type="text"
          className="search-bar__input"
          placeholder="Search items..."
          value={searchText}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="search-bar__row">
        <div className="search-bar__field">
          <label htmlFor="product-category" className="search-bar__label">
            Category
          </label>
          <select
            id="product-category"
            className="search-bar__select"
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
          >
            {CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="search-bar__field">
          <label htmlFor="product-sort" className="search-bar__label">
            Sort
          </label>
          <select
            id="product-sort"
            className="search-bar__select"
            value={sortOrder}
            onChange={(event) => onSortOrderChange(event.target.value)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        className="search-bar__clear"
        onClick={onClearFilters}
      >
        Clear Filters
      </button>
    </section>
  );
}

export default SearchBar;
