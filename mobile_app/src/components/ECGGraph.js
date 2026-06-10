import React, { useMemo } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { Canvas, Path, Skia, LinearGradient, vec, Paint, BlurMask } from '@shopify/react-native-skia';
import { Theme } from '../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRAPH_HEIGHT = 220;
const GRAPH_WIDTH = SCREEN_WIDTH - 48;
const MAX_POINTS = 500;

const ECGGraph = ({ data = [], showRaw = false, rawData = [] }) => {
  // Main signal path (filtered)
  const mainPath = useMemo(() => {
    const skPath = Skia.Path.Make();
    const displayData = showRaw && rawData.length > 0 ? rawData : data;
    if (displayData.length < 2) return skPath;

    const stepX = GRAPH_WIDTH / MAX_POINTS;
    
    // Auto-scale
    let minVal = Infinity, maxVal = -Infinity;
    for (const v of displayData) {
      if (v < minVal) minVal = v;
      if (v > maxVal) maxVal = v;
    }
    const range = maxVal - minVal || 1;
    const padding = range * 0.15;
    minVal -= padding;
    maxVal += padding;

    displayData.forEach((val, index) => {
      const x = index * stepX;
      const y = GRAPH_HEIGHT - ((val - minVal) / (maxVal - minVal)) * GRAPH_HEIGHT;
      
      if (index === 0) {
        skPath.moveTo(x, y);
      } else {
        skPath.lineTo(x, y);
      }
    });

    return skPath;
  }, [data, rawData, showRaw]);

  // Ghost raw path (when showing filtered)
  const ghostPath = useMemo(() => {
    const skPath = Skia.Path.Make();
    if (showRaw || rawData.length < 2 || data.length < 2) return skPath;

    const stepX = GRAPH_WIDTH / MAX_POINTS;
    
    let minVal = Infinity, maxVal = -Infinity;
    for (const v of data) {
      if (v < minVal) minVal = v;
      if (v > maxVal) maxVal = v;
    }
    const range = maxVal - minVal || 1;
    const padding = range * 0.15;
    minVal -= padding;
    maxVal += padding;

    rawData.forEach((val, index) => {
      const x = index * stepX;
      const y = GRAPH_HEIGHT - ((val - minVal) / (maxVal - minVal)) * GRAPH_HEIGHT;
      
      if (index === 0) {
        skPath.moveTo(x, y);
      } else {
        skPath.lineTo(x, y);
      }
    });

    return skPath;
  }, [data, rawData, showRaw]);

  const lineColor = showRaw ? '#F59E0B' : Theme.colors.ecgLine;

  return (
    <View style={styles.container}>
      <Canvas style={styles.canvas}>
        {/* Medical Grid - Minor lines */}
        {[...Array(12)].map((_, i) => (
          <Path
            key={`h-${i}`}
            path={`M 0 ${i * (GRAPH_HEIGHT / 11)} L ${GRAPH_WIDTH} ${i * (GRAPH_HEIGHT / 11)}`}
            color={Theme.colors.grid}
            style="stroke"
            strokeWidth={0.5}
          />
        ))}
        {[...Array(24)].map((_, i) => (
          <Path
            key={`v-${i}`}
            path={`M ${i * (GRAPH_WIDTH / 23)} 0 L ${i * (GRAPH_WIDTH / 23)} ${GRAPH_HEIGHT}`}
            color={Theme.colors.grid}
            style="stroke"
            strokeWidth={0.5}
          />
        ))}

        {/* Medical Grid - Major lines */}
        {[...Array(4)].map((_, i) => (
          <Path
            key={`hm-${i}`}
            path={`M 0 ${(i + 1) * (GRAPH_HEIGHT / 4)} L ${GRAPH_WIDTH} ${(i + 1) * (GRAPH_HEIGHT / 4)}`}
            color={Theme.colors.gridMajor}
            style="stroke"
            strokeWidth={1}
          />
        ))}
        {[...Array(6)].map((_, i) => (
          <Path
            key={`vm-${i}`}
            path={`M ${(i + 1) * (GRAPH_WIDTH / 6)} 0 L ${(i + 1) * (GRAPH_WIDTH / 6)} ${GRAPH_HEIGHT}`}
            color={Theme.colors.gridMajor}
            style="stroke"
            strokeWidth={1}
          />
        ))}

        {/* Ghost raw signal (when showing filtered) */}
        {!showRaw && rawData.length > 1 && (
          <Path
            path={ghostPath}
            color="rgba(245, 158, 11, 0.12)"
            style="stroke"
            strokeWidth={1}
            strokeJoin="round"
            strokeCap="round"
          />
        )}

        {/* Glow trail underneath */}
        <Path
          path={mainPath}
          color={showRaw ? 'rgba(245, 158, 11, 0.15)' : Theme.colors.liveDim}
          style="stroke"
          strokeWidth={8}
          strokeJoin="round"
          strokeCap="round"
        >
          <BlurMask blur={6} style="normal" />
        </Path>

        {/* Main ECG waveform */}
        <Path
          path={mainPath}
          color={lineColor}
          style="stroke"
          strokeWidth={2.5}
          strokeJoin="round"
          strokeCap="round"
        />
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: GRAPH_HEIGHT,
    width: '100%',
    backgroundColor: 'rgba(10, 14, 20, 0.6)',
    borderRadius: Theme.roundness.md,
    overflow: 'hidden',
  },
  canvas: {
    flex: 1,
  },
});

export default ECGGraph;
