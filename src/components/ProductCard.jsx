import './ProductCard.css';

function ProductCard({
  title,
  price,
  category = 'General',
  inStock,
  onAddToCart,
  image,
  children,
}) {
  const formattedPrice = `₱${price.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  function handleImageError(event) {
    event.currentTarget.style.display = 'none';
    event.currentTarget.parentElement?.classList.add(
      'product-card__media--fallback'
    );
  }

  function handleImageLoad(event) {
    event.currentTarget.style.display = 'block';
    event.currentTarget.parentElement?.classList.remove(
      'product-card__media--fallback'
    );
  }

  return (
    <article
      className={`product-card${inStock ? '' : ' product-card--out-of-stock'}`}
    >
      {children ? <div className="product-card__badge">{children}</div> : null}

      <div className="product-card__media">
        <img
          src={image}
          alt={title}
          className="product-card__sprite"
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
        <div className="product-card__fallback" aria-hidden="true">
          <svg
            viewBox="0 0 16 16"
            className="product-card__fallback-icon"
            shapeRendering="crispEdges"
          >
            <rect x="2" y="3" width="12" height="10" fill="#e6dfd1" />
            <rect x="2" y="3" width="12" height="2" fill="#1f1f1f" />
            <rect x="2" y="11" width="12" height="2" fill="#1f1f1f" />
            <rect x="2" y="3" width="2" height="10" fill="#1f1f1f" />
            <rect x="12" y="3" width="2" height="10" fill="#1f1f1f" />
            <rect x="5" y="6" width="2" height="2" fill="#d9534f" />
            <rect x="9" y="6" width="2" height="2" fill="#d9534f" />
            <rect x="6" y="9" width="4" height="1" fill="#1f1f1f" />
          </svg>
          <span className="product-card__fallback-text">SPRITE SLOT</span>
        </div>
      </div>

      <div className="product-card__body">
        <div className="product-card__meta">
          <span className="product-card__category">{category}</span>
          <span
            className={`product-card__stock ${
              inStock
                ? 'product-card__stock--in'
                : 'product-card__stock--out'
            }`}
          >
            {inStock ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>

        <h2 className="product-card__title">{title}</h2>
        <p className="product-card__price">{formattedPrice}</p>

        <button
          type="button"
          className="product-card__button"
          disabled={!inStock}
          onClick={(event) => onAddToCart(title, event)}
        >
          Add to Cart
        </button>
      </div>
    </article>
  );
}

export default ProductCard;
