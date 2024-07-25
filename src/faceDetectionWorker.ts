/// <reference lib="webworker" />
import * as tf from "@tensorflow/tfjs";
import * as faceDetection from "@tensorflow-models/face-detection";

self.onmessage = async (event: MessageEvent) => {
	const { imageData } = event.data;

	// Load the BlazeFace model
	const model = await faceDetection.createDetector(
		faceDetection.SupportedModels.MediaPipeFaceDetector,
		{
			runtime: "tfjs", // Specify the runtime to use
			modelType: "full",
		}
	);

	// Decode the image data into a tensor
	const imageTensor = tf.browser.fromPixels(imageData);

	// Perform the detection
	const predictions = await model.estimateFaces(imageTensor);

	// Convert predictions to bounding boxes
	const faces = predictions.map((prediction) => ({
		x: prediction.box.xMin,
		y: prediction.box.yMin,
		width: prediction.box.xMax - prediction.box.xMin,
		height: prediction.box.yMax - prediction.box.yMin,
	}));

	// Clean up
	imageTensor.dispose();

	// Post the result back to the main thread
	self.postMessage({ faces, width: imageData.width, height: imageData.height });
};
