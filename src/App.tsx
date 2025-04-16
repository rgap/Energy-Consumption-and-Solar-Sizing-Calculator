import { useCallback, useEffect, useState } from "react";
import { FiSearch } from "react-icons/fi";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [filteredEquipos, setFilteredEquipos] = useState<Equipo[]>([]);
  const [selectedEquipos, setSelectedEquipos] = useState<SelectedEquipo[]>([]);
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);
  const [calcConfig, setCalcConfig] = useState({
    factorSeguridad: 1.2,
    eficienciaInversor: 0.87,
    horasSolPico: 5.27,
    diasAutonomia: 3,
    costoPorKwh: 0.55,
    voltajeNominalSistema: 12, // Default value for system voltage
    voltajeNominalPanel: 12, // Voltaje nominal del panel (V)
    corrienteNominalPanel: 5.5, // Corriente nominal del panel (A)
  });

  useEffect(() => {
    fetch("/src/data/equipos.json")
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

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const query = event.target.value.toLowerCase();
      setSearchQuery(query);
      const filtered = equipos.filter(equipo => equipo.nombre.toLowerCase().includes(query) || equipo.potencia.toString().includes(query));
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

  const handleRemoveEquipo = useCallback((equipoToRemove: Equipo) => {
    setSelectedEquipos(prev => prev.filter(equipo => equipo.nombre !== equipoToRemove.nombre));
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
      } else {
        handleRemoveEquipo(equipo);
      }
    },
    [selectedEquipos, handleRemoveEquipo]
  );

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
            placeholder="Buscar equipo por nombre o potencia..."
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
                    className={`add-button ${selectedEquipos.some(e => e.nombre === equipo.nombre) ? "remove-state" : ""}`}
                    onClick={() => handleAddEquipo(equipo)}
                  >
                    {selectedEquipos.some(e => e.nombre === equipo.nombre) ? "Eliminar" : "Agregar"}
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

                <div className="consumption-section">
                  <h3>Consumo y Costos de Energía</h3>
                  <div className="config-item cost-input">
                    <label>Costo por kWh (S/.):</label>
                    <input
                      type="number"
                      value={calcConfig.costoPorKwh}
                      onChange={e => handleConfigChange("costoPorKwh", e.target.value)}
                      onClick={e => e.currentTarget.select()}
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="consumption-grid">
                    <div className="consumption-item">
                      <div className="consumption-title">Consumo Diario</div>
                      <div className="consumption-row">
                        <span>{(totals.energiaTotal / 1000).toFixed(2)} kWh</span>
                        <span>S/. {((totals.energiaTotal / 1000) * calcConfig.costoPorKwh).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="consumption-item">
                      <div className="consumption-title">Consumo Semanal</div>
                      <div className="consumption-row">
                        <span>{((totals.energiaTotal * 7) / 1000).toFixed(2)} kWh</span>
                        <span>S/. {(((totals.energiaTotal * 7) / 1000) * calcConfig.costoPorKwh).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="consumption-item">
                      <div className="consumption-title">Consumo Mensual</div>
                      <div className="consumption-row">
                        <span>{((totals.energiaTotal * 30) / 1000).toFixed(2)} kWh</span>
                        <span>S/. {(((totals.energiaTotal * 30) / 1000) * calcConfig.costoPorKwh).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="config-section">
                  <h3>Configuración del Sistema</h3>
                  <div className="config-grid">
                    <div className="config-item">
                      <label>Factor de Seguridad:</label>
                      <input
                        type="number"
                        value={calcConfig.factorSeguridad}
                        onChange={e => handleConfigChange("factorSeguridad", e.target.value)}
                        onClick={e => e.currentTarget.select()}
                        min="1"
                        step="0.1"
                      />
                    </div>
                    <div className="config-item">
                      <label>Voltaje Nominal del Sistema (V):</label>
                      <input
                        type="number"
                        value={calcConfig.voltajeNominalSistema}
                        onChange={e => handleConfigChange("voltajeNominalSistema", e.target.value)}
                        onClick={e => e.currentTarget.select()}
                        min="12"
                        step="12"
                      />
                    </div>
                    <div className="config-item">
                      <label>Eficiencia del Inversor:</label>
                      <input
                        type="number"
                        value={calcConfig.eficienciaInversor}
                        onChange={e => handleConfigChange("eficienciaInversor", e.target.value)}
                        onClick={e => e.currentTarget.select()}
                        min="0"
                        max="1"
                        step="0.01"
                      />
                    </div>
                    <div className="config-item">
                      <label>Horas Sol Pico (HSP):</label>
                      <input
                        type="number"
                        value={calcConfig.horasSolPico}
                        onChange={e => handleConfigChange("horasSolPico", e.target.value)}
                        onClick={e => e.currentTarget.select()}
                        min="0"
                        max="24"
                        step="0.1"
                      />
                    </div>
                    <div className="config-item">
                      <label>Voltaje Nominal Panel (V):</label>
                      <input
                        type="number"
                        value={calcConfig.voltajeNominalPanel}
                        onChange={e => handleConfigChange("voltajeNominalPanel", e.target.value)}
                        onClick={e => e.currentTarget.select()}
                        min="12"
                        step="12"
                      />
                    </div>
                    <div className="config-item">
                      <label>Corriente Nominal Panel (A):</label>
                      <input
                        type="number"
                        value={calcConfig.corrienteNominalPanel}
                        onChange={e => handleConfigChange("corrienteNominalPanel", e.target.value)}
                        onClick={e => e.currentTarget.select()}
                        min="0"
                        step="0.1"
                      />
                    </div>
                  </div>

                  <div className="calculations-results">
                    <h3>Resultados del Dimensionamiento</h3>
                    <div className="results-grid">
                      <div className="result-item">
                        <label>Energía Diaria Necesaria en DC (Wh):</label>
                        <span>{(totals.energiaTotal / calcConfig.eficienciaInversor).toFixed(2)} Wh</span>
                        <div className="formula">
                          Energía Diaria Necesaria en DC (Wh) = Energía Diaria de Salida en AC (Wh) / Eficiencia del Inversor
                          <br />= {totals.energiaTotal.toFixed(2)} Wh / {calcConfig.eficienciaInversor}={" "}
                          {(totals.energiaTotal / calcConfig.eficienciaInversor).toFixed(2)} Wh
                        </div>
                      </div>
                      <div className="result-item">
                        <label>Corriente Diaria Necesaria en DC (Ah):</label>
                        <span>
                          {(
                            (totals.energiaTotal / calcConfig.eficienciaInversor / calcConfig.voltajeNominalSistema) *
                            calcConfig.factorSeguridad
                          ).toFixed(2)}{" "}
                          Ah
                        </span>
                        <div className="formula">
                          Corriente Diaria Necesaria en DC (Ah) = (Energía Diaria Necesaria en DC (Wh) / Voltaje Nominal del Sistema (V)) × FS
                          <br />= ({(totals.energiaTotal / calcConfig.eficienciaInversor).toFixed(2)} Wh / {calcConfig.voltajeNominalSistema} V) ×{" "}
                          {calcConfig.factorSeguridad}={" "}
                          {(
                            (totals.energiaTotal / calcConfig.eficienciaInversor / calcConfig.voltajeNominalSistema) *
                            calcConfig.factorSeguridad
                          ).toFixed(2)}{" "}
                          Ah
                        </div>
                      </div>
                      <div className="result-item">
                        <label>#Paneles en paralelo:</label>
                        <span>
                          {(() => {
                            const value =
                              ((totals.energiaTotal / calcConfig.eficienciaInversor / calcConfig.voltajeNominalSistema) *
                                calcConfig.factorSeguridad) /
                              (calcConfig.horasSolPico * calcConfig.corrienteNominalPanel);
                            return Number.isInteger(value) ? value.toString() : value.toFixed(2);
                          })()}
                        </span>
                        <div className="formula">
                          #Paneles en paralelo = Corriente diaria requerida (Ah) / (HSP × Corriente Nominal del Panel (A))
                          <br />={" "}
                          {(
                            (totals.energiaTotal / calcConfig.eficienciaInversor / calcConfig.voltajeNominalSistema) *
                            calcConfig.factorSeguridad
                          ).toFixed(2)}{" "}
                          Ah / ({calcConfig.horasSolPico} × {calcConfig.corrienteNominalPanel} A) ={" "}
                          {(
                            ((totals.energiaTotal / calcConfig.eficienciaInversor / calcConfig.voltajeNominalSistema) * calcConfig.factorSeguridad) /
                            (calcConfig.horasSolPico * calcConfig.corrienteNominalPanel)
                          ).toFixed(2)}
                        </div>
                      </div>
                      <div className="result-item">
                        <label>#Paneles en Serie:</label>
                        <span>
                          {(() => {
                            const value = calcConfig.voltajeNominalSistema / calcConfig.voltajeNominalPanel;
                            return Number.isInteger(value) ? value.toString() : value.toFixed(2);
                          })()}
                        </span>
                        <div className="formula">
                          #Paneles en Serie = Voltaje del Sistema (V) / Voltaje del Panel (V)
                          <br />= {calcConfig.voltajeNominalSistema} V / {calcConfig.voltajeNominalPanel} V ={" "}
                          {(calcConfig.voltajeNominalSistema / calcConfig.voltajeNominalPanel).toFixed(2)}
                        </div>
                      </div>
                      <div className="result-item">
                        <label>Potencia Mínima del Panel (W):</label>
                        <span>{(calcConfig.voltajeNominalPanel * calcConfig.corrienteNominalPanel).toFixed(1)} W</span>
                        <div className="formula">
                          Potencia Mínima del Panel (W) = Voltaje Nominal del Panel (V) × Corriente Nominal del Panel (A)
                          <br />= {calcConfig.voltajeNominalPanel} V × {calcConfig.corrienteNominalPanel} A ={" "}
                          {(calcConfig.voltajeNominalPanel * calcConfig.corrienteNominalPanel).toFixed(1)} W
                        </div>
                      </div>
                    </div>
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
