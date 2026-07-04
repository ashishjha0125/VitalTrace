/**
 * VitalTrace ECG - Intelligent Signal Analyzer (Mobile Port)
 * Analyzes ECG data arrays to extract key cardiovascular metrics
 */
export class ECGAnalyzer {
    constructor(sampleRate = 200) {
        this.sampleRate = sampleRate;
    }

    analyze(data) {
        if (data.length < this.sampleRate * 4) {
            return { error: true, message: "Need at least 5 seconds of data." };
        }

        const results = [];
        
        // --- SIGNAL QUALITY & BASELINE ---
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        let pVariance = 0;
        data.forEach(v => pVariance += Math.pow(v - mean, 2));
        const stdDev = Math.sqrt(pVariance / data.length);

        if (stdDev < 15) {
             results.push({ name: "Signal Quality", status: "Critical", message: "Signal flatline or too weak.", icon: "⚠️" });
             return results;
        }

        // --- R-PEAK DETECTION ---
        const diff = new Array(data.length).fill(0);
        for(let i=1; i<data.length; i++) diff[i] = data[i] - data[i-1];
        const sq = diff.map(v => v * v);
        
        const windowSize = Math.round(0.15 * this.sampleRate);
        const mwi = new Array(sq.length).fill(0);
        for(let i=windowSize; i<sq.length; i++) {
            let sum = 0;
            for(let j=0; j<windowSize; j++) sum += sq[i-j];
            mwi[i] = sum / windowSize;
        }

        const mwiMean = mwi.reduce((a, b) => a + b, 0) / mwi.length;
        const threshold = mwiMean * 1.5;
        let peaks = []; 
        let minRR = 0.25 * this.sampleRate;
        
        for(let i=1; i<mwi.length-1; i++) {
            if (mwi[i] > threshold && mwi[i] > mwi[i-1] && mwi[i] > mwi[i+1]) {
                if (peaks.length === 0 || (i - peaks[peaks.length-1]) > minRR) {
                    peaks.push(i);
                } else if (peaks.length > 0 && mwi[i] > mwi[peaks[peaks.length-1]]) {
                    peaks[peaks.length-1] = i; 
                }
            }
        }

        // Refine peaks on raw data
        peaks = peaks.map(idx => {
            let localMaxIdx = idx;
            let start = Math.max(0, idx - 15);
            let end = Math.min(data.length - 1, idx + 15);
            for (let i = start; i <= end; i++) {
                if (data[i] > data[localMaxIdx]) localMaxIdx = i;
            }
            return localMaxIdx;
        });

        if (peaks.length < 3) {
            results.push({ name: "Signal Quality", status: "Warning", message: "Too noisy. Cannot detect clear R-peaks.", icon: "📉" });
            return results;
        }

        // --- INTERVAL CALCULATIONS ---
        const rrIntervals = [];
        for (let i = 1; i < peaks.length; i++) {
            rrIntervals.push(((peaks[i] - peaks[i-1]) / this.sampleRate) * 1000);
        }
        
        const avgRR = rrIntervals.reduce((a,b)=>a+b, 0) / rrIntervals.length;
        const bpm = Math.round(60000 / avgRR);

        let rrVariance = 0;
        rrIntervals.forEach(rr => rrVariance += Math.pow(rr - avgRR, 2));
        const rrStdDev = Math.sqrt(rrVariance / rrIntervals.length);
        const cv = rrStdDev / avgRR;

        // Estimated QRS, PR, and QT durations
        let qrsDurations = [];
        let prIntervals = [];
        let qtIntervals = [];
        let pWavesFound = 0;
        let tWavesHigh = 0;

        for (const pk of peaks) {
            let left = pk, right = pk;
            const thresholdLevelQRS = data[pk] - ((data[pk] - mean) * 0.5); 
            while (left > 0 && data[left] > thresholdLevelQRS && (pk - left) < 30) left--;
            while (right < data.length - 1 && data[right] > thresholdLevelQRS && (right - pk) < 30) right++;
            
            const qIdx = left;
            const sIdx = right;
            const qrsMs = ((sIdx - qIdx) / this.sampleRate) * 1000 * 1.5;
            qrsDurations.push(qrsMs);

            // PR Interval
            let pStartWindow = Math.max(0, qIdx - Math.round(0.20 * this.sampleRate));
            let pEndWindow = Math.max(0, qIdx - Math.round(0.04 * this.sampleRate));
            let pWaveMax = -Infinity;
            let pWaveIdx = -1;
            
            if (pEndWindow > pStartWindow) {
                for(let i = pStartWindow; i < pEndWindow; i++) {
                    if (data[i] > pWaveMax) {
                        pWaveMax = data[i];
                        pWaveIdx = i;
                    }
                }
            }

            if (pWaveIdx !== -1 && pWaveMax > mean + (stdDev * 0.2)) {
                pWavesFound++;
                const prMs = ((qIdx - pWaveIdx) / this.sampleRate) * 1000;
                prIntervals.push(Math.min(prMs, 300));
            }

            // QT Interval
            let tStart = pk + Math.round(0.15 * this.sampleRate);
            let tEndWindow = pk + Math.round(0.40 * this.sampleRate);
            let tWaveMax = -Infinity;
            let tWaveIdx = -1;
            
            if (tEndWindow < data.length) {
                 for(let i = tStart; i < tEndWindow; i++) {
                    if (data[i] > tWaveMax) {
                        tWaveMax = data[i];
                        tWaveIdx = i;
                    }
                 }
                 
                 if ((tWaveMax - mean) > (data[pk] - mean) * 0.6) {
                     tWavesHigh++;
                 }

                 let tEnd = tWaveIdx;
                 while(tEnd < data.length - 1 && data[tEnd] > mean && (tEnd - tWaveIdx) < 20) tEnd++;
                 
                 const qtMs = ((tEnd - qIdx) / this.sampleRate) * 1000;
                 qtIntervals.push(qtMs);
            }
        }

        const avgQRS = qrsDurations.reduce((a,b)=>a+b, 0) / qrsDurations.length || 0;
        const avgPR = prIntervals.length > 0 ? prIntervals.reduce((a,b)=>a+b, 0) / prIntervals.length : 0;
        const avgQT = qtIntervals.length > 0 ? qtIntervals.reduce((a,b)=>a+b, 0) / qtIntervals.length : 0;
        
        let possibleConditions = [];

        // 1. HEART RATE
        if (bpm < 60) {
            results.push({ name: "Heart Rate", status: "Warning", message: `Bradycardia Baseline. Rate: ${bpm} BPM (Normal: 60-100).`, icon: "🐢" });
            possibleConditions.push("Sinus Bradycardia");
        } else if (bpm > 100) {
            results.push({ name: "Heart Rate", status: "Warning", message: `Tachycardia Baseline. Rate: ${bpm} BPM (Normal: 60-100).`, icon: "⚡" });
             possibleConditions.push("Sinus Tachycardia");
        } else {
            results.push({ name: "Heart Rate", status: "Normal", message: `Normal resting rate. Rate: ${bpm} BPM.`, icon: "❤️" });
        }

        // 2. R-R RHYTHM & ATRIAL FIBRILLATION
        let isIrregular = cv > 0.15;
        let isPWaveMissing = pWavesFound < (peaks.length * 0.3);

        if (isIrregular) {
            if (isPWaveMissing) {
                results.push({ name: "Arrhythmia Check", status: "Critical", message: `Irregular RR (${Math.round(cv*100)}% var) & missing P-waves.`, icon: "⚠️" });
                possibleConditions.push("Possible Atrial Fibrillation (AFib)");
            } else {
                results.push({ name: "Arrhythmia Check", status: "Warning", message: `Irregular RR Intervals (Dev: ${Math.round(rrStdDev)}ms).`, icon: "⚠️" });
                possibleConditions.push("Sinus Arrhythmia");
            }
        } else {
            results.push({ name: "Arrhythmia Check", status: "Normal", message: "Regular sinus rhythm interval.", icon: "⏱️" });
        }

        // 3. PR INTERVAL
        if (avgPR === 0) {
            results.push({ name: "PR Interval", status: "Warning", message: "P-wave undetectable.", icon: "❓" });
        } else if (avgPR > 200) {
            results.push({ name: "PR Interval", status: "Warning", message: `Prolonged PR: ${Math.round(avgPR)}ms (Normal: 120-200ms).`, icon: "📏" });
            possibleConditions.push("First-Degree AV Block");
        } else if (avgPR < 120) {
             results.push({ name: "PR Interval", status: "Warning", message: `Short PR: ${Math.round(avgPR)}ms (Normal: 120-200ms).`, icon: "📏" });
             possibleConditions.push("Possible Pre-excitation (WPW)");
        } else {
            results.push({ name: "PR Interval", status: "Normal", message: `Normal range: ${Math.round(avgPR)}ms.`, icon: "✅" });
        }

        // 4. QRS COMPLEX
        if (avgQRS > 120) {
            results.push({ name: "QRS Duration", status: "Critical", message: `Wide QRS: ${Math.round(avgQRS)}ms (Normal: 80-120ms).`, icon: "〰️" });
            possibleConditions.push("Bundle Branch Block (LBBB/RBBB)");
        } else {
            results.push({ name: "QRS Duration", status: "Normal", message: `Normal width: ${Math.round(avgQRS)}ms.`, icon: "✅" });
        }

        // 5. QT INTERVAL
        const avgRRSeconds = avgRR / 1000;
        const qtc = avgQT / Math.sqrt(avgRRSeconds);
        
        if (qtc > 450) {
            results.push({ name: "QTc Interval", status: "Warning", message: `Prolonged QTc: ${Math.round(qtc)}ms (Normal: <440ms).`, icon: "⏱️" });
            possibleConditions.push("Long QT Syndrome Risk");
        } else if (avgQT > 0) {
            results.push({ name: "QTc Interval", status: "Normal", message: `Normal QTc: ${Math.round(qtc)}ms.`, icon: "✅" });
        }

        // 6. T-WAVE
        if (tWavesHigh > peaks.length * 0.4) {
            results.push({ name: "T-Wave Profile", status: "Warning", message: "Peaked/Tall T-waves detected.", icon: "⛰️" });
            possibleConditions.push("Possible Hyperkalemia / Ischemia");
        } else {
            results.push({ name: "T-Wave Profile", status: "Normal", message: "Normal repolarization.", icon: "✅" });
        }

        // 7. HRV
        if (rrStdDev < 20 && !isIrregular) {
            results.push({ name: "HRV (SDNN)", status: "Warning", message: `Low HRV: ${Math.round(rrStdDev)}ms. High stress.`, icon: "🔋" });
        } else {
            results.push({ name: "HRV (SDNN)", status: "Normal", message: `Healthy HRV: ${Math.round(rrStdDev)}ms.`, icon: "🧘" });
        }

        // 8. DROPPED BEATS
        let droppedBeats = 0;
        for (const rr of rrIntervals) {
            if (rr > avgRR * 1.6) droppedBeats++;
        }
        if (droppedBeats > 0) {
            results.push({ name: "Missed Beats", status: "Warning", message: `${droppedBeats} prolonged pause(s) detected.`, icon: "⏸️" });
            if (!possibleConditions.includes("Possible Atrial Fibrillation (AFib)")) {
                possibleConditions.push("Second-Degree AV Block / Ectopic Beats");
            }
        } else {
             results.push({ name: "Ectopic Beats", status: "Normal", message: "No dropped beats observed.", icon: "✅" });
        }

        // --- PREDICTIONS SUMMARY ---
        let conditionText = "No major abnormalities detected. Sinus Rhythm.";
        let overalStatus = "Normal";
        if (possibleConditions.length > 0) {
             conditionText = "Possible indicators: " + possibleConditions.join(', ') + ".";
             overalStatus = possibleConditions.some(c => c.includes("AFib") || c.includes("Block")) ? "Critical" : "Warning";
        }
        
        results.push({ 
             name: "AI Diagnosis Predictor", 
             status: overalStatus, 
             message: conditionText, 
             icon: "🩺", 
             isOverall: true 
        });

        return results;
    }
}
