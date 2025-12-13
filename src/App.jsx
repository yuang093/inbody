import React, { useState, useEffect, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Line, BarChart, Bar, ReferenceLine, Cell
} from 'recharts';
import { Upload, Activity, TrendingDown, Scale, AlertCircle, User, Zap, Layout, Droplets, Dumbbell, Grid, Ruler, Printer, Brain } from 'lucide-react';

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
        if (ffmi < 16) return { label: '低於平均', color: 'bg-zinc-100 text-zinc-500', score: 1 };
        if (ffmi < 18) return { label: '肌肉量偏低', color: 'bg-cyan-50 text-cyan-600', score: 2 };
        if (ffmi < 20) return { label: '平均水準', color: 'bg-emerald-50 text-emerald-600', score: 3 };
        if (ffmi < 22) return { label: '高於平均', color: 'bg-emerald-100 text-emerald-700 font-bold', score: 4 };
        if (ffmi < 23) return { label: '肌肉量蠻高', color: 'bg-violet-100 text-violet-700', score: 5 };
        if (ffmi < 26) return { label: '肌肉量很高', color: 'bg-violet-100 text-violet-800 font-bold', score: 6 };
        if (ffmi < 28) return { label: '疑似用藥', color: 'bg-rose-100 text-rose-600', score: 7 };
        return { label: '自然極限', color: 'bg-rose-200 text-rose-800 font-bold', score: 8 };
    } else {
        if (ffmi < 13) return { label: '低於平均', color: 'bg-zinc-100 text-zinc-500', score: 1 };
        if (ffmi < 15) return { label: '肌肉量偏低', color: 'bg-cyan-50 text-cyan-600', score: 2 };
        if (ffmi < 17) return { label: '平均水準', color: 'bg-emerald-50 text-emerald-600', score: 3 };
        if (ffmi < 19) return { label: '高於平均', color: 'bg-emerald-100 text-emerald-700 font-bold', score: 4 };
        if (ffmi < 22) return { label: '肌肉量很高', color: 'bg-violet-100 text-violet-700', score: 5 };
        return { label: '自然極限', color: 'bg-rose-200 text-rose-800 font-bold', score: 6 };
    }
};

const getWaterStatus = (ratio) => {
    if (!ratio) return { label: '-', color: 'text-zinc-400', bg: 'bg-zinc-100' };
    if (ratio < 0.360) return { label: '脫水', color: 'text-amber-600', bg: 'bg-amber-100' };
    if (ratio <= 0.390) return { label: '標準', color: 'text-emerald-600', bg: 'bg-emerald-100' }; 
    if (ratio <= 0.400) return { label: '輕微浮腫', color: 'text-orange-600', bg: 'bg-orange-100' }; 
    return { label: '浮腫', color: 'text-rose-600', bg: 'bg-rose-100' }; 
};

const getBMICategory = (bmi) => {
    if (!bmi) return '-';
    if (bmi < 18.5) return '體重過輕';
    if (bmi < 24) return '標準體重';
    if (bmi < 27) return '過重';
    if (bmi < 30) return '輕度肥胖';
    if (bmi < 35) return '中度肥胖';
    return '重度肥胖';
};

const Card = ({ children, className = "", title = null, icon: Icon = null, subTitle = null, accentColor = "border-zinc-200" }) => (
  <div className={`bg-white rounded-2xl shadow-sm border ${accentColor} p-5 break-inside-avoid print:border-zinc-300 print:shadow-none print:p-3 print:mb-4 print:rounded-xl ${className}`}>
    {title && (
      <div className="mb-4 border-b border-zinc-100 pb-2 print:border-zinc-300 print:mb-2">
        <h3 className="text-lg font-bold text-zinc-800 flex items-center gap-2 print:text-base">
          {Icon && <Icon size={20} className="text-cyan-600 print:text-black print:w-4 print:h-4" />}
          {title}
        </h3>
        {subTitle && <p className="text-xs text-zinc-500 mt-1 print:text-[10px]">{subTitle}</p>}
      </div>
    )}
    {children}
  </div>
);

const MetricCard = ({ title, value, unit, change, status, icon: Icon, colorClass = "text-zinc-800" }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-5 flex flex-col justify-between hover:shadow-md transition-all hover:-translate-y-1 break-inside-avoid print:border-zinc-300 print:shadow-none print:p-2 print:mb-0 print:rounded-lg">
      <div>
        <div className="flex justify-between items-start mb-2">
          <span className="text-zinc-500 text-sm font-medium print:text-xs">{title}</span>
          <div className={`p-2 rounded-xl bg-opacity-10 ${colorClass.replace('text-', 'bg-')} print:hidden`}>
            <Icon size={18} className={colorClass} />
          </div>
        </div>
        
        <div className="flex items-end gap-2 mb-2">
          <span className={`text-3xl font-bold ${colorClass} print:text-black print:text-2xl`}>{value}</span>
          <span className="text-sm text-zinc-400 mb-1 print:text-xs">{unit}</span>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mt-2">
            {status && <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${status.color || 'bg-zinc-100 text-zinc-500'} print:border print:border-zinc-400 print:text-black print:bg-transparent print:px-1 print:py-0`}>{status.label}</span>}
          {change !== 0 && !isNaN(change) && (
            <div className={`flex items-center text-xs font-bold ${change > 0 ? 'text-rose-400' : 'text-emerald-500'} print:text-black`}>
              {change > 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- InBody Style Chart Components ---

const InBodyHeader = () => {
  return (
    <div className="flex text-xs font-bold text-zinc-500 mb-2 border-b border-zinc-200 pb-2 print:text-[10px]">
      <div className="w-20 md:w-24 shrink-0 text-right pr-4">項目</div>
      <div className="flex-1 grid grid-cols-12 gap-0 text-center relative">
        <div className="col-span-3 text-center pl-4">低</div>
        <div className="col-span-4 text-center">正常</div>
        <div className="col-span-5 text-center">高</div>
      </div>
      <div className="w-24 text-right pl-2 hidden md:block print:hidden">正常範圍</div>
    </div>
  );
};

const InBodyAnalysisRow = ({ label, value, unit, standard100, config }) => {
  const { min, max, lowNormal, highNormal, ticks } = config;
  
  // 計算當前數值是標準值的百分之幾
  // 如果 standard100 為 0 或未定義，避免除以零錯誤
  const safeStandard = standard100 && standard100 > 0 ? standard100 : 1;
  const currentPercent = (value / safeStandard) * 100;
  
  // 計算 CSS 寬度位置的 Helper
  const getPosition = (pct) => {
    const pos = ((pct - min) / (max - min)) * 100;
    return Math.min(Math.max(pos, 0), 100);
  };

  const normalRangeMin = (safeStandard * (lowNormal / 100)).toFixed(1);
  const normalRangeMax = (safeStandard * (highNormal / 100)).toFixed(1);

  return (
    <div className="mb-6 last:mb-0 break-inside-avoid print:mb-3">
      <div className="flex items-end">
        {/* 左側標籤 */}
        <div className="w-20 md:w-24 shrink-0 text-right pr-4 pb-1 font-bold text-zinc-700 text-sm print:text-xs">
          {label}
          <span className="text-[10px] text-zinc-400 font-normal block print:text-[8px]">({unit})</span>
        </div>

        {/* 中間圖表區 */}
        <div className="flex-1 relative">
          
          {/* 上方刻度尺 (Percentage Ticks) */}
          <div className="h-4 w-full relative border-b border-zinc-300 mb-1">
            {ticks.map((tick) => (
              <div 
                key={tick} 
                className="absolute bottom-0 transform -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${getPosition(tick)}%` }}
              >
                <span className="text-[9px] text-zinc-400 mb-0.5 print:text-[7px]">{tick}</span>
                <div className="w-px h-1 bg-zinc-300"></div>
              </div>
            ))}
          </div>

          {/* 長條圖軌道 */}
          <div className="h-3 bg-zinc-100 rounded-sm relative w-full overflow-hidden shadow-inner print:bg-white print:border print:border-zinc-300 print:h-2.5">
            {/* 正常範圍的灰色背景區塊 */}
            <div 
              className="absolute top-0 bottom-0 bg-zinc-200/80 border-x border-white/50 print:bg-zinc-200"
              style={{
                left: `${getPosition(lowNormal)}%`,
                width: `${getPosition(highNormal) - getPosition(lowNormal)}%`
              }}
            ></div>

            {/* 實際數值條 */}
            <div 
              className="absolute top-1 bottom-1 left-0.5 bg-zinc-700 rounded-full shadow transition-all duration-1000 z-10 print:bg-black print:top-0.5 print:bottom-0.5"
              style={{ width: `${getPosition(currentPercent)}%` }}
            >
              <span className="absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2 text-xs font-black text-zinc-800 pl-1 whitespace-nowrap print:text-[9px] print:text-black">
                {value}
              </span>
            </div>
          </div>
        </div>

        {/* 右側正常範圍數值 */}
        <div className="w-24 shrink-0 text-right pl-2 pb-1 hidden md:block print:hidden">
          <div className="text-xs font-medium text-zinc-500">{normalRangeMin}~{normalRangeMax}</div>
        </div>
      </div>
    </div>
  );
};

// --- Custom Components for Dashboard ---

const BmiGauge = ({ bmi }) => {
    // Scale: 15 to 40
    const min = 15;
    const max = 40;
    const percent = Math.min(Math.max(((bmi - min) / (max - min)) * 100, 0), 100);
    const getPos = (val) => ((val - min) / (max - min)) * 100;

    return (
        <div className="pt-8 pb-4 relative">
            <div className="absolute -top-0 transform -translate-x-1/2 transition-all duration-500" style={{ left: `${percent}%` }}>
                <div className="bg-zinc-800 text-white text-xs font-bold px-2 py-1 rounded mb-1 whitespace-nowrap shadow-lg">
                    您在這裡 {bmi?.toFixed(1)}
                </div>
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-zinc-800 mx-auto"></div>
            </div>
            
            <div className="h-6 w-full rounded-full bg-gradient-to-r from-blue-400 via-emerald-400 via-amber-400 to-rose-500 relative overflow-hidden shadow-inner">
                {[18.5, 24, 27, 30, 35].map(val => (
                     <div key={val} className="absolute top-0 bottom-0 w-0.5 bg-white/50" style={{ left: `${getPos(val)}%` }}></div>
                ))}
            </div>

            <div className="relative h-6 mt-1 text-[10px] text-zinc-400 font-bold">
                <span className="absolute transform -translate-x-1/2" style={{ left: `${getPos(18.5)}%` }}>18.5</span>
                <span className="absolute transform -translate-x-1/2" style={{ left: `${getPos(24)}%` }}>24</span>
                <span className="absolute transform -translate-x-1/2" style={{ left: `${getPos(27)}%` }}>27</span>
                <span className="absolute transform -translate-x-1/2" style={{ left: `${getPos(30)}%` }}>30</span>
                <span className="absolute transform -translate-x-1/2" style={{ left: `${getPos(35)}%` }}>35</span>
            </div>
            
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-4 text-[10px] text-zinc-500">
                <div className="flex justify-between border-b border-zinc-100 pb-1"><span>標準範圍</span><span>18.5 - 24.0</span></div>
                <div className="flex justify-between border-b border-zinc-100 pb-1"><span>過重</span><span>24.0 - 27.0</span></div>
                <div className="flex justify-between border-b border-zinc-100 pb-1"><span>輕度肥胖</span><span>27.0 - 30.0</span></div>
                <div className="flex justify-between border-b border-zinc-100 pb-1"><span>中度肥胖</span><span>30.0 - 35.0</span></div>
                <div className="flex justify-between"><span>重度肥胖</span><span>&gt; 35.0</span></div>
            </div>
        </div>
    );
};

const CustomRadarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/90 backdrop-blur-sm p-3 border border-zinc-100 shadow-xl rounded-xl text-sm z-50">
          <p className="font-bold text-zinc-800 mb-1">{data.subject}</p>
          <div className="flex flex-col gap-1">
             <div className="flex justify-between gap-4">
                <span className="text-zinc-500">比例:</span>
                <span className="font-bold text-cyan-600">{data.A}%</span>
             </div>
             <div className="flex justify-between gap-4">
                <span className="text-zinc-500">重量:</span>
                <span className="font-bold text-zinc-700">{data.massKg} kg</span>
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
  const [timeRange, setTimeRange] = useState('ALL');
  const [viewMode, setViewMode] = useState('report'); 
  const [gender, setGender] = useState(localStorage.getItem('inbody_gender') || 'male');
  const [userHeight, setUserHeight] = useState(localStorage.getItem('inbody_height') || '');

  useEffect(() => {
    localStorage.setItem('inbody_gender', gender);
    localStorage.setItem('inbody_height', userHeight);
  }, [gender, userHeight]);
  
  const [isPrinting, setIsPrinting] = useState(false);

  const printStyles = `
    @media print {
      @page { 
        size: A4 portrait; 
        margin: 6mm; 
      }
      body { 
        -webkit-print-color-adjust: exact; 
        print-color-adjust: exact;
        background-color: white !important;
        zoom: 0.65;
      }
      .print-hidden { display: none !important; }
      .print-container { width: 100% !important; margin: 0 auto; display: block !important; }
      .print-break-after { break-after: page; page-break-after: always; display: block !important; min-height: 95vh; }
      .print-block { display: block !important; }
      .print-grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
      .recharts-wrapper { width: 100% !important; }
      * { box-shadow: none !important; }
    }
  `;

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

  useEffect(() => {
    if (isPrinting) {
        const timer = setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 1000); 
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
  const waterRatio = latest.ecw / latest.tbw;
  const waterStatus = getWaterStatus(waterRatio);
  const bmiCategory = getBMICategory(latest.bmi);
  const weightChange = latest.weight - first.weight;
  
  const getStatus = (type, value) => {
      const std = STANDARDS_OMRON[gender];
      if (!value) return { type: 'normal', label: '-' };
      if (type === 'bmi') return value < 24 ? {label:'標準', color:'bg-emerald-100 text-emerald-700'} : {label:'過重', color:'bg-amber-100 text-amber-700'};
      if (type === 'bodyFat') return value < std.bodyFat.normal_top ? {label:'標準', color:'bg-emerald-100 text-emerald-700'} : {label:'偏高', color:'bg-amber-100 text-amber-700'};
      if (type === 'weight') return {label: '-', color: 'bg-zinc-100'};
      return {label: '-', color: 'bg-zinc-100'};
  }

  // Radar Data (Correct Order for Chart: Top -> TL -> BL -> BR -> TR)
  const trunkTotalMass = latest.weight * 0.46;
  const armTotalMass = latest.weight * 0.06; 
  const legTotalMass = latest.weight * 0.18; 
  const trunkMuscleKg = trunkTotalMass * (latest.trunkMusclePct / 100);
  const armMuscleKg = armTotalMass * (latest.armMusclePct / 100);
  const legMuscleKg = legTotalMass * (latest.legMusclePct / 100);
  const trunkFatKg = trunkTotalMass * (latest.trunkFatPct / 100);
  const armFatKg = armTotalMass * (latest.armFatPct / 100);
  const legFatKg = legTotalMass * (latest.legFatPct / 100);

  // Re-ordered Radar Data for Chart Visual (Trunk, Left Arm, Left Leg, Right Leg, Right Arm)
  const muscleRadarData = [
    { subject: '軀幹', A: latest.trunkMusclePct, massKg: trunkMuscleKg.toFixed(1) },
    { subject: '左臂', A: latest.armMusclePct, massKg: armMuscleKg.toFixed(1) },
    { subject: '左腿', A: latest.legMusclePct, massKg: legMuscleKg.toFixed(1) },
    { subject: '右腿', A: latest.legMusclePct, massKg: legMuscleKg.toFixed(1) },
    { subject: '右臂', A: latest.armMusclePct, massKg: armMuscleKg.toFixed(1) },
  ];

  const fatRadarData = [
    { subject: '軀幹', A: latest.trunkFatPct, massKg: trunkFatKg.toFixed(1) },
    { subject: '左臂', A: latest.armFatPct, massKg: armFatKg.toFixed(1) },
    { subject: '左腿', A: latest.legFatPct, massKg: legFatKg.toFixed(1) },
    { subject: '右腿', A: latest.legFatPct, massKg: legFatKg.toFixed(1) },
    { subject: '右臂', A: latest.armFatPct, massKg: armFatKg.toFixed(1) },
  ];

  // Grid Mapping Order: Left Leg (2), Left Arm (1), Trunk (0), Right Arm (4), Right Leg (3)
  const gridOrder = [2, 1, 0, 4, 3];

  // Dashboard Specific Data
  const triangleRadarData = [
      { subject: '雙臂', A: latest.armMusclePct, fullMark: 60 },
      { subject: '軀幹', A: latest.trunkMusclePct, fullMark: 60 },
      { subject: '雙腳', A: latest.legMusclePct, fullMark: 60 },
  ];

  const fatBarData = [
      { name: '全身', value: latest.subFatPercent, fill: '#f59e0b' },
      { name: '雙臂', value: latest.armFatPct, fill: '#fbbf24' },
      { name: '軀幹', value: latest.trunkFatPct, fill: '#d97706' },
      { name: '雙腳', value: latest.legFatPct, fill: '#ea580c' },
  ];

  // --- 計算 InBody 標準值 (100% Reference) ---
  const heightM = userHeight ? parseFloat(userHeight) / 100 : 1.736; // 預設 173.6cm
  const standardWeight = heightM * heightM * 22; // BMI 22 為標準體重 (100%)
  
  // 男性標準參數 (概略模擬 InBody 邏輯)
  const isMale = gender === 'male';
  const standardMuscle = standardWeight * (isMale ? 0.45 : 0.39);
  const standardFat = standardWeight * (isMale ? 0.15 : 0.23);

  // --- 刻度與範圍設定 ---
  const chartConfigs = {
    weight: {
      min: 50, max: 200, 
      lowNormal: 85, highNormal: 115,
      ticks: [55, 70, 85, 100, 115, 130, 145, 160, 175, 190, 205]
    },
    muscle: {
      min: 60, max: 180,
      lowNormal: 90, highNormal: 110,
      ticks: [60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170]
    },
    fat: {
      min: 50, max: 400, // 體脂肪範圍較大
      lowNormal: 80, highNormal: 160,
      ticks: [40, 60, 80, 100, 160, 220, 280, 340, 400]
    }
  };

  if (rawData.length === 0) return <div className="p-10 text-center text-zinc-500 animate-pulse">數據分析中...</div>;

  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-8 font-sans text-zinc-800 print:bg-white print:p-0">
      <style>{printStyles}</style>
      
      {/* --- HEADER --- */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 print-hidden">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 flex items-center gap-2 tracking-tight">
            <Activity className="text-cyan-500 fill-cyan-500" />
            INBODY<span className="text-zinc-400 font-light">PRO</span>
          </h1>
          <p className="text-xs font-bold text-zinc-400 tracking-wide uppercase">Advanced Body Composition Analytics</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
             <div className="flex items-center gap-2 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-200">
                <Ruler size={16} className="text-zinc-400" />
                <span className="text-xs font-bold text-zinc-500 hidden sm:inline">身高(cm):</span>
                <input 
                    type="number" 
                    placeholder="0" 
                    value={userHeight}
                    onChange={(e) => setUserHeight(e.target.value)}
                    className="w-16 bg-transparent border-b-2 border-zinc-200 focus:border-cyan-500 focus:outline-none text-sm font-bold text-cyan-600 text-center transition-colors"
                />
             </div>

             <div className="bg-zinc-100 rounded-xl p-1 flex items-center">
                <button onClick={() => setGender('male')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${gender === 'male' ? 'bg-white shadow text-cyan-600' : 'text-zinc-400'}`}>男</button>
                <button onClick={() => setGender('female')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${gender === 'female' ? 'bg-white shadow text-rose-500' : 'text-zinc-400'}`}>女</button>
            </div>

            <button onClick={triggerPrint} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 transition shadow-lg shadow-zinc-200 text-sm font-bold active:scale-95">
                <Printer size={16} />
                <span>列印報告</span>
            </button>
            
            <div className="bg-zinc-100 rounded-xl p-1 flex">
                {['report', 'dashboard'].map(m => (
                    <button key={m} onClick={() => setViewMode(m)} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === m ? 'bg-white shadow text-zinc-900' : 'text-zinc-400'}`}>
                        {m === 'report' ? '報告書' : '儀表板'}
                    </button>
                ))}
            </div>
             <label className="flex items-center gap-2 px-3 py-2 bg-white border border-zinc-200 text-zinc-600 rounded-xl cursor-pointer hover:bg-zinc-50 transition text-sm font-bold">
                <Upload size={14} />
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
        </div>
      </div>

      <div className="print-container">

        {/* --- PAGE 1: REPORT VIEW (Classic Full Report) --- */}
        <div className={`max-w-6xl mx-auto space-y-6 ${(isPrinting || viewMode === 'report' || viewMode === 'print_all') ? 'block' : 'hidden'} ${(isPrinting || viewMode === 'print_all') ? 'print-break-after' : ''}`}>
                
                <div className="flex justify-between items-end border-b-2 border-zinc-100 pb-4 print:mt-4 print:border-zinc-300">
                    <div>
                        <h2 className="text-4xl font-black text-zinc-800 tracking-tight">身體組成分析報告</h2>
                        <p className="text-zinc-400 font-bold uppercase tracking-widest text-sm mt-1">Body Composition Analysis Report</p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-black text-cyan-600 print:text-black">{latest.date}</div>
                        <div className="text-sm font-bold text-zinc-400">測量型號: HBF-702T</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
                    <div className="space-y-6">
                        <Card title="1. 身體組成分析 (Body Composition)" icon={Scale} accentColor="border-t-4 border-t-zinc-800">
                            <div className="space-y-4">
                                <div className="grid grid-cols-4 gap-2 text-center text-xs text-zinc-500 bg-zinc-50 p-3 rounded-xl print:bg-transparent">
                                    <div>體內水份<br/><span className="text-xl font-bold text-zinc-800">{latest.tbw?.toFixed(1)}</span></div>
                                    <div>蛋白質<br/><span className="text-xl font-bold text-zinc-800">{latest.protein?.toFixed(1)}</span></div>
                                    <div>礦物質(骨)<br/><span className="text-xl font-bold text-zinc-800">{latest.boneMass?.toFixed(1)}</span></div>
                                    <div>體脂肪<br/><span className="text-xl font-bold text-zinc-800">{latest.bodyFatMass?.toFixed(1)}</span></div>
                                </div>
                                <div className="flex justify-between items-center px-5 py-3 border border-zinc-100 rounded-xl shadow-sm print:border-zinc-300">
                                    <span className="text-sm font-bold text-zinc-600">去脂體重 (FFM)</span>
                                    <span className="text-2xl font-black text-cyan-600 print:text-black">{latest.fatFreeMass?.toFixed(1)} <span className="text-sm text-zinc-400 font-normal">kg</span></span>
                                </div>
                                <div className="flex justify-between items-center px-5 py-3 bg-zinc-900 text-white rounded-xl shadow-lg shadow-zinc-200 print:bg-zinc-200 print:text-black print:shadow-none">
                                    <span className="text-sm font-bold">體重 (Weight)</span>
                                    <span className="text-2xl font-black">{latest.weight?.toFixed(1)} <span className="text-sm text-zinc-400 print:text-zinc-600 font-normal">kg</span></span>
                                </div>
                            </div>
                        </Card>

                        {/* --- 2. 肌肉-脂肪分析 (InBody Style) --- */}
                        <Card title="2. 肌肉-脂肪分析 (Muscle-Fat)" icon={Dumbbell}>
                            <div className="pt-2">
                                <InBodyHeader />
                                <InBodyAnalysisRow 
                                    label="體重" 
                                    value={latest.weight?.toFixed(1)} 
                                    unit="kg"
                                    standard100={standardWeight}
                                    config={chartConfigs.weight}
                                />
                                <InBodyAnalysisRow 
                                    label="骨骼肌重" 
                                    value={latest.skeletalMuscleMass?.toFixed(1)} 
                                    unit="kg"
                                    standard100={standardMuscle}
                                    config={chartConfigs.muscle}
                                />
                                <InBodyAnalysisRow 
                                    label="體脂肪重" 
                                    value={latest.bodyFatMass?.toFixed(1)} 
                                    unit="kg"
                                    standard100={standardFat}
                                    config={chartConfigs.fat}
                                />
                            </div>
                        </Card>

                        <Card title="3. 肥胖與肌肉診斷 (Obesity & FFMI)" icon={AlertCircle}>
                            {/* 這裡保留原本的樣式，因為需求僅修改 Card 2 */}
                             <div className="mb-4">
                                <div className="flex justify-between text-sm mb-1 font-bold text-zinc-600">
                                    <span className="w-24 text-right pr-4">BMI</span>
                                    <div className="flex-1 relative h-4 bg-zinc-100 rounded-full w-full overflow-hidden print:bg-white print:border print:border-zinc-300">
                                        <div className="absolute top-0 bottom-0 left-0 bg-zinc-300" style={{ width: `${Math.min(latest.bmi / 50 * 100, 100)}%` }}></div>
                                        <div className="absolute top-0 bottom-0 flex items-center" style={{ left: `${Math.min(latest.bmi / 50 * 100, 100) + 2}%` }}>
                                             <span className="text-xs font-bold text-zinc-700">{latest.bmi?.toFixed(1)}</span>
                                        </div>
                                    </div>
                                </div>
                             </div>
                             <div className="mb-4">
                                <div className="flex justify-between text-sm mb-1 font-bold text-zinc-600">
                                    <span className="w-24 text-right pr-4">體脂率</span>
                                    <div className="flex-1 relative h-4 bg-zinc-100 rounded-full w-full overflow-hidden print:bg-white print:border print:border-zinc-300">
                                        <div className="absolute top-0 bottom-0 left-0 bg-zinc-300" style={{ width: `${Math.min(latest.bodyFatPercent / 60 * 100, 100)}%` }}></div>
                                        <div className="absolute top-0 bottom-0 flex items-center" style={{ left: `${Math.min(latest.bodyFatPercent / 60 * 100, 100) + 2}%` }}>
                                             <span className="text-xs font-bold text-zinc-700">{latest.bodyFatPercent?.toFixed(1)} %</span>
                                        </div>
                                    </div>
                                </div>
                             </div>
                            
                            <div className="mt-6 pt-4 border-t border-zinc-100">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-sm font-bold flex items-center gap-2 text-zinc-700"><Dumbbell size={16} className="text-violet-600 print:text-black"/> FFMI 肌肉量指數</h4>
                                    <span className={`text-xs px-2.5 py-1 rounded-md font-bold ${ffmiStatus.color} print:border print:border-zinc-400`}>{ffmiStatus.label}</span>
                                </div>
                                <div className="relative h-4 bg-zinc-100 rounded-full w-full overflow-hidden border border-zinc-100 print:bg-white print:border-zinc-400">
                                    {gender === 'male' ? (
                                        <>
                                            <div className="absolute top-0 bottom-0 bg-zinc-200 print:bg-zinc-100" style={{left: '0%', width: '40%'}}></div>
                                            <div className="absolute top-0 bottom-0 bg-cyan-200 print:bg-zinc-200" style={{left: '40%', width: '20%'}}></div>
                                            <div className="absolute top-0 bottom-0 bg-violet-300 print:bg-zinc-300" style={{left: '60%', width: '25%'}}></div>
                                            <div className="absolute top-0 bottom-0 bg-rose-300 print:bg-zinc-400" style={{left: '85%', width: '15%'}}></div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="absolute top-0 bottom-0 bg-zinc-200 print:bg-zinc-100" style={{left: '0%', width: '40%'}}></div>
                                            <div className="absolute top-0 bottom-0 bg-cyan-200 print:bg-zinc-200" style={{left: '40%', width: '20%'}}></div>
                                            <div className="absolute top-0 bottom-0 bg-violet-300 print:bg-zinc-300" style={{left: '60%', width: '30%'}}></div>
                                            <div className="absolute top-0 bottom-0 bg-rose-300 print:bg-zinc-400" style={{left: '90%', width: '10%'}}></div>
                                        </>
                                    )}
                                    <div className="absolute top-0 bottom-0 w-1.5 bg-black ring-2 ring-white shadow-lg" style={{ left: `${Math.min(Math.max(((latest.ffmi - (gender === 'male' ? 14 : 11)) / (gender === 'male' ? 14 : 11)) * 100, 0), 100)}%` }}></div>
                                </div>
                                <div className="flex justify-between text-[10px] text-zinc-400 mt-2 font-mono">
                                    <span>{gender === 'male' ? 14 : 11}</span>
                                    <span className="font-bold text-zinc-800 text-lg">{latest.ffmi?.toFixed(1)}</span>
                                    <span>{gender === 'male' ? 28 : 22}+</span>
                                </div>
                            </div>
                        </Card>

                        <Card title="4. 體液均衡 (Water Balance)" icon={Droplets}>
                            <div className="grid grid-cols-3 gap-2 text-center mb-3">
                                <div className="p-3 border border-zinc-100 rounded-xl print:border-zinc-300">
                                    <div className="text-[10px] text-zinc-400 font-bold mb-1">細胞內液</div>
                                    <div className="text-xl font-black text-zinc-700">{latest.icw?.toFixed(1)}</div>
                                </div>
                                <div className="p-3 border border-zinc-100 rounded-xl print:border-zinc-300">
                                    <div className="text-[10px] text-zinc-400 font-bold mb-1">細胞外液</div>
                                    <div className="text-xl font-black text-zinc-700">{latest.ecw?.toFixed(1)}</div>
                                </div>
                                <div className="p-3 border border-cyan-100 bg-cyan-50/50 rounded-xl print:bg-transparent print:border-zinc-300">
                                    <div className="text-[10px] text-cyan-600 font-bold mb-1 print:text-black">外液比率</div>
                                    <div className="text-xl font-black text-cyan-700 print:text-black">{(latest.ecw / latest.tbw)?.toFixed(3)}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-1 text-[9px] text-zinc-500 bg-zinc-50 p-2 rounded-lg border border-zinc-100 print:bg-transparent print:border-zinc-300">
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div>&lt; 0.360 脫水/異常</div>
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>0.36~0.39 標準</div>
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500"></div>0.39~0.40 輕微浮腫</div>
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500"></div>&gt; 0.400 明顯浮腫</div>
                            </div>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card title="5. 部位別分析 (Segmental Analysis)" icon={User} accentColor="border-t-4 border-t-emerald-400">
                            <div className="mb-8 break-inside-avoid">
                                <h4 className="text-xs font-bold text-center mb-4 flex justify-center items-center gap-2 bg-emerald-50 py-1.5 rounded-lg mx-10 text-emerald-700 print:bg-transparent print:text-black">
                                    <Dumbbell size={14} className="text-emerald-600 print:text-black"/> 骨骼肌分佈 (Muscle Mass)
                                </h4>
                                <div className="h-[200px] relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={muscleRadarData}>
                                            <PolarGrid gridType="polygon" stroke="#e4e4e7" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#52525b', fontSize: 11, fontWeight: 'bold' }} />
                                            <PolarRadiusAxis angle={90} domain={[10, 60]} tick={false} axisLine={false} />
                                            <Radar name="Muscle" dataKey="A" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.4} />
                                            <Tooltip />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-5 gap-1 text-center text-[10px] mt-2">
                                    {gridOrder.map((index) => {
                                        const data = muscleRadarData[index];
                                        return (
                                            <div key={index} className={`p-1 rounded-lg ${data.subject === '軀幹' ? 'bg-emerald-50 text-emerald-800' : 'bg-zinc-50'} print:bg-transparent`}>
                                                {data.subject}<br/>
                                                <b className="text-xs">{data.A}%</b><br/>
                                                <span className="text-zinc-400">{data.massKg}kg</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="border-t border-zinc-100 pt-6 break-inside-avoid">
                                <h4 className="text-xs font-bold text-center mb-4 flex justify-center items-center gap-2 bg-rose-50 py-1.5 rounded-lg mx-10 text-rose-700 print:bg-transparent print:text-black">
                                    <Zap size={14} className="text-rose-500 print:text-black"/> 皮下脂肪分佈 (Subcutaneous Fat)
                                </h4>
                                <div className="h-[200px] relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={fatRadarData}>
                                            <PolarGrid gridType="polygon" stroke="#e4e4e7" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#52525b', fontSize: 11, fontWeight: 'bold' }} />
                                            <PolarRadiusAxis angle={90} domain={[10, 50]} tick={false} axisLine={false} />
                                            <Radar name="Fat" dataKey="A" stroke="#f43f5e" strokeWidth={2} fill="#f43f5e" fillOpacity={0.3} />
                                            <Tooltip />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-5 gap-1 text-center text-[10px] mt-2">
                                    {gridOrder.map((index) => {
                                        const data = fatRadarData[index];
                                        return (
                                            <div key={index} className={`p-1 rounded-lg ${data.subject === '軀幹' ? 'bg-rose-50 text-rose-800' : 'bg-zinc-50'} print:bg-transparent`}>
                                                {data.subject}<br/>
                                                <b className="text-xs">{data.A}%</b><br/>
                                                <span className="text-zinc-400">{data.massKg}kg</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </Card>

                        <div className="grid grid-cols-2 gap-4">
                            <Card title="體型判定" icon={Grid} className="bg-white border-zinc-200">
                                <div className="text-center py-6">
                                    <div className="text-2xl font-black mb-2 tracking-wide text-zinc-800">
                                        {latest.bmi > 30 ? '肥胖型' : latest.bmi > 24 ? (latest.bodyFatPercent > 25 ? '脂肪過多' : '肌肉型過重') : '標準型'}
                                    </div>
                                    <div className="text-xs text-zinc-500 font-mono">BMI {latest.bmi?.toFixed(1)} / Fat {latest.bodyFatPercent}%</div>
                                </div>
                            </Card>
                            <Card title="基礎代謝" icon={Zap}>
                                <div className="text-center py-6">
                                    <div className="text-3xl font-black text-cyan-600">{latest.bmr}</div>
                                    <div className="text-xs text-zinc-400 font-bold uppercase mt-1">kcal / Day</div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
                
                <div className="text-center text-[10px] text-zinc-300 mt-10 print:mt-4 print:text-zinc-500">
                    <p>Generated by InBodyPro v6.0 • Analysis based on ACSM Guidelines & Plagenhoef Parameters</p>
                </div>
        </div>

        {/* --- PAGE 2: DASHBOARD VIEW (Enhanced) --- */}
        <div className={`max-w-7xl mx-auto ${(isPrinting || viewMode === 'print_all' || viewMode === 'dashboard') ? 'block' : 'hidden'}`}>
                <div className="bg-white rounded-2xl p-2 border border-zinc-200 shadow-sm flex flex-wrap gap-2 mb-6 print-hidden">
                    {['2021','2022','2023','2024','2025','1Y','3M','ALL'].map(t => (
                        <button key={t} onClick={() => setTimeRange(t)} className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-colors ${timeRange === t ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600'}`}>{t}</button>
                    ))}
                </div>
                
                <div className="hidden print-block mb-8 mt-4 border-b-2 border-zinc-800 pb-4">
                    <h2 className="text-3xl font-black text-zinc-800 tracking-tight">健康趨勢儀表板 & AI 評估</h2>
                    <p className="text-sm text-zinc-500 font-bold mt-1">Comprehensive Health Assessment Dashboard</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6 print-grid-cols-3">
                    <MetricCard title="FFMI" value={latest.ffmi?.toFixed(1)} unit="" change={latest.ffmi - first.ffmi} status={{label: ffmiStatus.label, color: ffmiStatus.color}} colorClass="text-violet-600" icon={Dumbbell} />
                    <MetricCard title="體重" value={latest.weight?.toFixed(1)} unit="kg" change={latest.weight - first.weight} status={getStatus('weight', latest.weight)} colorClass="text-zinc-800" icon={Layout} />
                    <MetricCard title="體脂率" value={latest.bodyFatPercent?.toFixed(1)} unit="%" change={latest.bodyFatPercent - first.bodyFatPercent} status={getStatus('bodyFat', latest.bodyFatPercent)} colorClass="text-rose-500" icon={TrendingDown} />
                    <MetricCard title="骨骼肌率" value={latest.skeletalMusclePercent?.toFixed(1)} unit="%" change={latest.skeletalMusclePercent - first.skeletalMusclePercent} status={{label: '-', color: ''}} colorClass="text-emerald-500" icon={Activity} />
                    <MetricCard title="內臟脂肪" value={latest.visceralFat?.toFixed(1)} unit="Lv" change={latest.visceralFat - first.visceralFat} status={{label: '-', color: ''}} colorClass="text-orange-500" icon={AlertCircle} />
                    <MetricCard title="BMI" value={latest.bmi?.toFixed(1)} unit="" change={latest.bmi - first.bmi} status={getStatus('bmi', latest.bmi)} colorClass="text-cyan-600" icon={Scale} />
                </div>

                {/* AI 評估報告區塊 */}
                <Card title="AI 綜合健康評估報告 (Comprehensive Assessment)" icon={Brain} className="mb-6 bg-white border-zinc-200 print:border-zinc-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                        <div className="space-y-2">
                            <h4 className="font-bold text-cyan-600 flex items-center gap-2 print:text-black"><Scale size={16}/> 體重管理</h4>
                            <p className="text-zinc-600 leading-relaxed print:text-zinc-700">
                                目前 BMI 為 <b className="text-zinc-900 print:text-black">{latest.bmi?.toFixed(1)}</b>，屬於<b className="text-amber-500 print:text-black">{getBMICategory(latest.bmi)}</b>區間。
                                與初期相比，體重變化 <b className={weightChange > 0 ? "text-rose-600" : "text-emerald-600"}>{weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}kg</b>。
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-bold text-violet-600 flex items-center gap-2 print:text-black"><Dumbbell size={16}/> 肌肉品質</h4>
                            <p className="text-zinc-600 leading-relaxed print:text-zinc-700">
                                骨骼肌率為 <b className="text-zinc-900 print:text-black">{latest.skeletalMusclePercent}%</b>。
                                您的<b className="text-zinc-900 print:text-black">{latest.legMusclePct > latest.armMusclePct ? '下肢' : '上肢'}</b>肌肉特別發達，這對於基礎代謝與行動力是很好的保護。
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-bold text-emerald-600 flex items-center gap-2 print:text-black"><Zap size={16}/> 代謝效能</h4>
                            <p className="text-zinc-600 leading-relaxed print:text-zinc-700">
                                基礎代謝率 <b className="text-zinc-900 print:text-black">{latest.bmr}</b> kcal。
                                身體年齡為 <b className="text-zinc-900 print:text-black">{latest.bodyAge}</b> 歲，
                                {latest.bodyAge < first.bodyAge ? '且呈現「逆齡」趨勢，這表示您的身體組成正在改善！' : '與初期持平，建議增加肌力訓練以降低身體年齡。'}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-bold text-rose-600 flex items-center gap-2 print:text-black"><AlertCircle size={16}/> 風險提示</h4>
                            <p className="text-zinc-600 leading-relaxed print:text-zinc-700">
                                內臟脂肪等級 <b className="text-zinc-900 print:text-black">{latest.visceralFat}</b> 
                                {latest.visceralFat > 15 ? ' 處於極高風險區。請務必控制精緻糖攝取並監測血壓血糖。' : latest.visceralFat > 9 ? ' 偏高，建議進行有氧運動與飲食控制。' : ' 處於標準範圍，請繼續保持。'}
                            </p>
                        </div>
                    </div>
                </Card>

                {/* 1. 代謝機能分析 */}
                <Card title="1. 代謝機能分析 (Metabolic Analysis)" icon={Zap} className="mb-6">
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={displayData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                                <XAxis dataKey="date" tick={{fontSize: 10}} />
                                <YAxis yAxisId="left" orientation="left" stroke="#0891b2" label={{ value: 'BMR (kcal)', angle: -90, position: 'insideLeft' }} domain={['auto', 'auto']} />
                                <YAxis yAxisId="right" orientation="right" stroke="#71717a" label={{ value: '身體年齡', angle: 90, position: 'insideRight' }} domain={['dataMin - 5', 'dataMax + 5']} />
                                <Tooltip />
                                <Legend />
                                <Area yAxisId="left" type="monotone" dataKey="bmr" name="基礎代謝率" fill="#cffafe" stroke="#06b6d4" strokeWidth={2} />
                                <Line yAxisId="right" type="monotone" dataKey="bodyAge" name="身體年齡" stroke="#52525b" strokeWidth={3} dot={{r: 4}} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {/* 2. 肌肉平衡雷達 */}
                    <Card title="2. 肌肉平衡雷達" icon={Dumbbell}>
                         <div className="text-xs text-center text-zinc-400 mb-4">各部位骨骼肌率分佈 (%)</div>
                         <div className="h-[200px] flex justify-center items-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={triangleRadarData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fontWeight: 'bold' }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 60]} tick={false} />
                                    <Radar name="Muscle" dataKey="A" stroke="#3b82f6" fill="#60a5fa" fillOpacity={0.6} />
                                    <Tooltip />
                                </RadarChart>
                            </ResponsiveContainer>
                         </div>
                    </Card>

                    {/* 3. 皮下脂肪分佈 */}
                    <Card title="3. 皮下脂肪分佈" icon={Layout}>
                        <div className="text-xs text-center text-zinc-400 mb-4">各部位皮下脂肪率 (%)</div>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={fatBarData} margin={{top: 20, right: 0, bottom: 0, left: 0}}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" tick={{fontSize: 12}} />
                                    <Tooltip cursor={{fill: 'transparent'}} />
                                    <Bar dataKey="value" name="脂肪率" radius={[4, 4, 0, 0]} label={{ position: 'top', fill: '#666', fontSize: 12 }}>
                                        {fatBarData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* 4. BMI 落點分析 */}
                    <Card title="4. BMI 肥胖落點分析" icon={Scale}>
                        <div className="text-xs text-center text-zinc-400 mb-2">目前 BMI 位置</div>
                        <BmiGauge bmi={latest.bmi} />
                    </Card>
                </div>

                <div className="h-[400px] bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 break-inside-avoid print:h-[500px] print:border-zinc-300">
                    <h3 className="text-lg font-bold text-zinc-800 mb-4 print:hidden">歷史趨勢圖表</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={displayData}>
                            <defs>
                                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#27272a" stopOpacity={0.1}/><stop offset="95%" stopColor="#27272a" stopOpacity={0}/></linearGradient>
                                <linearGradient id="colorMuscle" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0891b2" stopOpacity={0.3}/><stop offset="95%" stopColor="#0891b2" stopOpacity={0}/></linearGradient>
                                <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                            <XAxis dataKey="date" tick={{fontSize: 12, fill: '#a1a1aa'}} axisLine={false} tickLine={false} />
                            <YAxis tick={{fontSize: 12, fill: '#a1a1aa'}} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                            <Legend />
                            <Area type="monotone" dataKey="weight" name="體重(kg)" stroke="#52525b" strokeWidth={2} fill="url(#colorWeight)" />
                            <Area type="monotone" dataKey="skeletalMuscleMass" name="骨骼肌(kg)" stroke="#06b6d4" strokeWidth={2} fill="url(#colorMuscle)" />
                            <Area type="monotone" dataKey="bodyFatMass" name="脂肪重(kg)" stroke="#fb7185" strokeWidth={2} fill="url(#colorFat)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
        </div>

      </div>
    </div>
  );
}