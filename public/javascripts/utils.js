import SparkMD5 from 'spark-md5';
import { CHUNK_SIZE } from './constants';
import toastr from 'toastr';

export const ID = () => {
  // Math.random should be unique because of its seeding algorithm.
  // Convert it to base 36 (numbers + letters), and grab the first 9 characters
  // after the decimal.
  return '_' + Math.random().toString(36).substr(2, 9);
};

export const checkSum = (file, piece = CHUNK_SIZE) => {
  return new Promise((resolve, reject) => {
    let totalSize = file.size;
    let start = 0;
    const blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;
    const chunks = [];
    const spark = new SparkMD5.ArrayBuffer();
    const fileReader = new FileReader();

    const loadNext = () => {
      const end = start + piece >= totalSize ? totalSize : start + piece;
      const chunk = blobSlice.call(file, start, end);

      start = end;
      chunks.push(chunk);
      fileReader.readAsArrayBuffer(chunk);
    };

    fileReader.onload = (event) => {
      spark.append(event.target.result);

      if (start < totalSize) {
        loadNext();
      } else {
        const checksum = spark.end();
        resolve({ chunks, checksum });
      }
    };

    fileReader.onerror = () => {
      console.warn('oops, something went wrong.');
      reject();
    };

    loadNext();
  });
};

toastr.options.closeButton = true;
toastr.options.closeMethod = 'fadeOut';
toastr.options.closeDuration = 300;
toastr.options.closeEasing = 'swing';
toastr.options.progressBar = true;
toastr.options.positionClass = 'toast-bottom-left';
export { toastr };
