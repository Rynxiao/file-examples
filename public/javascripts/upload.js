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

const isFileExists = (checksum) =>
  axios.get('/file/exist', { params: { checksum } }).then((res) => {
    const data = res.data;
    return data.code === 200 && !!data.data.id;
  });

const isChunkExists = (checksum, chunkId) =>
  axios.get('/chunk/exist', { params: { checksum, chunkId } }).then((res) => {
    const data = res.data;
    return data.code === 200 && !!data.data.id;
  });

$fileUpload.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  const { chunks, checksum } = await checkSum(file);
  const fileExists = await isFileExists(checksum);

  if (!fileExists) {
    const tasks = [];

    for (const chunk of chunks) {
      const index = chunks.indexOf(chunk);
      const chunkExists = await isChunkExists(checksum, index);
      if (!chunkExists) {
        const fd = new FormData();
        fd.append('file', chunk);
        fd.append('checksum', checksum);
        fd.append('chunkId', index.toString());

        tasks.push(axios({ url: '/upload', method: 'post', data: fd }).then((res) => res.data));
      }
    }

    Promise.all(tasks).then(() => {
      const filename = file.name;
      axios({ url: '/makefile', method: 'post', data: { chunks: chunks.length, filename, checksum } });
    });
  }
});
