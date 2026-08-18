import React, { useRef, useState, useCallback } from "react";

const DEFECT_TYPES = [
  {
    key: "scratch",
    label: "Surface scratch",
    note: "A linear surface abrasion was detected on the housing. Typically caused by handling or conveyor contact — check upstream guarding.",
  },
  {
    key: "crack",
    label: "Structural crack",
    note: "A fracture line was detected in a load-bearing area. Part should be pulled from the line and root-caused before further assembly.",
  },
  {
    key: "missing",
    label: "Missing component",
    note: "An expected fastener or sub-component was not found in its designated position. Verify the upstream placement station.",
  },
  {
    key: "misalign",
    label: "Incorrect assembly",
    note: "A component was found outside its expected tolerance window, suggesting misalignment during assembly.",
  },
];

function makePartId() {
  const n = Math.floor(1000 + Math.random() * 8999);
  return "PN-" + n + "-A";
}

export default function ParakhVision() {
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null); // holds the loaded HTMLImageElement

  const [hasImage, setHasImage] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [scanning, setScanning] = useState(false);

  const [report, setReport] = useState({
    partId: "PART ID — PENDING",
    time: "—",
    defect: "—",
    confidence: "—",
    region: "—",
    result: null, // 'pass' | 'fail' | null
  });
  const [defectNote, setDefectNote] = useState(null);
  const [logs, setLogs] = useState([]);

  const redrawBase = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }, []);

  const resetReport = useCallback((keepImage) => {
    setReport({
      partId: "PART ID — PENDING",
      time: "—",
      defect: "—",
      confidence: "—",
      region: "—",
      result: null,
    });
    setDefectNote(null);
    if (!keepImage) {
      redrawBase();
    }
  }, [redrawBase]);

  const loadImage = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        const canvas = canvasRef.current;
        const maxW = 720;
        const scale = Math.min(1, maxW / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasImage(true);
        resetReport(true);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }, [resetReport]);

  const openFileDialog = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) loadImage(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadImage(file);
  };

  const addLogRow = (id, defect, time, result) => {
    setLogs((prev) => [{ id, defect, time, result }, ...prev]);
  };

  const runInspection = () => {
    if (!imageRef.current) return;
    setScanning(true);
    resetReport(true);

    setTimeout(() => {
      setScanning(false);
      redrawBase();

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const isDefective = Math.random() < 0.6;
      const id = makePartId();
      const time = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      if (isDefective) {
        const defect =
          DEFECT_TYPES[Math.floor(Math.random() * DEFECT_TYPES.length)];
        const confidence = (82 + Math.random() * 15).toFixed(1);

        const bw = canvas.width * (0.16 + Math.random() * 0.14);
        const bh = canvas.height * (0.14 + Math.random() * 0.14);
        const bx = Math.random() * (canvas.width - bw);
        const by = Math.random() * (canvas.height - bh);

        ctx.strokeStyle = "#c24444";
        ctx.lineWidth = 2.5;
        ctx.strokeRect(bx, by, bw, bh);
        ctx.fillStyle = "rgba(194,68,68,0.14)";
        ctx.fillRect(bx, by, bw, bh);
        ctx.font = "600 11px monospace";
        ctx.fillStyle = "#c24444";
        ctx.fillText(
          defect.label.toUpperCase(),
          bx,
          by > 14 ? by - 6 : by + bh + 14
        );

        setReport({
          partId: "PART ID — " + id,
          time,
          defect: defect.label,
          confidence: confidence + "%",
          region: "x:" + Math.round(bx) + " y:" + Math.round(by),
          result: "fail",
        });
        setDefectNote({ label: defect.label, note: defect.note });
        addLogRow(id, defect.label, time, "fail");
      } else {
        const confidence = (91 + Math.random() * 8).toFixed(1);
        setReport({
          partId: "PART ID — " + id,
          time,
          defect: "None detected",
          confidence: confidence + "%",
          region: "Full frame",
          result: "pass",
        });
        setDefectNote(null);
        addLogRow(id, "None", time, "pass");
      }
    }, 1400);
  };

  const clearTray = () => {
    imageRef.current = null;
    setHasImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    resetReport(false);
  };

  const scrollToAnalyze = () => {
    document.getElementById("analyze")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={styles.root}>
      <style>{fontImport}</style>

      {/* NAV */}
      <nav style={styles.navbar}>
        <div style={styles.brand}>
          <span style={styles.mark}>PV</span> ParakhVision
        </div>
        <div style={styles.navLinks} className="pv-nav-links">
          <a href="#home" style={styles.navLink}>Home</a>
          <a href="#analyze" style={styles.navLink}>Inspect</a>
          <a href="#how" style={styles.navLink}>How It Works</a>
        </div>
        <button style={styles.navBtn} onClick={scrollToAnalyze}>Try It</button>
      </nav>

      {/* HERO */}
      <section id="home" style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.heroActions}>
            <button style={styles.btnPrimary} onClick={scrollToAnalyze}>
              Start Inspection →
            </button>
            <a style={styles.btnGhost} href="#how">
              See the Process ↓
            </a>
          </div>
        </div>
        <div style={styles.heroVisual}>
          <div style={{ ...styles.floatingChip, top: "6%", left: "-4%" }}>
            <b style={styles.chipB}>94.7%</b>
            <small style={styles.chipSmall}>Model confidence</small>
          </div>
          <div style={{ ...styles.floatingChip, bottom: "10%", right: "-6%" }}>
            <b style={styles.chipB}>Real-time</b>
            <small style={styles.chipSmall}>Per-frame analysis</small>
          </div>
          <div style={styles.heroTag}>
            <div style={styles.tagEyebrow}>Inspection Report</div>
            <h4 style={styles.tagH4}>PART ID — PN-4821-A</h4>
            <div style={styles.tagRow}><span>Inspector</span><span>AI-VISION-05</span></div>
            <div style={styles.tagRow}><span>Defect type</span><span>None detected</span></div>
            <div style={{ ...styles.tagRow, borderBottom: "none" }}>
              <span>Confidence</span><span>96.4%</span>
            </div>
            <div style={styles.stampMini}>PASS</div>
          </div>
        </div>
      </section>

      <Conveyor stroke="#3a4256" bg="var(--dark-bg)" />

      {/* ANALYZE */}
      <section id="analyze" style={{ ...styles.section, background: "var(--light-bg)", color: "var(--light-text)" }}>
        <div style={styles.sectionHeading}>
          <div style={{ ...styles.eyebrow, color: "var(--amber-deep)" }}>AI Analysis</div>
          <h2 style={styles.h2}>Run the model on a real part</h2>
          <p style={{ ...styles.sectionP, color: "var(--light-dim)" }}>
            Load a product image and run inspection. Swap this demo logic for your trained CV model or API when ready.
          </p>
        </div>

        <div style={styles.workspace} className="pv-workspace">
          <div style={styles.panel}>
            <div style={styles.panelHead}>
              <h3 style={styles.panelH3}>Inspection Tray</h3>
              <span style={styles.tagPill}>CAM-05 · RGB</span>
            </div>

            <div
              style={{
                ...styles.dropzone,
                borderColor: dragging ? "var(--amber-deep)" : "var(--light-line)",
                background: dragging ? "rgba(232,163,61,0.04)" : styles.dropzone.background,
              }}
              onClick={openFileDialog}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") openFileDialog();
              }}
              tabIndex={0}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
              onDrop={handleDrop}
            >
              {!hasImage && (
                <div>
                  <div style={styles.dzIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
                      <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
                    </svg>
                  </div>
                  <div style={styles.dzLabel}>
                    <b style={{ color: "var(--light-text)" }}>Click to load part image</b>
                    <br />or drag and drop · JPG, PNG
                  </div>
                </div>
              )}

              <div style={{ display: hasImage ? "block" : "none", position: "relative", width: "100%", lineHeight: 0 }}>
                <canvas ref={canvasRef} style={{ width: "100%", height: "auto", display: "block" }} />
                {scanning && (
                  <>
                    <div style={styles.scanline} />
                    <div style={styles.analyzingBadge}>ANALYZING — RUNNING DETECTION</div>
                  </>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </div>

            <div style={styles.trayActions}>
              <button
                style={{ ...styles.btn, ...styles.btnSolid, opacity: !hasImage || scanning ? 0.35 : 1, cursor: !hasImage || scanning ? "not-allowed" : "pointer" }}
                disabled={!hasImage || scanning}
                onClick={runInspection}
              >
                Run Inspection
              </button>
              <button
                style={{ ...styles.btn, opacity: !hasImage ? 0.35 : 1, cursor: !hasImage ? "not-allowed" : "pointer" }}
                disabled={!hasImage}
                onClick={clearTray}
              >
                Clear Tray
              </button>
            </div>

            <div style={styles.legend}>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendSwatch, borderColor: "var(--fail)", background: "rgba(194,68,68,0.15)" }} />
                Defect region
              </div>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendSwatch, borderColor: "var(--amber-deep)", background: "transparent" }} />
                Scan pass
              </div>
            </div>
          </div>

          <div>
            <div style={styles.report}>
              <div style={styles.reportTop}>
                <p style={styles.rEyebrow}>Inspection Report</p>
                <h3 style={styles.reportH3}>{report.partId}</h3>
              </div>
              <div style={styles.fieldList}>
                <FieldRow k="Timestamp" v={report.time} />
                <FieldRow k="Inspector" v="AI-VISION-05" />
                <FieldRow k="Defect type" v={report.defect} />
                <FieldRow k="Confidence" v={report.confidence} />
                <FieldRow k="Region" v={report.region} last />
              </div>
              <div style={styles.perf} />
              <div style={styles.stampZone}>
                {!report.result && (
                  <div style={styles.stampPlaceholder}>
                    RESULT PENDING
                    <br />
                    RUN INSPECTION TO GENERATE STAMP
                  </div>
                )}
                {report.result && (
                  <div
                    style={{
                      ...styles.stamp,
                      opacity: 0.92,
                      transform: "rotate(-8deg) scale(1)",
                      color: report.result === "pass" ? "var(--pass)" : "var(--fail)",
                    }}
                  >
                    {report.result === "pass" ? "PASS" : "FAIL"}
                  </div>
                )}
              </div>
              {defectNote && (
                <div style={styles.defectNote}>
                  <b style={{ color: "var(--dark-text)" }}>{defectNote.label} detected.</b>{" "}
                  {defectNote.note}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={styles.logSection}>
          <div style={styles.logHead}>
            <h3 style={styles.logH3}>Recent Inspections</h3>
            <span style={styles.logCountText}>
              {logs.length} {logs.length === 1 ? "record" : "records"}
            </span>
          </div>
          <div style={styles.logTable}>
            <div style={{ ...styles.logRow, ...styles.logRowHead }}>
              <span>Part ID</span><span>Defect</span><span>Time</span><span>Result</span>
            </div>
            {logs.length === 0 && (
              <div style={styles.logEmpty}>No inspections run yet this session.</div>
            )}
            {logs.map((row, i) => (
              <div style={styles.logRow} key={i}>
                <span>{row.id}</span>
                <span>{row.defect}</span>
                <span>{row.time}</span>
                <span
                  style={{
                    ...styles.pill,
                    color: row.result === "pass" ? "var(--pass)" : "var(--fail)",
                    borderColor: row.result === "pass" ? "var(--pass)" : "var(--fail)",
                  }}
                >
                  {row.result.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Conveyor stroke="#ddd6c5" bg="var(--light-bg)" />

      {/* HOW IT WORKS */}
      <section id="how" style={{ ...styles.section, background: "var(--dark-bg)", color: "var(--dark-text)" }}>
        <div style={styles.sectionHeading}>
          <div style={{ ...styles.eyebrow, color: "var(--amber)" }}>Workflow</div>
          <h2 style={styles.h2}>Four stations, one pass down the line</h2>
          <p style={{ ...styles.sectionP, color: "var(--dark-dim)" }}>
            Every part moves through the same sequence, in order — the way it would on a real conveyor.
          </p>
        </div>
        <div style={styles.steps} className="pv-steps">
          <Step n="01" title="Capture" text="A camera image of the part enters the pipeline, uploaded or pulled from the line." />
          <Step n="02" title="Preprocess" text="The frame is normalized and cropped so the model sees the part consistently." />
          <Step n="03" title="Detect" text="The vision model scans for cracks, scratches, missing parts, and misalignment." />
          <Step n="04" title="Report" text="A pass/fail result is stamped with defect type, location, and confidence." />
        </div>
      </section>

      <footer style={styles.footer}>
        <span>Detection runs on-device · results are session-local</span>
      </footer>
    </div>
  );
}

function FieldRow({ k, v, last }) {
  return (
    <div style={{ ...styles.fieldRow, borderBottom: last ? "none" : styles.fieldRow.borderBottom }}>
      <span style={styles.fieldK}>{k}</span>
      <span style={styles.fieldV}>{v}</span>
    </div>
  );
}

function Step({ n, title, text }) {
  return (
    <div style={styles.step}>
      <span style={styles.stepN}>{n}</span>
      <h3 style={styles.stepH3}>{title}</h3>
      <p style={styles.stepP}>{text}</p>
    </div>
  );
}

function Conveyor({ stroke, bg }) {
  return (
    <div style={{ height: 34, position: "relative", overflow: "hidden", background: bg }}>
      <svg viewBox="0 0 1200 34" preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block" }}>
        <line x1="0" y1="17" x2="1200" y2="17" stroke={stroke} strokeWidth="1" strokeDasharray="10 8" />
      </svg>
    </div>
  );
}

const fontImport = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

  :root{
    --dark-bg: #171b24;
    --dark-bg-2: #1e2430;
    --dark-line: #2e3546;
    --dark-text: #f1eee4;
    --dark-dim: #93a0b8;
    --light-bg: #f2efe6;
    --light-panel: #fbf9f3;
    --light-line: #ddd6c5;
    --light-text: #22242b;
    --light-dim: #6c6656;
    --amber: #e8a33d;
    --amber-deep: #c67f1f;
    --pass: #3f8f5f;
    --fail: #c24444;
  }
  @keyframes pv-scan { 0% { top: 0%; } 100% { top: 100%; } }
  @media (max-width: 900px) {
    .pv-workspace { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 840px) {
    .pv-nav-links { display: none !important; }
  }
  @media (max-width: 900px) {
    .pv-steps { grid-template-columns: 1fr 1fr !important; }
  }
  @media (max-width: 520px) {
    .pv-steps { grid-template-columns: 1fr !important; }
  }
`;

const FONT_DISPLAY = "'Space Grotesk', sans-serif";
const FONT_BODY = "'Inter', sans-serif";
const FONT_MONO = "'JetBrains Mono', monospace";

const styles = {
  root: {
    fontFamily: FONT_BODY,
    lineHeight: 1.6,
    background: "var(--light-bg)",
    color: "var(--light-text)",
    minHeight: "100vh",
  },
  navbar: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    height: 112,
    padding: "0 6%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "rgba(23,27,36,0.94)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid var(--dark-line)",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 15,
    fontFamily: FONT_DISPLAY,
    fontWeight: 700,
    fontSize: 30,
    letterSpacing: "0.01em",
    color: "var(--dark-text)",
  },
  mark: {
    width: 50,
    height: 50,
    border: "2.5px solid var(--amber)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: FONT_MONO,
    fontSize: 15,
    fontWeight: 700,
    color: "var(--amber)",
  },
  navLinks: { display: "flex", gap: 38, fontSize: 16, fontWeight: 700, color: "var(--dark-dim)" },
  navLink: { color: "inherit", textDecoration: "none" },
  navBtn: {
    fontFamily: FONT_MONO,
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    padding: "14px 26px",
    background: "var(--amber)",
    color: "#1a1300",
    border: "none",
    cursor: "pointer",
  },
  hero: {
    padding: "90px 6% 70px",
    display: "grid",
    gridTemplateColumns: "1.05fr 0.95fr",
    gap: 50,
    alignItems: "center",
    background:
      "radial-gradient(700px 400px at 85% 10%, rgba(232,163,61,0.07), transparent 60%), var(--dark-bg)",
    minHeight: "calc(100vh - 112px)",
    color: "var(--dark-text)",
  },
  heroContent: {},
  heroActions: { display: "flex", gap: 14, flexWrap: "wrap" },
  btnPrimary: {
    fontFamily: FONT_MONO,
    fontSize: 12.5,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    padding: "14px 22px",
    background: "var(--amber)",
    color: "#1a1300",
    border: "none",
    fontWeight: 700,
    cursor: "pointer",
  },
  btnGhost: {
    fontFamily: FONT_MONO,
    fontSize: 12.5,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    padding: "13px 22px",
    border: "1px solid var(--dark-line)",
    color: "var(--dark-text)",
    textDecoration: "none",
  },
  heroVisual: { position: "relative", display: "flex", alignItems: "center", justifyContent: "center" },
  heroTag: {
    width: "100%",
    maxWidth: 340,
    background: "var(--light-panel)",
    color: "var(--light-text)",
    border: "1px solid var(--light-line)",
    padding: 22,
    position: "relative",
    boxShadow: "0 30px 60px rgba(0,0,0,0.35)",
    transform: "rotate(-2deg)",
  },
  tagEyebrow: {
    fontFamily: FONT_MONO,
    fontSize: 10,
    color: "var(--light-dim)",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  tagH4: { fontFamily: FONT_DISPLAY, fontSize: 16, margin: "4px 0 14px" },
  tagRow: {
    display: "flex",
    justifyContent: "space-between",
    fontFamily: FONT_MONO,
    fontSize: 11.5,
    padding: "7px 0",
    borderBottom: "1px dashed var(--light-line)",
  },
  stampMini: {
    marginTop: 16,
    display: "inline-block",
    fontFamily: FONT_DISPLAY,
    fontWeight: 700,
    fontSize: 20,
    color: "var(--pass)",
    border: "3px solid var(--pass)",
    padding: "6px 16px",
    borderRadius: 5,
    transform: "rotate(-6deg)",
  },
  floatingChip: {
    position: "absolute",
    background: "var(--dark-bg-2)",
    border: "1px solid var(--dark-line)",
    padding: "10px 14px",
    fontFamily: FONT_MONO,
    fontSize: 11,
    color: "var(--dark-text)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
  },
  chipB: { display: "block", color: "var(--amber)", fontSize: 13 },
  chipSmall: { color: "var(--dark-dim)" },
  section: { padding: "90px 6%" },
  sectionHeading: { textAlign: "center", maxWidth: 640, margin: "0 auto 46px" },
  eyebrow: { fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" },
  h2: { fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: "clamp(26px,3vw,36px)", margin: "10px 0" },
  sectionP: { fontSize: 15 },
  workspace: {
    maxWidth: 1140,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr",
    gap: 24,
    alignItems: "start",
  },
  panel: { background: "var(--light-panel)", border: "1px solid var(--light-line)", padding: 24 },
  panelHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  panelH3: { fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 600 },
  tagPill: {
    fontFamily: FONT_MONO,
    fontSize: 10.5,
    color: "var(--light-dim)",
    border: "1px solid var(--light-line)",
    padding: "3px 9px",
    letterSpacing: "0.06em",
  },
  dropzone: {
    position: "relative",
    border: "1.5px dashed var(--light-line)",
    minHeight: 320,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: 14,
    cursor: "pointer",
    background: "repeating-linear-gradient(45deg, rgba(0,0,0,0.012) 0 2px, transparent 2px 14px)",
    transition: "border-color .18s ease, background .18s ease",
  },
  dzIcon: {
    width: 44,
    height: 44,
    border: "1.5px solid var(--light-dim)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--light-dim)",
    margin: "0 auto 14px",
  },
  dzLabel: {
    fontFamily: FONT_MONO,
    fontSize: 12,
    color: "var(--light-dim)",
    textAlign: "center",
    letterSpacing: "0.03em",
  },
  scanline: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    top: 0,
    background: "linear-gradient(90deg, transparent, var(--amber-deep), transparent)",
    boxShadow: "0 0 12px 2px rgba(198,127,31,0.5)",
    animation: "pv-scan 1.5s linear infinite",
  },
  analyzingBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    fontFamily: FONT_MONO,
    fontSize: 10.5,
    background: "rgba(23,27,36,0.85)",
    color: "var(--amber)",
    border: "1px solid var(--amber-deep)",
    padding: "4px 9px",
    letterSpacing: "0.1em",
  },
  trayActions: { display: "flex", gap: 10, marginTop: 16 },
  btn: {
    fontFamily: FONT_MONO,
    fontSize: 12,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    padding: "11px 18px",
    border: "1px solid var(--light-line)",
    background: "transparent",
    color: "var(--light-text)",
  },
  btnSolid: { background: "var(--amber)", borderColor: "var(--amber)", color: "#1a1300", fontWeight: 700 },
  legend: { display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    fontFamily: FONT_MONO,
    fontSize: 10.5,
    color: "var(--light-dim)",
  },
  legendSwatch: { width: 10, height: 10, border: "1.5px solid" },
  report: { background: "var(--dark-bg-2)", color: "var(--dark-text)", border: "1px solid var(--dark-line)" },
  reportTop: { padding: "20px 22px 16px", borderBottom: "1px dashed var(--dark-line)" },
  rEyebrow: {
    fontFamily: FONT_MONO,
    fontSize: 10,
    color: "var(--dark-dim)",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
  },
  reportH3: { fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, marginTop: 4 },
  fieldList: { padding: "14px 22px" },
  fieldRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    fontFamily: FONT_MONO,
    fontSize: 12,
  },
  fieldK: { color: "var(--dark-dim)" },
  fieldV: { fontWeight: 500 },
  perf: {
    height: 10,
    backgroundImage: "radial-gradient(circle, var(--light-bg) 3px, transparent 3.5px)",
    backgroundSize: "16px 10px",
    backgroundPosition: "8px center",
  },
  stampZone: {
    position: "relative",
    padding: "24px 22px 28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 140,
  },
  stamp: {
    fontFamily: FONT_DISPLAY,
    fontWeight: 700,
    fontSize: 28,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    padding: "11px 24px",
    border: "4px solid currentColor",
    borderRadius: 6,
    transition: "opacity .18s ease, transform .28s cubic-bezier(.34,1.56,.64,1)",
  },
  stampPlaceholder: {
    fontFamily: FONT_MONO,
    fontSize: 11.5,
    color: "var(--dark-dim)",
    textAlign: "center",
    letterSpacing: "0.06em",
  },
  defectNote: {
    margin: "0 22px 20px",
    padding: "12px 14px",
    borderLeft: "3px solid var(--amber-deep)",
    background: "rgba(232,163,61,0.06)",
    fontSize: 12.5,
    lineHeight: 1.55,
    color: "var(--dark-dim)",
  },
  logSection: { maxWidth: 1140, margin: "34px auto 0" },
  logHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  logH3: { fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 600 },
  logCountText: { fontFamily: FONT_MONO, fontSize: 10.5, color: "var(--light-dim)" },
  logTable: { border: "1px solid var(--light-line)", background: "var(--light-panel)" },
  logRow: {
    display: "grid",
    gridTemplateColumns: "120px 1fr 140px 90px",
    gap: 10,
    padding: "11px 16px",
    borderBottom: "1px solid var(--light-line)",
    fontFamily: FONT_MONO,
    fontSize: 11.5,
    alignItems: "center",
  },
  logRowHead: {
    color: "var(--light-dim)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    fontSize: 10,
  },
  pill: { display: "inline-block", padding: "2px 8px", fontSize: 10.5, border: "1px solid", letterSpacing: "0.05em" },
  logEmpty: {
    padding: "24px 16px",
    textAlign: "center",
    color: "var(--light-dim)",
    fontFamily: FONT_MONO,
    fontSize: 11.5,
  },
  steps: { maxWidth: 1140, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 },
  step: { padding: 24, border: "1px solid var(--dark-line)", background: "var(--dark-bg-2)", position: "relative" },
  stepN: { fontFamily: FONT_MONO, color: "var(--amber)", fontWeight: 700, fontSize: 13 },
  stepH3: { fontFamily: FONT_DISPLAY, fontSize: 17, margin: "14px 0 6px", fontWeight: 600 },
  stepP: { color: "var(--dark-dim)", fontSize: 13.5 },
  footer: {
    background: "var(--dark-bg)",
    color: "var(--dark-dim)",
    textAlign: "center",
    padding: "30px 6%",
    borderTop: "1px solid var(--dark-line)",
    fontFamily: FONT_MONO,
    fontSize: 11.5,
  },
};
