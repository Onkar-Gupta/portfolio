/* ============================================================
   CONTENT.JS: all the words on the site
   Source of truth: 01_CV_Optimization/References_Samples/master-cv.json (v0.6).
   Rewritten 10 Nov 2026 to follow it. Project entries for the PPE repo,
   the secure RAG and sponsor-scout come from the verified project notes
   (CLAUDE.md, P3_CV_Bullets_Draft.md, P4_CV_Bullets_Draft.md) because
   master-cv.json does not hold them yet.
   Rules: UK English, no em dashes, no AWS, only numbers that exist in a
   report or README. Anything still unknown is left out, not guessed.
   `points` are the bullet points shown under a card.
   ============================================================ */

const CONTENT = {

  meta: {
    name: "Onkar Gupta",
    shortName: "onkar",                        // used in nav logo
    role: "Computer Vision & AI Engineer",
    email: "onkar.gupta.ai@gmail.com",
    location: "Coventry, UK",
    year: "2026",
    resumeUrl: "#",                            // add the CV PDF link once Onkar has checked the PDF
  },

  nav: [
    { label: "data",         href: "#about" },
    { label: "architecture", href: "#skills" },
    { label: "training",     href: "#journey" },
    { label: "outputs",      href: "#projects" },
    { label: "evaluation",   href: "#achievements" },
    { label: "deploy",       href: "#contact" },
  ],

  /* ---------- EPOCH 00 · THE MIND (3D brain hero) ---------- */
  hero: {
    kicker: "epoch 00 · you are entering a mind",
    title: "Onkar Gupta",
    subtitle: "Computer vision and applied AI engineer. MSc Applied AI, University of Warwick.",
    tagline: "Computer vision, tested before it is trusted.",
    scrollHint: "scroll to dive in ↓",
  },

  /* ---------- THE BOOT: computer + terminal (types out before the eject) ---------- */
  boot: {
    terminal: [
      { text: "$ whoami", cls: "cmd" },
      { text: "Onkar Gupta | computer vision & AI | open_to_work = True", cls: "ok" },
      { text: "$ ls ./mind", cls: "cmd" },
      { text: "data/  architecture/  training/  outputs/  evaluation/  deployment/", cls: "out" },
      { text: "$ ./eject.sh --visitor you", cls: "cmd" },
      { text: "spawning process ......... PID 042", cls: "dim" },
      { text: "> ejecting...", cls: "ok" },
    ],
  },

  /* ---------- EPOCH 01 · THE DATA (about) ---------- */
  about: {
    id: "about", num: "01", tag: "the data",
    title: "Every model is only as good as its data.",
    narrative: "Here's mine.",
    hook: "I write the pass marks before I run anything, and I publish the results that miss them.",
    egg: "",
    paragraphs: [
      "I'm Onkar, an MSc Applied AI graduate from WMG, University of Warwick. I build computer-vision and machine-learning systems, and I test them against protocols written before the results exist.",
      "At Adani AI Labs I built multi-modal sensing pipelines that combine RGB and thermal imaging for point-of-sale monitoring and drone surveillance across multiple sites. My dissertation benchmarked YOLOv8, YOLO11 and YOLO26 for PPE compliance detection, and found that dataset shift mattered more than architecture.",
      "I'm looking for a Computer Vision or Applied AI Engineer role in the UK.",
    ],
    points: [
      "Object detection, thermal imaging and recommender systems",
      "Pre-registered evaluations, with misses reported as they came out",
      "Five released projects, each with tests, CI and a public repo",
    ],
    stats: [
      { value: "MSc",  label: "Applied AI, WMG, University of Warwick" },
      { value: "2",    label: "AI and data science internships" },
      { value: "5",    label: "Released projects on GitHub" },
    ],
  },

  /* ---------- EPOCH 02 · THE ARCHITECTURE (skills) ---------- */
  skills: {
    id: "skills", num: "02", tag: "the architecture",
    title: "Layers, weights, and everything in between.",
    narrative: "The stack this model runs on.",
    egg: "",
    groups: [
      { title: "input layer · computer vision",  items: ["Object Detection (YOLO v8, v11, v26)", "Image Classification", "Thermal Imaging", "OpenCV", "Ultralytics"] },
      { title: "hidden layer · deep learning",   items: ["PyTorch", "TensorFlow", "scikit-learn", "Recommender Systems (SVD, BPR loss)", "Precision@K, Recall@K, NDCG@K"] },
      { title: "hidden layer · data",            items: ["Statistical Analysis", "Data Mining", "NumPy", "SciPy", "Pandas", "Matplotlib"] },
      { title: "output layer · engineering",     items: ["Python", "SQL", "C++", "JavaScript", "FastAPI", "Docker", "GitHub Actions (CI)", "pytest", "Git/GitHub"] },
    ],
    marquee: ["COMPUTER VISION", "OBJECT DETECTION", "DEEP LEARNING", "PYTORCH", "THERMAL IMAGING", "DATA SCIENCE"],
  },

  /* ---------- EPOCH 03 · THE TRAINING ARC (journey) ---------- */
  journey: {
    id: "journey", num: "03", tag: "the training arc",
    title: "Gradient descent, but make it a life.",
    narrative: "Four epochs so far. The loss went down each time.",
    egg: "",
    epochs: [
      {
        epoch: "epoch 04", loss: "loss: 0.41",
        date: "2025 to 2026",
        heading: "MSc, Applied Artificial Intelligence",
        org: "WMG, University of Warwick, UK",
        desc: "Dissertation: Benchmarking Modern Object Detectors for PPE-Compliance Detection.",
        points: [
          "Modules: AI & Deep Learning, Applied Statistics for AI, AI for Industry, Fundamentals of AI & Data Mining",
          "Compared YOLOv8n, YOLO11n and YOLO26n over 18 training runs on two datasets, 9,400+ images in total",
        ],
      },
      {
        epoch: "epoch 03", loss: "loss: 0.78",
        date: "Nov 2024 to May 2025",
        heading: "Computer Vision Intern",
        org: "Sirius Digitech (Adani Group and IHC joint venture), Adani AI Labs, India",
        desc: "Computer-vision pipelines across several Adani businesses.",
        points: [
          "Built a model that flags suspicious transactions at airport retail outlets, detecting sales-record discrepancies",
          "Developed object-detection pipelines on drone video for Adani Defence and Aerospace, and thermal-image processing for AESL, combining RGB and thermal feeds for low visibility",
          "Prototyped a 2D-to-3D drone-image reconstruction tool with a modular GUI for Adani Total Gas",
          "Reworked model pipelines on own initiative to reach near real-time inference",
        ],
      },
      {
        epoch: "epoch 02", loss: "loss: 1.40",
        date: "Jun 2023 to Jan 2024",
        heading: "Data Science Intern",
        org: "Ardent Computech Pvt. Ltd., India",
        desc: "Heart-failure prediction on a public clinical dataset.",
        points: [
          "Built and compared logistic regression, random forest and XGBoost classifiers in Python with scikit-learn",
          "Used feature-importance analysis to show the strongest risk factors",
        ],
      },
      {
        epoch: "epoch 01", loss: "loss: 2.35",
        date: "2021 to 2025",
        heading: "B.Tech, Computer Science (Data Science)",
        org: "The Heritage Institute of Technology, India",
        desc: "Specialisation in Data Science.",
        points: [
          "Data Structures & Algorithms, Machine Learning, Data Mining, Artificial Intelligence, Database Management Systems, Statistics",
        ],
      },
    ],
  },

  /* ---------- EPOCH 04 · THE OUTPUTS (projects) ---------- */
  projects: {
    id: "projects", num: "04", tag: "the outputs",
    title: "What the model produces.",
    narrative: "Predictions are cheap. Shipped things aren't.",
    egg: "",
    items: [
      {
        num: "001",
        key: "0.88 to 0.90 mAP50 · 18 runs",
        album: { big: "0.88 to 0.90", unit: "mAP50, CHV test split" },
        title: "PPE Compliance Detection (MSc dissertation)",
        desc: "A benchmark of three YOLO detectors on two public safety datasets, plus a zone monitor.",
        points: [
          "18 training runs on SH17 and CHV, 9,400+ images; CHV-trained models reach 0.88 to 0.90 mAP50 on the CHV test split",
          "Architecture made no statistically significant difference (smallest Holm-adjusted p of 0.15); dataset shift did the damage, with cross-dataset drops of 0.35 to 0.40 mAP50",
          "199 tests, CI, a replay page and a v1.0.0 release",
        ],
        tags: ["Python", "PyTorch", "Ultralytics", "OpenCV", "SciPy"],
        links: [
          { label: "github", href: "https://github.com/Onkar-Gupta/ppe-compliance-detection" },
          { label: "replay", href: "https://onkar-gupta.github.io/ppe-compliance-detection/" },
        ],
      },
      {
        num: "002",
        key: "19 fps on a laptop CPU",
        album: { big: "19 fps", unit: "on a laptop CPU, 1080p" },
        title: "Object Tracking Counter",
        desc: "A command-line people counter with line crossing, built and measured against MOT17.",
        points: [
          "YOLOX on ONNX Runtime with ByteTrack; 19 fps on a laptop CPU at 1080p",
          "146 true crossings on three static scenes: precision 0.91, recall 0.47",
          "82% of crossings by clearly visible people counted, but only 9% by people under half visible",
          "72 tests, CI, Docker, release v1.0.0",
        ],
        tags: ["YOLOX", "ONNX Runtime", "ByteTrack", "PyTorch", "Docker"],
        links: [
          { label: "github", href: "https://github.com/Onkar-Gupta/object-tracking-counter" },
          { label: "demo", href: "https://huggingface.co/spaces/Onkar-Gupta-HF/track-counter" },
        ],
      },
      {
        num: "003",
        key: "0 forbidden chunks in 480 runs",
        album: { big: "0", unit: "forbidden chunks in 480 retrieval runs" },
        title: "Ginger & Simba: secure document Q&A",
        desc: "A local question-answering service where access control runs inside the vector search.",
        points: [
          "0 forbidden chunks in the model's context across 480 retrieval runs and 150 answer runs",
          "Prompt-only access control let 27 of 30 cross-group answers cite forbidden chunks, against 0 of 30 with the in-query filter",
          "0.875 citation accuracy (35 of 40), 2.5 s median answer on a laptop GPU",
          "A search-timing check failed its own rule and is reported as failed",
        ],
        tags: ["Chroma", "Ollama", "FastAPI", "SQLite", "Docker"],
        links: [
          { label: "github", href: "https://github.com/Onkar-Gupta/rag-secure-retrieval" },
          { label: "replay", href: "https://onkar-gupta.github.io/rag-secure-retrieval/" },
        ],
      },
      {
        num: "004",
        key: "0.993 vs 0.736 field accuracy",
        album: { big: "0.993", unit: "mean field accuracy, vs 0.736 prompt-only" },
        title: "sponsor-scout: fine-tuning a small model on UK job adverts",
        desc: "Phi-4-mini fine-tuned with QLoRA to return ten fields as schema-valid JSON.",
        points: [
          "On 50 held-out synthetic adverts: 0.993 mean field accuracy against 0.736 for a five-example prompt",
          "Invented values 0.000 against 0.342; no loss of general ability (MMLU 0.629 against 0.631)",
          "On 10 real LinkedIn adverts, accuracy fell to 0.700, and the gap is reported",
        ],
        tags: ["PyTorch", "Transformers", "PEFT", "TRL", "Docker"],
        links: [
          { label: "github", href: "https://github.com/Onkar-Gupta/sponsor-scout" },
          { label: "replay", href: "https://onkar-gupta.github.io/sponsor-scout/" },
        ],
      },
      {
        num: "005",
        key: "Precision@10 0.213 vs 0.171",
        album: { big: "0.213", unit: "Precision@10, vs 0.171 SVD baseline" },
        title: "Recommendation Engine (TensorFlow rebuild)",
        desc: "A recommender rebuilt with a ranking loss and measured on MovieLens 100K.",
        points: [
          "Beats a scikit-learn SVD baseline on every ranking metric: Precision@10 0.213 against 0.171, NDCG@10 0.296 against 0.225",
          "Caught a model that recommended only 32 of 1,682 films; a coverage metric and a sweep lifted coverage to 24.4%",
          "Server memory cut from about 464 MB to 116 MB by scoring with NumPy; 50 tests, CI, Docker",
        ],
        tags: ["TensorFlow", "FastAPI", "NumPy", "Docker", "GitHub Actions"],
        links: [
          { label: "github", href: "https://github.com/Onkar-Gupta/recommendation-engine" },
          { label: "demo", href: "https://huggingface.co/spaces/Onkar-Gupta-HF/recommendation-engine" },
        ],
      },
      {
        num: "006",
        key: "ongoing research",
        album: { big: "ongoing", unit: "crop growth-stage research" },
        title: "Intelligent Crop Growth-Stage Identification",
        desc: "Ongoing research: a YOLO-based model that classifies fruit and identifies crop growth stages.",
        points: [
          "Focus on field-ready accuracy; results to be added when the paper is ready",
        ],
        tags: ["YOLO", "Computer Vision"],
        links: [],
      },
    ],
  },

  /* ---------- EPOCH 05 · THE EVALUATION (certifications) ---------- */
  achievements: {
    id: "achievements", num: "05", tag: "the evaluation",
    title: "Benchmarks passed.",
    narrative: "External validation, because self-reported metrics don't count.",
    egg: "",
    items: [
      { icon: "★", title: "Advanced Certification in Data Science & AI", desc: "IIT Roorkee and Government of India, 2025." },
      { icon: "▲", title: "McKinsey Forward Programme", desc: "McKinsey.org, 2026." },
      { icon: "◆", title: "Building Trustworthy AI Enterprise Solutions", desc: "IBM SkillsBuild, 2026." },
      { icon: "●", title: "More from IBM SkillsBuild, Ardent and Udemy", desc: "Retrieval-Augmented Generation, Embeddings, AI Fundamentals, Generative AI, Data Science & Machine Learning, Python Programming Bootcamp." },
    ],
  },

  /* ---------- EPOCH 06 · DEPLOYMENT (contact) ---------- */
  contact: {
    id: "contact", num: "06", tag: "deployment",
    title: "Training complete.",
    narrative: "The run is over. I'm looking for a Computer Vision or Applied AI Engineer role in the UK.",
    egg: "",
    ctaLabel: "model.deploy( your_team )",
    socials: [
      { label: "github",    href: "https://github.com/Onkar-Gupta" },
      { label: "linkedin",  href: "https://www.linkedin.com/in/onkar-gupta-ai" },
      { label: "email",     href: "mailto:onkar.gupta.ai@gmail.com" },
    ],
  },

  footer: "inference complete · designed & built by Onkar Gupta · © 2026",
};
