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

interface SelectedEquipo extends Equipo {
  cantidad: number;
  horas: number;
  editedAmperaje: number;
  editedPotencia: number;
}

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [filteredEquipos, setFilteredEquipos] = useState<Equipo[]>([]);
  const [selectedEquipos, setSelectedEquipos] = useState<SelectedEquipo[]>([]);

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

  const handleDragStart = (event: React.DragEvent, equipo: Equipo) => {
    event.dataTransfer.setData("application/json", JSON.stringify(equipo));
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.currentTarget.classList.add("drag-over");
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.currentTarget.classList.remove("drag-over");
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.currentTarget.classList.remove("drag-over");

    try {
      const draggedData = event.dataTransfer.getData("application/json");
      if (!draggedData) return;

      const data = JSON.parse(draggedData);
      // Only process items from the sidebar, not reordering
      if (!data.type && data.nombre) {
        if (!selectedEquipos.some(e => e.nombre === data.nombre)) {
          const selectedEquipo: SelectedEquipo = {
            ...data,
            cantidad: 1,
            horas: 1,
            editedAmperaje: data.amperaje,
            editedPotencia: data.potencia,
          };
          setSelectedEquipos([selectedEquipo, ...selectedEquipos]);
        }
      }
    } catch (error) {
      console.error("Error adding equipment:", error);
    }
  };

  const handleRemoveEquipo = (equipoToRemove: Equipo) => {
    setSelectedEquipos(selectedEquipos.filter(equipo => equipo.nombre !== equipoToRemove.nombre));
  };

  const handleSelectedItemDragStart = (event: React.DragEvent, index: number) => {
    event.dataTransfer.setData("application/json", JSON.stringify({ type: "reorder", index, equipo: selectedEquipos[index] }));
  };

  const handleSelectedItemDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    // Just add visual feedback, don't try to access dataTransfer data here
    const target = event.currentTarget as HTMLElement;
    if (!target.classList.contains("drag-over")) {
      const items = Array.from(document.getElementsByClassName("selected-equipment-item"));
      items.forEach(item => item.classList.remove("drag-over"));
      target.classList.add("drag-over");
    }
  };

  const handleSelectedItemDrop = (event: React.DragEvent, dropIndex: number) => {
    event.preventDefault();

    try {
      const draggedData = event.dataTransfer.getData("application/json");
      if (!draggedData) return;

      const data = JSON.parse(draggedData);

      if (data.type === "reorder") {
        // Reordering within selected items
        const dragIndex = data.index;
        if (dragIndex === dropIndex) return; // Don't reorder if dropped in same position

        const newItems = [...selectedEquipos];
        const [removed] = newItems.splice(dragIndex, 1);
        newItems.splice(dropIndex, 0, removed);
        setSelectedEquipos(newItems);
      } else if (!data.type && data.nombre) {
        // Check if it's an equipment item
        // Adding new item from the sidebar
        if (!selectedEquipos.some(e => e.nombre === data.nombre)) {
          const newItems = [...selectedEquipos];
          newItems.splice(dropIndex, 0, data);
          setSelectedEquipos(newItems);
        }
      }

      // Remove drag-over class from all items
      const items = Array.from(document.getElementsByClassName("selected-equipment-item"));
      items.forEach(item => item.classList.remove("drag-over"));
    } catch (error) {
      console.error("Error in drop operation:", error);
    }
  };

  const handleFieldChange = (index: number, field: "editedPotencia" | "editedAmperaje" | "cantidad" | "horas", value: string) => {
    const newValue = parseFloat(value) || 0;
    setSelectedEquipos(prevEquipos => {
      const newEquipos = [...prevEquipos];
      newEquipos[index] = {
        ...newEquipos[index],
        [field]: newValue,
      };
      return newEquipos;
    });
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
                <li key={index} className="equipment-item" draggable onDragStart={e => handleDragStart(e, equipo)}>
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
        <section className="product-list" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
          {selectedEquipos.length > 0 ? (
            <div className="selected-equipment-grid">
              {selectedEquipos.map((equipo, index) => (
                <div
                  key={index}
                  className="selected-equipment-item"
                  draggable
                  onDragStart={e => handleSelectedItemDragStart(e, index)}
                  onDragOver={handleSelectedItemDragOver}
                  onDrop={e => handleSelectedItemDrop(e, index)}
                  onDragLeave={e => {
                    e.currentTarget.classList.remove("drag-over");
                  }}
                >
                  <button className="remove-button" onClick={() => handleRemoveEquipo(equipo)} title="Eliminar">
                    ×
                  </button>
                  <div className="equipment-details">
                    <div className="equipment-name">{equipo.nombre}</div>
                    <div className="input-group">
                      <label>Potencia</label>
                      <div className="input-field-container">
                        <input
                          type="number"
                          value={equipo.editedPotencia}
                          onChange={e => handleFieldChange(index, "editedPotencia", e.target.value)}
                        />
                        <span>W</span>
                      </div>
                    </div>
                    <div className="input-group">
                      <label>Amperaje</label>
                      <div className="input-field-container">
                        <input
                          type="number"
                          value={equipo.editedAmperaje}
                          onChange={e => handleFieldChange(index, "editedAmperaje", e.target.value)}
                        />
                        <span>A</span>
                      </div>
                    </div>
                    <div className="input-group">
                      <label>Cantidad</label>
                      <div className="input-field-container">
                        <input type="number" value={equipo.cantidad} onChange={e => handleFieldChange(index, "cantidad", e.target.value)} min="1" />
                        <span></span>
                      </div>
                    </div>
                    <div className="input-group">
                      <label>Horas al día</label>
                      <div className="input-field-container">
                        <input
                          type="number"
                          value={equipo.horas}
                          onChange={e => handleFieldChange(index, "horas", e.target.value)}
                          min="0"
                          max="24"
                        />
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="centered-text">Arrastra equipos aquí para agregarlos</div>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;
