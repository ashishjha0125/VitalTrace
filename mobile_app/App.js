import React, { useState, useRef, useCallback, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, SafeAreaView } from 'react-native';
import { Theme } from './src/theme/theme';
import { bleService } from './src/services/bleManager';
import { ECGSignalProcessor } from './src/services/signalProcessor';
import { ECGAnalyzer } from './src/services/ecgAnalyzer';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import TrendsScreen from './src/screens/TrendsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import BottomTabBar from './src/components/BottomTabBar';
import { storageService } from './src/services/storageService';
import { cloudService } from './src/services/cloudService';
import { supabase } from './src/services/supabaseClient';

const MAX_DATA_POINTS = 2500; 
const UI_DISP_POINTS = 500; 
const WINDOW_SIZE = 40;

export default function App() {
  // Navigation & Auth
  const [activeTab, setActiveTab] = useState('home');
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Initialize Signal Processor & Analyzer safely inside component
  const signalProcessor = useMemo(() => new ECGSignalProcessor(200), []);
  const ecgAnalyzer = useMemo(() => new ECGAnalyzer(200), []);

  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState('Disconnected');
  const [leadsOff, setLeadsOff] = useState(false);

  // Data buffers
  const [filteredData, setFilteredData] = useState([]);
  const [rawData, setRawData] = useState([]);
  const rawBufferRef = useRef([]);
  const filteredBufferRef = useRef([]);

  // Stats
  const [bpm, setBpm] = useState('--');
  const [sampleRate, setSampleRate] = useState(0);
  const [totalSamples, setTotalSamples] = useState(0);
  const [signalQuality, setSignalQuality] = useState('Standby');
  const [bpmHistory, setBpmHistory] = useState([]);
  const [showRaw, setShowRaw] = useState(false);

  // Analysis
  const [analysisResults, setAnalysisResults] = useState([]);

  // Sessions
  const [sessions, setSessions] = useState([]);
  const sessionStartRef = useRef(null);

  // Filter settings
  const [filterSettings, setFilterSettings] = useState({
    lowPass: true,
    highPass: true,
    notch: true,
    movingAvg: true,
    notchFreq: 50,
  });

  // Heart rate detection refs
  const peakTimesRef = useRef([]);
  const lastPeakTimeRef = useRef(0);
  const signalWindowRef = useRef([]);
  const runningMeanRef = useRef(0);
  const runningMaxRef = useRef(0);
  const waitingForDropRef = useRef(false);
  const bpmHistoryRef = useRef([]);

  // Sample rate tracking
  const sampleCountRef = useRef(0);
  const lastRateCheckRef = useRef(Date.now());
  const totalSamplesRef = useRef(0);
  const lastKnownValueRef = useRef(2048);

  // Analysis timing
  const lastAnalysisTimeRef = useRef(Date.now());

  // R-Peak Detection (ported from web)
  const detectHeartbeat = useCallback((value, timestamp) => {
    signalWindowRef.current.push(value);
    if (signalWindowRef.current.length > WINDOW_SIZE) signalWindowRef.current.shift();
    if (signalWindowRef.current.length < WINDOW_SIZE) return;

    runningMeanRef.current = runningMeanRef.current * 0.995 + value * 0.005;
    runningMaxRef.current = runningMaxRef.current * 0.998 + Math.max(value, runningMaxRef.current) * 0.002;

    const signalRange = Math.abs(runningMaxRef.current - runningMeanRef.current);
    const threshold = runningMeanRef.current + signalRange * 0.5;

    if (waitingForDropRef.current && value < runningMeanRef.current + signalRange * 0.1) {
      waitingForDropRef.current = false;
    }

    const midIdx = Math.floor(WINDOW_SIZE / 2);
    const midValue = signalWindowRef.current[midIdx];
    const timeSinceLastPeak = timestamp - lastPeakTimeRef.current;

    let isLocalMax = true;
    for (let i = 0; i < signalWindowRef.current.length; i++) {
      if (i !== midIdx && signalWindowRef.current[i] > midValue) {
        isLocalMax = false;
        break;
      }
    }

    if (isLocalMax && midValue > threshold && !waitingForDropRef.current && timeSinceLastPeak > 400) {
      lastPeakTimeRef.current = timestamp;
      waitingForDropRef.current = true;
      peakTimesRef.current.push(timestamp);

      if (peakTimesRef.current.length > 8) peakTimesRef.current.shift();

      if (peakTimesRef.current.length >= 3) {
        const intervals = [];
        for (let i = 1; i < peakTimesRef.current.length; i++) {
          intervals.push(peakTimesRef.current[i] - peakTimesRef.current[i - 1]);
        }

        intervals.sort((a, b) => a - b);
        const median = intervals[Math.floor(intervals.length / 2)];
        const validIntervals = intervals.filter(iv => iv > median * 0.6 && iv < median * 1.4);

        if (validIntervals.length >= 2) {
          const avgInterval = validIntervals.reduce((a, b) => a + b, 0) / validIntervals.length;
          const detectedBpm = Math.round(60000 / avgInterval);

          if (detectedBpm >= 40 && detectedBpm <= 160) {
            bpmHistoryRef.current.push(detectedBpm);
            if (bpmHistoryRef.current.length > 5) bpmHistoryRef.current.shift();

            const smoothBpm = Math.round(
              bpmHistoryRef.current.reduce((a, b) => a + b, 0) / bpmHistoryRef.current.length
            );

            setBpm(smoothBpm);
            setBpmHistory(prev => [...prev, smoothBpm].slice(-100));
          }
        }
      }
    }
  }, []);

  // Load user on start via Supabase Auth
  React.useEffect(() => {
    // Check active session
    try {
      supabase.auth.getSession().then(async ({ data: { session }, error }) => {
        if (error) throw error;
        if (session?.user) {
          const profile = await cloudService.getUserProfile(session.user.id);
          if (profile && profile.profileComplete) {
            setCurrentUser(profile);
            const userSessions = await cloudService.getUserSessions(session.user.id);
            setSessions(userSessions);
          } else {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
        setIsAuthLoading(false);
      }).catch(err => {
        console.error('Supabase Session Load Error:', err);
        setIsAuthLoading(false);
      });
    } catch (err) {
      console.error('Supabase Init Error:', err);
      setIsAuthLoading(false);
    }

    // Listen for auth changes
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const profile = await cloudService.getUserProfile(session.user.id);
          if (profile && profile.profileComplete) {
            setCurrentUser(profile);
            const userSessions = await cloudService.getUserSessions(session.user.id);
            setSessions(userSessions);
          } else {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      });

      return () => {
        if (subscription) subscription.unsubscribe();
      };
    } catch (err) {
      console.error('Supabase Auth Change Error:', err);
    }
  }, []);

  // Process incoming data point
  const processDataPoint = useCallback((value) => {
    totalSamplesRef.current++;
    sampleCountRef.current++;

    const now = Date.now();

    // Sample rate calculation
    if (now - lastRateCheckRef.current >= 1000) {
      const rate = Math.round(sampleCountRef.current / ((now - lastRateCheckRef.current) / 1000));
      setSampleRate(rate);
      sampleCountRef.current = 0;
      lastRateCheckRef.current = now;
    }

    setTotalSamples(totalSamplesRef.current);

    if (value === -1) {
      setLeadsOff(true);
      setSignalQuality('Leads Off');
      rawBufferRef.current.push(lastKnownValueRef.current);
      filteredBufferRef.current.push(signalProcessor.process(lastKnownValueRef.current));
    } else {
      setLeadsOff(false);
      setSignalQuality('Optimal');
      lastKnownValueRef.current = value;

      rawBufferRef.current.push(value);
      const filtered = signalProcessor.process(value);
      filteredBufferRef.current.push(filtered);

      detectHeartbeat(filtered, now);
    }

    // Trim buffers
    if (rawBufferRef.current.length > MAX_DATA_POINTS) {
      rawBufferRef.current.shift();
      filteredBufferRef.current.shift();
    }

    // Update UI state periodically (every 5 samples for performance)
    if (totalSamplesRef.current % 5 === 0) {
      setFilteredData(filteredBufferRef.current.slice(-UI_DISP_POINTS));
      setRawData(rawBufferRef.current.slice(-UI_DISP_POINTS));
    }

    // Auto-run analysis every 10 seconds
    const minSamples = 200 * 5;
    if (filteredBufferRef.current.length >= minSamples && now - lastAnalysisTimeRef.current > 10000) {
      runAnalysis();
      lastAnalysisTimeRef.current = now;
    }
  }, [detectHeartbeat]);

  // Handle incoming BLE data (supports batched data from ESP32)
  const handleData = useCallback((value) => {
    if (!value) return;

    // ESP32 sends batched data: "val1\nval2\nval3\nval4\n"
    const lines = value.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '') continue;

      // Handle leads-off detection
      if (trimmed === '-1' || trimmed.toLowerCase().includes('leads off')) {
        processDataPoint(-1);
        continue;
      }

      const num = parseInt(trimmed, 10);
      if (!isNaN(num)) {
        processDataPoint(num);
      }
    }
  }, [processDataPoint]);

  // Toggle BLE connection
  const toggleConnection = async () => {
    if (isConnected) {
      // Save session
      if (sessionStartRef.current) {
        const avgBpm = bpmHistory.length > 0 
          ? Math.round(bpmHistory.reduce((a, b) => a + b, 0) / bpmHistory.length)
          : 0;
        
        const newSession = {
          startTime: sessionStartRef.current,
          duration: Date.now() - sessionStartRef.current,
          avgBpm,
          totalSamples: totalSamplesRef.current,
          quality: signalQuality === 'Optimal' ? 'Good' : 'Fair',
        };
        
        setSessions(prev => [newSession, ...prev]);

        // Save to Supabase Cloud
        if (currentUser?.uid) {
          await cloudService.saveSession(currentUser.uid, newSession);
        }
      }

      bleService.disconnect();
      setIsConnected(false);
      setStatus('Disconnected');
      setSignalQuality('Standby');
    } else {
      setStatus('Scanning...');
      const hasPermission = await bleService.requestPermissions();
      if (!hasPermission) {
        setStatus('Permission Denied');
        return;
      }

      bleService.startDeviceScan(
        (device) => {
          setStatus('Connecting...');
          bleService.connectToDevice(device, handleData).then((success) => {
            if (success) {
              setIsConnected(true);
              setStatus('Live');
              sessionStartRef.current = Date.now();
              resetState();
            } else {
              setStatus('Connection Failed');
            }
          });
        },
        (errorMsg) => {
          // Scan error or timeout
          setStatus(errorMsg || 'Scan Failed');
          setTimeout(() => {
            if (!isConnected) setStatus('Disconnected');
          }, 5000);
        }
      );
    }
  };

  // Reset state on new connection
  const resetState = () => {
    rawBufferRef.current = [];
    filteredBufferRef.current = [];
    totalSamplesRef.current = 0;
    sampleCountRef.current = 0;
    lastRateCheckRef.current = Date.now();
    peakTimesRef.current = [];
    lastPeakTimeRef.current = 0;
    signalWindowRef.current = [];
    runningMeanRef.current = 0;
    runningMaxRef.current = 0;
    waitingForDropRef.current = false;
    bpmHistoryRef.current = [];
    lastAnalysisTimeRef.current = Date.now();
    signalProcessor.resetAll();

    setFilteredData([]);
    setRawData([]);
    setTotalSamples(0);
    setSampleRate(0);
    setBpm('--');
    setBpmHistory([]);
    setAnalysisResults([]);
  };

  // Run AI analysis
  const runAnalysis = useCallback(() => {
    if (filteredBufferRef.current.length < 1000) return;
    const dataToAnalyze = filteredBufferRef.current.slice(-2000);
    const results = ecgAnalyzer.analyze(dataToAnalyze);
    if (!results.error) {
      setAnalysisResults(results);
    }
  }, []);

  // Handle filter setting changes
  const handleFilterChange = useCallback((key, value) => {
    setFilterSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      
      // Apply to signal processor
      signalProcessor.enableLowPass = newSettings.lowPass;
      signalProcessor.enableHighPass = newSettings.highPass;
      signalProcessor.enableNotch = newSettings.notch;
      signalProcessor.enableMovingAvg = newSettings.movingAvg;

      if (key === 'lpfCutoff') signalProcessor.setLowPassCutoff(value);
      if (key === 'hpfCutoff') signalProcessor.setHighPassCutoff(value);
      if (key === 'maWindow') signalProcessor.setMovingAvgWindow(value);
      if (key === 'notchFreq') {
        signalProcessor.setNotchFrequency(value);
        newSettings.notchFreq = value;
      }

      // Reprocess data
      signalProcessor.resetAll();
      filteredBufferRef.current = rawBufferRef.current.map(raw => signalProcessor.process(raw));
      setFilteredData([...filteredBufferRef.current]);

      return newSettings;
    });
  }, []);

  // Clear history
  const clearHistory = () => setSessions([]);

  // Render active screen
  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            isConnected={isConnected}
            status={status}
            bpm={bpm}
            leadsOff={leadsOff}
            sampleRate={sampleRate}
            totalSamples={totalSamples}
            filteredData={filteredData}
            rawData={rawData}
            showRaw={showRaw}
            onToggleConnection={toggleConnection}
            signalQuality={signalQuality}
          />
        );
      case 'trends':
        return (
          <TrendsScreen 
            bpmHistory={bpmHistory}
            isConnected={isConnected}
          />
        );
      case 'history':
        return (
          <HistoryScreen
            sessions={sessions}
            onClearHistory={clearHistory}
          />
        );
      case 'reports':
        return (
          <ReportsScreen
            analysisResults={analysisResults}
            isConnected={isConnected}
            onRunAnalysis={runAnalysis}
            dataReady={filteredBufferRef.current.length >= 1000}
            rawMetrics={{
              BPM: bpm,
              SampleRate: sampleRate,
              TotalSamples: totalSamples,
              SignalQuality: signalQuality,
            }}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            filterSettings={filterSettings}
            onFilterChange={handleFilterChange}
            isConnected={isConnected}
            totalSamples={totalSamples}
            sampleRate={sampleRate}
            onToggleRaw={() => setShowRaw(!showRaw)}
            showRaw={showRaw}
          />
        );
      case 'profile':
        return (
          <ProfileScreen 
            user={currentUser}
            onUpdate={setCurrentUser}
            onLogout={() => {
              cloudService.signOut();
              setCurrentUser(null);
            }}
          />
        );
      default:
        return null;
    }
  };

  if (isAuthLoading) {
    return <View style={{ flex: 1, backgroundColor: 'blue', justifyContent: 'center', alignItems: 'center' }}><StatusBar style="light" /></View>;
  }

  if (!currentUser) {
    return <LoginScreen onLogin={setCurrentUser} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>
      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  screenContainer: {
    flex: 1,
  },
});
