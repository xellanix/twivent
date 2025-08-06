/**
 * Generates a unique filename based on the current time
 * @param {string} prefix Prefix for the filename
 * @param {string} ext File extension
 * @returns {string} A unique filename in the format of prefix_YYYYMMDD_HHMMSSMS.ext
 */
export const generateTimeName = (prefix: string, ext: string) => {
	const now = new Date();

	// Get current year, month, and day
	// Month is 0-indexed, so we need to add 1
	// Pad with leading zeros until 2 digits for months and days
	const year = now.getFullYear();
	const month = (now.getMonth() + 1).toString().padStart(2, "0");
	const day = now.getDate().toString().padStart(2, "0");

	// Get current hours, minutes, seconds, and milliseconds
	// Pad with leading zeros until 2 digits for hours, minutes, and seconds
	// Pad with leading zeros until 3 digits for milliseconds
	const hours = now.getHours().toString().padStart(2, "0");
	const minutes = now.getMinutes().toString().padStart(2, "0");
	const seconds = now.getSeconds().toString().padStart(2, "0");
	const milliseconds = now.getMilliseconds().toString().padStart(3, "0");

	// Create a string with all the unique parts
	// This will be in the format of YYYYMMDD_HHMMSSMS
	const uniqueParts = `${year}${month}${day}_${hours}${minutes}${seconds}${milliseconds}`;

	// Return the file name with the prefix and extension
	return `${prefix}_${uniqueParts}.${ext}`;
};
