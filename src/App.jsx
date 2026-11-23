import { useRef, useState } from 'react';
import ProductCard from './components/ProductCard';
import { products } from './data/products';
import './App.css';

const BADGE_BY_ID = {
  1: <span>New</span>,
  2: <span>Sale</span>,
  5: <span>Sale</span>,
};

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
  const [receiptPos, setReceiptPos] = useState({
    visible: false,
    x: 0,
    y: 0,
  });

  const cartRef = useRef(null);
  const receiptRef = useRef(null);
  const nextIdRef = useRef(1);
  const activeTokenIdsRef = useRef(new Set());

  const leftShelf = products.slice(0, 4);
  const rightShelf = products.slice(4, 8);

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

    const toastId = nextIdRef.current++;
    setToasts((prev) => [...prev, { id: toastId, text: `+1 ${title}` }]);
    window.setTimeout(() => removeToast(toastId), 1100);

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

  function renderShelfCard(product) {
    return (
      <ProductCard
        key={product.id}
        title={product.title}
        price={product.price}
        category={product.category}
        inStock={product.inStock}
        image={product.image}
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
              {totalCount === 0
                ? 'Your cart is empty...'
                : `Items added to cart: ${totalCount} (Last added: ${lastAdded})`}
            </div>

            <div
              ref={cartRef}
              className={`cart-stage${cartBouncing ? ' cart-stage--bounce' : ''}`}
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

              <div className="cart-stage__counter">
                <span>CART</span>
                <strong>{totalCount}</strong>
              </div>
              <p className="cart-stage__hint">Hover cart for pixel receipt</p>
            </div>
          </div>
        </section>

        <section className="aisle__shelf aisle__shelf--right" aria-label="Right Aisle">
          {rightShelf.map(renderShelfCard)}
        </section>
      </main>

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

      {receiptPos.visible ? (
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
        </aside>
      ) : null}
    </div>
  );
}

export default App;
