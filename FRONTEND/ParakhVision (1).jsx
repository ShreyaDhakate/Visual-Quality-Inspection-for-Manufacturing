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
    document.getElementById("analyze")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToId = (id) => (e) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
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
          <a href="#home" style={styles.navLink} onClick={scrollToId("home")}>Home</a>
          <a href="#analyze" style={styles.navLink} onClick={scrollToId("analyze")}>Inspect</a>
          <a href="#how" style={styles.navLink} onClick={scrollToId("how")}>Workflow</a>
        </div>
        <button style={styles.navBtn} onClick={scrollToAnalyze}>Try It</button>
      </nav>

      {/* HERO */}
      <section id="home" style={styles.hero}>
        <div style={styles.heroContent}>
          <HeroGraphic />
          <div style={styles.heroActions}>
            <button style={styles.btnPrimary} onClick={scrollToAnalyze}>
              Start Inspection →
            </button>
            <a style={styles.btnGhost} href="#how" onClick={scrollToId("how")}>
              How It Works ↓
            </a>
          </div>
        </div>
        <div style={styles.heroWorkflow} id="how" className="pv-hero-workflow">
          <WfStep n="01" stage="capture" title="Capture" text="A camera image of the part enters the pipeline, uploaded or pulled from the line." delay="0.15s" />
          <WfStep n="02" stage="preprocess" title="Preprocess" text="The frame is normalized and cropped so the model sees the part consistently." delay="0.4s" />
          <WfStep n="03" stage="detect" title="Detect" text="The vision model scans for cracks, scratches, missing parts, and misalignment." delay="0.65s" />
          <WfStep n="04" stage="report" title="Report" text="A pass/fail result is stamped with defect type, location, and confidence." delay="0.9s" last />
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

      <footer style={styles.footer}>
        <div style={styles.footerBrand}>ParakhVision — AI-powered visual inspection for manufacturing lines</div>
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

function HeroGraphic() {
  return (
    <svg
      width="100%"
      height="auto"
      viewBox="0 0 480 300"
      style={styles.heroGraphic}
      role="img"
      aria-label="Illustration of an AI camera scanning a manufactured part for defects"
    >
      <defs>
        <radialGradient id="hgGlow" cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor="rgba(232,163,61,0.16)" />
          <stop offset="100%" stopColor="rgba(232,163,61,0)" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="480" height="300" fill="url(#hgGlow)" />

      {/* frame / panel */}
      <rect x="30" y="24" width="420" height="252" rx="8" fill="var(--dark-bg-2)" stroke="var(--dark-line)" strokeWidth="1.4" />

      {/* camera unit */}
      <g>
        <rect x="205" y="46" width="70" height="34" rx="5" fill="var(--dark-bg)" stroke="var(--amber)" strokeWidth="1.6" />
        <circle cx="240" cy="63" r="10" fill="none" stroke="var(--amber)" strokeWidth="1.8" />
        <circle cx="240" cy="63" r="3.4" fill="var(--amber)" className="pv-thumb-flash" />
        <rect x="228" y="80" width="24" height="8" fill="var(--dark-bg)" stroke="var(--amber-deep)" strokeWidth="1.2" />
      </g>

      {/* scan beam */}
      <path d="M215 88 L150 190 L330 190 Z" fill="rgba(232,163,61,0.07)" stroke="var(--amber-deep)" strokeWidth="1" strokeDasharray="4 4" />
      <line x1="150" y1="120" x2="330" y2="120" stroke="var(--amber)" strokeWidth="1.6" className="pv-thumb-scanline" opacity="0.85" />

      {/* inspected part */}
      <g transform="translate(240 210)">
        <rect x="-70" y="-34" width="140" height="68" rx="6" fill="var(--dark-bg)" stroke="var(--dark-line)" strokeWidth="1.4" />
        <circle cx="-34" cy="0" r="14" fill="none" stroke="var(--dark-dim)" strokeWidth="1.6" />
        <rect x="-4" y="-16" width="60" height="10" fill="none" stroke="var(--dark-dim)" strokeWidth="1.4" />
        <rect x="-4" y="4" width="60" height="10" fill="none" stroke="var(--dark-dim)" strokeWidth="1.4" />

        {/* defect bounding box drawn on the part */}
        <rect x="14" y="-24" width="34" height="22" fill="none" stroke="var(--fail)" strokeWidth="1.6" strokeDasharray="112" className="pv-thumb-box-in" />
      </g>

      {/* pass/fail readout chip */}
      <g transform="translate(360 210)" className="pv-thumb-stamp-in" style={{ transformOrigin: "360px 210px" }}>
        <rect x="-34" y="-16" width="68" height="32" rx="4" fill="none" stroke="var(--fail)" strokeWidth="2" />
        <text x="0" y="5" textAnchor="middle" fontFamily={FONT_MONO} fontSize="13" fontWeight="700" fill="var(--fail)">
          FAIL
        </text>
      </g>

      {/* connecting circuit dots */}
      <circle cx="100" cy="60" r="2.4" fill="var(--amber-deep)" />
      <circle cx="100" cy="60" r="2.4" fill="var(--amber-deep)">
        <animate attributeName="opacity" values="0.25;1;0.25" dur="2.4s" repeatCount="indefinite" />
      </circle>
      <circle cx="380" cy="90" r="2.4" fill="var(--amber-deep)">
        <animate attributeName="opacity" values="1;0.25;1" dur="2.1s" repeatCount="indefinite" />
      </circle>
      <path d="M60 60 H100 M380 90 H420" stroke="var(--dark-line)" strokeWidth="1" />
    </svg>
  );
}

function WfStep({ n, title, text, delay, last, stage }) {
  return (
    <div className="pv-wf-step" style={{ ...styles.wfStep, animationDelay: delay }}>
      <div style={styles.wfMarker}>
        <span style={styles.wfDot}>{n}</span>
        {!last && <span style={styles.wfConnector} />}
      </div>
      <div style={{ ...styles.wfBodyRow, paddingBottom: last ? 0 : 30 }}>
        <WfThumb stage={stage} />
        <div>
          <h4 style={styles.wfH4}>{title}</h4>
          <p style={styles.wfP}>{text}</p>
        </div>
      </div>
    </div>
  );
}

function WfThumb({ stage }) {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" style={styles.wfThumb}>
      <rect x="6" y="6" width="44" height="44" rx="4" fill="var(--dark-bg-2)" stroke="var(--dark-line)" strokeWidth="1.4" />

      {stage === "capture" && (
        <>
          <path
            d="M15 20h4l2-3h14l2 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H15a2 2 0 0 1-2-2V22a2 2 0 0 1 2-2z"
            fill="none"
            stroke="var(--amber)"
            strokeWidth="1.5"
          />
          <circle cx="28" cy="30" r="6" fill="none" stroke="var(--amber)" strokeWidth="1.5" />
          <circle cx="28" cy="30" r="2.2" fill="var(--amber)" className="pv-thumb-flash" />
        </>
      )}

      {stage === "preprocess" && (
        <>
          <rect x="12" y="12" width="32" height="32" fill="none" stroke="var(--dark-dim)" strokeWidth="1" strokeDasharray="3 3" />
          <rect
            x="16"
            y="16"
            width="24"
            height="24"
            fill="none"
            stroke="var(--amber-deep)"
            strokeWidth="1.6"
            strokeDasharray="6 4"
            className="pv-thumb-dash"
          />
          <path
            d="M11 11h6M11 11v6M45 11h-6M45 11v6M11 45h6M11 45v-6M45 45h-6M45 45v-6"
            stroke="var(--amber)"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}

      {stage === "detect" && (
        <>
          <rect x="17" y="19" width="22" height="17" fill="none" stroke="var(--fail)" strokeWidth="1.6" strokeDasharray="120" className="pv-thumb-box-in" />
          <clipPath id="wfThumbClip">
            <rect x="9" y="9" width="38" height="38" rx="2" />
          </clipPath>
          <line x1="9" y1="9" x2="47" y2="9" stroke="var(--amber)" strokeWidth="1.8" className="pv-thumb-scanline" clipPath="url(#wfThumbClip)" />
        </>
      )}

      {stage === "report" && (
        <g className="pv-thumb-stamp-in" style={{ transformOrigin: "28px 28px" }}>
          <rect x="14" y="21" width="28" height="15" rx="2" fill="none" stroke="var(--pass)" strokeWidth="2" />
          <path d="M19 28.5l4.5 4.5 10-10" fill="none" stroke="var(--pass)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </svg>
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
  @keyframes pv-wf-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .pv-wf-step { animation-name: pv-wf-in; animation-duration: 0.6s; animation-timing-function: ease; animation-fill-mode: forwards; }
  @keyframes pv-thumb-flash { 0%, 100% { opacity: 0.25; } 50% { opacity: 1; } }
  .pv-thumb-flash { animation: pv-thumb-flash 1.8s ease-in-out infinite; }
  @keyframes pv-thumb-dash { to { stroke-dashoffset: -20; } }
  .pv-thumb-dash { animation: pv-thumb-dash 1.4s linear infinite; }
  @keyframes pv-thumb-box-in { 0% { stroke-dashoffset: 120; opacity: 0; } 60% { opacity: 1; } 100% { stroke-dashoffset: 0; opacity: 1; } }
  .pv-thumb-box-in { animation: pv-thumb-box-in 2.2s ease-in-out infinite; }
  @keyframes pv-thumb-scanline { 0% { transform: translateY(0); } 100% { transform: translateY(38px); } }
  .pv-thumb-scanline { animation: pv-thumb-scanline 1.6s ease-in-out infinite alternate; }
  @keyframes pv-thumb-stamp-in { 0%, 55% { transform: scale(0.5) rotate(-14deg); opacity: 0; } 75% { transform: scale(1.12) rotate(-6deg); opacity: 1; } 100% { transform: scale(1) rotate(-6deg); opacity: 1; } }
  .pv-thumb-stamp-in { animation: pv-thumb-stamp-in 2.6s ease-in-out infinite; }
  @media (max-width: 900px) {
    .pv-workspace { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 840px) {
    .pv-nav-links { display: none !important; }
  }
  @media (prefers-reduced-motion: reduce) {
    .pv-wf-step { animation: none !important; opacity: 1 !important; transform: none !important; }
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
  heroGraphic: { display: "block", width: "100%", maxWidth: 480, marginBottom: 28 },
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
  heroWorkflow: { display: "flex", flexDirection: "column" },
  wfStep: { display: "flex", gap: 18, opacity: 0, transform: "translateY(16px)" },
  wfMarker: { display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 },
  wfDot: {
    width: 38,
    height: 38,
    border: "2px solid var(--amber)",
    background: "var(--dark-bg)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: FONT_MONO,
    fontWeight: 700,
    fontSize: 12,
    color: "var(--amber)",
  },
  wfConnector: { flex: 1, width: 1, minHeight: 26, background: "var(--dark-line)", marginTop: 4 },
  wfBody: {},
  wfBodyRow: { display: "flex", gap: 16, alignItems: "flex-start" },
  wfThumb: { flexShrink: 0, marginTop: 2 },
  wfH4: { fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 600, marginBottom: 5 },
  wfP: { color: "var(--dark-dim)", fontSize: 13.5, maxWidth: 340, margin: 0 },
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
  footer: {
    background: "var(--dark-bg)",
    color: "var(--dark-dim)",
    textAlign: "center",
    padding: "30px 6%",
    borderTop: "1px solid var(--dark-line)",
    fontFamily: FONT_MONO,
    fontSize: 11.5,
  },
  footerBrand: {
    color: "var(--dark-text)",
    fontWeight: 600,
    fontSize: 12.5,
    marginBottom: 8,
    letterSpacing: "0.02em",
  },
};
