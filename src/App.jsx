// import { useState, useEffect } from "react";
// import {
//   LineChart,
//   BarChart,
//   XAxis,
//   YAxis,
//   Tooltip,
//   Legend,
//   Line,
//   Bar,
//   CartesianGrid,
//   ResponsiveContainer,
// } from "recharts";
// import Papa from "papaparse";
// import { jsPDF } from "jspdf";
// import autoTable from "jspdf-autotable";
// import "./App.css";

// // Adjustable parameters
// const WINDOW_SIZE = 50; // Samples for RMS window
// const TABLE_SIZE = 30;  // Rows in recent data tables

// // Convert V1/V2 from m/s² to g (adjust if your data is already in g)
// const convertToG = (v) => v / 9.807;

// // RMS calculation helper
// function calculateRMS(column, dataset) {
//   const vals = dataset
//     .map((d) => d[column])
//     .filter((v) => typeof v === "number" && !isNaN(v));
//   if (vals.length === 0) return "0.000";
//   const sumSquares = vals.reduce((acc, v) => acc + v * v, 0);
//   return Math.sqrt(sumSquares / vals.length).toFixed(3);
// }

// const App = () => {
//   // State variables
//   const [data, setData] = useState([]);
//   const [electricalData, setElectricalData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Fetch and parse data from Google Sheets CSV exports
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const url1 =
//           "https://docs.google.com/spreadsheets/d/1b2y2t-R3VPtomAQvhB1Jy4xYQb7WblQrGqCyZyihFuk/export?format=csv&gid=0&t=" +
//           Date.now();
//         const res1 = await fetch(url1);
//         const text1 = await res1.text();
//         const parsed1 = Papa.parse(text1, {
//           header: true,
//           dynamicTyping: true,
//           skipEmptyLines: true,
//         });

//         const url2 =
//           "https://docs.google.com/spreadsheets/d/1j2NNnnOOuWByhBuxfowBKnOC8u6sEcIZP0b9q_eEtBg/export?format=csv&gid=0&t=" +
//           Date.now();
//         const res2 = await fetch(url2);
//         const text2 = await res2.text();
//         const parsed2 = Papa.parse(text2, {
//           header: true,
//           dynamicTyping: true,
//           skipEmptyLines: true,
//         });

//         if (parsed1.data.length > 0) {
//           const processed = parsed1.data.map(row => {
//             const newRow = { ...row };
//             if (typeof row.S1 === "number" && typeof row.S2 === "number") {
//               // Swap S1 and S2
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
//         console.error(err);
//       }
//     };

//     fetchData();
//     const interval = setInterval(fetchData, 1000);
//     return () => clearInterval(interval);
//   }, []);

//   // Show loading and error states
//   if (loading) return <div style={{ color: "#fff" }}>Loading data...</div>;
//   if (error) return <div style={{ color: "red" }}>{error}</div>;
//   if (data.length === 0) return <div style={{ color: "#ccc" }}>No data loaded</div>;

//   // Compute recent datasets for RMS and table
//   const recent = data.slice(-WINDOW_SIZE);
//   const recentTable = data.slice(-TABLE_SIZE).map((row, i) => ({
//     index: data.length - TABLE_SIZE + i,
//     S1: row.S1,
//     S2: row.S2,
//     V1: row.V1,
//     V2: row.V2,
//   }));

//   // Electrical recent table and headers
//   const electricalRecentTable = electricalData.slice(-TABLE_SIZE).map((row, i) => ({
//     index: electricalData.length - TABLE_SIZE + i,
//     ...row
//   }));
//   const elecHeaders = electricalData.length ? Object.keys(electricalData[0]) : [];

//   // Moving window RMS values
//   const s1RMS = calculateRMS("S1", recent);
//   const s2RMS = calculateRMS("S2", recent);
//   const v1RMS = calculateRMS("V1", recent);
//   const v2RMS = calculateRMS("V2", recent);

//   // Time series for charts
//   const timeSeriesData = data.map((d, i) => ({ time: i, ...d }));
//   const electricalTimeSeriesData = electricalData.map((d, i) => ({ time: i, ...d }));

//   // Signal Information (S1/S2 swapped) for graph
//   const signalInfoData = data.map((d, i) => ({
//     index: i,
//     S1: d.S1,
//     S2: d.S2,
//   }));

//   // Transmissibility per sample = (S2/S1)*100%
//   const transmissibilitySeries = data.map((d, i) => {
//     let tr = null;
//     if (typeof d.S1 === "number" && d.S1 !== 0 && typeof d.S2 === "number") {
//       tr = (d.S2 / d.S1) * 100;
//     }
//     return { index: i, Transmissibility: tr };
//   });

//   // Average transmissibility over full dataset
//   const avgTransmissibility =
//     transmissibilitySeries.reduce((acc, cur) => acc + (cur.Transmissibility || 0), 0) /
//     transmissibilitySeries.length;

//   // PDF export functions for signal and electrical data tables
//   const exportSignalTablePDF = () => {
//     const doc = new jsPDF();
//     doc.setFontSize(16);
//     doc.text("Recent Signal Data", 14, 18);
//     autoTable(doc, {
//       head: [["Index", "S1 (g)", "S2 (g)", "V1 (g)", "V2 (g)"]],
//       body: recentTable.map(r => [
//         r.index,
//         r.S1?.toFixed(4) ?? "-",
//         r.S2?.toFixed(4) ?? "-",
//         r.V1?.toFixed(4) ?? "-",
//         r.V2?.toFixed(4) ?? "-",
//       ]),
//       startY: 24,
//       styles: { fontSize: 9 }
//     });
//     doc.save("Recent_Signal_Data.pdf");
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

//   return (
//     <div className="dashboard1" style={{ background: "#181627", minHeight: "100vh", padding: 24 }}>
//       <h1 style={{ color: "#ff8b36" }}>
//         <span className="title-icon">📊</span> Vibration Isolation Dashboard
//       </h1>

//       {/* Signal Information Graph */}
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
//         <p style={{ color: "#bbb", fontSize: 13, marginTop: 6 }}>
//           Shows S1 (input, swapped original S2) and S2 (output, swapped original S1) signal over time.
//         </p>
//       </section>

//       {/* Transmissibility Chart */}
//       <section style={{ margin: "24px 0" }}>
//         <h2 style={{ color: "#ff8b36" }}>Transmissibility (% Over Time)</h2>
//         <div style={{ background: "#232044", borderRadius: 8, padding: 8 }}>
//           <ResponsiveContainer width="100%" height={165}>
//             <LineChart data={transmissibilitySeries}>
//               <CartesianGrid strokeDasharray="3 3" stroke="#8888" />
//               <XAxis dataKey="index" tick={{ fill: "#aaa", fontSize: 10 }} />
//               <YAxis tick={{ fill: "#FFAA00", fontSize: 12 }} />
//               <Tooltip />
//               <Line dataKey="Transmissibility" stroke="#FFAA00" strokeWidth={2} dot={false} />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
//         <p style={{ color: "#FFD700", fontWeight: "bold", fontSize: 15, marginTop: 6 }}>
//           Average Transmissibility: {avgTransmissibility.toFixed(2)}%
//         </p>
//         <p style={{ color: "#bbb", fontSize: 13 }}>
//           Calculated as (Output RMS / Input RMS) × 100%
//         </p>
//       </section>

//       {/* Signal Waveforms and RMS Blocks */}
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
//                   color: color,
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
//                 {rms} <span style={{ fontSize: 14, fontWeight: 400 }}>g rms</span>
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
//                     <td style={{ padding: "4px", color: "#00ff41" }}>{row.S1?.toFixed(4)}</td>
//                     <td style={{ padding: "4px", color: "#ff0080" }}>{row.S2?.toFixed(4)}</td>
//                     <td style={{ padding: "4px", color: "#1E90FF" }}>{row.V1?.toFixed(4)}</td>
//                     <td style={{ padding: "4px", color: "#FFA500" }}>{row.V2?.toFixed(4)}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </section>

//       {/* Electrical Section - Graph and Table with PDF download */}
//       <section style={{ marginBottom: 45 }}>
//         <h2 style={{ color: "#ff8b36" }}>Electrical Measurements</h2>
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
//         {/* Electrical recent data table */}
//         <div>
//           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
//             <h3 style={{ color: "#ff8b36", margin: 0 }}>Recent Electrical Data (last {TABLE_SIZE})</h3>
//             <button
//               onClick={() => {
//                 const doc = new jsPDF();
//                 doc.setFontSize(16);
//                 doc.text("Recent Electrical Data", 14, 18);
//                 autoTable(doc, {
//                   head: [["Index", ...elecHeaders]],
//                   body: electricalRecentTable.map(row => [
//                     row.index,
//                     ...elecHeaders.map(h => (typeof row[h] === "number" ? row[h].toFixed(4) : (row[h] ?? "-")))
//                   ]),
//                   startY: 24,
//                   styles: { fontSize: 8 },
//                 });
//                 doc.save("Recent_Electrical_Data.pdf");
//               }}
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






import { useState, useEffect } from "react";
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

  const factor = materialFactors[selectedMaterial];
  const recent = data.slice(-WINDOW_SIZE);
  const timeSeriesData = data.map((d, i) => ({ time: i, ...d }));

  const s1RMS = calculateRMS("S1", recent) * factor;
  const s2RMS = calculateRMS("S2", recent) * factor;
  const v1RMS = calculateRMS("V1", recent) * factor;
  const v2RMS = calculateRMS("V2", recent) * factor;
  const trRaw = calculateRMS("S1", recent) !== 0
    ? (calculateRMS("S2", recent) / calculateRMS("S1", recent)) * 100
    : 0;
  const transmissibility = trRaw * factor;

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
        <div><strong>V2 RMS:</strong> {v2RMS.toFixed(3)} g</div>
        <div><strong>Transmissibility:</strong> {transmissibility.toFixed(3)} %</div>
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
            { key: "V2", color: "#FFA500", label: "V2", rms: v2RMS },
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








// import { useState, useEffect } from "react";
// import {
//   LineChart,
//   BarChart,
//   XAxis,
//   YAxis,
//   Tooltip,
//   Legend,
//   Line,
//   Bar,
//   CartesianGrid,
//   ResponsiveContainer,
// } from "recharts";
// import Papa from "papaparse";
// import { jsPDF } from "jspdf";
// import autoTable from "jspdf-autotable";
// import "./App.css";

// // Adjustable parameters
// const WINDOW_SIZE = 50; // Samples for RMS window
// const TABLE_SIZE = 30;  // Rows in recent data tables

// // Convert V1/V2 from m/s² to g (adjust if your data is already in g)
// const convertToG = (v) => v / 9.807;

// // RMS calculation helper
// function calculateRMS(column, dataset) {
//   const vals = dataset
//     .map((d) => d[column])
//     .filter((v) => typeof v === "number" && !isNaN(v));
//   if (vals.length === 0) return 0;
//   const sumSquares = vals.reduce((acc, v) => acc + v * v, 0);
//   return Math.sqrt(sumSquares / vals.length);
// }

// // Material adjustment factors
// // e.g. Non Gradient Silicon values are 10% higher, Epoxy values 20% higher than Non Gradient Silicon
// const materialFactors = {
//   "Gradient Silicon": 1.0,
//   "Non Gradient Silicon": 1.1,
//   Epoxy: 1.32,
// };

// const App = () => {
//   // State variables
//   const [data, setData] = useState([]);
//   const [electricalData, setElectricalData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [rmsMode, setRmsMode] = useState("standard");
//   const [selectedMaterial, setSelectedMaterial] = useState("Gradient Silicon"); // default material

//   // Fetch and parse data
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
//         console.error(err);
//       }
//     };

//     fetchData();
//     const interval = setInterval(fetchData, 1000);
//     return () => clearInterval(interval);
//   }, []);

//   // Handle material factor for RMS and transmissibility
//   const factor = materialFactors[selectedMaterial] || 1.0;

//   // Compute RMS values over recent samples
//   const recent = data.slice(-WINDOW_SIZE);

//   const s1RMSRaw = calculateRMS("S1", recent);
//   const s2RMSRaw = calculateRMS("S2", recent);
//   const v1RMSRaw = calculateRMS("V1", recent);
//   const v2RMSRaw = calculateRMS("V2", recent);

//   // Adjusted RMS values
//   const s1RMS = s1RMSRaw * factor;
//   const s2RMS = s2RMSRaw * factor;
//   const v1RMS = v1RMSRaw * factor;
//   const v2RMS = v2RMSRaw * factor;

//   // Compute transmissibility raw and adjusted (handle division by zero)
//   const transmissibilityRaw = s1RMSRaw !== 0 ? (s2RMSRaw / s1RMSRaw) * 100 : 0;
//   const transmissibility = transmissibilityRaw * factor;

//   // Format display values to 3 decimals
//   const formatVal = (val) => val.toFixed(3);

//   // Prepare time series data for charts
//   const timeSeriesData = data.map((d, i) => ({ time: i, ...d }));

//   // Recent signal data table
//   const recentTable = data.slice(-TABLE_SIZE).map((row, i) => ({
//     index: data.length - TABLE_SIZE + i,
//     S1: row.S1,
//     S2: row.S2,
//     V1: row.V1,
//     V2: row.V2,
//   }));

//   // Export signal data as PDF
//   const exportSignalTablePDF = () => {
//     const doc = new jsPDF();
//     doc.setFontSize(16);
//     doc.text(`Signal Data - ${selectedMaterial}`, 14, 18);
//     autoTable(doc, {
//       head: [["Index", "S1 (g)", "S2 (g)", "V1 (g)", "V2 (g)"]],
//       body: recentTable.map((r) => [
//         r.index,
//         r.S1?.toFixed(4) ?? "-",
//         r.S2?.toFixed(4) ?? "-",
//         r.V1?.toFixed(4) ?? "-",
//         r.V2?.toFixed(4) ?? "-",
//       ]),
//       startY: 25,
//       styles: { fontSize: 9 },
//     });
//     doc.save(`Signal_Data_${selectedMaterial}.pdf`);
//   };

//   if (loading) return <div className="loading">Loading data...</div>;
//   if (error) return <div className="error">{error}</div>;
//   if (!data.length) return <div className="empty">No data loaded</div>;

//   return (
//     <div className="dashboard1" style={{ background: "#181627", minHeight: "100vh", padding: 24 }}>
//       <h1 className="main-title" style={{ color: "#ff8b36" }}>
//         <span className="title-icon" role="img" aria-label="chart">📊</span> Vibration Isolation Dashboard
//       </h1>

//       {/* Material Selection Dropdown */}
//       <div style={{ marginBottom: 24 }}>
//         <label htmlFor="material-select" style={{ color: "#ddd", fontWeight: "600", marginRight: 8 }}>
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
//           }}
//         >
//           <option value="Gradient Silicon">Gradient Silicon</option>
//           <option value="Non Gradient Silicon">Non Gradient Silicon</option>
//           <option value="Epoxy">Epoxy</option>
//         </select>
//       </div>

//       {/* RMS and Transmissibility Display */}
//       <section style={{ marginBottom: 32, color: "#eee", fontSize: 16, display: "flex", gap: 36, flexWrap: "wrap" }}>
//         <div>
//           <strong>S1 RMS:</strong> {formatVal(s1RMS)} g
//         </div>
//         <div>
//           <strong>S2 RMS:</strong> {formatVal(s2RMS)} g
//         </div>
//         <div>
//           <strong>V1 RMS:</strong> {formatVal(v1RMS)} g
//         </div>
//         <div>
//           <strong>V2 RMS:</strong> {formatVal(v2RMS)} g
//         </div>
//         <div>
//           <strong>Transmissibility:</strong> {formatVal(transmissibility)} %
//         </div>
//       </section>

//       {/* Signal Waveforms with RMS block */}
//       <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
//         {[
//           { key: "S1", color: "#00ff41", label: "S2 (Orig)", rms: s1RMS },
//           { key: "S2", color: "#ff0080", label: "S1 (Orig)", rms: s2RMS },
//           { key: "V1", color: "#1E90FF", label: "V1", rms: v1RMS },
//           { key: "V2", color: "#FFA500", label: "V2", rms: v2RMS },
//         ].map(({ key, color, label, rms }) => (
//           <div key={key} style={{ flex: "1 1 45%", minWidth: 320, marginBottom: 20 }}>
//             <div
//               style={{
//                 color,
//                 fontWeight: "bold",
//                 fontSize: 22,
//                 background: "#140015",
//                 textAlign: "center",
//                 borderRadius: 8,
//                 marginBottom: 6,
//                 padding: "8px 0",
//                 border: `2px solid ${color}`,
//                 userSelect: "text",
//               }}
//             >
//               {formatVal(rms)} <span style={{ fontSize: 14, fontWeight: "normal" }}>g rms</span>
//             </div>
//             <div
//               style={{
//                 fontWeight: 600,
//                 color: "#fff",
//                 textAlign: "center",
//                 fontSize: 15,
//                 marginBottom: 2,
//               }}
//             >
//               {label} Signal
//             </div>
//             <div style={{ background: "#222", borderRadius: 8, padding: 6 }}>
//               <ResponsiveContainer width="100%" height={170}>
//                 <LineChart data={timeSeriesData}>
//                   <CartesianGrid strokeDasharray="1 1" stroke="#333" opacity={0.5} />
//                   <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} />
//                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} />
//                   <Tooltip />
//                   <Line
//                     type="monotone"
//                     dataKey={key}
//                     stroke={color}
//                     strokeWidth={2}
//                     dot={false}
//                     isAnimationActive={false}
//                   />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Recent Signal Data Table */}
//       <div style={{ marginTop: 36 }}>
//         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
//           <h3 style={{ color: "#ff8b36", margin: 0 }}>Recent Signal Data (last {TABLE_SIZE})</h3>
//           <button
//             onClick={exportSignalTablePDF}
//             style={{
//               background: "#2b273c",
//               color: "#fff",
//               border: "none",
//               padding: "8px 16px",
//               borderRadius: 4,
//               fontWeight: 600,
//               cursor: "pointer",
//             }}
//           >
//             Download Table as PDF
//           </button>
//         </div>
//         <div
//           style={{
//             maxHeight: 270,
//             overflowY: "auto",
//             background: "#151124",
//             borderRadius: 8,
//             boxShadow: "0 2px 8px #0003",
//             fontFamily: "monospace",
//           }}
//         >
//           <table style={{ width: "100%", borderCollapse: "collapse" }}>
//             <thead>
//               <tr style={{ background: "#120c19" }}>
//                 <th style={{ padding: "6px", color: "#ff8b36" }}>Index</th>
//                 <th style={{ padding: "6px", color: "#00ff41" }}>S1 (g)</th>
//                 <th style={{ padding: "6px", color: "#ff0080" }}>S2 (g)</th>
//                 <th style={{ padding: "6px", color: "#1E90FF" }}>V1 (g)</th>
//                 <th style={{ padding: "6px", color: "#FFA500" }}>V2 (g)</th>
//               </tr>
//             </thead>
//             <tbody>
//               {[...recentTable].reverse().map((row) => (
//                 <tr key={row.index} style={{ textAlign: "center", borderBottom: "1px solid #232044" }}>
//                   <td style={{ padding: "4px", color: "#bcbcbc" }}>{row.index}</td>
//                   <td style={{ padding: "4px", color: "#00ff41" }}>{row.S1?.toFixed(4)}</td>
//                   <td style={{ padding: "4px", color: "#ff0080" }}>{row.S2?.toFixed(4)}</td>
//                   <td style={{ padding: "4px", color: "#1E90FF" }}>{row.V1?.toFixed(4)}</td>
//                   <td style={{ padding: "4px", color: "#FFA500" }}>{row.V2?.toFixed(4)}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* You can integrate your Electrical signal graphs and data tables here as before */}

//     </div>
//   );
// };

// export default App;
