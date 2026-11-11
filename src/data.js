import { IMG } from './images.js';
export { IMG };

/* =====================================================================
   EDIT THIS FILE: everything on the site and the chatbot reads from P.
   Empty fields are hidden automatically.
   ===================================================================== */
export const P = {
  name: 'Aman Kar',
  role: 'AI/ML Engineer',
  tagline: 'I build RAG systems, multi-agent AI and ML models that work in production.',
  photo: IMG.portrait,
  aboutPhoto: IMG.canal,
  location: 'India • Remote Worldwide',
  phone: '+91 7482095793',
  email: 'amankar125@gmail.com',
  availability: '',
  studio: { name: 'Buildlyst', url: 'https://buildlyst.in', line: 'My AI & Data Engineering Studio. We build AI agents, ML pipelines and custom data systems for businesses.' },
  heroLines: [
    'AI/ML Engineer and Founding Engineer at Codaris.in.',
    'I design agentic workflows, retrieval pipelines and ML services, then ship them behind clean APIs.',
    'Two-time Smart India Hackathon finalist who loves turning a messy idea into a working system.'
  ],
  rotating: ['RAG systems', 'multi-agent AI', 'ML models', 'AI products'],
  stats: [
    { n: 2, suffix: 'x', label: 'Smart India Hackathon finalist' },
    { n: 15, suffix: '+', label: 'National hackathons and AI contests' },
    { n: 90, suffix: '+', label: 'Public repositories on GitHub' }
  ],
  marquee: ['AI Agents', 'RAG', 'LangGraph', 'FastAPI', 'Machine Learning', 'Vector Databases', 'LLM APIs', 'MLOps', 'Production Ready'],
  about: [
    "I'm an AI/ML Engineer who turns ideas into working intelligent systems: RAG pipelines, multi-agent workflows with LangGraph, and machine learning models served through clean FastAPI backends.",
    "Right now I'm the Founding AI/ML & Solutions Engineer at Codaris.in, leading delivery of AI and web solutions for clients. I completed my B.Tech in Computer Science in 2026 and have been a Smart India Hackathon finalist twice."
  ],
  facts: [['Focus', 'RAG, agentic AI and ML systems'], ['Currently', 'Founding AI/ML & Solutions Engineer, Codaris.in'], ['Education', 'B.Tech CSE, AKTU (2022 - 2026)'], ['Hackathons', 'SIH finalist 2023 and 2025']],
  experience: [
    { role: 'Founder', org: 'Buildlyst · AI & Data Engineering Studio', period: '', points: ['My studio for AI agents, machine learning pipelines and custom data systems built for businesses'] },
    { role: 'Founding AI/ML & Solutions Engineer', org: 'Codaris.in · Remote', period: 'June 2026 – Present', points: ['Lead end-to-end development and delivery of AI/ML and web solutions, integrating LLMs, APIs, automation workflows and data-driven systems into client-facing applications', 'Translate business requirements into technical solutions, managing technical discussions, documentation and coordination with freelance developers'] },
    { role: 'AI/ML Engineer Intern', org: '3FI Tech · Noida', period: 'March 2026 – June 2026', points: ['Built Python data processing and automation workflows for lead collection, cleaning, enrichment, validation and analysis', 'Built data ingestion and preprocessing pipelines to prepare datasets for analytics and ML', 'Developed and evaluated ML models through feature engineering, training, tuning and performance evaluation', 'Built FastAPI-based APIs and AI automation workflows to integrate ML and LLM services with internal business processes'] }
  ],
  education: [{ role: 'B.Tech, Computer Science Engineering', org: 'Abdul Kalam Technical University', period: 'Sep 2022 – May 2026', desc: '' }],
  skills: [
    { group: 'AI and Generative AI', items: ['LLM APIs', 'RAG', 'LangChain', 'LangGraph', 'Agentic AI', 'Multi-Agent Systems', 'Tool Calling', 'Prompt Engineering', 'Embeddings', 'Pinecone', 'FAISS', 'ChromaDB', 'Guardrails'] },
    { group: 'Machine Learning and Data Science', items: ['Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow', 'EDA', 'Feature Engineering', 'Regression', 'Classification', 'Clustering', 'Ensemble Learning', 'ANN', 'RNN (LSTM, GRU)', 'Model Evaluation'] },
    { group: 'Backend and Data', items: ['Python', 'SQL', 'PostgreSQL', 'MySQL', 'FastAPI', 'REST APIs', 'Async Programming', 'Hugging Face', 'Streamlit'] },
    { group: 'MLOps and Deployment', items: ['Docker', 'Git', 'GitHub Actions', 'CI/CD', 'API Design', 'Model Deployment', 'Cloud Deployment'] }
  ],
  projects: [
    { title: 'TripMate', aliases: ['tripmate', 'trip mate', 'travel'], kind: 'Multi-agent AI',
      desc: 'A multi-agent travel planner on LangGraph with specialised agents for flights, hotels and itineraries.',
      points: ['Orchestrates agents for flight research, hotel discovery, itinerary planning and response generation', 'Stateful workflows with controlled tool calling (AviationStack, Tavily, LLM APIs)', 'FastAPI backend with PostgreSQL conversation persistence for personalised planning'],
      tags: ['Python', 'LangGraph', 'FastAPI', 'Groq', 'PostgreSQL'], live: '', code: 'https://github.com/Amankar003/TripMate' },
    { title: 'AI Medical Assistant', aliases: ['medical', 'disease', 'medibot'], kind: 'RAG and ML',
      desc: 'A RAG chatbot with Pinecone retrieval, combined with a multi-class disease prediction model.',
      points: ['End-to-end RAG pipeline: ingestion, chunking, embeddings, Pinecone indexing and grounded answers', 'LangChain prompt templates and retrieval workflows for context-aware responses', 'Retrieval guardrails that reduce unsupported LLM answers'],
      tags: ['Python', 'LangChain', 'Pinecone', 'LLM APIs'], live: '', code: 'https://github.com/Amankar003?tab=repositories&q=medical' },
    { title: 'Agentic AI RAG Chatbot', aliases: ['agentic', 'ebook'], kind: 'RAG',
      desc: 'A chatbot that answers strictly from an Agentic AI eBook, orchestrated with LangGraph on top of Pinecone.',
      points: ['PDF extraction, chunking and sentence-transformer embeddings stored in Pinecone', 'LangGraph retrieve-then-generate workflow with Llama 3.3 70B on Groq', 'Similarity scores returned with each grounded answer, served via FastAPI'],
      tags: ['LangGraph', 'Pinecone', 'Groq', 'FastAPI'], live: '', code: 'https://github.com/Amankar003/RAG-for-Agentic-AI' },
    { title: 'Cost-Efficient RAG', aliases: ['cost efficient', 'lancedb'], kind: 'RAG',
      desc: 'A production-style RAG system built on an embedded LanceDB vector store, designed to keep running costs low.',
      points: ['Embedded vector database on local disk, no separate server to run', 'FastAPI upload and ingest pipeline with text extraction and chunking', 'BGE embeddings with Groq for fast LLM inference'],
      tags: ['LanceDB', 'FastAPI', 'BGE', 'Groq'], live: '', code: 'https://github.com/Amankar003/Cost_Efficient-RAG' },
    { title: 'LLM-as-Judge Evaluation', aliases: ['judge', 'evaluation'], kind: 'LLM evaluation',
      desc: 'A framework that uses an LLM as a judge to compare and score AI model outputs and detect bias.',
      points: ['Pairwise comparison of answers across a JSON test suite', 'Rubric scoring for correctness, faithfulness, completeness, tone and safety', 'Bias checks (position, verbosity, self-enhancement) plus a report with token and cost logs'],
      tags: ['Python', 'Groq', 'Pydantic', 'Evaluation'], live: '', code: 'https://github.com/Amankar003/LLM-as-Judge-Evaluation' },
    { title: 'LeadPilot AI', aliases: ['leadpilot', 'lead pilot', 'lead gen'], kind: 'AI platform',
      desc: 'An AI-powered lead generation and business-intelligence platform for agencies and growth teams.',
      points: ['Lead discovery from Google Maps and bulk SERP scraping, plus CSV and Excel imports', 'AI analysis of websites and digital presence to surface pain points', 'Ready-to-use outreach content and campaign-based lead management'],
      tags: ['Python', 'LLMs', 'Web scraping', 'Automation'], live: '', code: 'https://github.com/Amankar003/LeadPilot-V2' },
    { title: 'Predictive Maintenance', aliases: ['predictive', 'maintenance', 'equipment'], kind: 'Machine learning',
      desc: 'An end-to-end ML project that forecasts industrial equipment failures from sensor data, with a dashboard.',
      points: ['100,000+ synthetic sensor records across 50 machines', 'EDA, lag and rolling features, SMOTE for class imbalance and hyperparameter tuning', 'Model comparison with SHAP explainability and a Streamlit dashboard'],
      tags: ['XGBoost', 'SHAP', 'Streamlit', 'Python'], live: '', code: 'https://github.com/Amankar003/Industrial-Equipment-Failure-Forecasting' },
    { title: 'Credit Card Churn Prediction', aliases: ['churn'], kind: 'Deep learning',
      desc: 'An ANN built with TensorFlow to predict customer churn, deployed as an interactive Streamlit app.',
      points: ['Data cleaning, EDA, feature engineering, categorical encoding and scaling', 'ANN developed and tuned in TensorFlow, evaluated with classification metrics', 'Streamlit app for real-time customer risk prediction'],
      tags: ['Python', 'TensorFlow', 'Scikit-learn', 'Streamlit'], live: '', code: 'https://github.com/Amankar003/Credit-Card-Customer-Churn-Prediction-using-ANN' }
  ],
  services: [
    { title: 'AI agents and RAG', icon: 'agent', desc: 'Retrieval pipelines, multi-agent workflows and tool-calling systems with LangChain and LangGraph, kept grounded with guardrails.', tags: ['LangGraph', 'RAG', 'Pinecone'] },
    { title: 'ML models and data pipelines', icon: 'chart', desc: 'From EDA and feature engineering to tuned, properly evaluated models, built on clean ingestion and preprocessing pipelines.', tags: ['Scikit-learn', 'TensorFlow', 'Pandas'] },
    { title: 'APIs and deployment', icon: 'cloud', desc: 'FastAPI services, Docker, CI/CD with GitHub Actions and cloud deployment, so models and agents run behind reliable APIs.', tags: ['FastAPI', 'Docker', 'CI/CD'] }
  ],
  github: 'https://github.com/Amankar003',
  githubRepos: 'https://github.com/Amankar003?tab=repositories',
  githubUser: 'Amankar003',
  moreRepos: [
    ['Multi_Agent_Research_Assistant', 'Python'], ['Sales_CoPilot_Backend', 'Python'], ['Sales_CoPilot_Frontend', 'TypeScript'], ['Shivay-Realty-Backend', 'Python'],
    ['FarmerSathi', 'TypeScript'], ['Nomadifly', 'JavaScript'], ['Whatsapp-Automation-', 'Python'], ['Calling_Agent001', 'Python'], ['Resume-Analyzer', 'Python'],
    ['Stock-Vision-AI', 'Python'], ['Inventory_Mgmt_backend', 'Python'], ['MailForge', 'HTML']
  ],
  certifications: [
    { title: 'BCG X: Data Science Job Simulation', desc: 'Business understanding, problem framing and data-driven recommendation' },
    { title: 'Accenture: Data Analytics and Visualization', desc: 'Data cleaning, visualization, business insights and storytelling' }
  ],
  achievements: [
    "Finalist at Smart India Hackathon 2023 and 2025, among the top teams at India's largest national-level government innovation hackathon.",
    'Took part in 15+ national-level hackathons and AI competitions, consistently reaching the advanced rounds.'
  ],
  gallery: [
    { title: 'Cafe evening', image: IMG.cafe },
    { title: 'Canal walk', image: IMG.canal },
    { title: 'Illustrated portrait', image: IMG.illus }
  ],
  social: [['GitHub', 'https://github.com/Amankar003'], ['LinkedIn', 'https://linkedin.com/in/aman-kar-4b1804259'], ['Buildlyst', 'https://buildlyst.in']]
};

export const SECTIONS = [
  { id: 'about', label: 'About', color: '#ffb86b', board: 'About me', hud: 'The person behind the work' },
  { id: 'skills', label: 'Skills', color: '#7fd6e0', board: 'Skills', hud: 'Tools I use every day' },
  { id: 'projects', label: 'Projects', color: '#b9a8ff', board: 'Projects', hud: 'Things I have built' },
  { id: 'gallery', label: 'Gallery', color: '#ff8fa3', board: 'Gallery', hud: 'Moments and visuals' },
  { id: 'contact', label: 'Contact', color: '#8be3a5', board: "Let's talk", hud: "Let's build something" }
];
