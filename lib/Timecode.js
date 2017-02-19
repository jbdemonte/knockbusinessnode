module.exports = Timecode;

/**
 * Timecode
 * @param {string} item - Item name
 * @constructor
 */
function Timecode(item) {
  var start = time();

  /**
   * Return Item name
   * @return {string}
   */
  this.item = function () {
    return item;
  };

  /**
   * Return time passed since instantiation
   * @return {number}
   */
  this.time = function () {
    return time() - start;
  };
}

/**
 * Return hrtime in ms
 * @return {number}
 */
function time() {
  var hrtime = process.hrtime();
  return hrtime[0] * 1e3 + hrtime[1] / 1e6;
}