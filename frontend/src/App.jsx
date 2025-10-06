// src/App.jsx
import React, { useState } from "react";
import ProductListApp from "./ProductListReactApp"; // the file from the canvas
import "./index.css"; // optional, keep or remove

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">My Product Catalog</h1>
        <p className="text-sm text-gray-600">Based on your design.</p>
      </header>

      {/* render the product page, fetching local products.json */}
      <ProductListApp apiEndpoint="http://localhost:5000/api/products" />

      
    </div>
  );
}

export default App;

