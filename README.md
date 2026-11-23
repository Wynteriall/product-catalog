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
