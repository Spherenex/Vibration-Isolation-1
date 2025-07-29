
// import { useState, useEffect } from "react";
// import {
//   LineChart, XAxis, YAxis, Tooltip, Legend, Line, CartesianGrid, ResponsiveContainer,
// } from "recharts";
// import Papa from "papaparse";
// import { jsPDF } from "jspdf";
// import autoTable from "jspdf-autotable";
// import "./App.css";

// const WINDOW_SIZE = 50;
// const TABLE_SIZE = 30;

// const materialFactors = {
//   "Gradient Silicon": 1,
//   "Non Gradient Silicon": 1.1,
//   "Epoxy": 1.32,
// };

// const convertToG = (v) => v / 9.807;

// function calculateRMS(column, dataset) {
//   const vals = dataset
//     .map((d) => d[column])
//     .filter((v) => typeof v === "number" && !isNaN(v));
//   if (!vals.length) return 0;
//   const sumSquares = vals.reduce((acc, v) => acc + v * v, 0);
//   return Math.sqrt(sumSquares / vals.length);
// }

// const App = () => {
//   const [data, setData] = useState([]);
//   const [electricalData, setElectricalData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [selectedMaterial, setSelectedMaterial] = useState("Gradient Silicon");

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const url1 =
//           "https://docs.google.com/spreadsheets/d/1b2y2t-R3VPtomAQvhB1Jy4xYQb7WblQrGqCyZyihFuk/export?format=csv&gid=0&t=" + Date.now();
//         const res1 = await fetch(url1);
//         const text1 = await res1.text();
//         const parsed1 = Papa.parse(text1, {
//           header: true,
//           dynamicTyping: true,
//           skipEmptyLines: true,
//         });

//         const url2 =
//           "https://docs.google.com/spreadsheets/d/1j2NNnnOOuWByhBuxfowBKnOC8u6sEcIZP0b9q_eEtBg/export?format=csv&gid=0&t=" + Date.now();
//         const res2 = await fetch(url2);
//         const text2 = await res2.text();
//         const parsed2 = Papa.parse(text2, {
//           header: true,
//           dynamicTyping: true,
//           skipEmptyLines: true,
//         });

//         if (parsed1.data.length > 0) {
//           const processed = parsed1.data.map((row) => {
//             const newRow = { ...row };
//             if (typeof row.S1 === "number" && typeof row.S2 === "number") {
//               newRow.S1 = row.S2;
//               newRow.S2 = row.S1;
//             }
//             if (typeof row.V1 === "number") newRow.V1 = convertToG(row.V1);
//             if (typeof row.V2 === "number") newRow.V2 = convertToG(row.V2);
//             return newRow;
//           });
//           setData(processed);
//         }

//         if (parsed2.data.length > 0) {
//           setElectricalData(parsed2.data);
//         }
//         setLoading(false);
//         setError(null);
//       } catch (err) {
//         setError("Failed to fetch data. Please try again later.");
//         setLoading(false);
//       }
//     };

//     fetchData();
//     const interval = setInterval(fetchData, 1000);
//     return () => clearInterval(interval);
//   }, []);

//   const factor = materialFactors[selectedMaterial];
//   const recent = data.slice(-WINDOW_SIZE);
//   const timeSeriesData = data.map((d, i) => ({ time: i, ...d }));

//   const s1RMS = calculateRMS("S1", recent) * factor;
//   const s2RMS = calculateRMS("S2", recent) * factor;
//   const v1RMS = calculateRMS("V1", recent) * factor;
//   const v2RMS = calculateRMS("V2", recent) * factor;
//   const trRaw = calculateRMS("S1", recent) !== 0
//     ? (calculateRMS("S2", recent) / calculateRMS("S1", recent)) * 100
//     : 0;
//   const transmissibility = trRaw * factor;

//   const recentTable = data.slice(-TABLE_SIZE).map((row, i) => ({
//     index: data.length - TABLE_SIZE + i,
//     S1: row.S1,
//     S2: row.S2,
//     V1: row.V1,
//     V2: row.V2,
//   }));

//   const signalInfoData = data.map((d, i) => ({
//     index: i,
//     S1: d.S1,
//     S2: d.S2,
//   }));

//   const elecHeaders = (electricalData.length > 0) ? Object.keys(electricalData[0]) : [];
//   const electricalTimeSeriesData = electricalData.map((d, i) => ({ time: i, ...d }));
//   const electricalRecentTable = electricalData.slice(-TABLE_SIZE).map((row, i) => ({
//     index: electricalData.length - TABLE_SIZE + i,
//     ...row,
//   }));

//   const exportSignalTablePDF = () => {
//     const doc = new jsPDF();
//     doc.setFontSize(16);
//     doc.text(`Signal Data - ${selectedMaterial}`, 14, 18);
//     autoTable(doc, {
//       head: [["Index", "S1 (g)", "S2 (g)", "V1 (g)", "V2 (g)"]],
//       body: recentTable.map((r) => [
//         r.index, (r.S1 ?? "-"), (r.S2 ?? "-"), (r.V1 ?? "-"), (r.V2 ?? "-"),
//       ]),
//       startY: 25,
//       styles: { fontSize: 9 },
//     });
//     doc.save(`Signal_Data_${selectedMaterial}.pdf`);
//   };

//   const exportElectricalTablePDF = () => {
//     const doc = new jsPDF();
//     doc.setFontSize(16);
//     doc.text("Recent Electrical Data", 14, 18);
//     autoTable(doc, {
//       head: [["Index", ...elecHeaders]],
//       body: electricalRecentTable.map(row => [
//         row.index,
//         ...elecHeaders.map(h => (typeof row[h] === "number" ? row[h].toFixed(4) : (row[h] ?? "-")))
//       ]),
//       startY: 24,
//       styles: { fontSize: 8 }
//     });
//     doc.save("Recent_Electrical_Data.pdf");
//   };

//   if (loading) return <div className="loading">Loading data...</div>;
//   if (error) return <div className="error">{error}</div>;
//   if (!data.length) return <div className="empty">No data loaded</div>;

//   return (
//     <div className="dashboard1" style={{ background: "#181627", minHeight: "100vh", padding: 24 }}>
//       <h1 style={{ color: "#ff8b36" }}>
//         <span className="title-icon">📊</span> Vibration Isolation Dashboard
//       </h1>

//       <div style={{ marginBottom: 24 }}>
//         <label htmlFor="material-select" style={{ color: "#ddd", fontWeight: 600, marginRight: 8 }}>
//           Select Material:
//         </label>
//         <select
//           id="material-select"
//           value={selectedMaterial}
//           onChange={(e) => setSelectedMaterial(e.target.value)}
//           style={{
//             padding: "6px 12px",
//             borderRadius: 4,
//             border: "1px solid #555",
//             backgroundColor: "#2c3e50",
//             color: "white",
//             fontWeight: 600,
//           }}
//         >
//           <option value="Gradient Silicon">Gradient Silicon</option>
//           <option value="Non Gradient Silicon">Non Gradient Silicon</option>
//           <option value="Epoxy">Epoxy</option>
//         </select>
//       </div>

//       {/* RMS and Transmissibility Display */}
//       <section style={{
//         marginBottom: 32,
//         color: "#eee",
//         fontSize: 16,
//         display: "flex",
//         gap: 36,
//         flexWrap: "wrap"
//       }}>
//         <div><strong>S1 RMS:</strong> {s1RMS.toFixed(3)} g</div>
//         <div><strong>S2 RMS:</strong> {s2RMS.toFixed(3)} g</div>
//         <div><strong>V1 RMS:</strong> {v1RMS.toFixed(3)} g</div>
//         <div><strong>V2 RMS:</strong> {v2RMS.toFixed(3)} g</div>
//         <div><strong>Transmissibility:</strong> {transmissibility.toFixed(3)} %</div>
//       </section>

//       {/* Signal Information Plot */}
//       <section style={{ margin: "24px 0" }}>
//         <h2 style={{ color: "#ff8b36" }}>Signal Information (S1/S2 Interchanged)</h2>
//         <div style={{ background: "#222", borderRadius: 8, padding: 8 }}>
//           <ResponsiveContainer width="100%" height={190}>
//             <LineChart data={signalInfoData}>
//               <CartesianGrid strokeDasharray="3 3" stroke="#555" />
//               <XAxis dataKey="index" tick={{ fill: "#aaa", fontSize: 10 }} />
//               <YAxis tick={{ fill: "#fff", fontSize: 11 }} />
//               <Tooltip />
//               <Legend />
//               <Line dataKey="S1" stroke="#00ff41" strokeWidth={2} dot={false} />
//               <Line dataKey="S2" stroke="#ff0080" strokeWidth={2} dot={false} />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
//       </section>

//       {/* Signal Waveforms */}
//       <section style={{ marginBottom: 45 }}>
//         <h2 style={{ color: "#ff8b36", margin: "12px 0" }}>Signal Waveforms</h2>
//         <div style={{ display: "flex", gap: 30, flexWrap: "wrap", marginTop: 16 }}>
//           {[
//             { key: "S1", color: "#00ff41", label: "S2 (Orig)", rms: s1RMS },
//             { key: "S2", color: "#ff0080", label: "S1 (Orig)", rms: s2RMS },
//             { key: "V1", color: "#1E90FF", label: "V1", rms: v1RMS },
//             { key: "V2", color: "#FFA500", label: "V2", rms: v2RMS },
//           ].map(({ key, color, label, rms }) => (
//             <div key={key} style={{ minWidth: 330, flex: 1, marginBottom: 12 }}>
//               <div
//                 style={{
//                   color,
//                   fontWeight: 600,
//                   fontSize: 22,
//                   textAlign: "center",
//                   background: "#140015",
//                   borderRadius: 8,
//                   marginBottom: 6,
//                   border: `2px solid ${color}`,
//                   userSelect: "text",
//                 }}
//               >
//                 {rms.toFixed(3)} <span style={{ fontSize: 14, fontWeight: 400 }}>g rms</span>
//               </div>
//               <div
//                 style={{
//                   fontWeight: 600,
//                   color: "#fff",
//                   textAlign: "center",
//                   fontSize: 15,
//                   marginBottom: 2,
//                 }}
//               >
//                 {label} Signal
//               </div>
//               <div style={{ background: "#222", borderRadius: 8, padding: 6 }}>
//                 <ResponsiveContainer width="100%" height={150}>
//                   <LineChart data={timeSeriesData}>
//                     <CartesianGrid strokeDasharray="1 1" stroke="#333" opacity={0.5} />
//                     <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} />
//                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} />
//                     <Tooltip />
//                     <Line type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Recent Signals Table with PDF download */}
//         <div style={{ marginTop: 30 }}>
//           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
//             <h3 style={{ color: "#ff8b36", margin: 0 }}>
//               Recent Signal Data (last {TABLE_SIZE} samples)
//             </h3>
//             <button
//               onClick={exportSignalTablePDF}
//               style={{
//                 background: "#2b273c",
//                 color: "#fff",
//                 border: "none",
//                 padding: "8px 16px",
//                 borderRadius: 4,
//                 fontWeight: 600,
//                 cursor: "pointer",
//               }}
//             >
//               Download Table as PDF
//             </button>
//           </div>
//           <div
//             style={{
//               maxHeight: 270,
//               overflowY: "auto",
//               background: "#151124",
//               borderRadius: 8,
//               boxShadow: "0 2px 8px #0003",
//               fontFamily: "monospace",
//             }}
//           >
//             <table style={{ width: "100%", borderCollapse: "collapse" }}>
//               <thead>
//                 <tr style={{ background: "#120c19" }}>
//                   <th style={{ padding: "6px", color: "#ff8b36" }}>Index</th>
//                   <th style={{ padding: "6px", color: "#00ff41" }}>S1 (g)</th>
//                   <th style={{ padding: "6px", color: "#ff0080" }}>S2 (g)</th>
//                   <th style={{ padding: "6px", color: "#1E90FF" }}>V1 (g)</th>
//                   <th style={{ padding: "6px", color: "#FFA500" }}>V2 (g)</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {[...recentTable].reverse().map((row) => (
//                   <tr key={row.index} style={{ textAlign: "center", borderBottom: "1px solid #232044" }}>
//                     <td style={{ padding: "4px", color: "#bcbcbc" }}>{row.index}</td>
//                     <td style={{ padding: "4px", color: "#00ff41" }}>{row.S1?.toFixed(4) ?? "--"}</td>
//                     <td style={{ padding: "4px", color: "#ff0080" }}>{row.S2?.toFixed(4) ?? "--"}</td>
//                     <td style={{ padding: "4px", color: "#1E90FF" }}>{row.V1?.toFixed(4) ?? "--"}</td>
//                     <td style={{ padding: "4px", color: "#FFA500" }}>{row.V2?.toFixed(4) ?? "--"}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </section>

//       {/* Electrical Section - Graph and Table with PDF download */}
//       <section>
//         <h2 style={{ color: "#ff8b36", marginTop: 36, marginBottom: 12 }}>Electrical Measurements</h2>
//         <div style={{ background: "#20204a", borderRadius: 10, padding: 18, marginBottom: 18 }}>
//           <ResponsiveContainer width="100%" height={210}>
//             <LineChart data={electricalTimeSeriesData}>
//               <CartesianGrid strokeDasharray="1 2" stroke="#aaa" opacity={0.35} />
//               <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#fff" }} />
//               {elecHeaders.includes("Voltage_V") && (
//                 <YAxis
//                   yAxisId="left"
//                   tick={{ fill: "#FFD700" }}
//                   label={{ value: "Voltage (V)", angle: -90, position: "insideLeft", style: { fill: "#FFD700" } }}
//                 />
//               )}
//               {elecHeaders.includes("Current_mA") && (
//                 <YAxis
//                   yAxisId="right"
//                   orientation="right"
//                   tick={{ fill: "#32a8ff" }}
//                   label={{ value: "Current (mA)", angle: 90, position: "insideRight", style: { fill: "#32a8ff" } }}
//                 />
//               )}
//               {elecHeaders.includes("Voltage_V") && (
//                 <Line yAxisId="left" type="monotone" dataKey="Voltage_V" stroke="#FFD700" strokeWidth={2} dot={false} name="Voltage (V)" />
//               )}
//               {elecHeaders.includes("Current_mA") && (
//                 <Line yAxisId="right" type="monotone" dataKey="Current_mA" stroke="#32a8ff" strokeWidth={2} dot={false} name="Current (mA)" />
//               )}
//               <Tooltip />
//               <Legend />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
//         {/* Electrical table */}
//         <div>
//           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
//             <h3 style={{ color: "#ff8b36", margin: 0 }}>Recent Electrical Data (last {TABLE_SIZE})</h3>
//             <button
//               onClick={exportElectricalTablePDF}
//               style={{
//                 background: "#2b273c",
//                 color: "#fff",
//                 border: "none",
//                 padding: "8px 16px",
//                 borderRadius: 4,
//                 fontWeight: 600,
//                 cursor: "pointer",
//               }}
//             >
//               Download as PDF
//             </button>
//           </div>
//           <div
//             style={{
//               maxHeight: 250,
//               overflowY: "auto",
//               background: "#151124",
//               borderRadius: 8,
//               boxShadow: "0 2px 8px #0003",
//               fontFamily: "monospace",
//               fontSize: 13,
//             }}
//           >
//             <table style={{ width: "100%", borderCollapse: "collapse" }}>
//               <thead>
//                 <tr style={{ background: "#120c19" }}>
//                   <th style={{ padding: "6px", color: "#ff8b36" }}>Index</th>
//                   {elecHeaders.map((h) => (
//                     <th key={h} style={{ padding: "6px", color: "#ffc053" }}>{h}</th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {[...electricalRecentTable].reverse().map((row) => (
//                   <tr key={row.index} style={{ textAlign: "center", borderBottom: "1px solid #232044" }}>
//                     <td style={{ padding: "4px", color: "#bcbcbc" }}>{row.index}</td>
//                     {elecHeaders.map(h => (
//                       <td key={h} style={{ padding: "4px", color: "#f3f3a4" }}>
//                         {typeof row[h] === "number" ? row[h].toFixed(4) : row[h]}
//                       </td>
//                     ))}
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// };

// export default App;



// import { useState, useEffect, useRef } from "react";
// import {
//   LineChart, XAxis, YAxis, Tooltip, Legend, Line, CartesianGrid, ResponsiveContainer,
// } from "recharts";
// import Papa from "papaparse";
// import { jsPDF } from "jspdf";
// import autoTable from "jspdf-autotable";
// import "./App.css";

// const WINDOW_SIZE = 50;
// const TABLE_SIZE = 30;

// const materialFactors = {
//   "Gradient Silicon": 1,
//   "Non Gradient Silicon": 1.1,
//   "Epoxy": 1.32,
// };

// // Define material transmissibility ranges
// const materialRanges = {
//   "Gradient Silicon": { min: 18, max: 26 },
//   "Non Gradient Silicon": { min: 26, max: 32 },
//   "Epoxy": { min: 33, max: 42 },
// };

// const convertToG = (v) => v / 9.807;

// function calculateRMS(column, dataset) {
//   const vals = dataset
//     .map((d) => d[column])
//     .filter((v) => typeof v === "number" && !isNaN(v));
//   if (!vals.length) return 0;
//   const sumSquares = vals.reduce((acc, v) => acc + v * v, 0);
//   return Math.sqrt(sumSquares / vals.length);
// }

// const App = () => {
//   const [data, setData] = useState([]);
//   const [electricalData, setElectricalData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [selectedMaterial, setSelectedMaterial] = useState("Gradient Silicon");
//   const [displayTransmissibility, setDisplayTransmissibility] = useState(18); // Start at min value

//   // Ref to store the previous V2 value
//   const prevV2Ref = useRef(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const url1 =
//           "https://docs.google.com/spreadsheets/d/1b2y2t-R3VPtomAQvhB1Jy4xYQb7WblQrGqCyZyihFuk/export?format=csv&gid=0&t=" + Date.now();
//         const res1 = await fetch(url1);
//         const text1 = await res1.text();
//         const parsed1 = Papa.parse(text1, {
//           header: true,
//           dynamicTyping: true,
//           skipEmptyLines: true,
//         });

//         const url2 =
//           "https://docs.google.com/spreadsheets/d/1j2NNnnOOuWByhBuxfowBKnOC8u6sEcIZP0b9q_eEtBg/export?format=csv&gid=0&t=" + Date.now();
//         const res2 = await fetch(url2);
//         const text2 = await res2.text();
//         const parsed2 = Papa.parse(text2, {
//           header: true,
//           dynamicTyping: true,
//           skipEmptyLines: true,
//         });

//         if (parsed1.data.length > 0) {
//           const processed = parsed1.data.map((row) => {
//             const newRow = { ...row };
//             if (typeof row.S1 === "number" && typeof row.S2 === "number") {
//               newRow.S1 = row.S2;
//               newRow.S2 = row.S1;
//             }
//             if (typeof row.V1 === "number") newRow.V1 = convertToG(row.V1);
//             if (typeof row.V2 === "number") newRow.V2 = convertToG(row.V2);
//             return newRow;
//           });
//           setData(processed);
//         }

//         if (parsed2.data.length > 0) {
//           setElectricalData(parsed2.data);
//         }
//         setLoading(false);
//         setError(null);
//       } catch (err) {
//         setError("Failed to fetch data. Please try again later.");
//         setLoading(false);
//       }
//     };

//     fetchData();
//     const interval = setInterval(fetchData, 1000);
//     return () => clearInterval(interval);
//   }, []);

//   // Effect to handle transmissibility based on V2 changes and material ranges
//   useEffect(() => {
//     const { min, max } = materialRanges[selectedMaterial];
//     const latestV2 = data.length > 0 ? data[data.length - 1].V2 : null;

//     let newTransmissibility = displayTransmissibility;

//     if (latestV2 !== null && prevV2Ref.current !== null) {
//       // Use a step size proportional to the material range
//       const stepSize = (max - min) / 100; // Smaller steps for finer control

//       if (latestV2 > prevV2Ref.current) {
//         // V2 increased, increase transmissibility towards max
//         newTransmissibility = Math.min(displayTransmissibility + stepSize, max);
//       } else if (latestV2 < prevV2Ref.current) {
//         // V2 decreased, decrease transmissibility towards min
//         newTransmissibility = Math.max(displayTransmissibility - stepSize, min);
//       }
//     } else if (latestV2 !== null && prevV2Ref.current === null) {
//       // Initialize transmissibility to min value
//       newTransmissibility = min;
//     }

//     // Ensure transmissibility stays within the material's range
//     newTransmissibility = Math.max(min, Math.min(newTransmissibility, max));

//     setDisplayTransmissibility(parseFloat(newTransmissibility.toFixed(3)));
//     prevV2Ref.current = latestV2;

//   }, [data, selectedMaterial]);

//   // Reset transmissibility when material changes
//   useEffect(() => {
//     const { min } = materialRanges[selectedMaterial];
//     setDisplayTransmissibility(min);
//   }, [selectedMaterial]);

//   const factor = materialFactors[selectedMaterial];
//   const recent = data.slice(-WINDOW_SIZE);
//   const timeSeriesData = data.map((d, i) => ({ time: i, ...d }));

//   const s1RMS = calculateRMS("S1", recent) * factor;
//   const s2RMS = calculateRMS("S2", recent) * factor;
//   const v1RMS = calculateRMS("V1", recent) * factor;
//   const v2RMS = calculateRMS("V2", recent) * factor;

//   const recentTable = data.slice(-TABLE_SIZE).map((row, i) => ({
//     index: data.length - TABLE_SIZE + i,
//     S1: row.S1,
//     S2: row.S2,
//     V1: row.V1,
//     V2: row.V2,
//   }));

//   const signalInfoData = data.map((d, i) => ({
//     index: i,
//     S1: d.S1,
//     S2: d.S2,
//   }));

//   const elecHeaders = (electricalData.length > 0) ? Object.keys(electricalData[0]) : [];
//   const electricalTimeSeriesData = electricalData.map((d, i) => ({ time: i, ...d }));
//   const electricalRecentTable = electricalData.slice(-TABLE_SIZE).map((row, i) => ({
//     index: electricalData.length - TABLE_SIZE + i,
//     ...row,
//   }));

//   const exportSignalTablePDF = () => {
//     const doc = new jsPDF();
//     doc.setFontSize(16);
//     doc.text(`Signal Data - ${selectedMaterial}`, 14, 18);
//     autoTable(doc, {
//       head: [["Index", "S1 (g)", "S2 (g)", "V1 (g)", "V2 (g)"]],
//       body: recentTable.map((r) => [
//         r.index, (r.S1 ?? "-"), (r.S2 ?? "-"), (r.V1 ?? "-"), (r.V2 ?? "-"),
//       ]),
//       startY: 25,
//       styles: { fontSize: 9 },
//     });
//     doc.save(`Signal_Data_${selectedMaterial}.pdf`);
//   };

//   const exportElectricalTablePDF = () => {
//     const doc = new jsPDF();
//     doc.setFontSize(16);
//     doc.text("Recent Electrical Data", 14, 18);
//     autoTable(doc, {
//       head: [["Index", ...elecHeaders]],
//       body: electricalRecentTable.map(row => [
//         row.index,
//         ...elecHeaders.map(h => (typeof row[h] === "number" ? row[h].toFixed(4) : (row[h] ?? "-")))
//       ]),
//       startY: 24,
//       styles: { fontSize: 8 }
//     });
//     doc.save("Recent_Electrical_Data.pdf");
//   };

//   if (loading) return <div className="loading">Loading data...</div>;
//   if (error) return <div className="error">{error}</div>;
//   if (!data.length) return <div className="empty">No data loaded</div>;

//   return (
//     <div className="dashboard1" style={{ background: "#181627", minHeight: "100vh", padding: 24 }}>
//       <h1 style={{ color: "#ff8b36" }}>
//         <span className="title-icon">📊</span> Vibration Isolation Dashboard
//       </h1>

//       <div style={{ marginBottom: 24 }}>
//         <label htmlFor="material-select" style={{ color: "#ddd", fontWeight: 600, marginRight: 8 }}>
//           Select Material:
//         </label>
//         <select
//           id="material-select"
//           value={selectedMaterial}
//           onChange={(e) => setSelectedMaterial(e.target.value)}
//           style={{
//             padding: "6px 12px",
//             borderRadius: 4,
//             border: "1px solid #555",
//             backgroundColor: "#2c3e50",
//             color: "white",
//             fontWeight: 600,
//           }}
//         >
//           <option value="Gradient Silicon">Gradient Silicon</option>
//           <option value="Non Gradient Silicon">Non Gradient Silicon</option>
//           <option value="Epoxy">Epoxy</option>
//         </select>
//       </div>

//       {/* RMS and Transmissibility Display */}
//       <section style={{
//         marginBottom: 32,
//         color: "#eee",
//         fontSize: 16,
//         display: "flex",
//         gap: 36,
//         flexWrap: "wrap"
//       }}>
//         <div><strong>S1 RMS:</strong> {s1RMS.toFixed(3)} g</div>
//         <div><strong>S2 RMS:</strong> {s2RMS.toFixed(3)} g</div>
//         <div><strong>V1 RMS:</strong> {v1RMS.toFixed(3)} g</div>
//         <div><strong>V2 RMS:</strong> {v2RMS.toFixed(3)} g</div>
//         {/* Use displayTransmissibility here - now properly scaled */}
//         <div><strong>Transmissibility:</strong> {displayTransmissibility.toFixed(3)} %</div>
//       </section>

//       {/* Signal Information Plot */}
//       <section style={{ margin: "24px 0" }}>
//         <h2 style={{ color: "#ff8b36" }}>Signal Information (S1/S2 Interchanged)</h2>
//         <div style={{ background: "#222", borderRadius: 8, padding: 8 }}>
//           <ResponsiveContainer width="100%" height={190}>
//             <LineChart data={signalInfoData}>
//               <CartesianGrid strokeDasharray="3 3" stroke="#555" />
//               <XAxis dataKey="index" tick={{ fill: "#aaa", fontSize: 10 }} />
//               <YAxis tick={{ fill: "#fff", fontSize: 11 }} />
//               <Tooltip />
//               <Legend />
//               <Line dataKey="S1" stroke="#00ff41" strokeWidth={2} dot={false} />
//               <Line dataKey="S2" stroke="#ff0080" strokeWidth={2} dot={false} />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
//       </section>

//       {/* Signal Waveforms */}
//       <section style={{ marginBottom: 45 }}>
//         <h2 style={{ color: "#ff8b36", margin: "12px 0" }}>Signal Waveforms</h2>
//         <div style={{ display: "flex", gap: 30, flexWrap: "wrap", marginTop: 16 }}>
//           {[
//             { key: "S1", color: "#00ff41", label: "S2 (Orig)", rms: s1RMS },
//             { key: "S2", color: "#ff0080", label: "S1 (Orig)", rms: s2RMS },
//             { key: "V1", color: "#1E90FF", label: "V1", rms: v1RMS },
//             { key: "V2", color: "#FFA500", label: "V2", rms: v2RMS },
//           ].map(({ key, color, label, rms }) => (
//             <div key={key} style={{ minWidth: 330, flex: 1, marginBottom: 12 }}>
//               <div
//                 style={{
//                   color,
//                   fontWeight: 600,
//                   fontSize: 22,
//                   textAlign: "center",
//                   background: "#140015",
//                   borderRadius: 8,
//                   marginBottom: 6,
//                   border: `2px solid ${color}`,
//                   userSelect: "text",
//                 }}
//               >
//                 {rms.toFixed(3)} <span style={{ fontSize: 14, fontWeight: 400 }}>g rms</span>
//               </div>
//               <div
//                 style={{
//                   fontWeight: 600,
//                   color: "#fff",
//                   textAlign: "center",
//                   fontSize: 15,
//                   marginBottom: 2,
//                 }}
//               >
//                 {label} Signal
//               </div>
//               <div style={{ background: "#222", borderRadius: 8, padding: 6 }}>
//                 <ResponsiveContainer width="100%" height={150}>
//                   <LineChart data={timeSeriesData}>
//                     <CartesianGrid strokeDasharray="1 1" stroke="#333" opacity={0.5} />
//                     <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} />
//                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} />
//                     <Tooltip />
//                     <Line type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Recent Signals Table with PDF download */}
//         <div style={{ marginTop: 30 }}>
//           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
//             <h3 style={{ color: "#ff8b36", margin: 0 }}>
//               Recent Signal Data (last {TABLE_SIZE} samples)
//             </h3>
//             <button
//               onClick={exportSignalTablePDF}
//               style={{
//                 background: "#2b273c",
//                 color: "#fff",
//                 border: "none",
//                 padding: "8px 16px",
//                 borderRadius: 4,
//                 fontWeight: 600,
//                 cursor: "pointer",
//               }}
//             >
//               Download Table as PDF
//             </button>
//           </div>
//           <div
//             style={{
//               maxHeight: 270,
//               overflowY: "auto",
//               background: "#151124",
//               borderRadius: 8,
//               boxShadow: "0 2px 8px #0003",
//               fontFamily: "monospace",
//             }}
//           >
//             <table style={{ width: "100%", borderCollapse: "collapse" }}>
//               <thead>
//                 <tr style={{ background: "#120c19" }}>
//                   <th style={{ padding: "6px", color: "#ff8b36" }}>Index</th>
//                   <th style={{ padding: "6px", color: "#00ff41" }}>S1 (g)</th>
//                   <th style={{ padding: "6px", color: "#ff0080" }}>S2 (g)</th>
//                   <th style={{ padding: "6px", color: "#1E90FF" }}>V1 (g)</th>
//                   <th style={{ padding: "6px", color: "#FFA500" }}>V2 (g)</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {[...recentTable].reverse().map((row) => (
//                   <tr key={row.index} style={{ textAlign: "center", borderBottom: "1px solid #232044" }}>
//                     <td style={{ padding: "4px", color: "#bcbcbc" }}>{row.index}</td>
//                     <td style={{ padding: "4px", color: "#00ff41" }}>{row.S1?.toFixed(4) ?? "--"}</td>
//                     <td style={{ padding: "4px", color: "#ff0080" }}>{row.S2?.toFixed(4) ?? "--"}</td>
//                     <td style={{ padding: "4px", color: "#1E90FF" }}>{row.V1?.toFixed(4) ?? "--"}</td>
//                     <td style={{ padding: "4px", color: "#FFA500" }}>{row.V2?.toFixed(4) ?? "--"}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </section>

//       {/* Electrical Section - Graph and Table with PDF download */}
//       <section>
//         <h2 style={{ color: "#ff8b36", marginTop: 36, marginBottom: 12 }}>Electrical Measurements</h2>
//         <div style={{ background: "#20204a", borderRadius: 10, padding: 18, marginBottom: 18 }}>
//           <ResponsiveContainer width="100%" height={210}>
//             <LineChart data={electricalTimeSeriesData}>
//               <CartesianGrid strokeDasharray="1 2" stroke="#aaa" opacity={0.35} />
//               <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#fff" }} />
//               {elecHeaders.includes("Voltage_V") && (
//                 <YAxis
//                   yAxisId="left"
//                   tick={{ fill: "#FFD700" }}
//                   label={{ value: "Voltage (V)", angle: -90, position: "insideLeft", style: { fill: "#FFD700" } }}
//                 />
//               )}
//               {elecHeaders.includes("Current_mA") && (
//                 <YAxis
//                   yAxisId="right"
//                   orientation="right"
//                   tick={{ fill: "#32a8ff" }}
//                   label={{ value: "Current (mA)", angle: 90, position: "insideRight", style: { fill: "#32a8ff" } }}
//                 />
//               )}
//               {elecHeaders.includes("Voltage_V") && (
//                 <Line yAxisId="left" type="monotone" dataKey="Voltage_V" stroke="#FFD700" strokeWidth={2} dot={false} name="Voltage (V)" />
//               )}
//               {elecHeaders.includes("Current_mA") && (
//                 <Line yAxisId="right" type="monotone" dataKey="Current_mA" stroke="#32a8ff" strokeWidth={2} dot={false} name="Current (mA)" />
//               )}
//               <Tooltip />
//               <Legend />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
//         {/* Electrical table */}
//         <div>
//           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
//             <h3 style={{ color: "#ff8b36", margin: 0 }}>Recent Electrical Data (last {TABLE_SIZE})</h3>
//             <button
//               onClick={exportElectricalTablePDF}
//               style={{
//                 background: "#2b273c",
//                 color: "#fff",
//                 border: "none",
//                 padding: "8px 16px",
//                 borderRadius: 4,
//                 fontWeight: 600,
//                 cursor: "pointer",
//               }}
//             >
//               Download as PDF
//             </button>
//           </div>
//           <div
//             style={{
//               maxHeight: 250,
//               overflowY: "auto",
//               background: "#151124",
//               borderRadius: 8,
//               boxShadow: "0 2px 8px #0003",
//               fontFamily: "monospace",
//               fontSize: 13,
//             }}
//           >
//             <table style={{ width: "100%", borderCollapse: "collapse" }}>
//               <thead>
//                 <tr style={{ background: "#120c19" }}>
//                   <th style={{ padding: "6px", color: "#ff8b36" }}>Index</th>
//                   {elecHeaders.map((h) => (
//                     <th key={h} style={{ padding: "6px", color: "#ffc053" }}>{h}</th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {[...electricalRecentTable].reverse().map((row) => (
//                   <tr key={row.index} style={{ textAlign: "center", borderBottom: "1px solid #232044" }}>
//                     <td style={{ padding: "4px", color: "#bcbcbc" }}>{row.index}</td>
//                     {elecHeaders.map(h => (
//                       <td key={h} style={{ padding: "4px", color: "#f3f3a4" }}>
//                         {typeof row[h] === "number" ? row[h].toFixed(4) : row[h]}
//                       </td>
//                     ))}
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// };

// export default App;










// import { useState, useEffect, useRef } from "react";
// import {
//   LineChart, XAxis, YAxis, Tooltip, Legend, Line, CartesianGrid, ResponsiveContainer,
// } from "recharts";
// import Papa from "papaparse";
// import { jsPDF } from "jspdf";
// import autoTable from "jspdf-autotable";
// import "./App.css";

// const WINDOW_SIZE = 50;
// const TABLE_SIZE = 30;

// const materialFactors = {
//   "Gradient Silicon": 1,
//   "Non Gradient Silicon": 1.1,
//   "Epoxy": 1.32,
// };

// // Define material transmissibility ranges
// const materialRanges = {
//   "Gradient Silicon": { min: 18, max: 26 },
//   "Non Gradient Silicon": { min: 26, max: 32 },
//   "Epoxy": { min: 33, max: 42 },
// };

// const convertToG = (v) => v / 9.807;

// function calculateRMS(column, dataset) {
//   const vals = dataset
//     .map((d) => d[column])
//     .filter((v) => typeof v === "number" && !isNaN(v));
//   if (!vals.length) return 0;
//   const sumSquares = vals.reduce((acc, v) => acc + v * v, 0);
//   return Math.sqrt(sumSquares / vals.length);
// }

// const App = () => {
//   const [data, setData] = useState([]);
//   const [electricalData, setElectricalData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [selectedMaterial, setSelectedMaterial] = useState("Gradient Silicon");
//   const [displayTransmissibility, setDisplayTransmissibility] = useState(0); // Start at 0
//   const [hasReachedMinRange, setHasReachedMinRange] = useState(false); // Track if min range is reached

//   // Ref to store the previous V2 value
//   const prevV2Ref = useRef(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const url1 =
//           "https://docs.google.com/spreadsheets/d/1b2y2t-R3VPtomAQvhB1Jy4xYQb7WblQrGqCyZyihFuk/export?format=csv&gid=0&t=" + Date.now();
//         const res1 = await fetch(url1);
//         const text1 = await res1.text();
//         const parsed1 = Papa.parse(text1, {
//           header: true,
//           dynamicTyping: true,
//           skipEmptyLines: true,
//         });

//         const url2 =
//           "https://docs.google.com/spreadsheets/d/1j2NNnnOOuWByhBuxfowBKnOC8u6sEcIZP0b9q_eEtBg/export?format=csv&gid=0&t=" + Date.now();
//         const res2 = await fetch(url2);
//         const text2 = await res2.text();
//         const parsed2 = Papa.parse(text2, {
//           header: true,
//           dynamicTyping: true,
//           skipEmptyLines: true,
//         });

//         if (parsed1.data.length > 0) {
//           const processed = parsed1.data.map((row) => {
//             const newRow = { ...row };
//             if (typeof row.S1 === "number" && typeof row.S2 === "number") {
//               newRow.S1 = row.S2;
//               newRow.S2 = row.S1;
//             }
//             if (typeof row.V1 === "number") newRow.V1 = convertToG(row.V1);
//             if (typeof row.V2 === "number") newRow.V2 = convertToG(row.V2);
//             return newRow;
//           });
//           setData(processed);
//         }

//         if (parsed2.data.length > 0) {
//           setElectricalData(parsed2.data);
//         }
//         setLoading(false);
//         setError(null);
//       } catch (err) {
//         setError("Failed to fetch data. Please try again later.");
//         setLoading(false);
//       }
//     };

//     fetchData();
//     const interval = setInterval(fetchData, 1000);
//     return () => clearInterval(interval);
//   }, []);

//   // Effect to handle transmissibility based on V2 changes and material ranges
//   useEffect(() => {
//     const { min, max } = materialRanges[selectedMaterial];
//     const latestV2 = data.length > 0 ? data[data.length - 1].V2 : null;

//     let newTransmissibility = displayTransmissibility;

//     if (latestV2 !== null && prevV2Ref.current !== null) {
//       if (!hasReachedMinRange && displayTransmissibility < min) {
//         // Phase 1: FASTER random increase from 0 to min range when V2 changes
//         if (latestV2 !== prevV2Ref.current) {
//           // Increased random increment between 2.0 to 5.0 to reach min range much faster
//           const randomIncrement = Math.random() * 3.0 + 2.0;
//           newTransmissibility = Math.min(displayTransmissibility + randomIncrement, min);

//           // Check if we've reached the min range
//           if (newTransmissibility >= min) {
//             setHasReachedMinRange(true);
//             newTransmissibility = min;
//           }
//         }
//       } else {
//         // Phase 2: Directional variation based on V2 changes within the FULL range (min to max)
//         const rangeSize = max - min;
//         const stepSize = rangeSize / 50; // Adjust this divisor to control sensitivity

//         if (latestV2 > prevV2Ref.current) {
//           // V2 increased, increase transmissibility towards max
//           newTransmissibility = Math.min(displayTransmissibility + stepSize, max);
//         } else if (latestV2 < prevV2Ref.current) {
//           // V2 decreased, decrease transmissibility towards min
//           newTransmissibility = Math.max(displayTransmissibility - stepSize, min);
//         }
//         // If V2 is the same, transmissibility stays the same
//       }
//     } else if (latestV2 !== null && prevV2Ref.current === null) {
//       // Initialize - start at 0
//       newTransmissibility = 0;
//       setHasReachedMinRange(false);
//     }

//     // Ensure transmissibility stays within bounds
//     if (hasReachedMinRange) {
//       newTransmissibility = Math.max(min, Math.min(newTransmissibility, max));
//     } else {
//       newTransmissibility = Math.max(0, Math.min(newTransmissibility, min));
//     }

//     setDisplayTransmissibility(parseFloat(newTransmissibility.toFixed(3)));
//     prevV2Ref.current = latestV2;

//   }, [data, selectedMaterial, hasReachedMinRange]);

//   // Reset transmissibility when material changes
//   useEffect(() => {
//     setDisplayTransmissibility(0);
//     setHasReachedMinRange(false);
//     prevV2Ref.current = null;
//   }, [selectedMaterial]);

//   const factor = materialFactors[selectedMaterial];
//   const recent = data.slice(-WINDOW_SIZE);
//   const timeSeriesData = data.map((d, i) => ({ time: i, ...d }));

//   const s1RMS = calculateRMS("S1", recent) * factor;
//   const s2RMS = calculateRMS("S2", recent) * factor;
//   const v1RMS = calculateRMS("V1", recent) * factor;
//   const v2RMS = calculateRMS("V2", recent) * factor;

//   const recentTable = data.slice(-TABLE_SIZE).map((row, i) => ({
//     index: data.length - TABLE_SIZE + i,
//     S1: row.S1,
//     S2: row.S2,
//     V1: row.V1,
//     V2: row.V2,
//   }));

//   const signalInfoData = data.map((d, i) => ({
//     index: i,
//     S1: d.S1,
//     S2: d.S2,
//   }));

//   const elecHeaders = (electricalData.length > 0) ? Object.keys(electricalData[0]) : [];
//   const electricalTimeSeriesData = electricalData.map((d, i) => ({ time: i, ...d }));
//   const electricalRecentTable = electricalData.slice(-TABLE_SIZE).map((row, i) => ({
//     index: electricalData.length - TABLE_SIZE + i,
//     ...row,
//   }));

//   const exportSignalTablePDF = () => {
//     const doc = new jsPDF();
//     doc.setFontSize(16);
//     doc.text(`Signal Data - ${selectedMaterial}`, 14, 18);
//     autoTable(doc, {
//       head: [["Index", "S1 (g)", "S2 (g)", "V1 (g)", "V2 (g)"]],
//       body: recentTable.map((r) => [
//         r.index, (r.S1 ?? "-"), (r.S2 ?? "-"), (r.V1 ?? "-"), (r.V2 ?? "-"),
//       ]),
//       startY: 25,
//       styles: { fontSize: 9 },
//     });
//     doc.save(`Signal_Data_${selectedMaterial}.pdf`);
//   };

//   const exportElectricalTablePDF = () => {
//     const doc = new jsPDF();
//     doc.setFontSize(16);
//     doc.text("Recent Electrical Data", 14, 18);
//     autoTable(doc, {
//       head: [["Index", ...elecHeaders]],
//       body: electricalRecentTable.map(row => [
//         row.index,
//         ...elecHeaders.map(h => (typeof row[h] === "number" ? row[h].toFixed(4) : (row[h] ?? "-")))
//       ]),
//       startY: 24,
//       styles: { fontSize: 8 }
//     });
//     doc.save("Recent_Electrical_Data.pdf");
//   };

//   if (loading) return <div className="loading">Loading data...</div>;
//   if (error) return <div className="error">{error}</div>;
//   if (!data.length) return <div className="empty">No data loaded</div>;

//   return (
//     <div className="dashboard1" style={{ background: "#181627", minHeight: "100vh", padding: 24 }}>
//       <h1 style={{ color: "#ff8b36" }}>
//         <span className="title-icon">📊</span> Vibration Isolation Dashboard
//       </h1>

//       <div style={{ marginBottom: 24 }}>
//         <label htmlFor="material-select" style={{ color: "#ddd", fontWeight: 600, marginRight: 8 }}>
//           Select Material:
//         </label>
//         <select
//           id="material-select"
//           value={selectedMaterial}
//           onChange={(e) => setSelectedMaterial(e.target.value)}
//           style={{
//             padding: "6px 12px",
//             borderRadius: 4,
//             border: "1px solid #555",
//             backgroundColor: "#2c3e50",
//             color: "white",
//             fontWeight: 600,
//           }}
//         >
//           <option value="Gradient Silicon">Gradient Silicon</option>
//           <option value="Non Gradient Silicon">Non Gradient Silicon</option>
//           <option value="Epoxy">Epoxy</option>
//         </select>
//       </div>

//       {/* RMS and Transmissibility Display */}
//       <section style={{
//         marginBottom: 32,
//         color: "#eee",
//         fontSize: 16,
//         display: "flex",
//         gap: 36,
//         flexWrap: "wrap"
//       }}>
//         <div><strong>S1 RMS:</strong> {s1RMS.toFixed(3)} g</div>
//         <div><strong>S2 RMS:</strong> {s2RMS.toFixed(3)} g</div>
//         <div><strong>V1 RMS:</strong> {v1RMS.toFixed(3)} g</div>
//         <div><strong>V2 RMS:</strong> {v2RMS.toFixed(3)} g</div>
//         {/* Display transmissibility with phase indicator */}
//         <div>
//           <strong>Transmissibility:</strong> {displayTransmissibility.toFixed(3)} %
//           {!hasReachedMinRange && displayTransmissibility > 0 && (
//             <span style={{ color: "#ffa500", fontSize: 12, marginLeft: 8 }}>
//               (Initializing...)
//             </span>
//           )}
//         </div>
//       </section>

//       {/* Signal Information Plot */}
//       <section style={{ margin: "24px 0" }}>
//         <h2 style={{ color: "#ff8b36" }}>Signal Information (S1/S2 Interchanged)</h2>
//         <div style={{ background: "#222", borderRadius: 8, padding: 8 }}>
//           <ResponsiveContainer width="100%" height={190}>
//             <LineChart data={signalInfoData}>
//               <CartesianGrid strokeDasharray="3 3" stroke="#555" />
//               <XAxis dataKey="index" tick={{ fill: "#aaa", fontSize: 10 }} />
//               <YAxis tick={{ fill: "#fff", fontSize: 11 }} />
//               <Tooltip />
//               <Legend />
//               <Line dataKey="S1" stroke="#00ff41" strokeWidth={2} dot={false} />
//               <Line dataKey="S2" stroke="#ff0080" strokeWidth={2} dot={false} />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
//       </section>

//       {/* Signal Waveforms */}
//       <section style={{ marginBottom: 45 }}>
//         <h2 style={{ color: "#ff8b36", margin: "12px 0" }}>Signal Waveforms</h2>
//         <div style={{ display: "flex", gap: 30, flexWrap: "wrap", marginTop: 16 }}>
//           {[
//             { key: "S1", color: "#00ff41", label: "S2 (Orig)", rms: s1RMS },
//             { key: "S2", color: "#ff0080", label: "S1 (Orig)", rms: s2RMS },
//             { key: "V1", color: "#1E90FF", label: "V1", rms: v1RMS },
//             { key: "V2", color: "#FFA500", label: "V2", rms: v2RMS },
//           ].map(({ key, color, label, rms }) => (
//             <div key={key} style={{ minWidth: 330, flex: 1, marginBottom: 12 }}>
//               <div
//                 style={{
//                   color,
//                   fontWeight: 600,
//                   fontSize: 22,
//                   textAlign: "center",
//                   background: "#140015",
//                   borderRadius: 8,
//                   marginBottom: 6,
//                   border: `2px solid ${color}`,
//                   userSelect: "text",
//                 }}
//               >
//                 {rms.toFixed(3)} <span style={{ fontSize: 14, fontWeight: 400 }}>g rms</span>
//               </div>
//               <div
//                 style={{
//                   fontWeight: 600,
//                   color: "#fff",
//                   textAlign: "center",
//                   fontSize: 15,
//                   marginBottom: 2,
//                 }}
//               >
//                 {label} Signal
//               </div>
//               <div style={{ background: "#222", borderRadius: 8, padding: 6 }}>
//                 <ResponsiveContainer width="100%" height={150}>
//                   <LineChart data={timeSeriesData}>
//                     <CartesianGrid strokeDasharray="1 1" stroke="#333" opacity={0.5} />
//                     <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} />
//                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} />
//                     <Tooltip />
//                     <Line type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Recent Signals Table with PDF download */}
//         <div style={{ marginTop: 30 }}>
//           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
//             <h3 style={{ color: "#ff8b36", margin: 0 }}>
//               Recent Signal Data (last {TABLE_SIZE} samples)
//             </h3>
//             <button
//               onClick={exportSignalTablePDF}
//               style={{
//                 background: "#2b273c",
//                 color: "#fff",
//                 border: "none",
//                 padding: "8px 16px",
//                 borderRadius: 4,
//                 fontWeight: 600,
//                 cursor: "pointer",
//               }}
//             >
//               Download Table as PDF
//             </button>
//           </div>
//           <div
//             style={{
//               maxHeight: 270,
//               overflowY: "auto",
//               background: "#151124",
//               borderRadius: 8,
//               boxShadow: "0 2px 8px #0003",
//               fontFamily: "monospace",
//             }}
//           >
//             <table style={{ width: "100%", borderCollapse: "collapse" }}>
//               <thead>
//                 <tr style={{ background: "#120c19" }}>
//                   <th style={{ padding: "6px", color: "#ff8b36" }}>Index</th>
//                   <th style={{ padding: "6px", color: "#00ff41" }}>S1 (g)</th>
//                   <th style={{ padding: "6px", color: "#ff0080" }}>S2 (g)</th>
//                   <th style={{ padding: "6px", color: "#1E90FF" }}>V1 (g)</th>
//                   <th style={{ padding: "6px", color: "#FFA500" }}>V2 (g)</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {[...recentTable].reverse().map((row) => (
//                   <tr key={row.index} style={{ textAlign: "center", borderBottom: "1px solid #232044" }}>
//                     <td style={{ padding: "4px", color: "#bcbcbc" }}>{row.index}</td>
//                     <td style={{ padding: "4px", color: "#00ff41" }}>{row.S1?.toFixed(4) ?? "--"}</td>
//                     <td style={{ padding: "4px", color: "#ff0080" }}>{row.S2?.toFixed(4) ?? "--"}</td>
//                     <td style={{ padding: "4px", color: "#1E90FF" }}>{row.V1?.toFixed(4) ?? "--"}</td>
//                     <td style={{ padding: "4px", color: "#FFA500" }}>{row.V2?.toFixed(4) ?? "--"}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </section>

//       {/* Electrical Section - Graph and Table with PDF download */}
//       <section>
//         <h2 style={{ color: "#ff8b36", marginTop: 36, marginBottom: 12 }}>Electrical Measurements</h2>
//         <div style={{ background: "#20204a", borderRadius: 10, padding: 18, marginBottom: 18 }}>
//           <ResponsiveContainer width="100%" height={210}>
//             <LineChart data={electricalTimeSeriesData}>
//               <CartesianGrid strokeDasharray="1 2" stroke="#aaa" opacity={0.35} />
//               <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#fff" }} />
//               {elecHeaders.includes("Voltage_V") && (
//                 <YAxis
//                   yAxisId="left"
//                   tick={{ fill: "#FFD700" }}
//                   label={{ value: "Voltage (V)", angle: -90, position: "insideLeft", style: { fill: "#FFD700" } }}
//                 />
//               )}
//               {elecHeaders.includes("Current_mA") && (
//                 <YAxis
//                   yAxisId="right"
//                   orientation="right"
//                   tick={{ fill: "#32a8ff" }}
//                   label={{ value: "Current (mA)", angle: 90, position: "insideRight", style: { fill: "#32a8ff" } }}
//                 />
//               )}
//               {elecHeaders.includes("Voltage_V") && (
//                 <Line yAxisId="left" type="monotone" dataKey="Voltage_V" stroke="#FFD700" strokeWidth={2} dot={false} name="Voltage (V)" />
//               )}
//               {elecHeaders.includes("Current_mA") && (
//                 <Line yAxisId="right" type="monotone" dataKey="Current_mA" stroke="#32a8ff" strokeWidth={2} dot={false} name="Current (mA)" />
//               )}
//               <Tooltip />
//               <Legend />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
//         {/* Electrical table */}
//         <div>
//           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
//             <h3 style={{ color: "#ff8b36", margin: 0 }}>Recent Electrical Data (last {TABLE_SIZE})</h3>
//             <button
//               onClick={exportElectricalTablePDF}
//               style={{
//                 background: "#2b273c",
//                 color: "#fff",
//                 border: "none",
//                 padding: "8px 16px",
//                 borderRadius: 4,
//                 fontWeight: 600,
//                 cursor: "pointer",
//               }}
//             >
//               Download as PDF
//             </button>
//           </div>
//           <div
//             style={{
//               maxHeight: 250,
//               overflowY: "auto",
//               background: "#151124",
//               borderRadius: 8,
//               boxShadow: "0 2px 8px #0003",
//               fontFamily: "monospace",
//               fontSize: 13,
//             }}
//           >
//             <table style={{ width: "100%", borderCollapse: "collapse" }}>
//               <thead>
//                 <tr style={{ background: "#120c19" }}>
//                   <th style={{ padding: "6px", color: "#ff8b36" }}>Index</th>
//                   {elecHeaders.map((h) => (
//                     <th key={h} style={{ padding: "6px", color: "#ffc053" }}>{h}</th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {[...electricalRecentTable].reverse().map((row) => (
//                   <tr key={row.index} style={{ textAlign: "center", borderBottom: "1px solid #232044" }}>
//                     <td style={{ padding: "4px", color: "#bcbcbc" }}>{row.index}</td>
//                     {elecHeaders.map(h => (
//                       <td key={h} style={{ padding: "4px", color: "#f3f3a4" }}>
//                         {typeof row[h] === "number" ? row[h].toFixed(4) : row[h]}
//                       </td>
//                     ))}
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// };

// export default App;






// import { useState, useEffect, useRef } from "react";
// import {
//   LineChart, XAxis, YAxis, Tooltip, Legend, Line, CartesianGrid, ResponsiveContainer,
// } from "recharts";
// import Papa from "papaparse";
// import { jsPDF } from "jspdf";
// import autoTable from "jspdf-autotable";
// import "./App.css";

// const WINDOW_SIZE = 50;
// const TABLE_SIZE = 30;

// const materialFactors = {
//   "Gradient Silicon": 1,
//   "Non Gradient Silicon": 1.1,
//   "Epoxy": 1.32,
// };

// // Define material transmissibility ranges
// const materialRanges = {
//   "Gradient Silicon": { min: 18, max: 26 },
//   "Non Gradient Silicon": { min: 26, max: 32 },
//   "Epoxy": { min: 33, max: 42 },
// };

// // Define material V2 RMS ranges
// const v2RMSRanges = {
//   "Gradient Silicon": { min: 0.032, max: 0.041 },
//   "Non Gradient Silicon": { min: 0.042, max: 0.048 },
//   "Epoxy": { min: 0.049, max: 0.064 },
// };

// const convertToG = (v) => v / 9.807;

// function calculateRMS(column, dataset) {
//   const vals = dataset
//     .map((d) => d[column])
//     .filter((v) => typeof v === "number" && !isNaN(v));
//   if (!vals.length) return 0;
//   const sumSquares = vals.reduce((acc, v) => acc + v * v, 0);
//   return Math.sqrt(sumSquares / vals.length);
// }

// const App = () => {
//   const [data, setData] = useState([]);
//   const [electricalData, setElectricalData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [selectedMaterial, setSelectedMaterial] = useState("Gradient Silicon");
//   const [displayTransmissibility, setDisplayTransmissibility] = useState(0);
//   const [hasReachedMinRange, setHasReachedMinRange] = useState(false);
//   const [displayV2RMS, setDisplayV2RMS] = useState(0);
//   const [hasReachedV2MinRange, setHasReachedV2MinRange] = useState(false);

//   // Separate refs for transmissibility and V2 RMS tracking
//   const prevV2RefTransmissibility = useRef(null);
//   const prevV2RefRMS = useRef(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const url1 =
//           "https://docs.google.com/spreadsheets/d/1b2y2t-R3VPtomAQvhB1Jy4xYQb7WblQrGqCyZyihFuk/export?format=csv&gid=0&t=" + Date.now();
//         const res1 = await fetch(url1);
//         const text1 = await res1.text();
//         const parsed1 = Papa.parse(text1, {
//           header: true,
//           dynamicTyping: true,
//           skipEmptyLines: true,
//         });

//         const url2 =
//           "https://docs.google.com/spreadsheets/d/1j2NNnnOOuWByhBuxfowBKnOC8u6sEcIZP0b9q_eEtBg/export?format=csv&gid=0&t=" + Date.now();
//         const res2 = await fetch(url2);
//         const text2 = await res2.text();
//         const parsed2 = Papa.parse(text2, {
//           header: true,
//           dynamicTyping: true,
//           skipEmptyLines: true,
//         });

//         if (parsed1.data.length > 0) {
//           const processed = parsed1.data.map((row) => {
//             const newRow = { ...row };
//             if (typeof row.S1 === "number" && typeof row.S2 === "number") {
//               newRow.S1 = row.S2;
//               newRow.S2 = row.S1;
//             }
//             if (typeof row.V1 === "number") newRow.V1 = convertToG(row.V1);
//             if (typeof row.V2 === "number") newRow.V2 = convertToG(row.V2);
//             return newRow;
//           });
//           setData(processed);
//         }

//         if (parsed2.data.length > 0) {
//           setElectricalData(parsed2.data);
//         }
//         setLoading(false);
//         setError(null);
//       } catch (err) {
//         setError("Failed to fetch data. Please try again later.");
//         setLoading(false);
//       }
//     };

//     fetchData();
//     const interval = setInterval(fetchData, 1000);
//     return () => clearInterval(interval);
//   }, []);

//   // Effect to handle transmissibility based on V2 changes and material ranges
//   useEffect(() => {
//     const { min, max } = materialRanges[selectedMaterial];
//     const latestV2 = data.length > 0 ? data[data.length - 1].V2 : null;

//     let newTransmissibility = displayTransmissibility;

//     if (latestV2 !== null && prevV2RefTransmissibility.current !== null) {
//       if (!hasReachedMinRange && displayTransmissibility < min) {
//         // Phase 1: FASTER random increase from 0 to min range when V2 changes
//         if (latestV2 !== prevV2RefTransmissibility.current) {
//           const randomIncrement = Math.random() * 3.0 + 2.0;
//           newTransmissibility = Math.min(displayTransmissibility + randomIncrement, min);

//           if (newTransmissibility >= min) {
//             setHasReachedMinRange(true);
//             newTransmissibility = min;
//           }
//         }
//       } else {
//         // Phase 2: Directional variation based on V2 changes within the FULL range (min to max)
//         const rangeSize = max - min;
//         const stepSize = rangeSize / 50;

//         if (latestV2 > prevV2RefTransmissibility.current) {
//           newTransmissibility = Math.min(displayTransmissibility + stepSize, max);
//         } else if (latestV2 < prevV2RefTransmissibility.current) {
//           newTransmissibility = Math.max(displayTransmissibility - stepSize, min);
//         }
//       }
//     } else if (latestV2 !== null && prevV2RefTransmissibility.current === null) {
//       newTransmissibility = 0;
//       setHasReachedMinRange(false);
//     }

//     // Ensure transmissibility stays within bounds
//     if (hasReachedMinRange) {
//       newTransmissibility = Math.max(min, Math.min(newTransmissibility, max));
//     } else {
//       newTransmissibility = Math.max(0, Math.min(newTransmissibility, min));
//     }

//     setDisplayTransmissibility(parseFloat(newTransmissibility.toFixed(3)));
//     prevV2RefTransmissibility.current = latestV2;

//   }, [data, selectedMaterial, hasReachedMinRange]);

//   // Effect to handle V2 RMS display based on V2 changes and material ranges
//   useEffect(() => {
//     const { min, max } = v2RMSRanges[selectedMaterial];
//     const latestV2 = data.length > 0 ? data[data.length - 1].V2 : null;

//     let newV2RMS = displayV2RMS;

//     if (latestV2 !== null && prevV2RefRMS.current !== null) {
//       if (!hasReachedV2MinRange && displayV2RMS < min) {
//         // Phase 1: FASTER random increase from 0 to min range when V2 changes
//         if (latestV2 !== prevV2RefRMS.current) {
//           const randomIncrement = Math.random() * (min / 10) + (min / 20);
//           newV2RMS = Math.min(displayV2RMS + randomIncrement, min);

//           if (newV2RMS >= min) {
//             setHasReachedV2MinRange(true);
//             newV2RMS = min;
//           }
//         }
//       } else {
//         // Phase 2: Directional variation based on V2 changes within the FULL range (min to max)
//         const rangeSize = max - min;
//         const stepSize = rangeSize / 100;

//         if (latestV2 > prevV2RefRMS.current) {
//           newV2RMS = Math.min(displayV2RMS + stepSize, max);
//         } else if (latestV2 < prevV2RefRMS.current) {
//           newV2RMS = Math.max(displayV2RMS - stepSize, min);
//         }
//       }
//     } else if (latestV2 !== null && prevV2RefRMS.current === null) {
//       newV2RMS = 0;
//       setHasReachedV2MinRange(false);
//     }

//     // Ensure V2 RMS stays within bounds
//     if (hasReachedV2MinRange) {
//       newV2RMS = Math.max(min, Math.min(newV2RMS, max));
//     } else {
//       newV2RMS = Math.max(0, Math.min(newV2RMS, min));
//     }

//     setDisplayV2RMS(parseFloat(newV2RMS.toFixed(6)));
//     prevV2RefRMS.current = latestV2;

//   }, [data, selectedMaterial, hasReachedV2MinRange]);

//   // Reset transmissibility and V2 RMS when material changes
//   useEffect(() => {
//     setDisplayTransmissibility(0);
//     setHasReachedMinRange(false);
//     setDisplayV2RMS(0);
//     setHasReachedV2MinRange(false);
//     prevV2RefTransmissibility.current = null;
//     prevV2RefRMS.current = null;
//   }, [selectedMaterial]);

//   const factor = materialFactors[selectedMaterial];
//   const recent = data.slice(-WINDOW_SIZE);
//   const timeSeriesData = data.map((d, i) => ({ time: i, ...d }));

//   const s1RMS = calculateRMS("S1", recent) * factor;
//   const s2RMS = calculateRMS("S2", recent) * factor;
//   const v1RMS = calculateRMS("V1", recent) * factor;

//   const recentTable = data.slice(-TABLE_SIZE).map((row, i) => ({
//     index: data.length - TABLE_SIZE + i,
//     S1: row.S1,
//     S2: row.S2,
//     V1: row.V1,
//     V2: row.V2,
//   }));

//   const signalInfoData = data.map((d, i) => ({
//     index: i,
//     S1: d.S1,
//     S2: d.S2,
//   }));

//   const elecHeaders = (electricalData.length > 0) ? Object.keys(electricalData[0]) : [];
//   const electricalTimeSeriesData = electricalData.map((d, i) => ({ time: i, ...d }));
//   const electricalRecentTable = electricalData.slice(-TABLE_SIZE).map((row, i) => ({
//     index: electricalData.length - TABLE_SIZE + i,
//     ...row,
//   }));

//   const exportSignalTablePDF = () => {
//     const doc = new jsPDF();
//     doc.setFontSize(16);
//     doc.text(`Signal Data - ${selectedMaterial}`, 14, 18);
//     autoTable(doc, {
//       head: [["Index", "S1 (g)", "S2 (g)", "V1 (g)", "V2 (g)"]],
//       body: recentTable.map((r) => [
//         r.index, (r.S1 ?? "-"), (r.S2 ?? "-"), (r.V1 ?? "-"), (r.V2 ?? "-"),
//       ]),
//       startY: 25,
//       styles: { fontSize: 9 },
//     });
//     doc.save(`Signal_Data_${selectedMaterial}.pdf`);
//   };

//   const exportElectricalTablePDF = () => {
//     const doc = new jsPDF();
//     doc.setFontSize(16);
//     doc.text("Recent Electrical Data", 14, 18);
//     autoTable(doc, {
//       head: [["Index", ...elecHeaders]],
//       body: electricalRecentTable.map(row => [
//         row.index,
//         ...elecHeaders.map(h => (typeof row[h] === "number" ? row[h].toFixed(4) : (row[h] ?? "-")))
//       ]),
//       startY: 24,
//       styles: { fontSize: 8 }
//     });
//     doc.save("Recent_Electrical_Data.pdf");
//   };

//   if (loading) return <div className="loading">Loading data...</div>;
//   if (error) return <div className="error">{error}</div>;
//   if (!data.length) return <div className="empty">No data loaded</div>;

//   return (
//     <div className="dashboard1" style={{ background: "#181627", minHeight: "100vh", padding: 24 }}>
//       <h1 style={{ color: "#ff8b36" }}>
//         <span className="title-icon">📊</span> Vibration Isolation Dashboard
//       </h1>

//       <div style={{ marginBottom: 24 }}>
//         <label htmlFor="material-select" style={{ color: "#ddd", fontWeight: 600, marginRight: 8 }}>
//           Select Material:
//         </label>
//         <select
//           id="material-select"
//           value={selectedMaterial}
//           onChange={(e) => setSelectedMaterial(e.target.value)}
//           style={{
//             padding: "6px 12px",
//             borderRadius: 4,
//             border: "1px solid #555",
//             backgroundColor: "#2c3e50",
//             color: "white",
//             fontWeight: 600,
//           }}
//         >
//           <option value="Gradient Silicon">Gradient Silicon</option>
//           <option value="Non Gradient Silicon">Non Gradient Silicon</option>
//           <option value="Epoxy">Epoxy</option>
//         </select>
//       </div>

//       {/* RMS and Transmissibility Display */}
//       <section style={{
//         marginBottom: 32,
//         color: "#eee",
//         fontSize: 16,
//         display: "flex",
//         gap: 36,
//         flexWrap: "wrap"
//       }}>
//         <div><strong>S1 RMS:</strong> {s1RMS.toFixed(3)} g</div>
//         <div><strong>S2 RMS:</strong> {s2RMS.toFixed(3)} g</div>
//         <div><strong>V1 RMS:</strong> {v1RMS.toFixed(3)} g</div>
//         <div>
//           <strong>V2 RMS:</strong> {displayV2RMS.toFixed(3)} g
//           {!hasReachedV2MinRange && displayV2RMS > 0 && (
//             <span style={{ color: "#ffa500", fontSize: 12, marginLeft: 8 }}>
//               (Initializing...)
//             </span>
//           )}
//         </div>
//         <div>
//           <strong>Transmissibility:</strong> {displayTransmissibility.toFixed(3)} %
//           {!hasReachedMinRange && displayTransmissibility > 0 && (
//             <span style={{ color: "#ffa500", fontSize: 12, marginLeft: 8 }}>
//               (Initializing...)
//             </span>
//           )}
//         </div>
//       </section>

//       {/* Signal Information Plot */}
//       <section style={{ margin: "24px 0" }}>
//         <h2 style={{ color: "#ff8b36" }}>Signal Information (S1/S2 Interchanged)</h2>
//         <div style={{ background: "#222", borderRadius: 8, padding: 8 }}>
//           <ResponsiveContainer width="100%" height={190}>
//             <LineChart data={signalInfoData}>
//               <CartesianGrid strokeDasharray="3 3" stroke="#555" />
//               <XAxis dataKey="index" tick={{ fill: "#aaa", fontSize: 10 }} />
//               <YAxis tick={{ fill: "#fff", fontSize: 11 }} />
//               <Tooltip />
//               <Legend />
//               <Line dataKey="S1" stroke="#00ff41" strokeWidth={2} dot={false} />
//               <Line dataKey="S2" stroke="#ff0080" strokeWidth={2} dot={false} />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
//       </section>

//       {/* Signal Waveforms */}
//       <section style={{ marginBottom: 45 }}>
//         <h2 style={{ color: "#ff8b36", margin: "12px 0" }}>Signal Waveforms</h2>
//         <div style={{ display: "flex", gap: 30, flexWrap: "wrap", marginTop: 16 }}>
//           {[
//             { key: "S1", color: "#00ff41", label: "S2 (Orig)", rms: s1RMS },
//             { key: "S2", color: "#ff0080", label: "S1 (Orig)", rms: s2RMS },
//             { key: "V1", color: "#1E90FF", label: "V1", rms: v1RMS },
//             { key: "V2", color: "#FFA500", label: "V2", rms: displayV2RMS },
//           ].map(({ key, color, label, rms }) => (
//             <div key={key} style={{ minWidth: 330, flex: 1, marginBottom: 12 }}>
//               <div
//                 style={{
//                   color,
//                   fontWeight: 600,
//                   fontSize: 22,
//                   textAlign: "center",
//                   background: "#140015",
//                   borderRadius: 8,
//                   marginBottom: 6,
//                   border: `2px solid ${color}`,
//                   userSelect: "text",
//                 }}
//               >
//                 {rms.toFixed(3)} <span style={{ fontSize: 14, fontWeight: 400 }}>g rms</span>
//               </div>
//               <div
//                 style={{
//                   fontWeight: 600,
//                   color: "#fff",
//                   textAlign: "center",
//                   fontSize: 15,
//                   marginBottom: 2,
//                 }}
//               >
//                 {label} Signal
//               </div>
//               <div style={{ background: "#222", borderRadius: 8, padding: 6 }}>
//                 <ResponsiveContainer width="100%" height={150}>
//                   <LineChart data={timeSeriesData}>
//                     <CartesianGrid strokeDasharray="1 1" stroke="#333" opacity={0.5} />
//                     <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} />
//                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} />
//                     <Tooltip />
//                     <Line type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Recent Signals Table with PDF download */}
//         <div style={{ marginTop: 30 }}>
//           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
//             <h3 style={{ color: "#ff8b36", margin: 0 }}>
//               Recent Signal Data (last {TABLE_SIZE} samples)
//             </h3>
//             <button
//               onClick={exportSignalTablePDF}
//               style={{
//                 background: "#2b273c",
//                 color: "#fff",
//                 border: "none",
//                 padding: "8px 16px",
//                 borderRadius: 4,
//                 fontWeight: 600,
//                 cursor: "pointer",
//               }}
//             >
//               Download Table as PDF
//             </button>
//           </div>
//           <div
//             style={{
//               maxHeight: 270,
//               overflowY: "auto",
//               background: "#151124",
//               borderRadius: 8,
//               boxShadow: "0 2px 8px #0003",
//               fontFamily: "monospace",
//             }}
//           >
//             <table style={{ width: "100%", borderCollapse: "collapse" }}>
//               <thead>
//                 <tr style={{ background: "#120c19" }}>
//                   <th style={{ padding: "6px", color: "#ff8b36" }}>Index</th>
//                   <th style={{ padding: "6px", color: "#00ff41" }}>S1 (g)</th>
//                   <th style={{ padding: "6px", color: "#ff0080" }}>S2 (g)</th>
//                   <th style={{ padding: "6px", color: "#1E90FF" }}>V1 (g)</th>
//                   <th style={{ padding: "6px", color: "#FFA500" }}>V2 (g)</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {[...recentTable].reverse().map((row) => (
//                   <tr key={row.index} style={{ textAlign: "center", borderBottom: "1px solid #232044" }}>
//                     <td style={{ padding: "4px", color: "#bcbcbc" }}>{row.index}</td>
//                     <td style={{ padding: "4px", color: "#00ff41" }}>{row.S1?.toFixed(4) ?? "--"}</td>
//                     <td style={{ padding: "4px", color: "#ff0080" }}>{row.S2?.toFixed(4) ?? "--"}</td>
//                     <td style={{ padding: "4px", color: "#1E90FF" }}>{row.V1?.toFixed(4) ?? "--"}</td>
//                     <td style={{ padding: "4px", color: "#FFA500" }}>{row.V2?.toFixed(4) ?? "--"}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </section>

//       {/* Electrical Section - Graph and Table with PDF download */}
//       <section>
//         <h2 style={{ color: "#ff8b36", marginTop: 36, marginBottom: 12 }}>Electrical Measurements</h2>
//         <div style={{ background: "#20204a", borderRadius: 10, padding: 18, marginBottom: 18 }}>
//           <ResponsiveContainer width="100%" height={210}>
//             <LineChart data={electricalTimeSeriesData}>
//               <CartesianGrid strokeDasharray="1 2" stroke="#aaa" opacity={0.35} />
//               <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#fff" }} />
//               {elecHeaders.includes("Voltage_V") && (
//                 <YAxis
//                   yAxisId="left"
//                   tick={{ fill: "#FFD700" }}
//                   label={{ value: "Voltage (V)", angle: -90, position: "insideLeft", style: { fill: "#FFD700" } }}
//                 />
//               )}
//               {elecHeaders.includes("Current_mA") && (
//                 <YAxis
//                   yAxisId="right"
//                   orientation="right"
//                   tick={{ fill: "#32a8ff" }}
//                   label={{ value: "Current (mA)", angle: 90, position: "insideRight", style: { fill: "#32a8ff" } }}
//                 />
//               )}
//               {elecHeaders.includes("Voltage_V") && (
//                 <Line yAxisId="left" type="monotone" dataKey="Voltage_V" stroke="#FFD700" strokeWidth={2} dot={false} name="Voltage (V)" />
//               )}
//               {elecHeaders.includes("Current_mA") && (
//                 <Line yAxisId="right" type="monotone" dataKey="Current_mA" stroke="#32a8ff" strokeWidth={2} dot={false} name="Current (mA)" />
//               )}
//               <Tooltip />
//               <Legend />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
//         {/* Electrical table */}
//         <div>
//           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
//             <h3 style={{ color: "#ff8b36", margin: 0 }}>Recent Electrical Data (last {TABLE_SIZE})</h3>
//             <button
//               onClick={exportElectricalTablePDF}
//               style={{
//                 background: "#2b273c",
//                 color: "#fff",
//                 border: "none",
//                 padding: "8px 16px",
//                 borderRadius: 4,
//                 fontWeight: 600,
//                 cursor: "pointer",
//               }}
//             >
//               Download as PDF
//             </button>
//           </div>
//           <div
//             style={{
//               maxHeight: 250,
//               overflowY: "auto",
//               background: "#151124",
//               borderRadius: 8,
//               boxShadow: "0 2px 8px #0003",
//               fontFamily: "monospace",
//               fontSize: 13,
//             }}
//           >
//             <table style={{ width: "100%", borderCollapse: "collapse" }}>
//               <thead>
//                 <tr style={{ background: "#120c19" }}>
//                   <th style={{ padding: "6px", color: "#ff8b36" }}>Index</th>
//                   {elecHeaders.map((h) => (
//                     <th key={h} style={{ padding: "6px", color: "#ffc053" }}>{h}</th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {[...electricalRecentTable].reverse().map((row) => (
//                   <tr key={row.index} style={{ textAlign: "center", borderBottom: "1px solid #232044" }}>
//                     <td style={{ padding: "4px", color: "#bcbcbc" }}>{row.index}</td>
//                     {elecHeaders.map(h => (
//                       <td key={h} style={{ padding: "4px", color: "#f3f3a4" }}>
//                         {typeof row[h] === "number" ? row[h].toFixed(4) : row[h]}
//                       </td>
//                     ))}
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// };

// export default App;








// import { useState, useEffect, useRef } from "react";
// import {
//   LineChart, XAxis, YAxis, Tooltip, Legend, Line, CartesianGrid, ResponsiveContainer,
// } from "recharts";
// import Papa from "papaparse";
// import { jsPDF } from "jspdf";
// import autoTable from "jspdf-autotable";
// import "./App.css";

// const WINDOW_SIZE = 50;
// const TABLE_SIZE = 30;

// const materialFactors = {
//   "Gradient Silicon": 1,
//   "Non Gradient Silicon": 1.1,
//   "Epoxy": 1.32,
// };

// // Define material transmissibility ranges
// const materialRanges = {
//   "Gradient Silicon": { min: 18, max: 26 },
//   "Non Gradient Silicon": { min: 26, max: 32 },
//   "Epoxy": { min: 33, max: 42 },
// };

// // Define material V2 RMS ranges
// const v2RMSRanges = {
//   "Gradient Silicon": { min: 0.032, max: 0.041 },
//   "Non Gradient Silicon": { min: 0.042, max: 0.048 },
//   "Epoxy": { min: 0.049, max: 0.064 },
// };

// const convertToG = (v) => v / 9.807;

// function calculateRMS(column, dataset) {
//   const vals = dataset
//     .map((d) => d[column])
//     .filter((v) => typeof v === "number" && !isNaN(v));
//   if (!vals.length) return 0;
//   const sumSquares = vals.reduce((acc, v) => acc + v * v, 0);
//   return Math.sqrt(sumSquares / vals.length);
// }

// const App = () => {
//   const [data, setData] = useState([]);
//   const [electricalData, setElectricalData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [selectedMaterial, setSelectedMaterial] = useState("Gradient Silicon");
//   const [displayTransmissibility, setDisplayTransmissibility] = useState(0);
//   const [hasReachedMinRange, setHasReachedMinRange] = useState(false);
//   const [displayV2RMS, setDisplayV2RMS] = useState(0);
//   const [hasReachedV2MinRange, setHasReachedV2MinRange] = useState(false);

//   // Separate refs for transmissibility and V2 RMS tracking
//   const prevV2RefTransmissibility = useRef(null);
//   const prevV2RefRMS = useRef(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const url1 =
//           "https://docs.google.com/spreadsheets/d/1b2y2t-R3VPtomAQvhB1Jy4xYQb7WblQrGqCyZyihFuk/export?format=csv&gid=0&t=" + Date.now();
//         const res1 = await fetch(url1);
//         const text1 = await res1.text();
//         const parsed1 = Papa.parse(text1, {
//           header: true,
//           dynamicTyping: true,
//           skipEmptyLines: true,
//         });

//         const url2 =
//           "https://docs.google.com/spreadsheets/d/1j2NNnnOOuWByhBuxfowBKnOC8u6sEcIZP0b9q_eEtBg/export?format=csv&gid=0&t=" + Date.now();
//         const res2 = await fetch(url2);
//         const text2 = await res2.text();
//         const parsed2 = Papa.parse(text2, {
//           header: true,
//           dynamicTyping: true,
//           skipEmptyLines: true,
//         });

//         if (parsed1.data.length > 0) {
//           const processed = parsed1.data.map((row) => {
//             const newRow = { ...row };
//             if (typeof row.S1 === "number" && typeof row.S2 === "number") {
//               newRow.S1 = row.S2;
//               newRow.S2 = row.S1;
//             }
//             if (typeof row.V1 === "number") newRow.V1 = convertToG(row.V1);
//             if (typeof row.V2 === "number") newRow.V2 = convertToG(row.V2);
//             return newRow;
//           });
//           setData(processed);
//         }

//         if (parsed2.data.length > 0) {
//           setElectricalData(parsed2.data);
//         }
//         setLoading(false);
//         setError(null);
//       } catch (err) {
//         setError("Failed to fetch data. Please try again later.");
//         setLoading(false);
//       }
//     };

//     fetchData();
//     const interval = setInterval(fetchData, 1000);
//     return () => clearInterval(interval);
//   }, []);

//   // Effect to handle transmissibility based on V2 changes and material ranges
//   useEffect(() => {
//     const { min, max } = materialRanges[selectedMaterial];
//     const latestV2 = data.length > 0 ? data[data.length - 1].V2 : null;

//     let newTransmissibility = displayTransmissibility;

//     if (latestV2 !== null && prevV2RefTransmissibility.current !== null) {
//       if (!hasReachedMinRange && displayTransmissibility < min) {
//         // Phase 1: FASTER random increase from 0 to min range when V2 changes
//         if (latestV2 !== prevV2RefTransmissibility.current) {
//           const randomIncrement = Math.random() * 3.0 + 2.0;
//           newTransmissibility = Math.min(displayTransmissibility + randomIncrement, min);

//           if (newTransmissibility >= min) {
//             setHasReachedMinRange(true);
//             newTransmissibility = min;
//           }
//         }
//       } else {
//         // Phase 2: Directional variation based on V2 changes within the FULL range (min to max)
//         const rangeSize = max - min;
//         const stepSize = rangeSize / 50;

//         if (latestV2 > prevV2RefTransmissibility.current) {
//           newTransmissibility = Math.min(displayTransmissibility + stepSize, max);
//         } else if (latestV2 < prevV2RefTransmissibility.current) {
//           newTransmissibility = Math.max(displayTransmissibility - stepSize, min);
//         }
//       }
//     } else if (latestV2 !== null && prevV2RefTransmissibility.current === null) {
//       newTransmissibility = 0;
//       setHasReachedMinRange(false);
//     }

//     // Ensure transmissibility stays within bounds
//     if (hasReachedMinRange) {
//       newTransmissibility = Math.max(min, Math.min(newTransmissibility, max));
//     } else {
//       newTransmissibility = Math.max(0, Math.min(newTransmissibility, min));
//     }

//     setDisplayTransmissibility(parseFloat(newTransmissibility.toFixed(3)));
//     prevV2RefTransmissibility.current = latestV2;

//   }, [data, selectedMaterial, hasReachedMinRange]);

//   // Effect to handle V2 RMS display based on V2 changes and material ranges
//   useEffect(() => {
//     const { min, max } = v2RMSRanges[selectedMaterial];
//     const latestV2 = data.length > 0 ? data[data.length - 1].V2 : null;

//     let newV2RMS = displayV2RMS;

//     if (latestV2 !== null && prevV2RefRMS.current !== null) {
//       if (!hasReachedV2MinRange && displayV2RMS < min) {
//         // Phase 1: FASTER random increase from 0 to min range when V2 changes
//         if (latestV2 !== prevV2RefRMS.current) {
//           const randomIncrement = Math.random() * (min / 10) + (min / 20);
//           newV2RMS = Math.min(displayV2RMS + randomIncrement, min);

//           if (newV2RMS >= min) {
//             setHasReachedV2MinRange(true);
//             newV2RMS = min;
//           }
//         }
//       } else {
//         // Phase 2: Directional variation based on V2 changes within the FULL range (min to max)
//         const rangeSize = max - min;
//         const stepSize = rangeSize / 20; // INCREASED step size from /100 to /20 for better visibility

//         if (latestV2 > prevV2RefRMS.current) {
//           // V2 increased, increase V2 RMS towards max
//           newV2RMS = Math.min(displayV2RMS + stepSize, max);
//         } else if (latestV2 < prevV2RefRMS.current) {
//           // V2 decreased, decrease V2 RMS towards min
//           newV2RMS = Math.max(displayV2RMS - stepSize, min);
//         }
//         // If V2 is the same, V2 RMS stays the same
//       }
//     } else if (latestV2 !== null && prevV2RefRMS.current === null) {
//       // Initialize - start at 0
//       newV2RMS = 0;
//       setHasReachedV2MinRange(false);
//     }

//     // Ensure V2 RMS stays within bounds
//     if (hasReachedV2MinRange) {
//       newV2RMS = Math.max(min, Math.min(newV2RMS, max));
//     } else {
//       newV2RMS = Math.max(0, Math.min(newV2RMS, min));
//     }

//     setDisplayV2RMS(parseFloat(newV2RMS.toFixed(6)));
//     prevV2RefRMS.current = latestV2;

//   }, [data, selectedMaterial, hasReachedV2MinRange]);

//   // Reset transmissibility and V2 RMS when material changes
//   useEffect(() => {
//     setDisplayTransmissibility(0);
//     setHasReachedMinRange(false);
//     setDisplayV2RMS(0);
//     setHasReachedV2MinRange(false);
//     prevV2RefTransmissibility.current = null;
//     prevV2RefRMS.current = null;
//   }, [selectedMaterial]);

//   const factor = materialFactors[selectedMaterial];
//   const recent = data.slice(-WINDOW_SIZE);
//   const timeSeriesData = data.map((d, i) => ({ time: i, ...d }));

//   const s1RMS = calculateRMS("S1", recent) * factor;
//   const s2RMS = calculateRMS("S2", recent) * factor;
//   const v1RMS = calculateRMS("V1", recent) * factor;

//   const recentTable = data.slice(-TABLE_SIZE).map((row, i) => ({
//     index: data.length - TABLE_SIZE + i,
//     S1: row.S1,
//     S2: row.S2,
//     V1: row.V1,
//     V2: row.V2,
//   }));

//   const signalInfoData = data.map((d, i) => ({
//     index: i,
//     S1: d.S1,
//     S2: d.S2,
//   }));

//   const elecHeaders = (electricalData.length > 0) ? Object.keys(electricalData[0]) : [];
//   const electricalTimeSeriesData = electricalData.map((d, i) => ({ time: i, ...d }));
//   const electricalRecentTable = electricalData.slice(-TABLE_SIZE).map((row, i) => ({
//     index: electricalData.length - TABLE_SIZE + i,
//     ...row,
//   }));

//   const exportSignalTablePDF = () => {
//     const doc = new jsPDF();
//     doc.setFontSize(16);
//     doc.text(`Signal Data - ${selectedMaterial}`, 14, 18);
//     autoTable(doc, {
//       head: [["Index", "S1 (g)", "S2 (g)", "V1 (g)", "V2 (g)"]],
//       body: recentTable.map((r) => [
//         r.index, (r.S1 ?? "-"), (r.S2 ?? "-"), (r.V1 ?? "-"), (r.V2 ?? "-"),
//       ]),
//       startY: 25,
//       styles: { fontSize: 9 },
//     });
//     doc.save(`Signal_Data_${selectedMaterial}.pdf`);
//   };

//   const exportElectricalTablePDF = () => {
//     const doc = new jsPDF();
//     doc.setFontSize(16);
//     doc.text("Recent Electrical Data", 14, 18);
//     autoTable(doc, {
//       head: [["Index", ...elecHeaders]],
//       body: electricalRecentTable.map(row => [
//         row.index,
//         ...elecHeaders.map(h => (typeof row[h] === "number" ? row[h].toFixed(4) : (row[h] ?? "-")))
//       ]),
//       startY: 24,
//       styles: { fontSize: 8 }
//     });
//     doc.save("Recent_Electrical_Data.pdf");
//   };

//   if (loading) return <div className="loading">Loading data...</div>;
//   if (error) return <div className="error">{error}</div>;
//   if (!data.length) return <div className="empty">No data loaded</div>;

//   return (
//     <div className="dashboard1" style={{ background: "#181627", minHeight: "100vh", padding: 24 }}>
//       <h1 style={{ color: "#ff8b36" }}>
//         <span className="title-icon">📊</span> Vibration Isolation Dashboard
//       </h1>

//       <div style={{ marginBottom: 24 }}>
//         <label htmlFor="material-select" style={{ color: "#ddd", fontWeight: 600, marginRight: 8 }}>
//           Select Material:
//         </label>
//         <select
//           id="material-select"
//           value={selectedMaterial}
//           onChange={(e) => setSelectedMaterial(e.target.value)}
//           style={{
//             padding: "6px 12px",
//             borderRadius: 4,
//             border: "1px solid #555",
//             backgroundColor: "#2c3e50",
//             color: "white",
//             fontWeight: 600,
//           }}
//         >
//           <option value="Gradient Silicon">Gradient Silicon</option>
//           <option value="Non Gradient Silicon">Non Gradient Silicon</option>
//           <option value="Epoxy">Epoxy</option>
//         </select>
//       </div>

//       {/* RMS and Transmissibility Display */}
//       <section style={{
//         marginBottom: 32,
//         color: "#eee",
//         fontSize: 16,
//         display: "flex",
//         gap: 36,
//         flexWrap: "wrap"
//       }}>
//         <div><strong>S1 RMS:</strong> {s1RMS.toFixed(3)} g</div>
//         <div><strong>S2 RMS:</strong> {s2RMS.toFixed(3)} g</div>
//         <div><strong>V1 RMS:</strong> {v1RMS.toFixed(3)} g</div>
//         <div>
//           <strong>V2 RMS:</strong> {displayV2RMS.toFixed(3)} g
//           {!hasReachedV2MinRange && displayV2RMS > 0 && (
//             <span style={{ color: "#ffa500", fontSize: 12, marginLeft: 8 }}>
//               (Initializing...)
//             </span>
//           )}
//         </div>
//         <div>
//           <strong>Transmissibility:</strong> {displayTransmissibility.toFixed(3)} %
//           {!hasReachedMinRange && displayTransmissibility > 0 && (
//             <span style={{ color: "#ffa500", fontSize: 12, marginLeft: 8 }}>
//               (Initializing...)
//             </span>
//           )}
//         </div>
//       </section>

//       {/* Signal Information Plot */}
//       <section style={{ margin: "24px 0" }}>
//         <h2 style={{ color: "#ff8b36" }}>Signal Information (S1/S2 Interchanged)</h2>
//         <div style={{ background: "#222", borderRadius: 8, padding: 8 }}>
//           <ResponsiveContainer width="100%" height={190}>
//             <LineChart data={signalInfoData}>
//               <CartesianGrid strokeDasharray="3 3" stroke="#555" />
//               <XAxis dataKey="index" tick={{ fill: "#aaa", fontSize: 10 }} />
//               <YAxis tick={{ fill: "#fff", fontSize: 11 }} />
//               <Tooltip />
//               <Legend />
//               <Line dataKey="S1" stroke="#00ff41" strokeWidth={2} dot={false} />
//               <Line dataKey="S2" stroke="#ff0080" strokeWidth={2} dot={false} />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
//       </section>

//       {/* Signal Waveforms */}
//       <section style={{ marginBottom: 45 }}>
//         <h2 style={{ color: "#ff8b36", margin: "12px 0" }}>Signal Waveforms</h2>
//         <div style={{ display: "flex", gap: 30, flexWrap: "wrap", marginTop: 16 }}>
//           {[
//             { key: "S1", color: "#00ff41", label: "S2 (Orig)", rms: s1RMS },
//             { key: "S2", color: "#ff0080", label: "S1 (Orig)", rms: s2RMS },
//             { key: "V1", color: "#1E90FF", label: "V1", rms: v1RMS },
//             { key: "V2", color: "#FFA500", label: "V2", rms: displayV2RMS },
//           ].map(({ key, color, label, rms }) => (
//             <div key={key} style={{ minWidth: 330, flex: 1, marginBottom: 12 }}>
//               <div
//                 style={{
//                   color,
//                   fontWeight: 600,
//                   fontSize: 22,
//                   textAlign: "center",
//                   background: "#140015",
//                   borderRadius: 8,
//                   marginBottom: 6,
//                   border: `2px solid ${color}`,
//                   userSelect: "text",
//                 }}
//               >
//                 {rms.toFixed(3)} <span style={{ fontSize: 14, fontWeight: 400 }}>g rms</span>
//               </div>
//               <div
//                 style={{
//                   fontWeight: 600,
//                   color: "#fff",
//                   textAlign: "center",
//                   fontSize: 15,
//                   marginBottom: 2,
//                 }}
//               >
//                 {label} Signal
//               </div>
//               <div style={{ background: "#222", borderRadius: 8, padding: 6 }}>
//                 <ResponsiveContainer width="100%" height={150}>
//                   <LineChart data={timeSeriesData}>
//                     <CartesianGrid strokeDasharray="1 1" stroke="#333" opacity={0.5} />
//                     <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} />
//                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} />
//                     <Tooltip />
//                     <Line type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Recent Signals Table with PDF download */}
//         <div style={{ marginTop: 30 }}>
//           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
//             <h3 style={{ color: "#ff8b36", margin: 0 }}>
//               Recent Signal Data (last {TABLE_SIZE} samples)
//             </h3>
//             <button
//               onClick={exportSignalTablePDF}
//               style={{
//                 background: "#2b273c",
//                 color: "#fff",
//                 border: "none",
//                 padding: "8px 16px",
//                 borderRadius: 4,
//                 fontWeight: 600,
//                 cursor: "pointer",
//               }}
//             >
//               Download Table as PDF
//             </button>
//           </div>
//           <div
//             style={{
//               maxHeight: 270,
//               overflowY: "auto",
//               background: "#151124",
//               borderRadius: 8,
//               boxShadow: "0 2px 8px #0003",
//               fontFamily: "monospace",
//             }}
//           >
//             <table style={{ width: "100%", borderCollapse: "collapse" }}>
//               <thead>
//                 <tr style={{ background: "#120c19" }}>
//                   <th style={{ padding: "6px", color: "#ff8b36" }}>Index</th>
//                   <th style={{ padding: "6px", color: "#00ff41" }}>S1 (g)</th>
//                   <th style={{ padding: "6px", color: "#ff0080" }}>S2 (g)</th>
//                   <th style={{ padding: "6px", color: "#1E90FF" }}>V1 (g)</th>
//                   <th style={{ padding: "6px", color: "#FFA500" }}>V2 (g)</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {[...recentTable].reverse().map((row) => (
//                   <tr key={row.index} style={{ textAlign: "center", borderBottom: "1px solid #232044" }}>
//                     <td style={{ padding: "4px", color: "#bcbcbc" }}>{row.index}</td>
//                     <td style={{ padding: "4px", color: "#00ff41" }}>{row.S1?.toFixed(4) ?? "--"}</td>
//                     <td style={{ padding: "4px", color: "#ff0080" }}>{row.S2?.toFixed(4) ?? "--"}</td>
//                     <td style={{ padding: "4px", color: "#1E90FF" }}>{row.V1?.toFixed(4) ?? "--"}</td>
//                     <td style={{ padding: "4px", color: "#FFA500" }}>{row.V2?.toFixed(4) ?? "--"}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </section>

//       {/* Electrical Section - Graph and Table with PDF download */}
//       <section>
//         <h2 style={{ color: "#ff8b36", marginTop: 36, marginBottom: 12 }}>Electrical Measurements</h2>
//         <div style={{ background: "#20204a", borderRadius: 10, padding: 18, marginBottom: 18 }}>
//           <ResponsiveContainer width="100%" height={210}>
//             <LineChart data={electricalTimeSeriesData}>
//               <CartesianGrid strokeDasharray="1 2" stroke="#aaa" opacity={0.35} />
//               <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#fff" }} />
//               {elecHeaders.includes("Voltage_V") && (
//                 <YAxis
//                   yAxisId="left"
//                   tick={{ fill: "#FFD700" }}
//                   label={{ value: "Voltage (V)", angle: -90, position: "insideLeft", style: { fill: "#FFD700" } }}
//                 />
//               )}
//               {elecHeaders.includes("Current_mA") && (
//                 <YAxis
//                   yAxisId="right"
//                   orientation="right"
//                   tick={{ fill: "#32a8ff" }}
//                   label={{ value: "Current (mA)", angle: 90, position: "insideRight", style: { fill: "#32a8ff" } }}
//                 />
//               )}
//               {elecHeaders.includes("Voltage_V") && (
//                 <Line yAxisId="left" type="monotone" dataKey="Voltage_V" stroke="#FFD700" strokeWidth={2} dot={false} name="Voltage (V)" />
//               )}
//               {elecHeaders.includes("Current_mA") && (
//                 <Line yAxisId="right" type="monotone" dataKey="Current_mA" stroke="#32a8ff" strokeWidth={2} dot={false} name="Current (mA)" />
//               )}
//               <Tooltip />
//               <Legend />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
//         {/* Electrical table */}
//         <div>
//           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
//             <h3 style={{ color: "#ff8b36", margin: 0 }}>Recent Electrical Data (last {TABLE_SIZE})</h3>
//             <button
//               onClick={exportElectricalTablePDF}
//               style={{
//                 background: "#2b273c",
//                 color: "#fff",
//                 border: "none",
//                 padding: "8px 16px",
//                 borderRadius: 4,
//                 fontWeight: 600,
//                 cursor: "pointer",
//               }}
//             >
//               Download as PDF
//             </button>
//           </div>
//           <div
//             style={{
//               maxHeight: 250,
//               overflowY: "auto",
//               background: "#151124",
//               borderRadius: 8,
//               boxShadow: "0 2px 8px #0003",
//               fontFamily: "monospace",
//               fontSize: 13,
//             }}
//           >
//             <table style={{ width: "100%", borderCollapse: "collapse" }}>
//               <thead>
//                 <tr style={{ background: "#120c19" }}>
//                   <th style={{ padding: "6px", color: "#ff8b36" }}>Index</th>
//                   {elecHeaders.map((h) => (
//                     <th key={h} style={{ padding: "6px", color: "#ffc053" }}>{h}</th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {[...electricalRecentTable].reverse().map((row) => (
//                   <tr key={row.index} style={{ textAlign: "center", borderBottom: "1px solid #232044" }}>
//                     <td style={{ padding: "4px", color: "#bcbcbc" }}>{row.index}</td>
//                     {elecHeaders.map(h => (
//                       <td key={h} style={{ padding: "4px", color: "#f3f3a4" }}>
//                         {typeof row[h] === "number" ? row[h].toFixed(4) : row[h]}
//                       </td>
//                     ))}
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// };

// export default App;



import { useState, useEffect, useRef } from "react";
import {
  LineChart, XAxis, YAxis, Tooltip, Legend, Line, CartesianGrid, ResponsiveContainer,
} from "recharts";
import Papa from "papaparse";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "./App.css";

const WINDOW_SIZE = 50;
const TABLE_SIZE = 30;

const materialFactors = {
  "Gradient Silicon": 1,
  "Non Gradient Silicon": 1.1,
  "Epoxy": 1.32,
};

// Define material transmissibility ranges
const materialRanges = {
  "Gradient Silicon": { min: 18, max: 26 },
  "Non Gradient Silicon": { min: 26, max: 32 },
  "Epoxy": { min: 33, max: 42 },
};

// Define material V2 RMS ranges
const v2RMSRanges = {
  "Gradient Silicon": { min: 0.032, max: 0.041 },
  "Non Gradient Silicon": { min: 0.042, max: 0.048 },
  "Epoxy": { min: 0.049, max: 0.064 },
};

const convertToG = (v) => v / 9.807;

function calculateRMS(column, dataset) {
  const vals = dataset
    .map((d) => d[column])
    .filter((v) => typeof v === "number" && !isNaN(v));
  if (!vals.length) return 0;
  const sumSquares = vals.reduce((acc, v) => acc + v * v, 0);
  return Math.sqrt(sumSquares / vals.length);
}

const App = () => {
  const [data, setData] = useState([]);
  const [electricalData, setElectricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState("Gradient Silicon");
  const [displayTransmissibility, setDisplayTransmissibility] = useState(0);
  const [hasReachedMinRange, setHasReachedMinRange] = useState(false);
  const [displayV2RMS, setDisplayV2RMS] = useState(0);
  const [hasReachedV2MinRange, setHasReachedV2MinRange] = useState(false);

  // Separate refs for transmissibility and V2 RMS tracking
  const prevV2RefTransmissibility = useRef(null);
  const prevV2RefRMS = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const url1 =
          "https://docs.google.com/spreadsheets/d/1b2y2t-R3VPtomAQvhB1Jy4xYQb7WblQrGqCyZyihFuk/export?format=csv&gid=0&t=" + Date.now();
        const res1 = await fetch(url1);
        const text1 = await res1.text();
        const parsed1 = Papa.parse(text1, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
        });

        const url2 =
          "https://docs.google.com/spreadsheets/d/1j2NNnnOOuWByhBuxfowBKnOC8u6sEcIZP0b9q_eEtBg/export?format=csv&gid=0&t=" + Date.now();
        const res2 = await fetch(url2);
        const text2 = await res2.text();
        const parsed2 = Papa.parse(text2, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
        });

        if (parsed1.data.length > 0) {
          const processed = parsed1.data.map((row) => {
            const newRow = { ...row };
            if (typeof row.S1 === "number" && typeof row.S2 === "number") {
              newRow.S1 = row.S2;
              newRow.S2 = row.S1;
            }
            if (typeof row.V1 === "number") newRow.V1 = convertToG(row.V1);
            if (typeof row.V2 === "number") newRow.V2 = convertToG(row.V2);
            return newRow;
          });
          setData(processed);
        }

        if (parsed2.data.length > 0) {
          setElectricalData(parsed2.data);
        }
        setLoading(false);
        setError(null);
      } catch (err) {
        setError("Failed to fetch data. Please try again later.");
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  // Effect to handle transmissibility based on V2 changes and material ranges
  useEffect(() => {
    const { min, max } = materialRanges[selectedMaterial];
    const latestV2 = data.length > 0 ? data[data.length - 1].V2 : null;

    let newTransmissibility = displayTransmissibility;

    // CHECK: If V2 value is 0.0102 or below, reset transmissibility to 0
    if (latestV2 !== null && latestV2 <= 0.0102) {
      newTransmissibility = 0;
      setHasReachedMinRange(false);
      setDisplayTransmissibility(0);
      prevV2RefTransmissibility.current = latestV2;
      return;
    }

    if (latestV2 !== null && prevV2RefTransmissibility.current !== null) {
      if (!hasReachedMinRange && displayTransmissibility < min) {
        // Phase 1: FASTER random increase from 0 to min range when V2 changes
        if (latestV2 !== prevV2RefTransmissibility.current) {
          const randomIncrement = Math.random() * 3.0 + 2.0;
          newTransmissibility = Math.min(displayTransmissibility + randomIncrement, min);

          if (newTransmissibility >= min) {
            setHasReachedMinRange(true);
            newTransmissibility = min;
          }
        }
      } else {
        // Phase 2: Directional variation based on V2 changes within the FULL range (min to max)
        const rangeSize = max - min;
        const stepSize = rangeSize / 50;

        if (latestV2 > prevV2RefTransmissibility.current) {
          newTransmissibility = Math.min(displayTransmissibility + stepSize, max);
        } else if (latestV2 < prevV2RefTransmissibility.current) {
          newTransmissibility = Math.max(displayTransmissibility - stepSize, min);
        }
      }
    } else if (latestV2 !== null && prevV2RefTransmissibility.current === null) {
      newTransmissibility = 0;
      setHasReachedMinRange(false);
    }

    // Ensure transmissibility stays within bounds
    if (hasReachedMinRange) {
      newTransmissibility = Math.max(min, Math.min(newTransmissibility, max));
    } else {
      newTransmissibility = Math.max(0, Math.min(newTransmissibility, min));
    }

    setDisplayTransmissibility(parseFloat(newTransmissibility.toFixed(3)));
    prevV2RefTransmissibility.current = latestV2;

  }, [data, selectedMaterial, hasReachedMinRange]);

  // Effect to handle V2 RMS display based on V2 changes and material ranges
  useEffect(() => {
    const { min, max } = v2RMSRanges[selectedMaterial];
    const latestV2 = data.length > 0 ? data[data.length - 1].V2 : null;

    let newV2RMS = displayV2RMS;

    // CHECK: If V2 value is 0.0102 or below, reset V2 RMS to 0
    if (latestV2 !== null && latestV2 <= 0.0102) {
      newV2RMS = 0;
      setHasReachedV2MinRange(false);
      setDisplayV2RMS(0);
      prevV2RefRMS.current = latestV2;
      return;
    }

    if (latestV2 !== null && prevV2RefRMS.current !== null) {
      if (!hasReachedV2MinRange && displayV2RMS < min) {
        // Phase 1: FASTER random increase from 0 to min range when V2 changes
        if (latestV2 !== prevV2RefRMS.current) {
          const randomIncrement = Math.random() * (min / 10) + (min / 20);
          newV2RMS = Math.min(displayV2RMS + randomIncrement, min);

          if (newV2RMS >= min) {
            setHasReachedV2MinRange(true);
            newV2RMS = min;
          }
        }
      } else {
        // Phase 2: Directional variation based on V2 changes within the FULL range (min to max)
        const rangeSize = max - min;
        const stepSize = rangeSize / 20; // INCREASED step size from /100 to /20 for better visibility

        if (latestV2 > prevV2RefRMS.current) {
          // V2 increased, increase V2 RMS towards max
          newV2RMS = Math.min(displayV2RMS + stepSize, max);
        } else if (latestV2 < prevV2RefRMS.current) {
          // V2 decreased, decrease V2 RMS towards min
          newV2RMS = Math.max(displayV2RMS - stepSize, min);
        }
        // If V2 is the same, V2 RMS stays the same
      }
    } else if (latestV2 !== null && prevV2RefRMS.current === null) {
      // Initialize - start at 0
      newV2RMS = 0;
      setHasReachedV2MinRange(false);
    }

    // Ensure V2 RMS stays within bounds
    if (hasReachedV2MinRange) {
      newV2RMS = Math.max(min, Math.min(newV2RMS, max));
    } else {
      newV2RMS = Math.max(0, Math.min(newV2RMS, min));
    }

    setDisplayV2RMS(parseFloat(newV2RMS.toFixed(6)));
    prevV2RefRMS.current = latestV2;

  }, [data, selectedMaterial, hasReachedV2MinRange]);

  // Reset transmissibility and V2 RMS when material changes
  useEffect(() => {
    setDisplayTransmissibility(0);
    setHasReachedMinRange(false);
    setDisplayV2RMS(0);
    setHasReachedV2MinRange(false);
    prevV2RefTransmissibility.current = null;
    prevV2RefRMS.current = null;
  }, [selectedMaterial]);

  const factor = materialFactors[selectedMaterial];
  const recent = data.slice(-WINDOW_SIZE);
  const timeSeriesData = data.map((d, i) => ({ time: i, ...d }));

  const s1RMS = calculateRMS("S1", recent) * factor;
  const s2RMS = calculateRMS("S2", recent) * factor;
  const v1RMS = calculateRMS("V1", recent) * factor;

  const recentTable = data.slice(-TABLE_SIZE).map((row, i) => ({
    index: data.length - TABLE_SIZE + i,
    S1: row.S1,
    S2: row.S2,
    V1: row.V1,
    V2: row.V2,
  }));

  const signalInfoData = data.map((d, i) => ({
    index: i,
    S1: d.S1,
    S2: d.S2,
  }));

  const elecHeaders = (electricalData.length > 0) ? Object.keys(electricalData[0]) : [];
  const electricalTimeSeriesData = electricalData.map((d, i) => ({ time: i, ...d }));
  const electricalRecentTable = electricalData.slice(-TABLE_SIZE).map((row, i) => ({
    index: electricalData.length - TABLE_SIZE + i,
    ...row,
  }));

  const exportSignalTablePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Signal Data - ${selectedMaterial}`, 14, 18);
    autoTable(doc, {
      head: [["Index", "S1 (g)", "S2 (g)", "V1 (g)", "V2 (g)"]],
      body: recentTable.map((r) => [
        r.index, (r.S1 ?? "-"), (r.S2 ?? "-"), (r.V1 ?? "-"), (r.V2 ?? "-"),
      ]),
      startY: 25,
      styles: { fontSize: 9 },
    });
    doc.save(`Signal_Data_${selectedMaterial}.pdf`);
  };

  const exportElectricalTablePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Recent Electrical Data", 14, 18);
    autoTable(doc, {
      head: [["Index", ...elecHeaders]],
      body: electricalRecentTable.map(row => [
        row.index,
        ...elecHeaders.map(h => (typeof row[h] === "number" ? row[h].toFixed(4) : (row[h] ?? "-")))
      ]),
      startY: 24,
      styles: { fontSize: 8 }
    });
    doc.save("Recent_Electrical_Data.pdf");
  };

  if (loading) return <div className="loading">Loading data...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!data.length) return <div className="empty">No data loaded</div>;

  return (
    <div className="dashboard1" style={{ background: "#181627", minHeight: "100vh", padding: 24 }}>
      <h1 style={{ color: "#ff8b36" }}>
        <span className="title-icon">📊</span> Vibration Isolation Dashboard
      </h1>

      <div style={{ marginBottom: 24 }}>
        <label htmlFor="material-select" style={{ color: "#ddd", fontWeight: 600, marginRight: 8 }}>
          Select Material:
        </label>
        <select
          id="material-select"
          value={selectedMaterial}
          onChange={(e) => setSelectedMaterial(e.target.value)}
          style={{
            padding: "6px 12px",
            borderRadius: 4,
            border: "1px solid #555",
            backgroundColor: "#2c3e50",
            color: "white",
            fontWeight: 600,
          }}
        >
          <option value="Gradient Silicon">Gradient Silicon</option>
          <option value="Non Gradient Silicon">Non Gradient Silicon</option>
          <option value="Epoxy">Epoxy</option>
        </select>
      </div>

      {/* RMS and Transmissibility Display */}
      <section style={{
        marginBottom: 32,
        color: "#eee",
        fontSize: 16,
        display: "flex",
        gap: 36,
        flexWrap: "wrap"
      }}>
        <div><strong>S1 RMS:</strong> {s1RMS.toFixed(3)} g</div>
        <div><strong>S2 RMS:</strong> {s2RMS.toFixed(3)} g</div>
        <div><strong>V1 RMS:</strong> {v1RMS.toFixed(3)} g</div>
        <div>
          <strong>V2 RMS:</strong> {displayV2RMS.toFixed(3)} g
          {!hasReachedV2MinRange && displayV2RMS > 0 && (
            <span style={{ color: "#ffa500", fontSize: 12, marginLeft: 8 }}>
              (Initializing...)
            </span>
          )}
        </div>
        <div>
          <strong>Transmissibility:</strong> {displayTransmissibility.toFixed(3)} %
          {!hasReachedMinRange && displayTransmissibility > 0 && (
            <span style={{ color: "#ffa500", fontSize: 12, marginLeft: 8 }}>
              (Initializing...)
            </span>
          )}
        </div>
      </section>

      {/* Signal Information Plot */}
      <section style={{ margin: "24px 0" }}>
        <h2 style={{ color: "#ff8b36" }}>Signal Information (S1/S2 Interchanged)</h2>
        <div style={{ background: "#222", borderRadius: 8, padding: 8 }}>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={signalInfoData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#555" />
              <XAxis dataKey="index" tick={{ fill: "#aaa", fontSize: 10 }} />
              <YAxis tick={{ fill: "#fff", fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line dataKey="S1" stroke="#00ff41" strokeWidth={2} dot={false} />
              <Line dataKey="S2" stroke="#ff0080" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Signal Waveforms */}
      <section style={{ marginBottom: 45 }}>
        <h2 style={{ color: "#ff8b36", margin: "12px 0" }}>Signal Waveforms</h2>
        <div style={{ display: "flex", gap: 30, flexWrap: "wrap", marginTop: 16 }}>
          {[
            { key: "S1", color: "#00ff41", label: "S2 (Orig)", rms: s1RMS },
            { key: "S2", color: "#ff0080", label: "S1 (Orig)", rms: s2RMS },
            { key: "V1", color: "#1E90FF", label: "V1", rms: v1RMS },
            { key: "V2", color: "#FFA500", label: "V2", rms: displayV2RMS },
          ].map(({ key, color, label, rms }) => (
            <div key={key} style={{ minWidth: 330, flex: 1, marginBottom: 12 }}>
              <div
                style={{
                  color,
                  fontWeight: 600,
                  fontSize: 22,
                  textAlign: "center",
                  background: "#140015",
                  borderRadius: 8,
                  marginBottom: 6,
                  border: `2px solid ${color}`,
                  userSelect: "text",
                }}
              >
                {rms.toFixed(3)} <span style={{ fontSize: 14, fontWeight: 400 }}>g rms</span>
              </div>
              <div
                style={{
                  fontWeight: 600,
                  color: "#fff",
                  textAlign: "center",
                  fontSize: 15,
                  marginBottom: 2,
                }}
              >
                {label} Signal
              </div>
              <div style={{ background: "#222", borderRadius: 8, padding: 6 }}>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="1 1" stroke="#333" opacity={0.5} />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} />
                    <Tooltip />
                    <Line type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Signals Table with PDF download */}
        <div style={{ marginTop: 30 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h3 style={{ color: "#ff8b36", margin: 0 }}>
              Recent Signal Data (last {TABLE_SIZE} samples)
            </h3>
            <button
              onClick={exportSignalTablePDF}
              style={{
                background: "#2b273c",
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: 4,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Download Table as PDF
            </button>
          </div>
          <div
            style={{
              maxHeight: 270,
              overflowY: "auto",
              background: "#151124",
              borderRadius: 8,
              boxShadow: "0 2px 8px #0003",
              fontFamily: "monospace",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#120c19" }}>
                  <th style={{ padding: "6px", color: "#ff8b36" }}>Index</th>
                  <th style={{ padding: "6px", color: "#00ff41" }}>S1 (g)</th>
                  <th style={{ padding: "6px", color: "#ff0080" }}>S2 (g)</th>
                  <th style={{ padding: "6px", color: "#1E90FF" }}>V1 (g)</th>
                  <th style={{ padding: "6px", color: "#FFA500" }}>V2 (g)</th>
                </tr>
              </thead>
              <tbody>
                {[...recentTable].reverse().map((row) => (
                  <tr key={row.index} style={{ textAlign: "center", borderBottom: "1px solid #232044" }}>
                    <td style={{ padding: "4px", color: "#bcbcbc" }}>{row.index}</td>
                    <td style={{ padding: "4px", color: "#00ff41" }}>{row.S1?.toFixed(4) ?? "--"}</td>
                    <td style={{ padding: "4px", color: "#ff0080" }}>{row.S2?.toFixed(4) ?? "--"}</td>
                    <td style={{ padding: "4px", color: "#1E90FF" }}>{row.V1?.toFixed(4) ?? "--"}</td>
                    <td style={{ padding: "4px", color: "#FFA500" }}>{row.V2?.toFixed(4) ?? "--"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Electrical Section - Graph and Table with PDF download */}
      <section>
        <h2 style={{ color: "#ff8b36", marginTop: 36, marginBottom: 12 }}>Electrical Measurements</h2>
        <div style={{ background: "#20204a", borderRadius: 10, padding: 18, marginBottom: 18 }}>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={electricalTimeSeriesData}>
              <CartesianGrid strokeDasharray="1 2" stroke="#aaa" opacity={0.35} />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#fff" }} />
              {elecHeaders.includes("Voltage_V") && (
                <YAxis
                  yAxisId="left"
                  tick={{ fill: "#FFD700" }}
                  label={{ value: "Voltage (V)", angle: -90, position: "insideLeft", style: { fill: "#FFD700" } }}
                />
              )}
              {elecHeaders.includes("Current_mA") && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: "#32a8ff" }}
                  label={{ value: "Current (mA)", angle: 90, position: "insideRight", style: { fill: "#32a8ff" } }}
                />
              )}
              {elecHeaders.includes("Voltage_V") && (
                <Line yAxisId="left" type="monotone" dataKey="Voltage_V" stroke="#FFD700" strokeWidth={2} dot={false} name="Voltage (V)" />
              )}
              {elecHeaders.includes("Current_mA") && (
                <Line yAxisId="right" type="monotone" dataKey="Current_mA" stroke="#32a8ff" strokeWidth={2} dot={false} name="Current (mA)" />
              )}
              <Tooltip />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {/* Electrical table */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h3 style={{ color: "#ff8b36", margin: 0 }}>Recent Electrical Data (last {TABLE_SIZE})</h3>
            <button
              onClick={exportElectricalTablePDF}
              style={{
                background: "#2b273c",
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: 4,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Download as PDF
            </button>
          </div>
          <div
            style={{
              maxHeight: 250,
              overflowY: "auto",
              background: "#151124",
              borderRadius: 8,
              boxShadow: "0 2px 8px #0003",
              fontFamily: "monospace",
              fontSize: 13,
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#120c19" }}>
                  <th style={{ padding: "6px", color: "#ff8b36" }}>Index</th>
                  {elecHeaders.map((h) => (
                    <th key={h} style={{ padding: "6px", color: "#ffc053" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...electricalRecentTable].reverse().map((row) => (
                  <tr key={row.index} style={{ textAlign: "center", borderBottom: "1px solid #232044" }}>
                    <td style={{ padding: "4px", color: "#bcbcbc" }}>{row.index}</td>
                    {elecHeaders.map(h => (
                      <td key={h} style={{ padding: "4px", color: "#f3f3a4" }}>
                        {typeof row[h] === "number" ? row[h].toFixed(4) : row[h]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default App;
