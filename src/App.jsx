import { useEffect, useMemo, useRef, useState } from 'react';
import ProductCard from './components/ProductCard';
import SearchBar from './components/SearchBar';
import { products } from './data/products';
import './App.css';

const BADGE_BY_ID = {
  1: <span>New</span>,
  2: <span>Sale</span>,
  5: <span>Sale</span>,
};

const RESTOCK_OUT_MS = 200;
const RESTOCK_IN_MS = 240;
const RESTOCK_STAGGER_MS = 40;

function toShelfItems(list) {
  return list.map((product, index) => ({
    product,
    shelf: index % 2 === 0 ? 'left' : 'right',
    orderIndex: index,
  }));
}

function formatPeso(amount) {
  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function PixelCartSvg() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="cart-stage__svg"
      role="img"
      aria-label="Pixel Mart shopping cart"
      shapeRendering="crispEdges"
    >
      <rect x="2" y="4" width="3" height="2" fill="#1f1f1f" />
      <rect x="4" y="6" width="2" height="8" fill="#1f1f1f" />
      <rect x="6" y="7" width="14" height="2" fill="#1f1f1f" />
      <rect x="6" y="9" width="13" height="5" fill="#fffdf8" />
      <rect x="8" y="10" width="2" height="3" fill="#d9534f" />
      <rect x="12" y="10" width="2" height="3" fill="#d9534f" />
      <rect x="16" y="10" width="2" height="3" fill="#d9534f" />
      <rect x="18" y="9" width="2" height="5" fill="#1f1f1f" />
      <rect x="6" y="14" width="14" height="2" fill="#1f1f1f" />
      <rect x="7" y="17" width="3" height="3" fill="#1f1f1f" />
      <rect x="8" y="18" width="1" height="1" fill="#f6f3eb" />
      <rect x="15" y="17" width="3" height="3" fill="#1f1f1f" />
      <rect x="16" y="18" width="1" height="1" fill="#f6f3eb" />
    </svg>
  );
}

function App() {
  const [cartItems, setCartItems] = useState([]);
  const [lastAdded, setLastAdded] = useState('');
  const [toasts, setToasts] = useState([]);
  const [flyingTokens, setFlyingTokens] = useState([]);
  const [cartBouncing, setCartBouncing] = useState(false);
  const [cartImgFailed, setCartImgFailed] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [receiptPos, setReceiptPos] = useState({
    visible: false,
    x: 0,
    y: 0,
  });
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortOrder, setSortOrder] = useState('default');
  const [displayedItems, setDisplayedItems] = useState(() =>
    toShelfItems(products)
  );
  const [restockPhase, setRestockPhase] = useState('idle');

  const cartRef = useRef(null);
  const cartVisualRef = useRef(null);
  const receiptRef = useRef(null);
  const nextIdRef = useRef(1);
  const activeTokenIdsRef = useRef(new Set());
  const prevSortOrderRef = useRef(sortOrder);
  const prevFilterKeyRef = useRef(products.map((p) => p.id).join(','));
  const displayedCountRef = useRef(products.length);
  const animTimersRef = useRef([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = debouncedSearch.trim().toLowerCase();
    const matchedProducts = products.filter((product) => {
      const matchesSearch =
        normalizedQuery === '' ||
        product.title.toLowerCase().includes(normalizedQuery);
      const productCategory = product.category ?? 'General';
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(productCategory);
      return matchesSearch && matchesCategory;
    });

    if (sortOrder === 'price-asc') {
      return [...matchedProducts].sort((a, b) => a.price - b.price);
    }
    if (sortOrder === 'price-desc') {
      return [...matchedProducts].sort((a, b) => b.price - a.price);
    }
    return matchedProducts;
  }, [debouncedSearch, selectedCategories, sortOrder]);

  useEffect(() => {
    document.title = `Pixel Mart (${filteredProducts.length} results)`;
  }, [filteredProducts.length]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReducedMotion) {
      return undefined;
    }

    let rafId = 0;
    let settleTimerId = 0;
    let lastScrollY = window.scrollY;

    function setCartRoll(yPx, tiltDeg) {
      const el = cartVisualRef.current;
      if (!el) {
        return;
      }
      el.style.setProperty('--cart-roll-y', `${yPx.toFixed(2)}px`);
      el.style.setProperty('--cart-roll-tilt', `${tiltDeg.toFixed(2)}deg`);
    }

    function handleScroll() {
      if (rafId) {
        return;
      }
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        const currentY = window.scrollY;
        const delta = currentY - lastScrollY;
        lastScrollY = currentY;

        if (delta === 0) {
          return;
        }

        const direction = delta > 0 ? 1 : -1;
        const bobY = Math.sin(currentY * 0.06) * 2.5;
        const wheelRock = Math.sin(currentY * 0.03) * 1.8;
        const lean = direction * Math.min(2.4, Math.abs(delta) * 0.08);
        setCartRoll(bobY, wheelRock + lean);

        window.clearTimeout(settleTimerId);
        settleTimerId = window.setTimeout(() => {
          setCartRoll(0, 0);
        }, 160);
      });
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(settleTimerId);
    };
  }, []);

  useEffect(() => {
    if (confirmAction === null) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setConfirmAction(null);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [confirmAction]);

  const filterKey = filteredProducts.map((product) => product.id).join(',');

  useEffect(() => {
    const sortChanged = prevSortOrderRef.current !== sortOrder;
    const filterChanged = prevFilterKeyRef.current !== filterKey;

    if (!sortChanged && !filterChanged) {
      return undefined;
    }

    prevSortOrderRef.current = sortOrder;
    prevFilterKeyRef.current = filterKey;

    animTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    animTimersRef.current = [];

    function runRestockIn() {
      setDisplayedItems(toShelfItems(filteredProducts));
      displayedCountRef.current = filteredProducts.length;

      if (filteredProducts.length === 0) {
        setRestockPhase('idle');
        return;
      }

      setRestockPhase('in');

      const inDuration =
        RESTOCK_IN_MS +
        Math.max(0, filteredProducts.length - 1) * RESTOCK_STAGGER_MS +
        40;
      const idleTimer = window.setTimeout(() => {
        setRestockPhase('idle');
      }, inDuration);
      animTimersRef.current.push(idleTimer);
    }

    if (displayedCountRef.current === 0) {
      runRestockIn();
    } else {
      setRestockPhase('out');
      const outTimer = window.setTimeout(runRestockIn, RESTOCK_OUT_MS);
      animTimersRef.current.push(outTimer);
    }

    return () => {
      animTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      animTimersRef.current = [];
    };
  }, [filteredProducts, filterKey, sortOrder]);

  const leftShelf = displayedItems.filter((item) => item.shelf === 'left');
  const rightShelf = displayedItems.filter((item) => item.shelf === 'right');

  const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  function triggerCartBounce() {
    setCartBouncing(false);
    window.requestAnimationFrame(() => {
      setCartBouncing(true);
    });
  }

  function removeToast(id) {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }

  function showToast(text) {
    const toastId = nextIdRef.current++;
    setToasts((prev) => [...prev, { id: toastId, text }]);
    window.setTimeout(() => removeToast(toastId), 1100);
  }

  function finishFlyingToken(id) {
    if (!activeTokenIdsRef.current.has(id)) {
      return;
    }
    activeTokenIdsRef.current.delete(id);
    setFlyingTokens((prev) => prev.filter((token) => token.id !== id));
    triggerCartBounce();
  }

  function handleAddToCart(title, event) {
    const product = products.find((item) => item.title === title);
    if (!product || !product.inStock) {
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          title: product.title,
          price: product.price,
          quantity: 1,
        },
      ];
    });

    setLastAdded(title);
    showToast(`+1 ${title}`);

    const buttonRect = event?.currentTarget?.getBoundingClientRect();
    const cartRect = cartRef.current?.getBoundingClientRect();

    if (buttonRect && cartRect) {
      const startX = buttonRect.left + buttonRect.width / 2;
      const startY = buttonRect.top + buttonRect.height / 2;
      const targetX = cartRect.left + cartRect.width / 2;
      const targetY = cartRect.top + cartRect.height / 2;

      const tokenId = nextIdRef.current++;
      activeTokenIdsRef.current.add(tokenId);
      setFlyingTokens((prev) => [
        ...prev,
        {
          id: tokenId,
          title: product.title,
          image: product.image,
          startX,
          startY,
          dx: targetX - startX,
          dy: targetY - startY,
        },
      ]);
      window.setTimeout(() => finishFlyingToken(tokenId), 600);
    } else {
      triggerCartBounce();
    }
  }

  function handleCartMouseMove(event) {
    if (isReceiptOpen) {
      return;
    }

    const tooltipWidth = receiptRef.current?.offsetWidth || 260;
    const tooltipHeight = receiptRef.current?.offsetHeight || 180;
    const offset = 16;

    const maxX = Math.max(12, window.innerWidth - tooltipWidth - 12);
    const maxY = Math.max(12, window.innerHeight - tooltipHeight - 12);
    const clampedX = Math.min(Math.max(12, event.clientX + offset), maxX);
    const clampedY = Math.min(Math.max(12, event.clientY + offset), maxY);

    setReceiptPos({
      visible: true,
      x: clampedX,
      y: clampedY,
    });
  }

  function handleCartMouseLeave() {
    setReceiptPos((prev) => ({ ...prev, visible: false }));
  }

  function handleToggleReceipt() {
    setIsReceiptOpen((prev) => {
      const next = !prev;
      if (next) {
        setReceiptPos((pos) => ({ ...pos, visible: false }));
      } else {
        setConfirmAction(null);
      }
      return next;
    });
  }

  function handleCartStageKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggleReceipt();
    }
  }

  function handleRemoveItem(id) {
    const item = cartItems.find((entry) => entry.id === id);
    if (!item) {
      return;
    }

    const remaining = cartItems.filter((entry) => entry.id !== id);
    setCartItems(remaining);
    if (lastAdded === item.title) {
      setLastAdded(
        remaining.length > 0 ? remaining[remaining.length - 1].title : ''
      );
    }
    showToast(`VOID ${item.title}`);
  }

  function handleUpdateQuantity(id, delta) {
    const item = cartItems.find((entry) => entry.id === id);
    if (!item) {
      return;
    }

    const nextQty = item.quantity + delta;
    if (nextQty <= 0) {
      handleRemoveItem(id);
      return;
    }

    setCartItems((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, quantity: nextQty } : entry
      )
    );
    showToast(`${delta > 0 ? '+1' : '-1'} ${item.title}`);
  }

  function handleClearCart() {
    if (cartItems.length === 0) {
      return;
    }

    setCartItems([]);
    setLastAdded('');
    setConfirmAction(null);
    showToast('RECEIPT VOIDED');
  }

  function handleRequestBuy() {
    if (cartItems.length > 0) {
      setConfirmAction('buy');
    }
  }

  function handleRequestVoidAll() {
    if (cartItems.length > 0) {
      setConfirmAction('void-all');
    }
  }

  function handleConfirmBuy() {
    if (cartItems.length === 0) {
      return;
    }

    const purchasedCount = totalCount;
    setCartItems([]);
    setLastAdded('');
    setConfirmAction(null);
    setIsReceiptOpen(false);
    triggerCartBounce();
    showToast(
      `BOUGHT ${purchasedCount} ${purchasedCount === 1 ? 'ITEM' : 'ITEMS'}!`
    );
  }

  function handleToggleCategory(cat) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((item) => item !== cat) : [...prev, cat]
    );
  }

  function handleClearFilters() {
    setSearchText('');
    setDebouncedSearch('');
    setSelectedCategories([]);
    setSortOrder('default');
  }

  function renderShelfCard(entry) {
    const { product, orderIndex } = entry;

    let animClass = '';
    if (restockPhase === 'out') {
      animClass = 'product-card--restock-out';
    } else if (restockPhase === 'in') {
      animClass = 'product-card--restock-in';
    }

    return (
      <ProductCard
        key={product.id}
        title={product.title}
        price={product.price}
        category={product.category}
        inStock={product.inStock}
        image={product.image}
        className={animClass}
        style={{
          '--mobile-order': orderIndex,
          '--stagger-delay': `${orderIndex * 40}ms`,
        }}
        onAddToCart={handleAddToCart}
      >
        {BADGE_BY_ID[product.id]}
      </ProductCard>
    );
  }

  return (
    <div className="pixel-mart">
      <header className="mart-header">
        <div className="mart-header__inner">
          <span className="mart-header__tag">24H RETRO CONVENIENCE</span>
          <h1 className="mart-header__title">PIXEL MART</h1>
          <p className="mart-header__subtitle">
            Push your cart down the aisle and pick your late-night supplies.
          </p>
        </div>
      </header>

      <main className="aisle">
        <section className="aisle__shelf aisle__shelf--left" aria-label="Left Aisle">
          {leftShelf.map(renderShelfCard)}
        </section>

        <section className="aisle__center" aria-label="Shopping Cart">
          <div className="cart-lane">
            <div className="cart-status" role="status" aria-live="polite">
              {totalCount === 0 ? (
                'Your cart is empty...'
              ) : lastAdded ? (
                <>
                  <span className="cart-status__count">
                    Items added to cart: {totalCount}
                  </span>
                  <span className="cart-status__last">
                    Last added: {lastAdded}
                  </span>
                </>
              ) : (
                `Items in cart: ${totalCount}`
              )}
            </div>

            <div
              ref={cartRef}
              role="button"
              tabIndex={0}
              aria-expanded={isReceiptOpen}
              aria-controls="printed-receipt"
              className={`cart-stage${cartBouncing ? ' cart-stage--bounce' : ''}${isReceiptOpen ? ' cart-stage--open' : ''}`}
              onClick={handleToggleReceipt}
              onKeyDown={handleCartStageKeyDown}
              onAnimationEnd={() => setCartBouncing(false)}
              onMouseEnter={handleCartMouseMove}
              onMouseMove={handleCartMouseMove}
              onMouseLeave={handleCartMouseLeave}
            >
              <div className="cart-toasts" aria-hidden="true">
                {toasts.map((toast) => (
                  <span
                    key={toast.id}
                    className="cart-toast"
                    onAnimationEnd={() => removeToast(toast.id)}
                  >
                    {toast.text}
                  </span>
                ))}
              </div>

              <div ref={cartVisualRef} className="cart-stage__visual">
                {cartImgFailed ? (
                  <PixelCartSvg />
                ) : (
                  <img
                    src="/images/cart.png"
                    alt="Pixel Mart shopping cart"
                    className="cart-stage__img"
                    onError={() => setCartImgFailed(true)}
                    onLoad={() => setCartImgFailed(false)}
                  />
                )}
              </div>

              <div className="cart-stage__counter">
                <span>CART</span>
                <strong>{totalCount}</strong>
              </div>
              <p className="cart-stage__hint">
                {isReceiptOpen
                  ? 'Click cart to close receipt'
                  : 'Hover to peek · Click to edit'}
              </p>
            </div>

            {isReceiptOpen ? (
              <aside
                id="printed-receipt"
                className="receipt-tape"
                aria-label="Editable cart receipt"
              >
                <div className="receipt-tape__slot" aria-hidden="true" />
                <div className="receipt-tape__paper">
                  <div className="receipt-tape__top">
                    <span className="receipt-tape__title">
                      PIXEL MART RECEIPT
                    </span>
                    <button
                      type="button"
                      className="receipt-tape__close"
                      onClick={handleToggleReceipt}
                      aria-label="Close receipt"
                    >
                      X
                    </button>
                  </div>

                  <div className="cart-receipt__divider" />

                  {cartItems.length === 0 ? (
                    <p className="cart-receipt__empty">
                      No items yet. Pick from the aisles!
                    </p>
                  ) : (
                    <>
                      <div className="receipt-tape__toolbar">
                        <span className="receipt-tape__count">
                          {totalCount} {totalCount === 1 ? 'ITEM' : 'ITEMS'}
                        </span>
                        <button
                          type="button"
                          className="receipt-tape__void-all"
                          onClick={handleRequestVoidAll}
                        >
                          VOID ALL
                        </button>
                      </div>

                      <ul className="receipt-tape__list">
                        {cartItems.map((item) => (
                          <li key={item.id} className="receipt-tape__item">
                            <div className="receipt-tape__item-top">
                              <span className="receipt-tape__item-name">
                                {item.title}
                              </span>
                              <span className="receipt-tape__item-price">
                                {formatPeso(item.price * item.quantity)}
                              </span>
                            </div>
                            <div className="receipt-tape__controls">
                              <div className="receipt-tape__stepper">
                                <button
                                  type="button"
                                  className="receipt-tape__step-btn"
                                  aria-label={`Decrease ${item.title} quantity`}
                                  onClick={() =>
                                    handleUpdateQuantity(item.id, -1)
                                  }
                                >
                                  -
                                </button>
                                <span className="receipt-tape__qty">
                                  x{item.quantity}
                                </span>
                                <button
                                  type="button"
                                  className="receipt-tape__step-btn"
                                  aria-label={`Increase ${item.title} quantity`}
                                  onClick={() =>
                                    handleUpdateQuantity(item.id, 1)
                                  }
                                >
                                  +
                                </button>
                              </div>
                              <button
                                type="button"
                                className="receipt-tape__void-btn"
                                aria-label={`Remove ${item.title} from receipt`}
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                VOID
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>

                      <div className="cart-receipt__divider" />

                      <div className="receipt-tape__footer">
                        <div className="cart-receipt__total">
                          <span>SUBTOTAL</span>
                          <strong>{formatPeso(subtotal)}</strong>
                        </div>
                        <button
                          type="button"
                          className="receipt-tape__buy-btn"
                          onClick={handleRequestBuy}
                        >
                          BUY
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </aside>
            ) : null}
          </div>
        </section>

        <section className="aisle__shelf aisle__shelf--right" aria-label="Right Aisle">
          {rightShelf.map(renderShelfCard)}
        </section>

        {filteredProducts.length === 0 && displayedItems.length === 0 ? (
          <div className="aisle__empty" role="status">
            <p className="aisle__empty-text">
              No products found. Try a different keyword or category.
            </p>
            <button
              type="button"
              className="aisle__empty-btn"
              onClick={handleClearFilters}
            >
              Clear Filters
            </button>
          </div>
        ) : null}
      </main>

      <SearchBar
        searchText={searchText}
        onSearchChange={setSearchText}
        selectedCategories={selectedCategories}
        onToggleCategory={handleToggleCategory}
        onClearCategories={() => setSelectedCategories([])}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        onClearFilters={handleClearFilters}
        resultCount={filteredProducts.length}
        totalCount={products.length}
      />

      <div className="fly-layer" aria-hidden="true">
        {flyingTokens.map((token) => (
          <div
            key={token.id}
            className="fly-token"
            style={{
              left: `${token.startX}px`,
              top: `${token.startY}px`,
              '--fly-dx': `${token.dx}px`,
              '--fly-dy': `${token.dy}px`,
            }}
            onAnimationEnd={(event) => {
              if (event.target === event.currentTarget) {
                finishFlyingToken(token.id);
              }
            }}
          >
            <div className="fly-token__inner">
              <img
                src={token.image}
                alt=""
                className="fly-token__img"
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
              />
              <span className="fly-token__tag">+1</span>
            </div>
          </div>
        ))}
      </div>

      {!isReceiptOpen && receiptPos.visible ? (
        <aside
          ref={receiptRef}
          className="cart-receipt"
          style={{
            left: `${receiptPos.x}px`,
            top: `${receiptPos.y}px`,
          }}
          aria-label="Cart receipt"
        >
          <div className="cart-receipt__header">PIXEL MART RECEIPT</div>
          <div className="cart-receipt__divider" />
          {cartItems.length === 0 ? (
            <p className="cart-receipt__empty">No items yet.</p>
          ) : (
            <>
              <ul className="cart-receipt__list">
                {cartItems.map((item) => (
                  <li key={item.id} className="cart-receipt__row">
                    <span>
                      {item.title} x{item.quantity} —
                    </span>
                    <span>{formatPeso(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="cart-receipt__divider" />
              <div className="cart-receipt__total">
                <span>SUBTOTAL</span>
                <strong>{formatPeso(subtotal)}</strong>
              </div>
            </>
          )}
          <p className="cart-receipt__hint">Click cart to edit</p>
        </aside>
      ) : null}

      {confirmAction !== null ? (
        <div
          className="confirm-backdrop"
          onClick={() => setConfirmAction(null)}
        >
          <div
            className="confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            {confirmAction === 'buy' ? (
              <>
                <h2 id="confirm-dialog-title" className="confirm-dialog__title">
                  CONFIRM PURCHASE
                </h2>
                <p className="confirm-dialog__text">
                  Buy {totalCount} {totalCount === 1 ? 'item' : 'items'} for{' '}
                  {formatPeso(subtotal)}?
                </p>
                <div className="confirm-dialog__actions">
                  <button
                    type="button"
                    className="confirm-dialog__btn confirm-dialog__btn--cancel"
                    onClick={() => setConfirmAction(null)}
                  >
                    CANCEL
                  </button>
                  <button
                    type="button"
                    className="confirm-dialog__btn confirm-dialog__btn--buy"
                    onClick={handleConfirmBuy}
                  >
                    CONFIRM BUY
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 id="confirm-dialog-title" className="confirm-dialog__title">
                  VOID ALL ITEMS?
                </h2>
                <p className="confirm-dialog__text">
                  Remove all {totalCount}{' '}
                  {totalCount === 1 ? 'item' : 'items'} ({formatPeso(subtotal)})
                  from your receipt?
                </p>
                <div className="confirm-dialog__actions">
                  <button
                    type="button"
                    className="confirm-dialog__btn confirm-dialog__btn--cancel"
                    onClick={() => setConfirmAction(null)}
                  >
                    CANCEL
                  </button>
                  <button
                    type="button"
                    className="confirm-dialog__btn confirm-dialog__btn--danger"
                    onClick={handleClearCart}
                  >
                    VOID ALL
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
