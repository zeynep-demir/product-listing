import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";

// Renk
const COLOR_OPTIONS = [
  { name: "Yellow Gold", code: "yellow", hex: "#E6CA97" },
  { name: "White Gold", code: "white", hex: "#D9D9D9" },
  { name: "Rose Gold", code: "rose", hex: "#E1A4A9" },
];

const RatingStars = ({ score }) => {
  const fullStars = Math.floor(score);
  const hasHalfStar = score % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const stars = [];
  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <span key={`full-${i}`} className="star">
        ★
      </span>
    );
  }
  if (hasHalfStar) {
    stars.push(
      <span key="half" className="star">
        ★
      </span>
    );
  }
  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <span key={`empty-${i}`} className="star empty">
        ★
      </span>
    );
  }

  return <div className="stars-container">{stars}</div>;
};

const ColorPicker = ({ selectedColor, onColorChange }) => (
  <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
    {COLOR_OPTIONS.map((option) => (
      <div
        key={option.code}
        className={`color-picker-dot color-${option.code} ${
          selectedColor.code === option.code ? "active" : ""
        }`}
        style={{ backgroundColor: option.hex }}
        onClick={() => onColorChange(option)}
      />
    ))}
  </div>
);

const ProductCard = ({ product }) => {
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  // JSON'dan gelen resim URL'sini seçili renge göre bul
  const currentImageSrc = product.images
    ? product.images[selectedColor.code]
    : "placeholder-image-url.jpg";

  return (
    <div className="product-card">
      <div className="product-image-container">
        <img
          src={currentImageSrc}
          alt={product.name}
          className="product-image"
        />
      </div>

      <div className="product-details">
        <h3 className="product-title">{product.name}</h3>
        <p className="product-price">${product.price.toFixed(2)} USD</p>
        <ColorPicker
          selectedColor={selectedColor}
          onColorChange={setSelectedColor}
        />
        <p className="product-color-name">{selectedColor.name}</p>
        <div className="product-rating">
          <RatingStars score={parseFloat(product.scoreOutOf5)} />
          <span className="rating-text">{product.scoreOutOf5}/5</span>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [scrollProgress, setScrollProgress] = useState(0);

  const carouselRef = useRef(null);

  const handleScroll = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;

      // Kaydırılabilir toplam alan: Toplam genişlik - Görüntülenebilir genişlik
      const maxScroll = scrollWidth - clientWidth;

      // İlerleme yüzdesi: Geçerli kaydırma / Maksimum kaydırma
      const progress = maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0;
      setScrollProgress(progress);
    }
  };

  // API'den ürün çekme
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("process.env.REACT_APP_API_URL");

        if (Array.isArray(response.data)) {
          setProducts(response.data);
        } else {
          setError("API'den gelen veri dizi formatında değil.");
          setProducts([]);
        }
      } catch (err) {
        setError(`API bağlantı hatası.`);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const carouselElement = carouselRef.current;
    if (carouselElement) {
      carouselElement.addEventListener("scroll", handleScroll);
      handleScroll();
      return () => {
        carouselElement.removeEventListener("scroll", handleScroll);
      };
    }
  }, [products]);

  const scroll = (scrollOffset) => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft += scrollOffset * 320;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px", fontSize: "1.2em" }}>
        Ürünler Yükleniyor...
      </div>
    );
  }

  if (error || products.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "100px",
          color: error ? "red" : "black",
          fontSize: "1.2em",
        }}
      >
        {error || "Gösterilecek Ürün Bulunamadı."}
      </div>
    );
  }

  return (
    <div className="product-list-container">
      <h1 className="main-title">Product List</h1>

      {/* Sol Ok */}
      <button className="nav-arrow left" onClick={() => scroll(-1)}>
        &lt;
      </button>

      {/* Carousel */}
      <div className="product-carousel" ref={carouselRef}>
        {products.map((product) => (
          <ProductCard key={product.name} product={product} />
        ))}
      </div>

      {/* Sağ Ok */}
      <button className="nav-arrow right" onClick={() => scroll(1)}>
        &gt;
      </button>

      {/* İlerleme Çubuğu */}
      <div
        style={{
          height: "5px",
          backgroundColor: "#e0e0e0",
          marginTop: "30px",
          borderRadius: "3px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            height: "100%",
            width: `${100 / products.length}%`,
            left: `${scrollProgress}%`,
            backgroundColor: "#adadad",
            borderRadius: "3px",
            transition: "left 0.3s ease-out",
          }}
        />
      </div>
    </div>
  );
};

export default App;
