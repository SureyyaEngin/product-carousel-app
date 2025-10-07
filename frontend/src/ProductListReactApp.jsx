import React, { useEffect, useState, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";



// --- Helpers ---
function formatPrice(price) {
  return typeof price === "number" ? `$${price.toFixed(2)} USD` : price;
}

function StarRating({ value, size = 16 }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (value >= i) stars.push("full");
    else if (value + 0.5 >= i) stars.push("half");
    else stars.push("empty");
  }
  return (
    <div className="flex items-center gap-1" aria-hidden>
      {stars.map((s, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={
            s === "full" ? "currentColor" : s === "half" ? "url(#grad)" : "none"
          }
          stroke="currentColor"
          className={`inline-block ${
            s === "empty" ? "text-gray-300" : "text-yellow-400"
          }`}
        >
          <defs>
            <linearGradient id="grad">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path
            strokeWidth="0"
            d="M12 .587l3.668 7.431L23.327 9.6l-5.66 5.52L18.999 24 12 19.897 5.001 24l1.332-8.88L.673 9.6l7.659-1.582L12 .587z"
          />
        </svg>
      ))}
    </div>
  );
}

export default function ProductListApp({
  apiEndpoint = "https://product-carousel-app-4k9g.vercel.app/api/products",
}) {


  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [selectedColor, setSelectedColor] = useState(null);
  const [sortBy, setSortBy] = useState("featured");
  const [activeImages, setActiveImages] = useState({});

  const carouselRef = useRef(null);

    const isDragging = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);

    const handleMouseDown = (e) => {
        isDragging.current = true;
        carouselRef.current.style.cursor = "grabbing";
        startX.current = e.pageX - carouselRef.current.offsetLeft;
        scrollLeft.current = carouselRef.current.scrollLeft;
    };

    const handleMouseLeave = () => {
        isDragging.current = false;
        carouselRef.current.style.cursor = "grab";
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        carouselRef.current.style.cursor = "grab";
    };

    const handleMouseMove = (e) => {
        if (!isDragging.current) return;
        e.preventDefault();
        const x = e.pageX - carouselRef.current.offsetLeft;
        const walk = (x - startX.current) * 1.2; // hız katsayısı
        carouselRef.current.scrollLeft = scrollLeft.current - walk;
    };

    // Dokunmatik (touch)
    const touchStartX = useRef(0);
    const touchScrollStart = useRef(0);

    const handleTouchStart = (e) => {
        const touch = e.touches[0];
        touchStartX.current = touch.clientX;
        touchScrollStart.current = carouselRef.current.scrollLeft;
    };

    const handleTouchMove = (e) => {
        if (e.touches.length !== 1) return;
        const touch = e.touches[0];
        const dx = touch.clientX - touchStartX.current;
        carouselRef.current.scrollLeft = touchScrollStart.current - dx;
    };


    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);

        fetch(apiEndpoint)
            .then((r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
        })
        .then((data) => {
            if (!mounted) return;
            setProducts(data);

            // --- İlk ürünün ilk rengini otomatik seç ---
            if (data.length > 0) {
                const firstProduct = data[0];
                setActiveImages({ [firstProduct.name]: "Yellow Gold" });
            }
        })
        .catch((err) => {
            if (!mounted) return;
                console.error(err);
                setError(err.message || String(err));
            })
            .finally(() => mounted && setLoading(false));

            return () => {
                mounted = false;
            };
    }, [apiEndpoint]);


  const colorsFromProducts = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.images) Object.keys(p.images).forEach((c) => set.add(c));
    });
    return Array.from(set);
  }, [products]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => (p.name || "").toLowerCase().includes(q));
    }
    
    if (sortBy === "rating")
      list.sort(
        (a, b) => (b.popularityScore || 0) - (a.popularityScore || 0)
      );
    return list;
  }, [products, search, selectedColor, sortBy]);

    const colorKeyMap = {
        "Yellow Gold": "yellow",
        "White Gold": "white",
        "Rose Gold": "rose",
    };

    const handleColorClick = (productId, color) => {
        setActiveImages((prev) => ({ ...prev, [productId]: color }));
    };

  const scrollLeft_ = () => {
    carouselRef.current?.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollRight_ = () => {
    carouselRef.current?.scrollBy({ left: 300, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <header className="max-w-7xl mx-auto mb-6">
        {products.length > 0 && (
          <p className="text-sm text-gray-500 mb-3">
            Current gold price:{" "}
            <span className="font-medium">
              ${Number(products[0].goldPrice).toFixed(2)} / gram
            </span>
          </p>
        )}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1
                className="text-[45px] font-normal"
                style={{ fontFamily: "Avenir, sans-serif" }}
            >
            Product List
            </h1>

            <p className="text-sm text-gray-600">
              Swipe or use arrows to explore
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-64 md:w-96 rounded-md border px-3 py-2 bg-white shadow-sm focus:outline-none"
              />
              {search && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                  onClick={() => setSearch("")}
                >
                  ✕
                </button>
              )}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-md border bg-white px-3 py-2"
            >
              <option value="featured">Featured</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>
      </header>
      

      {/* Carousel */}
      <main className="max-w-7xl mx-auto relative">
        {loading ? (
          <div className="rounded-lg bg-white p-8 shadow-sm">
            Loading products...
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-6 text-red-700">
            Error: {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg bg-white p-8 shadow-sm">
            No products found.
          </div>
        ) : (
          <div className="relative">
            {/* Left arrow */}
            <button
              onClick={scrollLeft_}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-white shadow-md rounded-full p-2 z-10 hover:bg-gray-100"
            >
              <ChevronLeft />
            </button>

            <div
                ref={carouselRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                className="flex overflow-x-auto scroll-smooth space-x-4 snap-x snap-mandatory no-scrollbar pb-4"
                style={{ cursor: 'grab', touchAction: 'pan-x', userSelect: 'none' }}
            >
              {filtered.map((p) => {
                const popularity5 = (p.popularityScore * 5).toFixed(1);

                // Varsayılan renk: Yellow Gold
                const activeColorName = activeImages[p.name] || "Yellow Gold";

                // JSON'daki key ile eşleştirme
                const colorKeyMap = { "Yellow Gold": "yellow", "White Gold": "white", "Rose Gold": "rose" };
                const imageUrl = p.images?.[colorKeyMap[activeColorName]];

                const colorMap = {
                    "Yellow Gold": "#E6CA97",
                    "White Gold": "#D9D9D9",
                    "Rose Gold": "#E1A4A9",
                };

                return (
                    <article
                        key={p.name}
                        className="flex-shrink-0 w-64 bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all transform hover:scale-105"
                    >
                    <div className="relative aspect-square bg-gray-100">
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={p.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                No Image
                            </div>
                        )}
                    </div>

                    <div className="p-4 flex flex-col items-center">
                        <h2
                            className="text-[15px] font-medium"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            {p.name}
                        </h2>

                        <p
                            className="text-[15px] mt-1"
                            style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 400 }}
                        >
                            {formatPrice(Number(p.price))}
                        </p>

                        {/* --- Renk seçimleri --- */}
                        <div className="flex gap-3 mt-3">
                            {["Yellow Gold", "White Gold", "Rose Gold"].map((colorName) => (
                                <div
                                    key={colorName}
                                    className={`w-5 h-5 rounded-full border-2 cursor-pointer transition-all ${
                                        activeColorName === colorName ? "scale-110 border-black" : "border-gray-300"
                                    }`}
                                    style={{ backgroundColor: colorMap[colorName] }}
                                    onClick={() => handleColorClick(p.name, colorName)}
                                ></div>
                                ))}
                            </div>

                            {/* --- Sadece seçili renk ismi --- */}
                            <div
                                className="mt-1 text-[13px] text-gray-600"
                                style={{ fontFamily: "Avenir, sans-serif" }}
                            >
                                {activeColorName}
                            </div>

                            {/* --- Puanlama --- */}
                            <div className="flex items-center gap-1 mt-3">
                                <StarRating value={popularity5 / 1} size={14} />
                                <span
                                    style={{ fontFamily: "Avenir, sans-serif", fontSize: "14px" }}
                                    className="text-gray-700"
                                >
                                    {popularity5}/5
                                </span>
                            </div>
                        </div>
                    </article>
                );
            })}

            </div>

            {/* Right arrow */}
            <button
              onClick={scrollRight_}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-white shadow-md rounded-full p-2 z-10 hover:bg-gray-100"
            >
              <ChevronRight />
            </button>
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto mt-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Renart
      </footer>
    </div>
  );
}
