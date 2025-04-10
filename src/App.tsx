import { useEffect, useState } from "react";
import { FiMenu, FiSearch } from "react-icons/fi";
import "./App.css";

interface Equipo {
  nombre: string;
  voltaje_entrada: number;
  amperaje: number;
  uso_diario_esperado: number;
  potencia: number;
}

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [filteredEquipos, setFilteredEquipos] = useState<Equipo[]>([]);

  useEffect(() => {
    // Load equipos data when component mounts
    fetch("/data/equipos.json")
      .then(response => response.json())
      .then(data => {
        setEquipos(data);
        setFilteredEquipos(data);
      })
      .catch(error => console.error("Error loading equipos:", error));
  }, []);

  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);

    // Filter equipos based on search query
    const filtered = equipos.filter(equipo => equipo.nombre.toLowerCase().includes(query));
    setFilteredEquipos(filtered);
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
          {filteredEquipos.length > 0 ? (
            <ul className="equipment-list">
              {filteredEquipos.map((equipo, index) => (
                <li key={index} className="equipment-item">
                  <div className="equipment-details">
                    <div className="equipment-name">{equipo.nombre}</div>
                    <div className="equipment-specs">
                      {equipo.voltaje_entrada}V, {equipo.amperaje}A
                    </div>
                    <div className="equipment-usage">Uso estimado {equipo.uso_diario_esperado}h/dia</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="centered-text">No se encontraron equipos</div>
          )}
        </aside>
        <section className="product-list">
          <div className="centered-text">Aqui aparecerán los equipos agregados y los calculos</div>
        </section>
      </div>
    </div>
  );
}

export default App;
