const $fileUpload = document.getElementById('fileUpload');

const CHUNK_SIZE = 1024 * 1024 * 0.2;

const slice = (file, piece = CHUNK_SIZE) => {
  let totalSize = file.size;
  let start = 0;
  let end = start + piece;
  const chunks = [];
  while (start < totalSize) {
    let chunk = file.slice(start, end);
    chunks.push(chunk);

    start = end;
    end = start + piece;
  }
  return chunks;
};

$fileUpload.addEventListener('change', (event) => {
  const file = event.target.files[0];
  const chunks = slice(file);
  const tasks = [];

  chunks.forEach((chunk, index) => {
    const fd = new FormData();
    fd.append('file', chunk);
    fd.append('context', file.name);
    fd.append('chunkIndex', index.toString());
    tasks.push(axios({ url: '/upload', method: 'post', data: fd }).then((res) => res.data));
  });

  Promise.all(tasks).then(() => {
    const filename = file.name;
    axios({ url: '/makefile', method: 'post', data: { chunks: chunks.length, filename } });
  });
});
