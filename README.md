# Pixel Mart (`product-catalog`)

A retro pixel-art convenience store built with React and Vite using plain JavaScript and plain CSS.

## Setup

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

## Guide Questions

1. **What is the difference between props and state?**
   **Props** are inputs passed into a component from its parent to configure what it renders, while **state** is data owned and managed inside a component that changes over time and triggers re-renders when updated.

2. **Why can a child component not modify the props it receives?**
   React enforces one-way (top-down) data flow and treats props as read-only so data ownership stays predictable and components remain easy to reason about and debug.

3. **How does the `onAddToCart` callback allow data to flow from child to parent even though props only flow downward?**
   The parent (`App.jsx`) passes a function reference down as a prop (`onAddToCart`). When the child (`ProductCard.jsx`) invokes that function with its `title` and click `event`, the function executes in the parent's scope and updates the parent's state.

4. **Why is the `key` prop required when rendering a list with `.map()`? What could happen if it is missing or duplicated?**
   `key` lets React match each element across renders so it knows which items were added, moved, or removed. If keys are missing or duplicated, React can reuse the wrong DOM nodes or component state, causing visual glitches or lost updates.

5. **What does the `children` prop allow you to do that a normal prop does not?**
   `children` lets a parent pass arbitrary JSX directly between a component's opening and closing tags (such as custom corner badges like `<span>New</span>` or `<span>Sale</span>`), making the component a flexible wrapper/slot without hardcoding every possible markup variation.

## Laboratory Exercise 4: Guide Questions

1. **Why do we use two separate states, `searchText` and `debouncedSearch`, instead of only one?**
   `searchText` updates immediately on every keystroke so the controlled input stays responsive, while `debouncedSearch` updates only after typing pauses for 300ms so filtering does not re-run on every character.

2. **What would happen if the debounce effect did not return a cleanup function?**
   Every keystroke would leave its old `setTimeout` running, so stale intermediate values would still fire `setDebouncedSearch` in sequence after 300ms instead of resetting the timer to only apply the final text.

3. **What is the purpose of the dependency array? What happens if it is empty (`[]`)? What happens if it is left out completely?**
   The dependency array tells React which values to watch so the effect only re-runs when one of them changes. An empty array (`[]`) runs the effect only once on mount (and its cleanup on unmount), while leaving it out completely makes the effect run after every single render.

4. **Why should we avoid sorting the original `products` array directly?**
   `Array.prototype.sort()` mutates the array in place, which would permanently reorder the imported `products` data, break the `"Default"` sort order, and violate React's immutability rules. Copying with `[...matchedProducts].sort(...)` keeps the original data intact.

5. **Is the filtered product list better stored in its own state, or calculated from existing state during rendering? Explain your choice.**
   It is better calculated as derived data during rendering (or memoized with `useMemo`) from `debouncedSearch`, `category`, and `sortOrder`. Storing it in a separate `useState` creates duplicate state that can easily fall out of sync whenever one of the filter inputs changes.
