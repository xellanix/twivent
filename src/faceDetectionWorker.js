importScripts(`../opencv.js`); // Ensure this path is correct

class Utils {
	constructor(errorOutputId) {
		this.errorOutputId = errorOutputId;
	}

	createFileFromUrl(path, url, callback) {
		let request = new XMLHttpRequest();
		request.open("GET", url, true);
		request.responseType = "arraybuffer";
		request.onload = () => {
			if (request.status === 200) {
				let data = new Uint8Array(request.response);
				cv.FS_createDataFile("/", path, data, true, false, false);
				callback();
			} else {
				this.printError(`Failed to load ${url} status: ${request.status}`);
			}
		};
		request.send();
	}

	printError(err) {
		console.error(err);
	}
}

self.onmessage = async (event) => {
	const { imageData } = event.data;

	if (!cv || !cv.imread || !cv.CascadeClassifier) {
		return;
	}

	// Convert image data to OpenCV Mat
	let src = cv.matFromImageData(imageData);
	let gray = new cv.Mat();
	cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

	// Load the Haar cascade classifier
	let faceCascade = new cv.CascadeClassifier();
	let utils = new Utils("errorMessage");
	let faceCascadeFile = "haarcascade_frontalface_default.xml";
	await new Promise((resolve) => {
		utils.createFileFromUrl(faceCascadeFile, `../${faceCascadeFile}`, () => {
			faceCascade.load(faceCascadeFile);
			resolve(true);
		});
	});

	// Detect faces
	let faces = new cv.RectVector();
	let msize = new cv.Size(0, 0);
	faceCascade.detectMultiScale(gray, faces, 1.1, 3, 0, msize, msize);

	// Prepare the results
	let facesArray = [];
	for (let i = 0; i < faces.size(); ++i) {
		let face = faces.get(i);
		facesArray.push({
			x: face.x,
			y: face.y,
			width: face.width,
			height: face.height,
		});
	}

	// Clean up
	src.delete();
	gray.delete();
	faceCascade.delete();
	faces.delete();

	// Post the result back to the main thread
	self.postMessage({ faces: facesArray });
};
