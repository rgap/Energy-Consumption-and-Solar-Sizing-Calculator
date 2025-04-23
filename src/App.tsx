import { useCallback, useEffect, useState } from "react";
import { FiChevronDown, FiSearch } from "react-icons/fi";
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
    diasAutonomia: 1,
    costoPorKwh: 0.55,
    voltajeNominalSistema: 12, // Default value for system voltage
    voltajeNominalPanel: 12, // Voltaje nominal del panel (V)
    corrienteNominalPanel: 5.5, // Corriente nominal del panel (A)
    // New battery configuration values
    profundidadDescarga: 0.35,
    capacidadBateria: 100,
    voltajeBateria: 12,
    // New controller configuration value
    corrienteCortocircuito: 9.51,
  });

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    costs: true,
    energyRequirements: false,
    configuration: false,
    panelSizing: false,
    batterySizing: false,
    controllerSizing: false,
    inverterSizing: false, // New section state
  });

  const toggleSection = (sectionName: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  useEffect(() => {
    // Prevent wheel events from changing number input values globally
    const preventWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" && target.getAttribute("type") === "number") {
        e.preventDefault();
      }
    };

    document.addEventListener("wheel", preventWheel, { passive: false });

    return () => {
      document.removeEventListener("wheel", preventWheel);
    };
  }, []);

  useEffect(() => {
    fetch("/equipos.json")
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
    const numValue = value === "" ? "" : parseFloat(value);
    if (typeof numValue === "number" && numValue < 0) return; // Prevent negative values

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
    const numValue = value === "" ? "" : parseFloat(value);
    if (typeof numValue === "number" && numValue < 0) return; // Prevent negative values

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
                                onWheel={e => e.preventDefault()}
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
                                onWheel={e => e.preventDefault()}
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
                                onWheel={e => e.preventDefault()}
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
                        <td>Potencia Máxima Diaria (W)</td>
                        <td>{totals.potenciaTotal.toFixed(1)}</td>
                        <td>Energía Máxima Diaria (Wh)</td>
                        <td>{totals.energiaTotal.toFixed(1)}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="consumption-section">
                  <div className="section-header" onClick={() => toggleSection("costs")}>
                    <h3>
                      Consumo y Costos de Energía
                      <FiChevronDown className={`collapse-icon ${!collapsedSections.costs ? "expanded" : ""}`} />
                    </h3>
                  </div>
                  <div className={`section-content ${collapsedSections.costs ? "collapsed" : ""}`}>
                    <div className="config-item cost-input">
                      <label>Costo por kWh (S/.):</label>
                      <input
                        type="number"
                        value={calcConfig.costoPorKwh}
                        onChange={e => handleConfigChange("costoPorKwh", e.target.value)}
                        onClick={e => e.currentTarget.select()}
                        onWheel={e => e.preventDefault()}
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
                </div>

                <div className="consumption-section">
                  <div className="section-header" onClick={() => toggleSection("energyRequirements")}>
                    <h3>
                      Requerimientos Diarios de Energía
                      <FiChevronDown className={`collapse-icon ${!collapsedSections.energyRequirements ? "expanded" : ""}`} />
                    </h3>
                  </div>
                  <div className={`section-content ${collapsedSections.energyRequirements ? "collapsed" : ""}`}>
                    <div className="results-section">
                      <div className="results-grid">
                        <div className="result-item">
                          <label>Energía Diaria Necesaria en DC (Wh):</label>
                          <span>{(totals.energiaTotal / calcConfig.eficienciaInversor).toFixed(2)} Wh</span>
                          <div className="formula">
                            Energía Diaria Necesaria en DC (Wh) = Energía Máxima Diaria (Wh) / Eficiencia del Inversor
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
                      </div>
                    </div>
                  </div>
                </div>

                <div className="consumption-section">
                  <div className="section-header" onClick={() => toggleSection("configuration")}>
                    <h3>
                      Datos de Configuración
                      <FiChevronDown className={`collapse-icon ${!collapsedSections.configuration ? "expanded" : ""}`} />
                    </h3>
                  </div>
                  <div className={`section-content ${collapsedSections.configuration ? "collapsed" : ""}`}>
                    <div className="config-grid">
                      <div className="config-item">
                        <label>Factor de Seguridad:</label>
                        <input
                          type="number"
                          value={calcConfig.factorSeguridad}
                          onChange={e => handleConfigChange("factorSeguridad", e.target.value)}
                          onClick={e => e.currentTarget.select()}
                          onWheel={e => e.preventDefault()}
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
                          onWheel={e => e.preventDefault()}
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
                          onWheel={e => e.preventDefault()}
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
                          onWheel={e => e.preventDefault()}
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
                          onWheel={e => e.preventDefault()}
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
                          onWheel={e => e.preventDefault()}
                          min="0"
                          step="0.1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="consumption-section">
                  <div className="section-header" onClick={() => toggleSection("panelSizing")}>
                    <h3>
                      Dimensionamiento de Paneles
                      <FiChevronDown className={`collapse-icon ${!collapsedSections.panelSizing ? "expanded" : ""}`} />
                    </h3>
                  </div>
                  <div className={`section-content ${collapsedSections.panelSizing ? "collapsed" : ""}`}>
                    <div className="results-grid">
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

                <div className="consumption-section">
                  <div className="section-header" onClick={() => toggleSection("batterySizing")}>
                    <h3>
                      Dimensionamiento de Baterías
                      <FiChevronDown className={`collapse-icon ${!collapsedSections.batterySizing ? "expanded" : ""}`} />
                    </h3>
                  </div>
                  <div className={`section-content ${collapsedSections.batterySizing ? "collapsed" : ""}`}>
                    <div className="config-grid">
                      <div className="config-item">
                        <label>N (días de autonomía):</label>
                        <input
                          type="number"
                          value={calcConfig.diasAutonomia}
                          onChange={e => handleConfigChange("diasAutonomia", e.target.value)}
                          onClick={e => e.currentTarget.select()}
                          onWheel={e => e.preventDefault()}
                          min="1"
                          step="1"
                        />
                      </div>
                      <div className="config-item">
                        <label>Profundidad de Descarga:</label>
                        <input
                          type="number"
                          value={calcConfig.profundidadDescarga}
                          onChange={e => handleConfigChange("profundidadDescarga", e.target.value)}
                          onClick={e => e.currentTarget.select()}
                          onWheel={e => e.preventDefault()}
                          min="0"
                          max="1"
                          step="0.05"
                        />
                      </div>
                      <div className="config-item">
                        <label>Capacidad de Batería (Ah):</label>
                        <input
                          type="number"
                          value={calcConfig.capacidadBateria}
                          onChange={e => handleConfigChange("capacidadBateria", e.target.value)}
                          onClick={e => e.currentTarget.select()}
                          onWheel={e => e.preventDefault()}
                          min="0"
                          step="1"
                        />
                      </div>
                      <div className="config-item">
                        <label>Voltaje de Batería (V):</label>
                        <input
                          type="number"
                          value={calcConfig.voltajeBateria}
                          onChange={e => handleConfigChange("voltajeBateria", e.target.value)}
                          onClick={e => e.currentTarget.select()}
                          onWheel={e => e.preventDefault()}
                          min="0"
                          step="12"
                        />
                      </div>
                    </div>

                    <div className="results-grid">
                      <div className="result-item">
                        <label>#Baterías en paralelo:</label>
                        <span>
                          {(() => {
                            const corrienteDiariaDC =
                              (totals.energiaTotal / calcConfig.eficienciaInversor / calcConfig.voltajeNominalSistema) * calcConfig.factorSeguridad;
                            const value =
                              (corrienteDiariaDC * calcConfig.diasAutonomia) / (calcConfig.profundidadDescarga * calcConfig.capacidadBateria);
                            return Number.isInteger(value) ? value.toString() : value.toFixed(2);
                          })()}
                        </span>
                        <div className="formula">
                          #Baterías en paralelo = (Corriente Diaria Necesaria en DC (Ah) × N) / (Profundidad de Descarga × Capacidad de Batería)
                          <br />= (
                          {(
                            (totals.energiaTotal / calcConfig.eficienciaInversor / calcConfig.voltajeNominalSistema) *
                            calcConfig.factorSeguridad
                          ).toFixed(2)}{" "}
                          Ah × {calcConfig.diasAutonomia}) / ({calcConfig.profundidadDescarga} × {calcConfig.capacidadBateria} Ah) ={" "}
                          {(
                            ((totals.energiaTotal / calcConfig.eficienciaInversor / calcConfig.voltajeNominalSistema) *
                              calcConfig.factorSeguridad *
                              calcConfig.diasAutonomia) /
                            (calcConfig.profundidadDescarga * calcConfig.capacidadBateria)
                          ).toFixed(2)}
                        </div>
                      </div>
                      <div className="result-item">
                        <label>#Baterías en serie:</label>
                        <span>
                          {(() => {
                            const value = calcConfig.voltajeNominalSistema / calcConfig.voltajeBateria;
                            return Number.isInteger(value) ? value.toString() : value.toFixed(2);
                          })()}
                        </span>
                        <div className="formula">
                          #Baterías en serie = Voltaje del Sistema (V) / Voltaje de Batería (V)
                          <br />= {calcConfig.voltajeNominalSistema} V / {calcConfig.voltajeBateria} V ={" "}
                          {(calcConfig.voltajeNominalSistema / calcConfig.voltajeBateria).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="consumption-section">
                  <div className="section-header" onClick={() => toggleSection("controllerSizing")}>
                    <h3>
                      Dimensionamiento del Controlador
                      <FiChevronDown className={`collapse-icon ${!collapsedSections.controllerSizing ? "expanded" : ""}`} />
                    </h3>
                  </div>
                  <div className={`section-content ${collapsedSections.controllerSizing ? "collapsed" : ""}`}>
                    <div className="config-grid">
                      <div className="config-item">
                        <label>Corriente de Cortocircuito (ISC):</label>
                        <input
                          type="number"
                          value={calcConfig.corrienteCortocircuito}
                          onChange={e => handleConfigChange("corrienteCortocircuito", e.target.value)}
                          onClick={e => e.currentTarget.select()}
                          onWheel={e => e.preventDefault()}
                          min="0"
                          step="0.1"
                        />
                      </div>
                    </div>

                    <div className="results-grid">
                      <div className="result-item">
                        <label>Corriente Máxima para Controlador:</label>
                        <span>
                          {(() => {
                            const numPanelesParalelo =
                              ((totals.energiaTotal / calcConfig.eficienciaInversor / calcConfig.voltajeNominalSistema) *
                                calcConfig.factorSeguridad) /
                              (calcConfig.horasSolPico * calcConfig.corrienteNominalPanel);
                            const corrienteMaxima = Math.floor(numPanelesParalelo) * calcConfig.corrienteCortocircuito * calcConfig.factorSeguridad;
                            return corrienteMaxima.toFixed(2);
                          })()}{" "}
                          A
                        </span>
                        <div className="formula">
                          Corriente Máxima para Controlador = ⌊#Paneles en Paralelo⌋ × Corriente de Cortocircuito (ISC) × FS
                          <br />={" "}
                          {Math.floor(
                            ((totals.energiaTotal / calcConfig.eficienciaInversor / calcConfig.voltajeNominalSistema) * calcConfig.factorSeguridad) /
                              (calcConfig.horasSolPico * calcConfig.corrienteNominalPanel)
                          ).toFixed(2)}{" "}
                          × {calcConfig.corrienteCortocircuito} A × {calcConfig.factorSeguridad} ={" "}
                          {(
                            (((totals.energiaTotal / calcConfig.eficienciaInversor / calcConfig.voltajeNominalSistema) * calcConfig.factorSeguridad) /
                              (calcConfig.horasSolPico * calcConfig.corrienteNominalPanel)) *
                            calcConfig.corrienteCortocircuito *
                            calcConfig.factorSeguridad
                          ).toFixed(2)}{" "}
                          A
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="consumption-section">
                  <div className="section-header" onClick={() => toggleSection("inverterSizing")}>
                    <h3>
                      Dimensionamiento del Inversor
                      <FiChevronDown className={`collapse-icon ${!collapsedSections.inverterSizing ? "expanded" : ""}`} />
                    </h3>
                  </div>
                  <div className={`section-content ${collapsedSections.inverterSizing ? "collapsed" : ""}`}>
                    <div className="results-grid">
                      <div className="result-item">
                        <label>Potencia Máxima de Inversor:</label>
                        <span>
                          {(() => {
                            const potenciaMaximaInversor = (totals.potenciaTotal * calcConfig.factorSeguridad) / calcConfig.eficienciaInversor;
                            return potenciaMaximaInversor.toFixed(2);
                          })()}{" "}
                          W
                        </span>
                        <div className="formula">
                          Potencia Máxima de Inversor = (Potencia Máxima Diaria × FS) / Eficiencia del Inversor
                          <br />= ({totals.potenciaTotal.toFixed(2)} W × {calcConfig.factorSeguridad}) / {calcConfig.eficienciaInversor} ={" "}
                          {((totals.potenciaTotal * calcConfig.factorSeguridad) / calcConfig.eficienciaInversor).toFixed(2)} W
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
