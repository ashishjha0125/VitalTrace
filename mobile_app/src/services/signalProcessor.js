/**
 * VitalTrace ECG - Signal Processing Filters (Mobile Port)
 * 
 * Implements real-time digital filters for ECG signal:
 * 1. Low-pass filter (Butterworth) - removes high frequency noise
 * 2. High-pass filter - removes baseline wander
 * 3. Notch filter (50Hz) - removes power line interference
 * 4. Moving average - additional smoothing
 */

// ===== Low-Pass Filter (2nd Order Butterworth) =====
class LowPassFilter {
    constructor(cutoffHz = 40, sampleRate = 200) {
        this.setSampleRate(cutoffHz, sampleRate);
    }

    setSampleRate(cutoffHz, sampleRate) {
        const omega = 2 * Math.PI * cutoffHz / sampleRate;
        const cos_omega = Math.cos(omega);
        const sin_omega = Math.sin(omega);
        const alpha = sin_omega / (2 * 0.7071); // Q = 0.7071 for Butterworth

        const a0 = 1 + alpha;
        this.b0 = ((1 - cos_omega) / 2) / a0;
        this.b1 = (1 - cos_omega) / a0;
        this.b2 = ((1 - cos_omega) / 2) / a0;
        this.a1 = (-2 * cos_omega) / a0;
        this.a2 = (1 - alpha) / a0;

        this.x1 = 0; this.x2 = 0;
        this.y1 = 0; this.y2 = 0;
    }

    process(x) {
        const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2
                  - this.a1 * this.y1 - this.a2 * this.y2;
        this.x2 = this.x1; this.x1 = x;
        this.y2 = this.y1; this.y1 = y;
        return y;
    }

    reset() {
        this.x1 = 0; this.x2 = 0;
        this.y1 = 0; this.y2 = 0;
    }
}

// ===== High-Pass Filter (2nd Order Butterworth) =====
class HighPassFilter {
    constructor(cutoffHz = 0.5, sampleRate = 200) {
        this.setSampleRate(cutoffHz, sampleRate);
    }

    setSampleRate(cutoffHz, sampleRate) {
        const omega = 2 * Math.PI * cutoffHz / sampleRate;
        const cos_omega = Math.cos(omega);
        const sin_omega = Math.sin(omega);
        const alpha = sin_omega / (2 * 0.7071);

        const a0 = 1 + alpha;
        this.b0 = ((1 + cos_omega) / 2) / a0;
        this.b1 = (-(1 + cos_omega)) / a0;
        this.b2 = ((1 + cos_omega) / 2) / a0;
        this.a1 = (-2 * cos_omega) / a0;
        this.a2 = (1 - alpha) / a0;

        this.x1 = 0; this.x2 = 0;
        this.y1 = 0; this.y2 = 0;
    }

    process(x) {
        const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2
                  - this.a1 * this.y1 - this.a2 * this.y2;
        this.x2 = this.x1; this.x1 = x;
        this.y2 = this.y1; this.y1 = y;
        return y;
    }

    reset() {
        this.x1 = 0; this.x2 = 0;
        this.y1 = 0; this.y2 = 0;
    }
}

// ===== Notch Filter (2nd Order IIR) =====
class NotchFilter {
    constructor(notchHz = 50, sampleRate = 200, Q = 30) {
        this.setSampleRate(notchHz, sampleRate, Q);
    }

    setSampleRate(notchHz, sampleRate, Q = 30) {
        const omega = 2 * Math.PI * notchHz / sampleRate;
        const cos_omega = Math.cos(omega);
        const alpha = Math.sin(omega) / (2 * Q);

        const a0 = 1 + alpha;
        this.b0 = 1 / a0;
        this.b1 = (-2 * cos_omega) / a0;
        this.b2 = 1 / a0;
        this.a1 = (-2 * cos_omega) / a0;
        this.a2 = (1 - alpha) / a0;

        this.x1 = 0; this.x2 = 0;
        this.y1 = 0; this.y2 = 0;
    }

    process(x) {
        const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2
                  - this.a1 * this.y1 - this.a2 * this.y2;
        this.x2 = this.x1; this.x1 = x;
        this.y2 = this.y1; this.y1 = y;
        return y;
    }

    reset() {
        this.x1 = 0; this.x2 = 0;
        this.y1 = 0; this.y2 = 0;
    }
}

// ===== Moving Average Filter =====
class MovingAverageFilter {
    constructor(windowSize = 3) {
        this.windowSize = windowSize;
        this.buffer = [];
        this.sum = 0;
    }

    setWindowSize(size) {
        this.windowSize = size;
        this.buffer = [];
        this.sum = 0;
    }

    process(x) {
        this.buffer.push(x);
        this.sum += x;

        if (this.buffer.length > this.windowSize) {
            this.sum -= this.buffer.shift();
        }

        return this.sum / this.buffer.length;
    }

    reset() {
        this.buffer = [];
        this.sum = 0;
    }
}

// ===== ECG Signal Processor (Chain of filters) =====
export class ECGSignalProcessor {
    constructor(sampleRate = 200) {
        this.sampleRate = sampleRate;
        
        // Initialize all filters
        this.lowPass = new LowPassFilter(40, sampleRate);
        this.highPass = new HighPassFilter(0.5, sampleRate);
        this.notch50 = new NotchFilter(50, sampleRate, 30);
        this.movingAvg = new MovingAverageFilter(3);

        // Filter enable flags
        this.enableLowPass = true;
        this.enableHighPass = true;
        this.enableNotch = true;
        this.enableMovingAvg = true;
    }

    process(rawValue) {
        let value = rawValue;

        // 1. Notch filter first (remove 50Hz)
        if (this.enableNotch) {
            value = this.notch50.process(value);
        }

        // 2. High-pass (remove baseline wander)
        if (this.enableHighPass) {
            value = this.highPass.process(value);
        }

        // 3. Low-pass (remove HF noise)
        if (this.enableLowPass) {
            value = this.lowPass.process(value);
        }

        // 4. Moving average (final smoothing)
        if (this.enableMovingAvg) {
            value = this.movingAvg.process(value);
        }

        return value;
    }

    resetAll() {
        this.lowPass.reset();
        this.highPass.reset();
        this.notch50.reset();
        this.movingAvg.reset();
    }

    setLowPassCutoff(hz) {
        this.lowPass.setSampleRate(hz, this.sampleRate);
    }

    setHighPassCutoff(hz) {
        this.highPass.setSampleRate(hz, this.sampleRate);
    }

    setNotchFrequency(hz) {
        this.notch50.setSampleRate(hz, this.sampleRate, 30);
    }

    setMovingAvgWindow(size) {
        this.movingAvg.setWindowSize(size);
    }

    getActiveCount() {
        return [this.enableLowPass, this.enableHighPass, this.enableNotch, this.enableMovingAvg]
            .filter(Boolean).length;
    }
}
