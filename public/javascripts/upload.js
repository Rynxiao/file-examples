const $fileUpload = document.getElementById('fileUpload');

const CHUNK_SIZE = 1024 * 1024 * 0.2;

const checkSum = (file, piece = CHUNK_SIZE) => {
  return new Promise((resolve, reject) => {
    let totalSize = file.size;
    let start = 0;
    const chunks = [];
    const spark = new SparkMD5.ArrayBuffer();
    const fileReader = new FileReader();

    const loadNext = () => {
      const end = start + piece;
      const chunk = file.slice(start, end);

      start = end;
      chunks.push(chunk);
      fileReader.readAsArrayBuffer(chunk);
    };

    fileReader.onload = (event) => {
      const buffer = event.target.result;

      if (start < totalSize) {
        spark.append(buffer);
        loadNext();
      } else {
        const sum = spark.end();
        resolve({ chunks, sum });
      }
    };

    fileReader.onerror = function () {
      console.warn('oops, something went wrong.');
      reject();
    };

    loadNext();
  });
};

$fileUpload.addEventListener('change', (event) => {
  const file = event.target.files[0];
  checkSum(file).then(({ chunks, sum }) => {
    const tasks = [];

    chunks.forEach((chunk, index) => {
      const fd = new FormData();
      fd.append('file', chunk);
      fd.append('fileHash', sum);
      fd.append('chunkIndex', index.toString());
      tasks.push(axios({ url: '/upload', method: 'post', data: fd }).then((res) => res.data));
    });

    Promise.all(tasks).then(() => {
      const filename = file.name;
      axios({ url: '/makefile', method: 'post', data: { chunks: chunks.length, filename, fileHash: sum } });
    });
  });
});
