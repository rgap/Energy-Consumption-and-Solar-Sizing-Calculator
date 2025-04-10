import { useState } from "react";
import { FiMenu, FiSearch } from "react-icons/fi";
import "./App.css";

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  return (
    <div className="app-container">
      <header className="header">
        <button className="hamburger-button" onClick={handleMenuClick}>
          <FiMenu />
        </button>
      </header>
      <div className="title-section">
        <h1>Cálculo de Energía</h1>
      </div>
      <div className="search-section">
        <div className="search-container">
          <FiSearch className="search-icon" />
          <input type="text" className="search-input" placeholder="Buscar equipo..." value={searchQuery} onChange={handleSearchChange} />
        </div>
      </div>
      <div className="content-wrapper">
        <aside className="products-filtered">
          <div className="centered-text">Aqui aparecerán los equipos</div>
        </aside>
        <section className="product-list">
          <div className="centered-text">Aqui aparecerán los equipos agregados y los calculos</div>
        </section>
      </div>
    </div>
  );
}

export default App;
