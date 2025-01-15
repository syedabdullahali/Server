function parseDuration(durationString) {
    const match = durationString.match(/(\d+)\s*(hours|minutes)/i); // Match number and unit
    if (!match) throw new Error(`Invalid duration format: ${durationString}`);
  
    const value = parseInt(match[1], 10); // Extract numeric value
    const unit = match[2].toLowerCase(); // Extract unit ('hours' or 'minutes')
  
    if (unit === "hours") {
      return value * 60 * 60 * 1000; // Convert hours to milliseconds
    } else if (unit === "minutes") {
      return value * 60 * 1000; // Convert minutes to milliseconds
    } else {
      throw new Error(`Unsupported time unit: ${unit}`);
    }
}
module.exports ={parseDuration}