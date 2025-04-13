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
  const [calcConfig, setCalcConfig] = useState({
    factorSeguridad: 1.0,
    eficaciaInversor: 0.9,
    horasSolPico: 5.0,
    diasAutonomia: 3,
  });

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

  const cleanupDragOverClasses = () => {
    const items = Array.from(document.getElementsByClassName("selected-equipment-item"));
    items.forEach(item => item.classList.remove("drag-over"));
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.currentTarget.classList.remove("drag-over");
    cleanupDragOverClasses();

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

          // Get the drop position relative to the grid
          const gridElement = event.currentTarget.querySelector(".selected-equipment-grid");
          if (gridElement) {
            const rect = gridElement.getBoundingClientRect();
            const items = Array.from(gridElement.children);
            const itemWidth = items.length > 0 ? items[0].getBoundingClientRect().width : 0;
            const itemsPerRow = Math.floor(rect.width / (itemWidth + 16)); // 16px is the gap

            // Calculate drop position
            const relativeX = event.clientX - rect.left;
            const relativeY = event.clientY - rect.top;
            const col = Math.floor(relativeX / (itemWidth + 16));
            const row = Math.floor(relativeY / (itemWidth + 16));
            const targetIndex = Math.min(row * itemsPerRow + col, selectedEquipos.length);

            // Insert at calculated position
            const newItems = [...selectedEquipos];
            newItems.splice(targetIndex, 0, selectedEquipo);
            setSelectedEquipos(newItems);
          } else {
            // Fallback if grid not found
            setSelectedEquipos([...selectedEquipos, selectedEquipo]);
          }
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
    cleanupDragOverClasses();
    const target = event.currentTarget as HTMLElement;
    target.classList.add("drag-over");
  };

  const handleSelectedItemDrop = (event: React.DragEvent, dropIndex: number) => {
    event.preventDefault();
    cleanupDragOverClasses();

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

  const handleConfigChange = (field: string, value: string) => {
    const newValue = parseFloat(value) || 0;
    setCalcConfig(prevConfig => ({
      ...prevConfig,
      [field]: newValue,
    }));
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

        <div className="right-panel">
          <div className="list-container">
            <section className="product-list" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
              {selectedEquipos.length > 0 ? (
                <div className="selected-equipment-grid">
                  {selectedEquipos.map((equipo, index) => (
                    <div
                      key={index}
                      className="selected-equipment-item"
                      onDragOver={handleSelectedItemDragOver}
                      onDrop={e => handleSelectedItemDrop(e, index)}
                      onDragLeave={e => {
                        e.currentTarget.classList.remove("drag-over");
                      }}
                    >
                      <button className="drag-handle" draggable onDragStart={e => handleSelectedItemDragStart(e, index)} title="Arrastrar">
                        ⋮⋮
                      </button>
                      <button className="remove-button" onClick={() => handleRemoveEquipo(equipo)} title="Eliminar">
                        ×
                      </button>
                      <div className="equipment-details">
                        <div className="equipment-name">{equipo.nombre}</div>
                        <div className="input-group">
                          <label>Potencia</label>
                          <div className="input-field-container">
                            <input
                              value={equipo.editedPotencia}
                              onChange={e => handleFieldChange(index, "editedPotencia", e.target.value)}
                              onClick={e => e.currentTarget.select()}
                            />
                            <span>W</span>
                          </div>
                        </div>
                        <div className="input-group">
                          <label>Amperaje</label>
                          <div className="input-field-container">
                            <input
                              value={equipo.editedAmperaje}
                              onChange={e => handleFieldChange(index, "editedAmperaje", e.target.value)}
                              onClick={e => e.currentTarget.select()}
                            />
                            <span>A</span>
                          </div>
                        </div>
                        <div className="input-group">
                          <label>Cantidad</label>
                          <div className="input-field-container">
                            <input
                              value={equipo.cantidad}
                              onChange={e => handleFieldChange(index, "cantidad", e.target.value)}
                              onClick={e => e.currentTarget.select()}
                              min="1"
                            />
                            <span></span>
                          </div>
                        </div>
                        <div className="input-group">
                          <label>Horas al día</label>
                          <div className="input-field-container">
                            <input
                              value={equipo.horas}
                              onChange={e => handleFieldChange(index, "horas", e.target.value)}
                              onClick={e => e.currentTarget.select()}
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
          <section className="calculations-section">
            {selectedEquipos.length > 0 ? (
              <div className="calculations-container">
                <div className="config-section">
                  <div className="config-group">
                    <label>Factor de Seguridad (FS)</label>
                    <input
                      value={calcConfig.factorSeguridad}
                      onChange={e => handleConfigChange("factorSeguridad", e.target.value)}
                      onClick={e => e.currentTarget.select()}
                      min="1"
                      step="0.1"
                    />
                  </div>
                  <div className="config-group">
                    <label>Eficacia del Inversor</label>
                    <input
                      value={calcConfig.eficaciaInversor}
                      onChange={e => handleConfigChange("eficaciaInversor", e.target.value)}
                      onClick={e => e.currentTarget.select()}
                      min="0"
                      max="1"
                      step="0.1"
                    />
                  </div>
                  <div className="config-group">
                    <label>Horas Sol Pico (HSP)</label>
                    <input
                      value={calcConfig.horasSolPico}
                      onChange={e => handleConfigChange("horasSolPico", e.target.value)}
                      onClick={e => e.currentTarget.select()}
                      min="0"
                      step="0.5"
                    />
                  </div>
                  <div className="config-group">
                    <label>#Dias de Autonomía</label>
                    <input
                      value={calcConfig.diasAutonomia}
                      onChange={e => handleConfigChange("diasAutonomia", e.target.value)}
                      onClick={e => e.currentTarget.select()}
                      min="1"
                      step="1"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="centered-text">Aquí irán los cálculos</div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default App;
