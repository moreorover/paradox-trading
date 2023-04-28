export function getColorCode(value: number) {
  // Calculate a value between 0 and 255 based on the input value
  var red = Math.round((255 * value) / 100);
  var blue = Math.round((255 * (100 - value)) / 100);

  // Convert the red and blue values to hex strings and pad them with zeros if necessary
  var redHex = red.toString(16).padStart(2, '0');
  var blueHex = blue.toString(16).padStart(2, '0');

  // Combine the red and blue components with a constant green component
  return '#' + redHex + '00' + blueHex;
}
