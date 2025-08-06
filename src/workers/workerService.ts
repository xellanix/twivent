import faceDetection from "./faceDetection.worker?worker";
// Define the structure of the data returned by the detection
type FaceData = {
	x: number;
	y: number;
	width: number;
	height: number;
};

// Singleton instance of the worker
const worker = new faceDetection();

let isReady = false;
let detectionResolver: ((faces: FaceData[]) => void) | null = null;
let detectionRejector: ((reason?: any) => void) | null = null;

// Handle messages from the worker
worker.onmessage = (event) => {
	const { type, faces, error } = event.data;

	switch (type) {
		case "READY":
			isReady = true;
			// If there's a pending initialization promise, resolve it
			if (initResolver) {
				initResolver();
				initResolver = null;
				initRejector = null;
			}
			break;
		case "RESULT":
			if (detectionResolver) {
				detectionResolver(faces);
				// Clean up resolvers for the next detection
				detectionResolver = null;
				detectionRejector = null;
			}
			break;
		case "ERROR":
			console.error("Error from worker:", error);
			if (detectionRejector) {
				detectionRejector(new Error(error));
			}
			if (initRejector) {
				initRejector(new Error(error));
			}
			break;
	}
};

// Store promise resolvers for initialization
let initResolver: (() => void) | null = null;
let initRejector: ((reason?: any) => void) | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Initializes the face detector in the worker.
 * Returns a promise that resolves when the worker is ready.
 */
export const init = (): Promise<void> => {
	if (isReady) {
		return Promise.resolve();
	}
	if (initPromise) {
		return initPromise;
	}

	initPromise = new Promise(async (resolve, reject) => {
		initResolver = resolve;
		initRejector = reject;
		worker.postMessage({ type: "INIT" });
	});
	return initPromise;
};

/**
 * Detects faces in the given ImageData.
 * @param imageData The image data to process.
 * @returns A promise that resolves with an array of detected face data.
 */
export const detect = (imageData: ImageData): Promise<FaceData[]> => {
	if (!isReady) {
		return Promise.reject(new Error("Worker is not initialized. Call init() first."));
	}
	// Prevent multiple detections at once
	if (detectionResolver) {
		return Promise.reject(new Error("Another detection is already in progress."));
	}

	return new Promise((resolve, reject) => {
		detectionResolver = resolve;
		detectionRejector = reject;
		worker.postMessage({ type: "DETECT", imageData });
	});
};
