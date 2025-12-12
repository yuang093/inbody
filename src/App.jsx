import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  ComposedChart, BarChart, Bar, ReferenceLine, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Upload, Activity, TrendingDown, TrendingUp, Scale, AlertCircle, Info, User, CheckCircle, Heart, Zap, Layout, FileText, Droplets, Bone, Dumbbell, Grid, Ruler, Printer, X, Download } from 'lucide-react';

// --- Helper Functions & Constants ---

const STANDARDS_OMRON = {
  male: {
    bodyFat: { normal_top: 20, high_top: 25 },
    visceralFat: { normal_top: 9, high_top: 14 },
    skeletalMuscle: { low_top: 32.8, normal_top: 35.7 },
  },
  female: {
    bodyFat: { normal_top: 30, high_top: 35 },
    visceralFat: { normal_top: 9, high_top: 14 },
    skeletalMuscle: { low_top: 25.8, normal_top: 27.9 },
  }
};

const getFFMIStatus = (ffmi, gender) => {
    if (gender === 'male') {
        if (ffmi < 16) return { label: '低於平均', color: 'bg-slate-200 text-slate-600', score: 1 };
        if (ffmi < 18) return { label: '肌肉量偏低 (16-17)', color: 'bg-blue-100 text-blue-700', score: 2 };
        if (ffmi < 20) return { label: '平均水準 (18-19)', color: 'bg-emerald-100 text-emerald-700', score: 3 };
        if (ffmi < 22) return { label: '高於平均 (20-21)', color: 'bg-emerald-100 text-emerald-800 font-bold', score: 4 };
        if (ffmi < 23) return { label: '肌肉量高 (22)', color: 'bg-indigo-100 text-indigo-700', score: 5 };
        if (ffmi < 26) return { label: '肌肉量很高 (23-25)', color: 'bg-indigo-100 text-indigo-800 font-bold', score: 6 };
        if (ffmi < 28) return { label: '疑似用藥 (26-27)', color: 'bg-rose-100 text-rose-700', score: 7 };
        return { label: '自然極限/用藥 (28+)', color: 'bg-rose-200 text-rose-800 font-bold', score: 8 };
    } else {
        if (ffmi < 13) return { label: '低於平均', color: 'bg-slate-200 text-slate-600', score: 1 };
        if (ffmi < 15) return { label: '肌肉量偏低 (13-14)', color: 'bg-blue-100 text-blue-700', score: 2 };
        if (ffmi < 17) return { label: '平均水準 (15-16)', color: 'bg-emerald-100 text-emerald-700', score: 3 };
        if (ffmi < 19) return { label: '高於平均 (17-18)', color: 'bg-emerald-100 text-emerald-800 font-bold', score: 4 };
        if (ffmi < 22) return { label: '肌肉量很高 (19-21)', color: 'bg-indigo-100 text-indigo-700', score: 5 };
        return { label: '自然極限/用藥 (>22)', color: 'bg-rose-200 text-rose-800 font-bold', score: 6 };
    }
};

const Card = ({ children, className = "", title = null, icon: Icon = null, subTitle = null }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-100 p-5 break-inside-avoid print:border-slate-300 print:shadow-none print:p-2 print:mb-4 ${className}`}>
    {title && (
      <div className="mb-4 border-b border-slate-100 pb-2 print:border-slate-300 print:mb-2">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 print:text-base">
          {Icon && <Icon size={20} className="text-blue-600 print:text-black print:w-4 print:h-4" />}
          {title}
        </h3>
        {subTitle && <p className="text-xs text-slate-500 mt-1 print:text-[10px]">{subTitle}</p>}
      </div>
    )}
    {children}
  </div>
);

const MetricCard = ({ title, value, unit, change, status, target, icon: Icon }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col justify-between hover:shadow-md transition-shadow break-inside-avoid print:border-slate-300 print:shadow-none print:p-2 print:mb-0">
      <div>
        <div className="flex justify-between items-start mb-2">
          <span className="text-slate-500 text-sm font-medium print:text-xs">{title}</span>
          <div className="p-2 bg-slate-50 rounded-lg text-slate-600 print:hidden">
            <Icon size={18} />
          </div>
        </div>
        
        <div className="flex items-end gap-2 mb-2">
          <span className="text-3xl font-bold text-slate-800 print:text-2xl">{value}</span>
          <span className="text-sm text-slate-500 mb-1 print:text-xs">{unit}</span>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mt-2">
            {status && <span className={`text-xs px-2 py-1 rounded-full border font-medium ${status.color || 'bg-slate-100 text-slate-600'} print:border-slate-400 print:text-black print:bg-transparent print:px-1 print:py-0`}>{status.label}</span>}
          {change !== 0 && !isNaN(change) && (
            <div className={`flex items-center text-xs ${change > 0 ? 'text-slate-500' : 'text-emerald-500'} print:text-black`}>
              {change > 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InBodyBar = ({ label, value, unit, min, max, ideal, color = "bg-slate-800", markLabel = true }) => {
  const rangeMin = min * 0.6;
  const rangeMax = max * 1.4;
  const percentage = Math.min(Math.max(((value - rangeMin) / (rangeMax - rangeMin)) * 100, 0), 100);
  const idealPos = ((ideal - rangeMin) / (rangeMax - rangeMin)) * 100;

  return (
    <div className="mb-3 break-inside-avoid print:mb-2">
      <div className="flex justify-between text-sm mb-1 font-medium text-slate-700 print:text-xs">
        <span className="w-24 text-right pr-4">{label}</span>
        <div className="flex-1 relative h-6 bg-slate-100 rounded-r-lg w-full border-l border-slate-300 print:h-4 print:bg-white print:border-slate-400">
           <div className="absolute top-0 bottom-0 border-r border-white print:border-slate-300" style={{ left: '25%' }}></div>
           <div className="absolute top-0 bottom-0 border-r border-white print:border-slate-300" style={{ left: '50%' }}></div>
           <div className="absolute top-0 bottom-0 border-r border-white print:border-slate-300" style={{ left: '75%' }}></div>
           {/* Force visible color in print */}
           <div className={`absolute top-1 bottom-1 left-0 rounded-r-md transition-all duration-1000 shadow-sm ${color} print:bg-slate-600 print:top-0.5 print:bottom-0.5`} style={{ width: `${percentage}%`, printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}></div>
           <div className="absolute top-0 bottom-0 flex items-center" style={{ left: `${percentage + 2}%` }}>
             <span className="text-xs font-bold text-slate-700 whitespace-nowrap print:text-[10px]">{value} {unit}</span>
           </div>
           <div className="absolute -top-1 bottom-0 w-0.5 bg-slate-400 opacity-50 print:bg-black" style={{ left: `${idealPos}%` }}></div>
           {markLabel && <div className="absolute -top-4 text-[9px] text-slate-400 transform -translate-x-1/2 print:hidden" style={{ left: `${idealPos}%` }}>100%</div>}
        </div>
      </div>
    </div>
  );
};

const CustomRadarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-lg text-sm z-50">
          <p className="font-bold text-slate-800 mb-1">{data.subject}</p>
          <div className="flex flex-col gap-1">
             <div className="flex justify-between gap-4">
                <span className="text-slate-500">比例:</span>
                <span className="font-bold text-blue-600">{data.A}%</span>
             </div>
             <div className="flex justify-between gap-4">
                <span className="text-slate-500">重量:</span>
                <span className="font-bold text-slate-700">{data.massKg} kg</span>
             </div>
          </div>
        </div>
      );
    }
    return null;
};

// --- Main Application ---

export default function HealthDashboardUltimate() {
  const [rawData, setRawData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [timeRange, setTimeRange] = useState('ALL');
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard', 'report', or 'print_all'
  const [gender, setGender] = useState(localStorage.getItem('inbody_gender') || 'male');
  const [userHeight, setUserHeight] = useState(localStorage.getItem('inbody_height') || '');

// 加入這段 useEffect
  useEffect(() => {
    localStorage.setItem('inbody_gender', gender);
    localStorage.setItem('inbody_height', userHeight);
  }, [gender, userHeight]);
  
  // Printing State
  const [isPrinting, setIsPrinting] = useState(false);

  // CSS for Print - Optimized for A4 Scale
  const printStyles = `
    @media print {
      @page { 
        size: A4 portrait; 
        margin: 5mm; 
      }
      body { 
        -webkit-print-color-adjust: exact; 
        print-color-adjust: exact;
        background-color: white !important;
        zoom: 0.65; /* CRITICAL: Scale down to fit A4 width without cut-off */
      }
      .print-hidden { 
        display: none !important; 
      }
      .print-container {
        width: 100% !important;
        margin: 0 auto;
        display: block !important;
      }
      .print-break-after { 
        break-after: page; 
        page-break-after: always; 
        display: block !important;
        min-height: 100vh;
      }
      .print-grid-cols-3 {
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      }
      .recharts-wrapper {
        width: 100% !important;
      }
      /* Clean up shadows and borders for print */
      * {
        box-shadow: none !important;
      }
    }
  `;

  // --- CSV Loading & Parsing ---
  useEffect(() => {
    const demoCSV = `
"測量日期","時區","體重(kg)","體脂肪(%)","體脂肪量(kg)","內臟脂肪程度","基礎代謝(kcal)","骨骼肌(%)","骨骼肌重量(kg)","骨骼肌率（雙臂）(%)","骨骼肌率（身軀）(%)","骨骼肌率（雙腳）(%)","皮下脂肪率(%)","皮下脂肪率（雙臂）(%)","皮下脂肪率（身軀）(%)","皮下脂肪率（雙腳）(%)","BMI","身體年齡(歲)","型號"
"2021/12/15 17:25","Asia/Taipei","117.80","33.9","","29.5","2298","28.9","","32.1","19.7","46.3","25.1","28.6","24.1","29.7","39.1","69","HBF-702T"
"2023/01/10 07:45","Asia/Taipei","102.10","28.5","29.1","21.0","2050","32.2","32.8","33.8","22.5","48.2","20.8","23.9","19.5","24.5","34.1","58","HBF-702T"
"2025/11/25 06:48","Asia/Taipei","99.50","27.8","27.7","21.0","2063","31.9","31.7","34.3","23.7","49.2","20.4","22.2","18.9","22.7","33.1","61","HBF-702T"
    `;
    processCSV(demoCSV);
  }, []);

  const processCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    const parsedData = lines.slice(1).map(line => {
      const cols = line.replace(/"/g, '').split(',');
      if (cols.length < 5) return null;

      const weight = parseFloat(cols[2]);
      const bodyFatPercent = parseFloat(cols[3]);
      const skeletalPercent = parseFloat(cols[7]);
      const bmi = parseFloat(cols[16]);
      
      let bodyFatMass = parseFloat(cols[4]);
      if (isNaN(bodyFatMass) && !isNaN(weight)) bodyFatMass = weight * (bodyFatPercent / 100);

      let skeletalMass = parseFloat(cols[8]); 
      if (isNaN(skeletalMass) && !isNaN(weight)) skeletalMass = weight * (skeletalPercent / 100);

      // --- Advanced Estimation ---
      const fatFreeMass = weight - bodyFatMass;
      const boneMass = fatFreeMass * 0.068;
      const softLeanMass = fatFreeMass - boneMass; 
      const tbw = fatFreeMass * 0.732;
      const icw = tbw * 0.62;
      const ecw = tbw * 0.38;
      const protein = fatFreeMass - tbw - boneMass;

      const ffmiBMI = (weight > 0 && bmi > 0) ? (fatFreeMass * bmi) / weight : 0;

      return {
        date: cols[0].split(' ')[0],
        timestamp: new Date(cols[0]).getTime(),
        weight, bodyFatPercent, bodyFatMass, visceralFat: parseFloat(cols[5]), bmr: parseFloat(cols[6]),
        skeletalMusclePercent: skeletalPercent, skeletalMuscleMass: skeletalMass,
        fatFreeMass, softLeanMass, boneMass, tbw, icw, ecw, protein,
        ffmiBMI, 
        
        armMusclePct: parseFloat(cols[9]),
        trunkMusclePct: parseFloat(cols[10]),
        legMusclePct: parseFloat(cols[11]),
        subFatPercent: parseFloat(cols[12]),
        armFatPct: parseFloat(cols[13]),
        trunkFatPct: parseFloat(cols[14]),
        legFatPct: parseFloat(cols[15]),
        
        bmi, bodyAge: parseFloat(cols[17]),
      };
    }).filter(d => d !== null && !isNaN(d.weight));

    parsedData.sort((a, b) => a.timestamp - b.timestamp);
    setRawData(parsedData);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => { if(e.target) processCSV(e.target.result); };
      reader.readAsText(file);
    }
  };

  // --- Print Logic using useEffect for Reliability ---
  useEffect(() => {
    if (isPrinting) {
        // Wait for React to re-render the viewMode change
        const timer = setTimeout(() => {
            window.print();
            setIsPrinting(false); // Reset after print window opens/closes
        }, 1000); // 1 second delay to ensure charts are redrawn
        return () => clearTimeout(timer);
    }
  }, [isPrinting]);

  const triggerPrint = () => {
    setViewMode('print_all');
    setIsPrinting(true);
  };

  const displayData = useMemo(() => {
      let data = rawData;
      
      const lastTimestamp = rawData.length > 0 ? rawData[rawData.length - 1].timestamp : 0;
      if (timeRange !== 'ALL') {
        const specificYears = ['2021', '2022', '2023', '2024', '2025'];
        if (specificYears.includes(timeRange)) {
            data = rawData.filter(d => new Date(d.timestamp).getFullYear() === parseInt(timeRange));
        } else {
            let cutoff = 0;
            if (timeRange === '3M') cutoff = lastTimestamp - 90 * 24 * 60 * 60 * 1000;
            if (timeRange === '1Y') cutoff = lastTimestamp - 365 * 24 * 60 * 60 * 1000;
            data = rawData.filter(d => d.timestamp >= cutoff);
        }
      }

      return data.map(d => {
          let currentFFMI = d.ffmiBMI;
          if (userHeight && !isNaN(userHeight) && userHeight > 0) {
              const heightM = parseFloat(userHeight) / 100;
              currentFFMI = d.fatFreeMass / (heightM * heightM);
          }
          return { ...d, ffmi: currentFFMI };
      });
  }, [rawData, timeRange, userHeight]);

  const latest = displayData[displayData.length - 1] || {};
  const first = displayData[0] || {};
  const ffmiStatus = getFFMIStatus(latest.ffmi, gender);
  
  const getStatus = (type, value) => {
      const std = STANDARDS_OMRON[gender];
      if (!value) return { type: 'normal', label: '-' };
      if (type === 'bmi') return value < 24 ? {label:'標準', color:'bg-emerald-100 text-emerald-700'} : {label:'過重', color:'bg-amber-100 text-amber-700'};
      if (type === 'bodyFat') return value < std.bodyFat.normal_top ? {label:'標準', color:'bg-emerald-100 text-emerald-700'} : {label:'偏高', color:'bg-amber-100 text-amber-700'};
      if (type === 'weight') return {label: '-', color: 'bg-slate-100'};
      return {label: '-', color: 'bg-slate-100'};
  }

  // Weights (Estimated)
  const trunkTotalMass = latest.weight * 0.46;
  const armTotalMass = latest.weight * 0.06; 
  const legTotalMass = latest.weight * 0.18; 

  const trunkMuscleKg = trunkTotalMass * (latest.trunkMusclePct / 100);
  const armMuscleKg = armTotalMass * (latest.armMusclePct / 100);
  const legMuscleKg = legTotalMass * (latest.legMusclePct / 100);

  const trunkFatKg = trunkTotalMass * (latest.trunkFatPct / 100);
  const armFatKg = armTotalMass * (latest.armFatPct / 100);
  const legFatKg = legTotalMass * (latest.legFatPct / 100);

  // Re-ordered Radar Data: Left Leg -> Left Arm -> Trunk -> Right Arm -> Right Leg
  const muscleRadarData = [
    { subject: '左腿', A: latest.legMusclePct, massKg: legMuscleKg.toFixed(1), fullMark: 60 },
    { subject: '左臂', A: latest.armMusclePct, massKg: armMuscleKg.toFixed(1), fullMark: 60 },
    { subject: '軀幹', A: latest.trunkMusclePct, massKg: trunkMuscleKg.toFixed(1), fullMark: 60 },
    { subject: '右臂', A: latest.armMusclePct, massKg: armMuscleKg.toFixed(1), fullMark: 60 },
    { subject: '右腿', A: latest.legMusclePct, massKg: legMuscleKg.toFixed(1), fullMark: 60 },
  ];

  const fatRadarData = [
    { subject: '左腿', A: latest.legFatPct, massKg: legFatKg.toFixed(1), fullMark: 40 },
    { subject: '左臂', A: latest.armFatPct, massKg: armFatKg.toFixed(1), fullMark: 40 },
    { subject: '軀幹', A: latest.trunkFatPct, massKg: trunkFatKg.toFixed(1), fullMark: 40 },
    { subject: '右臂', A: latest.armFatPct, massKg: armFatKg.toFixed(1), fullMark: 40 },
    { subject: '右腿', A: latest.legFatPct, massKg: legFatKg.toFixed(1), fullMark: 40 },
  ];

  if (rawData.length === 0) return <div className="p-10 text-center">載入中...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800 print:bg-white print:p-0">
      <style>{printStyles}</style>
      
      {/* Header & Controls - Hidden on Print */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm print-hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="text-blue-600" />
            體態醫學分析報告 v5.6
          </h1>
          <p className="text-xs text-slate-500">FFMI 肌肉分析 · A4 自動縮放列印 · 體液監測</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
             <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                <Ruler size={16} className="text-slate-500" />
                <span className="text-xs font-bold text-slate-600 hidden sm:inline">身高(cm):</span>
                <input 
                    type="number" 
                    placeholder="輸入身高" 
                    value={userHeight}
                    onChange={(e) => setUserHeight(e.target.value)}
                    className="w-20 bg-transparent border-b border-slate-300 focus:border-blue-500 focus:outline-none text-sm font-bold text-blue-700 text-center"
                />
             </div>

             <div className="bg-slate-100 rounded-lg p-1 flex items-center">
                <button onClick={() => setGender('male')} className={`px-3 py-1 text-xs font-medium rounded-md transition ${gender === 'male' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>男</button>
                <button onClick={() => setGender('female')} className={`px-3 py-1 text-xs font-medium rounded-md transition ${gender === 'female' ? 'bg-white shadow text-pink-500' : 'text-slate-500'}`}>女</button>
            </div>

            <button 
                onClick={triggerPrint}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm text-sm font-bold"
            >
                <Printer size={16} />
                <span>列印 / 輸出 PDF</span>
            </button>
            
            <div className="bg-slate-100 rounded-lg p-1 flex">
                {['dashboard', 'report'].map(m => (
                    <button key={m} onClick={() => setViewMode(m)} className={`px-4 py-1.5 text-xs font-bold rounded-md transition ${viewMode === m ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>
                        {m === 'dashboard' ? '儀表板' : '報告書'}
                    </button>
                ))}
            </div>
             <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-white rounded-lg cursor-pointer hover:bg-slate-700 transition shadow-sm text-sm">
                <Upload size={14} />
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
        </div>
      </div>

      <div className="print-container">
        
        {/* --- DASHBOARD VIEW (Page 1) --- */}
        {/* Force display when isPrinting or viewMode is print_all/dashboard */}
        <div className={`max-w-7xl mx-auto ${(isPrinting || viewMode === 'print_all' || viewMode === 'dashboard') ? 'block' : 'hidden'} ${(isPrinting || viewMode === 'print_all') ? 'print-break-after' : ''}`}>
                <div className="bg-white rounded-xl p-2 border border-slate-200 shadow-sm flex flex-wrap gap-2 mb-6 print-hidden">
                    {['2021','2022','2023','2024','2025','1Y','3M','ALL'].map(t => (
                        <button key={t} onClick={() => setTimeRange(t)} className={`px-3 py-1 text-xs font-bold rounded-md ${timeRange === t ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>{t}</button>
                    ))}
                </div>
                
                {/* Title for Print */}
                <div className="hidden print-block mb-6 border-b-2 border-slate-800 pb-2">
                    <h2 className="text-3xl font-bold">健康趨勢儀表板 (Dashboard)</h2>
                    <p className="text-sm text-slate-500">列印日期: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6 print-grid-cols-3">
                    <MetricCard title="FFMI" value={latest.ffmi?.toFixed(1)} unit="" change={latest.ffmi - first.ffmi} status={{label: ffmiStatus.label, color: ffmiStatus.color}} target={gender === 'male' ? '> 20' : '> 17'} icon={Dumbbell} />
                    <MetricCard title="體重" value={latest.weight?.toFixed(1)} unit="kg" change={latest.weight - first.weight} status={getStatus('weight', latest.weight)} target="" icon={Layout} />
                    <MetricCard title="體脂率" value={latest.bodyFatPercent?.toFixed(1)} unit="%" change={latest.bodyFatPercent - first.bodyFatPercent} status={getStatus('bodyFat', latest.bodyFatPercent)} target="" icon={TrendingDown} />
                    <MetricCard title="骨骼肌率" value={latest.skeletalMusclePercent?.toFixed(1)} unit="%" change={latest.skeletalMusclePercent - first.skeletalMusclePercent} status={{label: '-', color: ''}} target="" icon={Activity} />
                    <MetricCard title="內臟脂肪" value={latest.visceralFat?.toFixed(1)} unit="Lv" change={latest.visceralFat - first.visceralFat} status={{label: '-', color: ''}} target="" icon={AlertCircle} />
                    <MetricCard title="BMI" value={latest.bmi?.toFixed(1)} unit="" change={latest.bmi - first.bmi} status={getStatus('bmi', latest.bmi)} target="" icon={Scale} />
                </div>

                <div className="h-[400px] bg-white p-4 rounded-xl shadow-sm border border-slate-100 break-inside-avoid print:h-[500px] print:border-slate-300">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={displayData}>
                            <defs>
                                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#94a3b8" stopOpacity={0.8}/><stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/></linearGradient>
                                <linearGradient id="colorMuscle" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Area type="monotone" dataKey="weight" name="體重" stroke="#94a3b8" fill="url(#colorWeight)" />
                            <Area type="monotone" dataKey="skeletalMuscleMass" name="骨骼肌重" stroke="#3b82f6" fill="url(#colorMuscle)" />
                            <Line type="monotone" dataKey="ffmi" name="FFMI" stroke="#8b5cf6" dot={false} strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
        </div>

        {/* --- REPORT VIEW (Page 2) --- */}
        <div className={`max-w-6xl mx-auto space-y-6 ${(isPrinting || viewMode === 'report' || viewMode === 'print_all') ? 'block' : 'hidden'}`}>
                
                <div className="flex justify-between items-end border-b pb-4 print:mt-8">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800">身體組成分析報告</h2>
                        <p className="text-slate-500">Body Composition Analysis Report</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600 print:text-black">{latest.date}</div>
                        <div className="text-sm text-slate-400">測量型號: HBF-702T</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:grid-cols-2 print:gap-4">
                    
                    {/* LEFT COLUMN */}
                    <div className="space-y-6">
                        
                        <Card title="1. 身體組成分析 (Body Composition)" icon={Scale} className="border-t-4 border-t-slate-800">
                            <div className="space-y-4">
                                <div className="grid grid-cols-4 gap-2 text-center text-xs text-slate-500 bg-slate-50 p-2 rounded print:bg-transparent">
                                    <div>體內水份<br/><span className="text-lg font-bold text-slate-800">{latest.tbw?.toFixed(1)}</span></div>
                                    <div>蛋白質<br/><span className="text-lg font-bold text-slate-800">{latest.protein?.toFixed(1)}</span></div>
                                    <div>礦物質(骨)<br/><span className="text-lg font-bold text-slate-800">{latest.boneMass?.toFixed(1)}</span></div>
                                    <div>體脂肪<br/><span className="text-lg font-bold text-slate-800">{latest.bodyFatMass?.toFixed(1)}</span></div>
                                </div>
                                <div className="flex justify-between items-center px-4 py-2 border border-slate-100 rounded-lg print:border-slate-300">
                                    <span className="text-sm font-bold">去脂體重 (FFM)</span>
                                    <span className="text-xl font-bold text-blue-600 print:text-black">{latest.fatFreeMass?.toFixed(1)} <span className="text-sm text-slate-400">kg</span></span>
                                </div>
                                <div className="flex justify-between items-center px-4 py-2 bg-slate-800 text-white rounded-lg print:bg-slate-200 print:text-black">
                                    <span className="text-sm font-bold">體重 (Weight)</span>
                                    <span className="text-xl font-bold">{latest.weight?.toFixed(1)} <span className="text-sm text-slate-400 print:text-slate-600">kg</span></span>
                                </div>
                            </div>
                        </Card>

                        <Card title="2. 肌肉-脂肪分析 (Muscle-Fat)" icon={Dumbbell}>
                            <InBodyBar label="體重" value={latest.weight?.toFixed(1)} unit="kg" min={50} max={130} ideal={75} color="bg-slate-400" />
                            <InBodyBar label="骨骼肌重" value={latest.skeletalMuscleMass?.toFixed(1)} unit="kg" min={20} max={60} ideal={35} color="bg-slate-800" />
                            <InBodyBar label="體脂肪重" value={latest.bodyFatMass?.toFixed(1)} unit="kg" min={5} max={50} ideal={15} color="bg-slate-300" />
                        </Card>

                        <Card title="3. 肥胖與肌肉診斷 (Obesity & FFMI)" icon={AlertCircle}>
                            <InBodyBar label="BMI" value={latest.bmi?.toFixed(1)} unit="" min={10} max={50} ideal={22} color="bg-slate-400" markLabel={false} />
                            <InBodyBar label="體脂率" value={latest.bodyFatPercent?.toFixed(1)} unit="%" min={5} max={60} ideal={20} color="bg-slate-400" markLabel={false} />
                            
                            <div className="mt-6 pt-4 border-t border-slate-100">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-sm font-bold flex items-center gap-2"><Dumbbell size={16} className="text-indigo-600 print:text-black"/> FFMI 肌肉量指數</h4>
                                    <span className={`text-xs px-2 py-0.5 rounded ${ffmiStatus.color} print:border print:border-slate-400`}>{ffmiStatus.label}</span>
                                </div>
                                <div className="relative h-6 bg-slate-100 rounded-full w-full overflow-hidden border border-slate-200 print:bg-white print:border-slate-400">
                                    {gender === 'male' ? (
                                        <>
                                            <div className="absolute top-0 bottom-0 bg-slate-200 print:bg-slate-100" style={{left: '0%', width: '40%'}} title="低於平均"></div>
                                            <div className="absolute top-0 bottom-0 bg-emerald-200 print:bg-slate-200" style={{left: '40%', width: '20%'}} title="平均"></div>
                                            <div className="absolute top-0 bottom-0 bg-indigo-200 print:bg-slate-300" style={{left: '60%', width: '25%'}} title="高"></div>
                                            <div className="absolute top-0 bottom-0 bg-rose-200 print:bg-slate-400" style={{left: '85%', width: '15%'}} title="極限"></div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="absolute top-0 bottom-0 bg-slate-200 print:bg-slate-100" style={{left: '0%', width: '40%'}} title="低於平均"></div>
                                            <div className="absolute top-0 bottom-0 bg-emerald-200 print:bg-slate-200" style={{left: '40%', width: '20%'}} title="平均"></div>
                                            <div className="absolute top-0 bottom-0 bg-indigo-200 print:bg-slate-300" style={{left: '60%', width: '30%'}} title="高"></div>
                                            <div className="absolute top-0 bottom-0 bg-rose-200 print:bg-slate-400" style={{left: '90%', width: '10%'}} title="極限"></div>
                                        </>
                                    )}
                                    <div className="absolute top-0 bottom-0 w-1 bg-slate-800 shadow-lg" style={{ left: `${Math.min(Math.max(((latest.ffmi - (gender === 'male' ? 14 : 11)) / (gender === 'male' ? 14 : 11)) * 100, 0), 100)}%` }}></div>
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                    <span>{gender === 'male' ? 14 : 11}</span>
                                    <span className="font-bold text-slate-800 text-base">{latest.ffmi?.toFixed(1)}</span>
                                    <span>{gender === 'male' ? 28 : 22}+</span>
                                </div>
                                <div className="mt-1 text-[10px] text-slate-400 text-right">
                                    {userHeight ? `依據身高 ${userHeight}cm 計算` : '依據 BMI 反推估算 (建議輸入身高)'}
                                </div>
                            </div>
                        </Card>

                        <Card title="4. 體液均衡 (Water Balance)" icon={Droplets}>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="p-2 border rounded print:border-slate-300">
                                    <div className="text-[10px] text-slate-400">細胞內液</div>
                                    <div className="text-lg font-bold">{latest.icw?.toFixed(1)}</div>
                                </div>
                                <div className="p-2 border rounded print:border-slate-300">
                                    <div className="text-[10px] text-slate-400">細胞外液</div>
                                    <div className="text-lg font-bold">{latest.ecw?.toFixed(1)}</div>
                                </div>
                                <div className="p-2 border rounded bg-blue-50 border-blue-100 print:bg-transparent print:border-slate-300">
                                    <div className="text-[10px] text-blue-600 print:text-black">外液比率</div>
                                    <div className="text-lg font-bold text-blue-700 print:text-black">{(latest.ecw / latest.tbw)?.toFixed(3)}</div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-6">
                        
                        <Card title="5. 部位別分析 (Segmental Analysis)" icon={User} className="border-t-4 border-t-emerald-500">
                            
                            <div className="mb-8 break-inside-avoid">
                                <h4 className="text-sm font-bold text-center mb-2 flex justify-center items-center gap-2">
                                    <Dumbbell size={16} className="text-emerald-600 print:text-black"/> 骨骼肌分佈 (Muscle)
                                </h4>
                                <div className="h-[250px] relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={muscleRadarData}>
                                            <PolarGrid gridType="polygon" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#334155', fontSize: 12, fontWeight: 'bold' }} />
                                            <PolarRadiusAxis angle={90} domain={[10, 60]} tick={false} axisLine={false} />
                                            <Radar name="Muscle" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.5} />
                                            <Tooltip content={<CustomRadarTooltip />} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                                
                                <div className="grid grid-cols-5 gap-1 text-center text-[10px] mt-2">
                                    <div className="bg-slate-50 p-1 rounded print:bg-transparent print:border print:border-slate-200">左腿<br/><b>{latest.legMusclePct}%</b><br/><span className="text-slate-500">{muscleRadarData[0].massKg}kg</span></div>
                                    <div className="bg-slate-50 p-1 rounded print:bg-transparent print:border print:border-slate-200">左臂<br/><b>{latest.armMusclePct}%</b><br/><span className="text-slate-500">{muscleRadarData[1].massKg}kg</span></div>
                                    <div className="bg-emerald-50 p-1 rounded text-emerald-700 print:bg-transparent print:border print:border-slate-200 print:text-black">軀幹<br/><b>{latest.trunkMusclePct}%</b><br/><span className="text-emerald-600 print:text-black">{muscleRadarData[2].massKg}kg</span></div>
                                    <div className="bg-slate-50 p-1 rounded print:bg-transparent print:border print:border-slate-200">右臂<br/><b>{latest.armMusclePct}%</b><br/><span className="text-slate-500">{muscleRadarData[3].massKg}kg</span></div>
                                    <div className="bg-slate-50 p-1 rounded print:bg-transparent print:border print:border-slate-200">右腿<br/><b>{latest.legMusclePct}%</b><br/><span className="text-slate-500">{muscleRadarData[4].massKg}kg</span></div>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-6 break-inside-avoid">
                                <h4 className="text-sm font-bold text-center mb-2 flex justify-center items-center gap-2">
                                    <Zap size={16} className="text-rose-500 print:text-black"/> 皮下脂肪分佈 (Fat)
                                </h4>
                                <div className="h-[250px] relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={fatRadarData}>
                                            <PolarGrid gridType="polygon" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#334155', fontSize: 12, fontWeight: 'bold' }} />
                                            <PolarRadiusAxis angle={90} domain={[10, 50]} tick={false} axisLine={false} />
                                            <Radar name="Fat" dataKey="A" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.4} />
                                            <Tooltip content={<CustomRadarTooltip />} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="grid grid-cols-5 gap-1 text-center text-[10px] mt-2">
                                    <div className="bg-slate-50 p-1 rounded print:bg-transparent print:border print:border-slate-200">左腿<br/><b>{latest.legFatPct}%</b><br/><span className="text-slate-500">{fatRadarData[0].massKg}kg</span></div>
                                    <div className="bg-slate-50 p-1 rounded print:bg-transparent print:border print:border-slate-200">左臂<br/><b>{latest.armFatPct}%</b><br/><span className="text-slate-500">{fatRadarData[1].massKg}kg</span></div>
                                    <div className="bg-rose-50 p-1 rounded text-rose-700 print:bg-transparent print:border print:border-slate-200 print:text-black">軀幹<br/><b>{latest.trunkFatPct}%</b><br/><span className="text-rose-600 print:text-black">{fatRadarData[2].massKg}kg</span></div>
                                    <div className="bg-slate-50 p-1 rounded print:bg-transparent print:border print:border-slate-200">右臂<br/><b>{latest.armFatPct}%</b><br/><span className="text-slate-500">{fatRadarData[3].massKg}kg</span></div>
                                    <div className="bg-slate-50 p-1 rounded print:bg-transparent print:border print:border-slate-200">右腿<br/><b>{latest.legFatPct}%</b><br/><span className="text-slate-500">{fatRadarData[4].massKg}kg</span></div>
                                </div>
                            </div>

                        </Card>

                        <div className="grid grid-cols-2 gap-4">
                            <Card title="體型判定" icon={Grid} className="bg-slate-800 text-white border-none print:bg-white print:text-black print:border print:border-slate-300">
                                <div className="text-center py-4">
                                    <div className="text-3xl font-bold mb-1">
                                        {latest.bmi > 30 ? '肥胖型' : latest.bmi > 24 ? (latest.bodyFatPercent > 25 ? '脂肪過多' : '肌肉型過重') : '標準型'}
                                    </div>
                                    <div className="text-xs text-slate-400">基於 BMI {latest.bmi?.toFixed(1)} / 體脂 {latest.bodyFatPercent}%</div>
                                </div>
                            </Card>
                            <Card title="基礎代謝" icon={Zap}>
                                <div className="text-center py-4">
                                    <div className="text-3xl font-bold text-slate-800">{latest.bmr}</div>
                                    <div className="text-xs text-slate-500">kcal / 日</div>
                                </div>
                            </Card>
                        </div>

                    </div>
                </div>
                
                <div className="text-center text-[10px] text-slate-400 mt-10 print:mt-4">
                    本報告使用 ACSM (美國運動醫學會) 與 Plagenhoef 人體肢段參數進行各項成分與部位重量推估。<br/>
                    部位分析雷達圖假設左右肢體對稱進行繪製。FFMI 計算為去脂體重除以身高平方(若未輸入身高則以BMI反推)。
                </div>
        </div>
      </div>
    </div>
  );
}