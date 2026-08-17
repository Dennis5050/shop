class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.audioContext = null;
    this.analyser = null;
    this.source = null;
    this.startTime = null;
    this.duration = 0;
    this.isRecording = false;
    this.timerInterval = null;
  }

  /**
   * Starts voice recording with microphone stream
   * @param {Function} onDurationUpdate 
   * @returns {Promise<void>}
   */
  async startRecording(onDurationUpdate = null) {
    this.audioChunks = [];
    this.duration = 0;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Select supported audio mime type
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/wav',
      ];
      let selectedMimeType = '';
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedMimeType = type;
          break;
        }
      }

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: selectedMimeType || undefined,
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Set up AudioContext for live waveform analysis
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.audioContext = new AudioCtx();
          this.analyser = this.audioContext.createAnalyser();
          this.analyser.fftSize = 64;
          this.source = this.audioContext.createMediaStreamSource(this.stream);
          this.source.connect(this.analyser);
        }
      } catch (err) {
        console.warn('AudioContext visualization setup skipped:', err);
      }

      this.startTime = Date.now();
      this.isRecording = true;
      this.mediaRecorder.start(100); // 100ms time slices

      if (onDurationUpdate) {
        this.timerInterval = setInterval(() => {
          if (this.isRecording && this.startTime) {
            this.duration = Math.round((Date.now() - this.startTime) / 1000);
            onDurationUpdate(this.duration);
          }
        }, 500);
      }
    } catch (error) {
      this.cleanup();
      throw error;
    }
  }

  /**
   * Returns current audio amplitude level for live visualizer
   * @returns {number} 0 to 1
   */
  getLiveAmplitude() {
    if (!this.analyser || !this.isRecording) return 0.2;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    return Math.min(1, Math.max(0.1, average / 128));
  }

  /**
   * Stops recording and resolves with base64 DataURL and duration
   * @returns {Promise<{ dataUrl: string, duration: number, mimeType: string, fileSize: number }>}
   */
  async stopRecording() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        return reject(new Error('No active voice recording in progress'));
      }

      const totalDuration = this.duration || (this.startTime ? Math.max(1, Math.round((Date.now() - this.startTime) / 1000)) : 1);
      const mimeType = this.mediaRecorder.mimeType || 'audio/webm';

      this.mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(this.audioChunks, { type: mimeType });
          const dataUrl = await this.blobToDataURL(audioBlob);

          this.cleanup();
          resolve({
            dataUrl,
            duration: totalDuration,
            mimeType,
            fileSize: audioBlob.size,
          });
        } catch (err) {
          this.cleanup();
          reject(err);
        }
      };

      this.isRecording = false;
      this.mediaRecorder.stop();
    });
  }

  /**
   * Cancels active recording without saving
   */
  cancelRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.isRecording = false;
      try {
        this.mediaRecorder.stop();
      } catch {
        // Ignore
      }
    }
    this.cleanup();
  }

  blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  cleanup() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {
        // Ignore
      }
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.startTime = null;
  }
}

export const audioRecorder = new AudioRecorder();
export default audioRecorder;
