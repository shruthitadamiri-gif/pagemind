/**
 * Builds retailer search links for a book. There's no product-matching API
 * without credentials (Amazon's Product Advertising API requires an
 * Associates account), so these are search-result URLs, not guaranteed
 * exact product pages — the right book is almost always the top result for
 * a specific "title author" query.
 */
export function buildBookLinks(title, author) {
  const query = encodeURIComponent(`${title} ${author}`)
  return {
    amazon: `https://www.amazon.com/s?k=${query}`,
    audible: `https://www.audible.com/search?keywords=${query}`,
    goodreads: `https://www.goodreads.com/search?q=${query}`,
  }
}
