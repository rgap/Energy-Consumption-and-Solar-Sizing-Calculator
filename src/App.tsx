import { useCallback, useEffect, useState } from "react";
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
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);
  const [calcConfig, setCalcConfig] = useState({
    factorSeguridad: 1.2,
    eficaciaInversor: 0.87,
    horasSolPico: 5.27,
    diasAutonomia: 3,
  });

  useEffect(() => {
    fetch("/data/equipos.json")
      .then(response => response.json())
      .then(data => {
        setEquipos(data);
        setFilteredEquipos(data);
      })
      .catch(error => {
        console.error("Error loading equipos:", error);
        // Show error message to user
        alert("Error al cargar los equipos. Por favor, recarga la página.");
      });
  }, []);

  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const query = event.target.value.toLowerCase();
      setSearchQuery(query);
      const filtered = equipos.filter(
        equipo =>
          equipo.nombre.toLowerCase().includes(query) ||
          equipo.potencia.toString().includes(query) ||
          equipo.voltaje_entrada.toString().includes(query)
      );
      setFilteredEquipos(filtered);
    },
    [equipos]
  );

  const handleDragStart = (event: React.DragEvent, equipo: Equipo) => {
    event.dataTransfer.setData("application/json", JSON.stringify(equipo));
    event.currentTarget.classList.add("dragging");
  };

  const handleDragEnd = (event: React.DragEvent) => {
    event.currentTarget.classList.remove("dragging");
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.currentTarget.classList.add("drag-over");
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.currentTarget.classList.remove("drag-over");
  };

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.currentTarget.classList.remove("drag-over");

      try {
        const draggedData = event.dataTransfer.getData("application/json");
        if (!draggedData) return;

        const data = JSON.parse(draggedData);
        if (!data.type && data.nombre) {
          if (!selectedEquipos.some(e => e.nombre === data.nombre)) {
            const selectedEquipo: SelectedEquipo = {
              ...data,
              cantidad: 1,
              horas: data.uso_diario_esperado || 1,
              editedAmperaje: data.amperaje,
              editedPotencia: data.potencia,
            };
            setSelectedEquipos(prev => [...prev, selectedEquipo]);
          }
        }
      } catch (error) {
        console.error("Error adding equipment:", error);
      }
    },
    [selectedEquipos]
  );

  const handleSelectedItemDragStart = (event: React.DragEvent, index: number) => {
    // Only allow dragging if we're dragging a tr element or its direct children
    const trElement = (event.target as HTMLElement).closest("tr");
    if (!trElement) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.setData("application/json", JSON.stringify({ type: "reorder", index }));
    trElement.classList.add("dragging");
  };

  const handleSelectedItemDragEnd = (event: React.DragEvent) => {
    const trElement = (event.target as HTMLElement).closest("tr");
    if (trElement) {
      trElement.classList.remove("dragging");
    }
    setDraggedOverIndex(null);
  };

  const handleSelectedItemDragOver = (event: React.DragEvent, index: number) => {
    event.preventDefault();
    setDraggedOverIndex(index);
  };

  const handleSelectedItemDrop = useCallback(
    (event: React.DragEvent, dropIndex: number) => {
      event.preventDefault();
      setDraggedOverIndex(null);

      try {
        const draggedData = event.dataTransfer.getData("application/json");
        if (!draggedData) return;

        const data = JSON.parse(draggedData);
        if (data.type === "reorder") {
          // Handle reordering of existing items
          const dragIndex = data.index;
          if (dragIndex === dropIndex) return;

          setSelectedEquipos(prev => {
            const newItems = [...prev];
            const [removed] = newItems.splice(dragIndex, 1);
            newItems.splice(dropIndex, 0, removed);
            return newItems;
          });
        } else if (data.nombre) {
          // Handle dropping new equipment from the list
          if (!selectedEquipos.some(e => e.nombre === data.nombre)) {
            const selectedEquipo: SelectedEquipo = {
              ...data,
              cantidad: 1,
              horas: data.uso_diario_esperado || 1,
              editedAmperaje: data.amperaje,
              editedPotencia: data.potencia,
            };
            setSelectedEquipos(prev => {
              const newItems = [...prev];
              newItems.splice(dropIndex, 0, selectedEquipo);
              return newItems;
            });
          }
        }
      } catch (error) {
        console.error("Error in drop operation:", error);
      }
    },
    [selectedEquipos]
  );

  const handleFieldChange = useCallback((index: number, field: keyof SelectedEquipo, value: string) => {
    const numValue = parseFloat(value) || 0;
    if (numValue < 0) return; // Prevent negative values

    setSelectedEquipos(prev => {
      const newEquipos = [...prev];
      newEquipos[index] = {
        ...newEquipos[index],
        [field]: numValue,
      };
      return newEquipos;
    });
  }, []);

  const handleAddEquipo = useCallback(
    (equipo: Equipo) => {
      if (!selectedEquipos.some(e => e.nombre === equipo.nombre)) {
        const selectedEquipo: SelectedEquipo = {
          ...equipo,
          cantidad: 1,
          horas: equipo.uso_diario_esperado || 1,
          editedAmperaje: equipo.amperaje,
          editedPotencia: equipo.potencia,
        };
        setSelectedEquipos(prev => [...prev, selectedEquipo]);
      }
    },
    [selectedEquipos]
  );

  const handleRemoveEquipo = useCallback((equipoToRemove: Equipo) => {
    setSelectedEquipos(prev => prev.filter(equipo => equipo.nombre !== equipoToRemove.nombre));
  }, []);

  const handleConfigChange = useCallback((field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    if (numValue < 0) return; // Prevent negative values

    setCalcConfig(prev => ({
      ...prev,
      [field]: numValue,
    }));
  }, []);

  // Calculate totals
  const totals = {
    potenciaTotal: selectedEquipos.reduce((sum, equipo) => sum + equipo.editedPotencia * equipo.cantidad, 0),
    energiaTotal: selectedEquipos.reduce((sum, equipo) => sum + equipo.editedPotencia * equipo.cantidad * equipo.horas, 0),
  };

  return (
    <div className="app-container">
      <header className="header">
        <button className="hamburger-button" onClick={handleMenuClick}>
          <FiMenu />
        </button>
        <div className="title-section">
          <h1>Calculadora de Consumo y Dimensionamiento Solar</h1>
        </div>
      </header>
      <div className="search-section">
        <div className="search-container">
          <FiSearch className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar equipo por nombre, potencia o voltaje..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>
      <div className="content-wrapper">
        <aside className="products-filtered">
          {filteredEquipos.length > 0 ? (
            <ul className="equipment-list">
              {filteredEquipos.map((equipo, index) => (
                <li key={index} className="equipment-item" draggable onDragStart={e => handleDragStart(e, equipo)} onDragEnd={handleDragEnd}>
                  <div className="equipment-details">
                    <div className="equipment-name">{equipo.nombre}</div>
                    <div className="equipment-specs">
                      {equipo.voltaje_entrada}V, {equipo.amperaje}A, {equipo.potencia}W
                    </div>
                    <div className="equipment-usage">Uso estimado {equipo.uso_diario_esperado}h/día</div>
                  </div>
                  <button
                    className="add-button"
                    onClick={() => handleAddEquipo(equipo)}
                    disabled={selectedEquipos.some(e => e.nombre === equipo.nombre)}
                  >
                    Agregar
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="centered-text">No se encontraron equipos</div>
          )}
        </aside>

        <div className="right-panel">
          <section className="calculations-section">
            {selectedEquipos.length > 0 ? (
              <div className="calculations-container">
                <div className="calculations-table">
                  <table>
                    <thead>
                      <tr>
                        <th className="actions-cell">Acciones</th>
                        <th>Equipo</th>
                        <th>Potencia (W)</th>
                        <th>Cantidad</th>
                        <th>Potencia Total</th>
                        <th>Horas al día (h)</th>
                        <th>Energía (Wh)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEquipos.map((equipo, index) => {
                        const potenciaTotal = equipo.editedPotencia * equipo.cantidad;
                        const energia = potenciaTotal * equipo.horas;
                        return (
                          <tr
                            key={index}
                            className={draggedOverIndex === index ? "drag-over" : ""}
                            onDragOver={e => {
                              e.preventDefault();
                              const trElement = (e.target as HTMLElement).closest("tr");
                              if (trElement) {
                                handleSelectedItemDragOver(e, index);
                              }
                            }}
                            onDrop={e => {
                              const trElement = (e.target as HTMLElement).closest("tr");
                              if (trElement) {
                                handleSelectedItemDrop(e, index);
                              }
                            }}
                          >
                            <td className="actions-cell">
                              <div
                                className="drag-handle"
                                draggable
                                onDragStart={e => handleSelectedItemDragStart(e, index)}
                                onDragEnd={handleSelectedItemDragEnd}
                                title="Arrastrar"
                              >
                                ⋮⋮
                              </div>
                              <button className="remove-button" onClick={() => handleRemoveEquipo(equipo)} title="Eliminar">
                                ×
                              </button>
                            </td>
                            <td>{equipo.nombre}</td>
                            <td>
                              <input
                                type="number"
                                value={equipo.editedPotencia}
                                onChange={e => handleFieldChange(index, "editedPotencia", e.target.value)}
                                onClick={e => e.currentTarget.select()}
                                min="0"
                                step="0.1"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={equipo.cantidad}
                                onChange={e => handleFieldChange(index, "cantidad", e.target.value)}
                                onClick={e => e.currentTarget.select()}
                                min="1"
                                step="1"
                              />
                            </td>
                            <td>{potenciaTotal.toFixed(1)}</td>
                            <td>
                              <input
                                type="number"
                                value={equipo.horas}
                                onChange={e => handleFieldChange(index, "horas", e.target.value)}
                                onClick={e => e.currentTarget.select()}
                                min="0"
                                max="24"
                                step="0.5"
                              />
                            </td>
                            <td>{energia.toFixed(1)}</td>
                          </tr>
                        );
                      })}
                      <tr className="totals-row">
                        <td></td>
                        <td></td>
                        <td></td>
                        <td>Potencia Total (Máxima)</td>
                        <td>{totals.potenciaTotal.toFixed(1)}</td>
                        <td>Energía Diaria (Máxima)</td>
                        <td>{totals.energiaTotal.toFixed(1)}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="config-section">
                  <div className="config-group">
                    <label>Factor de Seguridad (FS)</label>
                    <input
                      type="number"
                      value={calcConfig.factorSeguridad}
                      onChange={e => handleConfigChange("factorSeguridad", e.target.value)}
                      onClick={e => e.currentTarget.select()}
                      min="1"
                      step="0.1"
                    />
                  </div>
                  <div className="config-group">
                    <label>Eficiencia del Inversor</label>
                    <input
                      type="number"
                      value={calcConfig.eficaciaInversor}
                      onChange={e => handleConfigChange("eficaciaInversor", e.target.value)}
                      onClick={e => e.currentTarget.select()}
                      min="0"
                      max="1"
                      step="0.01"
                    />
                  </div>
                  <div className="config-group">
                    <label>Horas Sol Pico (HSP)</label>
                    <input
                      type="number"
                      value={calcConfig.horasSolPico}
                      onChange={e => handleConfigChange("horasSolPico", e.target.value)}
                      onClick={e => e.currentTarget.select()}
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div className="config-group">
                    <label>Días de Autonomía</label>
                    <input
                      type="number"
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
              <div className="calculations-table" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                <div className="centered-text">Arrastra equipos aquí para agregarlos</div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default App;
