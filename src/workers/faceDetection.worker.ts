/// <reference lib="webworker" />

import { FaceDetector, FilesetResolver, Detection } from "@mediapipe/tasks-vision";

// --- Message Types ---
type InitCommand = {
	type: "INIT";
};

type DetectCommand = {
	type: "DETECT";
	imageData: ImageData;
};

// Use a discriminated union for clear action handling
type WorkerIncomingMessage = InitCommand | DetectCommand;

type ReadyMessage = {
	type: "READY";
};

type ResultMessage = {
	type: "RESULT";
	faces: { x: number; y: number; width: number; height: number }[];
};

type ErrorMessage = {
	type: "ERROR";
	error: string;
};

// --- Worker Logic ---
let faceDetector: FaceDetector | null = null;

const initFaceDetector = async () => {
	try {
		const vision = await FilesetResolver.forVisionTasks(
			"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
		);

		const response = await fetch(vision.wasmLoaderPath);
		// This sets globalThis.ModuleFactory
		eval?.(await response.text());
		vision.wasmLoaderPath = "";

		faceDetector = await FaceDetector.createFromOptions(vision, {
			baseOptions: {
				modelAssetPath:
					"https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite",
				delegate: "GPU",
			},
			runningMode: "IMAGE",
		});

		console.log("✅ Face detector is initialized and ready.");
		self.postMessage({ type: "READY" } as ReadyMessage);
	} catch (error) {
		console.error("Failed to initialize face detector:", error);
		self.postMessage({ type: "ERROR", error: (error as Error).message } as ErrorMessage);
	}
};

const detectFaces = (imageData: ImageData) => {
	if (!faceDetector) {
		console.error("Detector is not initialized.");
		return;
	}

	const result = faceDetector.detect(imageData);
	const faces = result.detections.map((detection: Detection) => {
		const { originX, originY, width, height } = detection.boundingBox!;
		return { x: originX, y: originY, width, height };
	});

	// Post the final result back to the main thread.
	self.postMessage({
		type: "RESULT",
		faces,
	} as ResultMessage);
};

/**
 * Handles incoming messages from the main thread.
 */
self.onmessage = (event: MessageEvent<WorkerIncomingMessage>) => {
	switch (event.data.type) {
		case "INIT":
			initFaceDetector();
			break;
		case "DETECT":
			detectFaces(event.data.imageData);
			break;
		default:
			console.error("Unknown message type received in worker:", event.data);
	}
};
