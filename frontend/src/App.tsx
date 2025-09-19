import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

// --- Type Definitions ---
interface ReportData {
  candidateName: string;
  interviewDuration: string;
  focusLostCount: number;
  // Renamed to match the backend response
  facesDetectedCount: number; 
  absenceCount: number;
  phoneDetectedCount: number;
  notesDetectedCount: number;
  integrityScore: number;
}
interface Detection {
  bbox: [number, number, number, number];
  class: string;
  score: number;
}

interface FaceRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
interface WorkerMessage {
  type: 'INIT' | 'PROCESS_FRAME' | 'LOG' | 'WORKER_READY' | 'WORKER_ERROR' | 'RESULTS';
  payload?: any;
  message?: string;
}

// --- SVG Icons for self-containment ---
const FaVideo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" className="w-4 h-4 text-teal-400 fill-current">
    <path d="M0 128C0 92.7 28.7 64 64 64H320c35.3 0 64 28.7 64 64V224H288c-17.7 0-32 14.3-32 32s14.3 32 32 32H384V384c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V128zM559.1 99.7c6.9-6.9 17.2-8.9 26.2-5.2S608 107.5 608 117.3V394.7c0 9.8-6.1 18.6-15.1 22.3s-19.3 1.7-26.2-5.2L416 337.8V174.2l143.1-74.5z" />
  </svg>
);
const LuFileSignature = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" className="w-4 h-4 text-teal-400 fill-current">
    <path d="M64 0C28.7 0 0 28.7 0 64V448c0 35.3 28.7 64 64 64H320c35.3 0 64-28.7 64-64V160H256c-17.7 0-32-14.3-32-32V0H64zM256 0V128H384L256 0zM128 288c0-11.4 6.7-21.7 17-26.2s23.2-3 32.7 4.6l57.7 46.2c6.9 5.5 17.1 5.3 23.9-.7s8.6-15.7 4.1-24.2L201.7 266c-11.6-21.9-.3-49.3 23.9-62.1l74.3-38.6c11.7-6.1 14.5-20.1 6.3-31.1s-23.7-14.3-35.4-8.2l-74.3 38.6c-21.9 11.4-33.7-2.6-22.1-13.9L170 144c-12.7-11.7-33.8-11.7-46.5 0L87 180.4c-9.1 8.4-14.5 20.2-14.5 32.6v94.5c0 10.7-8.3 19.4-18.7 19.5c-10.4 0-18.7-8.8-18.7-19.5V205.8c0-18 10.8-34.1 27.8-41.8l108.6-50.6c28.3-13.2 60 5.4 69.8 35.8l61.7 119.5c9.2 17.8 3.5 38.2-13.8 48.7l-47.5 29.8c-10.1 6.3-22.1 7.2-32.9 2.5l-57.7-46.2c-11.9 22.4-19.6 37.7-26.6 47.9c-8.9 13.5-24.9 20.3-41.5 20.3H128c-11.4 0-21.7-6.7-26.2-17s-3-23.2 4.6-32.7l46.2-57.7c5.5-6.9 5.3-17.1-.7-23.9s-15.7-8.6-24.2-4.1L128 288z" />
  </svg>
);
const FaUserCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-4 h-4 text-teal-400 fill-current">
    <path d="M399 384.2C376.9 345.8 335.7 320 288 320H224c-47.7 0-88.9 25.8-111 64.2c35.2 39.2 86.2 63.8 143 63.8s107.8-24.7 143-63.8zM256 128a128 128 0 1 1 0 256 128 128 0 1 1 0-256zM256 80c-77.4 0-140 62.6-140 140s62.6 140 140 140s140-62.6 140-140S333.4 80 256 80zm0-48a288 288 0 1 0 0 576A288 288 0 1 0 256 32z" />
  </svg>
);
const FaUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" className="w-4 h-4 text-teal-400 fill-current">
    <path d="M144 160c-44.2 0-80-35.8-80-80s35.8-80 80-80s80 35.8 80 80s-35.8 80-80 80zm112 16c-37.1 11.2-74.1 27.5-104.9 50.8c-14.8 11.2-28.7 25.1-41.6 41.5c-4.6 5.8-11.4 9.8-18.7 10.9s-14.4-1.2-19.5-6.8l-18-20.2c-5.7-6.4-14.4-8.8-22.7-5.5s-14.5 9.7-14.5 18.9v28.9c0 40.8 32.3 74 72.3 74c20.2 0 39-8.3 52.9-22.3c27-27.1 53.6-56.8 69.1-82.5c10.8-17.7 20.3-33.8 30.2-46.7c7.9-10.4 17.5-18.7 27.6-25.2c16.3-10.4 34.6-14.6 53.1-13.4c6.7 .4 13.5 .6 20.3 1c-.1-17.6-.2-35.2-.2-52.8c0-57.9 14.8-112 39.9-158.4c-4.5 2.1-9.1 4.5-13.8 7.3c-28.3 16.5-60.5 25.7-94.8 25.7H256zm320-16c-44.2 0-80-35.8-80-80s35.8-80 80-80s80 35.8 80 80s-35.8 80-80 80zm-112 16c-37.1 11.2-74.1 27.5-104.9 50.8c-14.8 11.2-28.7 25.1-41.6 41.5c-4.6 5.8-11.4 9.8-18.7 10.9s-14.4-1.2-19.5-6.8l-18-20.2c-5.7-6.4-14.4-8.8-22.7-5.5s-14.5 9.7-14.5 18.9v28.9c0 40.8 32.3 74 72.3 74c20.2 0 39-8.3 52.9-22.3c27-27.1 53.6-56.8 69.1-82.5c10.8-17.7 20.3-33.8 30.2-46.7c7.9-10.4 17.5-18.7 27.6-25.2c16.3-10.4 34.6-14.6 53.1-13.4c6.7 .4 13.5 .6 20.3 1c-.1-17.6-.2-35.2-.2-52.8c0-57.9 14.8-112 39.9-158.4c-4.5 2.1-9.1 4.5-13.8 7.3c-28.3 16.5-60.5 25.7-94.8 25.7H480z" />
  </svg>
);
const FaEyeSlash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" className="w-4 h-4 text-teal-400 fill-current">
    <path d="M492.6 62.1c-3.1-6.6-10.7-9.3-17.2-6.2L282.7 141.4c-7.2 3.4-11.4 11-9.8 18.9s6.3 14.9 13.9 18.3c-6.8 11.6-18.3 19.9-31.5 22.3C185.7 192.5 128 256 128 336c0 14.2 2.5 28.1 7.2 41.3L13.7 496.2c-5.1 5.1-5.1 13.3 0 18.4s13.3 5.1 18.4 0L620.3 32.5c5.1-5.1 5.1-13.3 0-18.4s-13.3-5.1-18.4 0L492.6 62.1zM593.8 205.8l-40.4 40.4c17.5 27.7 27.6 60.1 27.6 94.8c0 58.7-29.4 111.4-74.8 141.7c-33.1 22.1-71 34.1-110.8 34.1c-1.3 0-2.6-.1-3.9-.2c-39.7-1.4-78.9-13.6-112.5-35.7L189.6 429c.1 0 .2 .1 .3 .1c22.3 0 44-7.4 61.3-21.7c11.3-9.3 19.7-20.3 25.7-32.3L275 352c3.1-6.6 10.7-9.3 17.2-6.2s9.3 10.7 6.2 17.2l-9.8 20.8c-10.7 22.7-24.3 43.1-40.9 60.5l1.8 1.8c23.6 18.8 52.8 29.3 83.2 29.3c.7 0 1.4 0 2.1-.1c32-1.3 62.7-11.9 88.5-30.7c39.6-29.2 64.9-76.4 64.9-128.1c0-29.4-9.3-57-25.9-79.6zM288 336a48 48 0 1 1 96 0 48 48 0 1 1 -96 0z" />
  </svg>
);
const FaRefresh = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-4 h-4 text-white fill-current">
    <path d="M463.5 224H416c-13.3 0-24 10.7-24 24s10.7 24 24 24h47.5c1.1 0 2.2-.1 3.3-.2C498.4 266.3 512 291.5 512 320c0 106-86 192-192 192S128 426 128 320c0-59.5 27.2-112.9 69.3-148.9l32.2 32.2c3.1 3.1 8.2 3.1 11.3 0s3.1-8.2 0-11.3L164.7 91.1c-3.1-3.1-8.2-3.1-11.3 0L91.1 154.7c-3.1 3.1-3.1 8.2 0 11.3s8.2 3.1 11.3 0L154.7 127.3C114 163.6 88 217.1 88 276.1c0 11.2 1 22.3 2.9 33.2C41.3 325.2 0 371.4 0 426.1v17.9c0 13.3 10.7 24 24 24s24-10.7 24-24V426.1c0-30.5 25-55.5 55.5-55.5H192c13.3 0 24-10.7 24-24s-10.7-24-24-24H103.5c-1.1 0-2.2 .1-3.3 .2C13.6 245.7 0 220.5 0 192c0-106 86-192 192-192s192 86 192 192c0 29.5-6.8 57.5-19.1 82.6l-32.2-32.2c-3.1-3.1-8.2-3.1-11.3 0s-3.1 8.2 0 11.3L347.3 346.9c3.1 3.1 8.2 3.1 11.3 0L426.9 283.3c3.1-3.1 3.1-8.2 0-11.3s-8.2-3.1-11.3 0L383.5 328.7c41.3-44.5 66.5-98.8 66.5-156.7c0-11.2-1-22.3-2.9-33.2z" />
  </svg>
);
const SiSpeedometer = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-4 h-4 text-teal-400 fill-current">
    <path d="M512 256A256 256 0 1 0 0 256a256 256 0 1 0 512 0zm-76.4 125.7L320 288V128c0-17.7-14.3-32-32-32s-32 14.3-32 32v144c0 10.9 5.5 20.9 14.5 26.7l144 96c14.2 9.5 32.7 5.2 42.2-9c9.5-14.2 5.2-32.7-9-42.2z" />
  </svg>
);

const ReportCard: React.FC<{ report: ReportData; onClose: () => void }> = ({ report, onClose }) => (
  <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
    <div className="bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col items-center max-w-lg w-full animate-fade-in border border-gray-700">
      <h2 className="text-3xl font-bold mb-4 text-center text-teal-400">Proctoring Report</h2>
      <ul className="text-gray-300 w-full space-y-3">
        <li className="flex items-center gap-2"><FaUserCircle /><span className="font-semibold text-white">Candidate Name:</span> {report.candidateName}</li>
        <li className="flex items-center gap-2"><FaVideo /><span className="font-semibold text-white">Interview Duration:</span> {report.interviewDuration}</li>
        <li className="flex items-center gap-2"><FaEyeSlash /><span className="font-semibold text-white">Candidate Absence Count:</span> {report.absenceCount}</li>
        {/* Updated to use facesDetectedCount from the report data */}
        <li className="flex items-center gap-2"><FaUsers /><span className="font-semibold text-white">Multiple Faces Detected:</span> {report.facesDetectedCount}</li>
        <li className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-4 h-4 text-teal-400 fill-current"><path d="M16 64c0-12.9 8.3-24.3 20.9-28.7L224 5.3V48L48 90.7V400H24c-13.3 0-24 10.7-24 24s10.7 24 24 24H248c13.3 0 24-10.7 24-24s-10.7-24-24-24H224V80.8L448 48v24L264 90.7V400h24c13.3 0 24 10.7 24 24s-10.7 24-24 24H288v48H472c13.3 0 24-10.7 24-24s-10.7-24-24-24H448V80.8L264 48V5.3c-12.6-4.4-24.9 1.1-28.7 13.5L16 64zm432 0V400H416V64h32z" /></svg><span className="font-semibold text-white">Phones Detected:</span> {report.phoneDetectedCount}</li>
        <li className="flex items-center gap-2"><LuFileSignature /><span className="font-semibold text-white">Notes Detected:</span> {report.notesDetectedCount}</li>
        <li className="text-lg mt-4 text-white font-bold flex items-center gap-2"><SiSpeedometer /><span className="text-teal-400">Integrity Score:</span> {report.integrityScore}%</li>
      </ul>
      <button
        onClick={onClose}
        className="w-full mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-colors"
      >
        Close Report
      </button>
    </div>
  </div>
);

// Worker Script as a string
const proctoringWorkerScript = `
self.importScripts('https://docs.opencv.org/4.7.0/opencv.js');
self.importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.14.0/dist/tf.min.js');
self.importScripts('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.1/dist/coco-ssd.min.js');

let faceClassifier = null;
let objectDetector = null;
let lastEventTimestamps = {};
const detectedObjectClasses = ['cell phone', 'book', 'laptop', 'keyboard'];

// Throttle log messages to one per second to prevent flooding
const throttleLog = (message, eventType) => {
  const now = performance.now();
  if (!lastEventTimestamps[eventType] || now - lastEventTimestamps[eventType] > 1000) {
    self.postMessage({ type: 'LOG', message: message });
    lastEventTimestamps[eventType] = now;
  }
};

self.onmessage = async (e) => {
  const { type, payload } = e.data;
  
  if (type === 'INIT') {
    const { cascadeUrl } = payload;
    
    try {
      await new Promise(resolve => {
        cv.onRuntimeInitialized = resolve;
      });
      throttleLog('OpenCV.js loaded in worker.', 'opencv_load');

      // Correctly fetch the Haar Cascade file as a binary ArrayBuffer
      const response = await fetch(cascadeUrl);
      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }
      const buffer = await response.arrayBuffer();
      cv.FS_createDataFile('/', 'haarcascade.xml', new Uint8Array(buffer), true, false, false);
      
      faceClassifier = new cv.CascadeClassifier();
      if (!faceClassifier.load('haarcascade.xml')) {
        throw new Error('Failed to load Haar Cascade classifier.');
      }
      throttleLog('OpenCV face model loaded.', 'face_model_load');
      
      objectDetector = await cocoSsd.load();
      throttleLog('TensorFlow.js object model loaded.', 'object_model_load');

      self.postMessage({ type: 'WORKER_READY' });
      throttleLog('Proctoring models loaded and ready in worker.', 'models_ready');
    } catch (error) {
      console.error('Worker initialization failed:', error);
      self.postMessage({ type: 'WORKER_ERROR', message: 'Failed to load OpenCV or TF.js models.' });
    }
  } else if (type === 'PROCESS_FRAME' && faceClassifier && objectDetector) {
    const { imageData } = payload;
    
    const src = cv.matFromImageData(imageData);
    const gray = new cv.Mat();
    const faces = new cv.RectVector();
    
    const tensor = tf.browser.fromPixels(imageData);

    let objectPredictions = [];
    let faceRects = [];

    try {
      // --- OpenCV Face Detection ---
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
      cv.equalizeHist(gray, gray);
      faceClassifier.detectMultiScale(gray, faces);
      
      for (let i = 0; i < faces.size(); ++i) {
        const face = faces.get(i);
        faceRects.push({
          x: face.x,
          y: face.y,
          width: face.width,
          height: face.height
        });
      }
      
      // --- TensorFlow.js Object Detection ---
      const predictions = await objectDetector.detect(tensor);
      objectPredictions = predictions.filter(p => 
        detectedObjectClasses.includes(p.class) && p.score > 0.5
      );

      // Send combined results back to the main thread
      self.postMessage({
        type: 'RESULTS',
        payload: {
          faces: faceRects,
          objects: objectPredictions,
        }
      });

    } catch (e) {
      console.error('Processing frame error in worker:', e);
    } finally {
      src.delete();
      gray.delete();
      faces.delete();
      tensor.dispose();
    }
  }
};
`;

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const proctoringLoopRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const intervalRef = useRef<number | null>(null);

  const [isInterviewer, setIsInterviewer] = useState<boolean>(true);
  const [isInterviewActive, setIsInterviewActive] = useState<boolean>(false);
  const [logEvents, setLogEvents] = useState<string[]>([]);
  const [showReport, setShowReport] = useState<boolean>(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
  const [isLoadFailed, setIsLoadFailed] = useState<boolean>(false);
  const [interviewTime, setInterviewTime] = useState(0);

  // Stats for the report
  const [stats, setStats] = useState({
    candidateName: 'John Doe', // Placeholder, could be an input field
    // Renamed to match the report key
    facesDetectedCount: 0,
    absenceCount: 0,
    phoneDetectedCount: 0,
    notesDetectedCount: 0,
    focusLostCount: 0,
  });

  // Use a ref to hold the current state of isInterviewActive to prevent stale closures
  const isInterviewActiveRef = useRef(isInterviewActive);
  useEffect(() => {
    isInterviewActiveRef.current = isInterviewActive;
  }, [isInterviewActive]);

  const addLog = useCallback((message: string) => {
    setLogEvents(prevLogs => {
      const newLogs = [...prevLogs, `[${new Date().toLocaleTimeString()}] ${message}`];
      return newLogs.slice(-50); // Keep log to last 50 entries
    });
  }, []);

  const drawDetections = useCallback((faces: FaceRect[], objects: Detection[]) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame first
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Draw face bounding boxes
    ctx.strokeStyle = '#34d399'; // Tailwind green-400
    ctx.lineWidth = 4;
    faces.forEach(face => {
      ctx.strokeRect(face.x, face.y, face.width, face.height);
    });

    // Draw object bounding boxes and labels
    objects.forEach((obj) => {
      const [x, y, width, height] = obj.bbox;
      ctx.strokeStyle = '#6366f1'; // Tailwind indigo-500
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      ctx.fillStyle = '#6366f1';
      ctx.font = 'bold 16px Inter';
      ctx.fillText(obj.class, x + 5, y - 5);
    });
  }, []);

  useEffect(() => {
    const blob = new Blob([proctoringWorkerScript], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const { type, payload, message } = e.data;
      if (type === 'LOG' && message) {
        addLog(message);
      } else if (type === 'WORKER_READY') {
        setIsModelLoading(false);
        setIsLoadFailed(false);
      } else if (type === 'WORKER_ERROR') {
        setIsModelLoading(false);
        setIsLoadFailed(true);
      } else if (type === 'RESULTS' && payload) {
        // Use the ref to check for active interview status
        if (isInterviewActiveRef.current) {
          // Consolidate updates into a single setStats call for the frame
          setStats(prevStats => {
            const newStats = { ...prevStats };
            if (payload.faces.length > 1) {
              newStats.facesDetectedCount += 1;
              addLog('Multiple faces detected.');
            } else if (payload.faces.length === 0) {
              newStats.absenceCount += 1;
              addLog('Candidate absent.');
            }
            if (payload.objects.some((p: Detection) => p.class === 'cell phone')) {
              newStats.phoneDetectedCount += 1;
              addLog('Cell phone detected.');
            }
            if (payload.objects.some((p: Detection) => p.class === 'book')) {
              newStats.notesDetectedCount += 1;
              addLog('Notes/book detected.');
            }
            return newStats;
          });
        }
        drawDetections(payload.faces, payload.objects);
      }
    };

    addLog('Initializing proctoring worker...');
    const faceCascadeUrl = 'https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalface_default.xml';
    worker.postMessage({ type: 'INIT', payload: { cascadeUrl: faceCascadeUrl } });

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        URL.revokeObjectURL(workerUrl);
      }
    };
  }, [addLog, drawDetections]); // isInterviewActive is no longer a dependency here

  const getMediaStream = async () => {
    try {
      if (!streamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        addLog('Camera access granted.');
      }
    } catch (err) {
      console.error('Error accessing media devices.', err);
      addLog('Error: Could not access camera or microphone.');
    }
  };

  const handleStartStreaming = (stream: MediaStream) => {
    if (!stream || mediaRecorderRef.current) {
      return;
    }
    addLog('Starting video stream to simulated server...');
    const options = { mimeType: 'video/webm; codecs=vp8' };
    const recorder = new MediaRecorder(stream, options);
    recorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        // Data can be sent to a backend here for storage.
      }
    };
    recorder.start(500);
    mediaRecorderRef.current = recorder;
  };

  const handleStopStreaming = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      addLog('MediaRecorder stopped.');
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      streamRef.current = null;
      addLog('Camera and microphone tracks stopped.');
    }
  };

  const startProctoringLoop = useCallback(() => {
    const loop = () => {
      const video = videoRef.current;
      const worker = workerRef.current;

      if (!video || !worker || video.readyState < 2) {
        proctoringLoopRef.current = window.setTimeout(loop, 100);
        return;
      }

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = video.videoWidth;
      tempCanvas.height = video.videoHeight;
      const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
      if (tempCtx) {
        tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        worker.postMessage({
          type: 'PROCESS_FRAME',
          payload: {
            imageData: imageData
          }
        });
      }
      proctoringLoopRef.current = window.setTimeout(loop, 500);
    };
    proctoringLoopRef.current = window.setTimeout(loop, 500);
  }, []);

  const cancelProctoringLoop = useCallback(() => {
    if (proctoringLoopRef.current) {
      window.clearTimeout(proctoringLoopRef.current);
      proctoringLoopRef.current = null;
    }
  }, []);

  const startTimer = () => {
    setInterviewTime(0);
    intervalRef.current = window.setInterval(() => {
      setInterviewTime(prevTime => prevTime + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const calculateIntegrityScore = (currentStats: typeof stats) => {
    let score = 100;
    // We now subtract points for absence count instead of focus lost count
    score -= currentStats.absenceCount * 2;
    // Use facesDetectedCount from stats
    score -= currentStats.facesDetectedCount * 2;
    score -= currentStats.notesDetectedCount * 10;
    score -= currentStats.phoneDetectedCount * 15;
    return Math.max(0, score);
  };

  const handleInterviewerStart = async () => {
    if (isLoadFailed) {
      addLog('Error: Model failed to load. Cannot start interview.');
      return;
    }
    await getMediaStream();
    if (streamRef.current && videoRef.current) {
      videoRef.current.onloadeddata = () => {
        handleStartStreaming(streamRef.current!);
        startProctoringLoop();
        startTimer();
        setIsInterviewActive(true);
        addLog('Interview started.');
        setLogEvents([]);
        setStats({
          candidateName: 'John Doe',
          facesDetectedCount: 0,
          absenceCount: 0,
          phoneDetectedCount: 0,
          notesDetectedCount: 0,
          focusLostCount: 0,
        });
      };
    }
  };

  const handleInterviewerStop = async () => {
    setIsInterviewActive(false);
    stopTimer();
    handleStopStreaming();
    cancelProctoringLoop();
    addLog('Interview stopped. Generating report...');

    try {
      const finalStats = { ...stats };
      const integrityScore = calculateIntegrityScore(finalStats);
      const interviewDuration = formatTime(interviewTime);

      const reportData = {
        candidateName: finalStats.candidateName,
        interviewDuration,
        focusLostCount: finalStats.focusLostCount,
        // Send the correct key name to the backend
        multipleFacesCount: finalStats.facesDetectedCount,
        absenceCount: finalStats.absenceCount,
        phoneDetectedCount: finalStats.phoneDetectedCount,
        notesDetectedCount: finalStats.notesDetectedCount,
        integrityScore,
      };

      const postResponse = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });
      const postResult = await postResponse.json();

      if (!postResponse.ok) {
        throw new Error(postResult.message || 'Failed to save report.');
      }

      addLog(`Report saved with ID: ${postResult.reportId}. Fetching report...`);
      const getResponse = await fetch(`/api/reports/${postResult.reportId}`);
      const fetchedReport = await getResponse.json();

      if (!getResponse.ok) {
        throw new Error(fetchedReport.message || 'Failed to fetch report.');
      }

      setReportData(fetchedReport);
      setShowReport(true);
      addLog('Report successfully fetched and displayed.');

    } catch (error: any) {
      addLog(`Error during report generation: ${error.message}`);
      console.error(error);
      setReportData(null);
      setShowReport(false);
    }
  };
    
  const handleRetry = () => {
    setIsModelLoading(true);
    setIsLoadFailed(false);
    const worker = workerRef.current;
    if (worker) {
      worker.terminate();
    }
    const blob = new Blob([proctoringWorkerScript], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const newWorker = new Worker(workerUrl);
    workerRef.current = newWorker;

    newWorker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const { type, message, payload } = e.data;
      if (type === 'LOG' && message) {
        addLog(message);
      } else if (type === 'WORKER_READY') {
        setIsModelLoading(false);
        setIsLoadFailed(false);
      } else if (type === 'WORKER_ERROR') {
        setIsModelLoading(false);
        setIsLoadFailed(true);
      } else if (type === 'RESULTS' && payload) {
        drawDetections(payload.faces, payload.objects);
      }
    };
    addLog('Retrying model load...');
    const faceCascadeUrl = 'https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalface_default.xml';
    newWorker.postMessage({ type: 'INIT', payload: { cascadeUrl: faceCascadeUrl } });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 flex flex-col items-center justify-center font-[Inter]">
      <style>
        {`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
        body {
          font-family: 'Inter', sans-serif;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        .spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        `}
      </style>
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-8 h-[90vh]">
        <div className="bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center h-full flex-1">
          <h2 className="text-2xl font-bold mb-4 text-center">{isInterviewer ? 'Interviewer Controls' : 'Online Interview Session'}</h2>
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1] absolute inset-0"></video>
            <canvas ref={canvasRef} className="w-full h-full object-cover transform scale-x-[-1] absolute inset-0"></canvas>
            {!isInterviewActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/50">
                {isModelLoading ? (
                  <>
                    <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4 spin-slow"></div>
                    <p className="text-gray-400">Loading AI models...</p>
                  </>
                ) : (
                  <>
                    {isLoadFailed ? (
                      <div className="flex flex-col items-center">
                        <p className="text-red-400 mb-4 text-center">Failed to load models. Please check your connection.</p>
                        <button
                          onClick={handleRetry}
                          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md transition-colors flex items-center gap-2">
                          <FaRefresh />
                          <span>Retry</span>
                        </button>
                      </div>
                    ) : (
                      <p className="text-gray-400 animate-pulse">Awaiting interview start...</p>
                    )}
                  </>
                )}
              </div>
            )}
            {isInterviewActive && (
              <div className="absolute top-4 left-4 bg-gray-800/70 text-white px-4 py-2 rounded-xl text-lg font-bold">
                {formatTime(interviewTime)}
              </div>
            )}
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-4 w-full justify-center">
            {isInterviewer && (
              <>
                <button onClick={handleInterviewerStart} disabled={isInterviewActive || isModelLoading || isLoadFailed} className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {isModelLoading ? 'Loading Models...' : 'Start Interview'}
                </button>
                <button onClick={handleInterviewerStop} disabled={!isInterviewActive} className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  Stop Interview
                </button>
              </>
            )}
          </div>
          <div className="mt-6 text-center">
            <button onClick={() => setIsInterviewer(prev => !prev)} className="text-gray-400 hover:text-white transition-colors">
              Switch to {isInterviewer ? 'Candidate' : 'Interviewer'} View
            </button>
          </div>
        </div>
        <div className="bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col h-full flex-1">
          <h2 className="text-2xl font-bold mb-4 text-center">Live Proctoring Events</h2>
          <div className="bg-gray-700 rounded-lg p-4 overflow-y-auto flex-1">
            <ul className="space-y-2">
              {logEvents.map((log, index) => (
                <li key={index} className="text-sm font-mono bg-gray-600 p-2 rounded">
                  {log}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {showReport && reportData && <ReportCard report={reportData} onClose={() => setShowReport(false)} />}
    </div>
  );
};

export default App;
